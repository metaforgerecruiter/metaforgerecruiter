import { Requirement } from '../../../types'
import type { RequirementsVmState } from './useRequirementsPageState'
import { workspaceService } from '../../../services/workspace.service'
import { ApiError } from '../../../lib/api'

export function useRequirementsPageHandlers2(s: RequirementsVmState) {
  const {
    role, onUpdateRequirements, onAddActivityLog,
    localRequirements, setLocalRequirements, selectedReqForDetail, setSelectedReqForDetail,
    currentUserName, showToast
  } = s

  const handleConfirmRevoke = async (reqId: string, reason: string, isDirectRevoke: boolean) => {
    const target = localRequirements.find(r => r.id === reqId)
    const oldOwner = target?.owner || 'Assigned Recruiter'

    try {
      await workspaceService.revokeRequirement(target?._id || reqId, { reason })
    } catch (err: any) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err?.response?.data?.message || err?.message || 'Failed to revoke requirement'
      showToast(msg)
      return
    }

    let updated: Requirement[]
    if (isDirectRevoke) {
      updated = localRequirements.map(r =>
        r.id === reqId
          ? {
              ...r,
              owner: 'Unassigned',
              assignmentStatus: 'Unassigned' as const,
              status: 'Open' as const,
              revokeRequested: false,
              revokeReason: reason,
              revokeRequestedBy: undefined,
              revokeRequestedAt: undefined,
            }
          : r
      )
      showToast(`Requirement ${reqId} revoked. Status set to Unassigned.`)
      onAddActivityLog?.({
        id: `LOG-${Date.now()}`,
        timestamp: 'Just now',
        userName: currentUserName,
        userEmail: 'user@metaforgeit.com',
        userRole: role as any,
        userAvatar: currentUserName.charAt(0),
        action: `Revoked Requirement ${reqId}`,
        category: 'Requirements',
        targetEntity: `Requirement ${reqId}`,
        targetId: reqId,
        clientName: target?.client,
        ipAddress: '192.168.1.45',
        status: 'Success',
        details: `Reason for revocation: ${reason}. Previous owner was ${oldOwner}. Requirement reverted to Unassigned.`,
      })
    } else {
      updated = localRequirements.map(r =>
        r.id === reqId
          ? {
              ...r,
              status: 'On Hold' as const,
              revokeRequested: true,
              revokeReason: reason,
              revokeRequestedBy: currentUserName,
              revokeRequestedAt: 'Just now',
            }
          : r
      )
      showToast(`Revoke permission request for ${reqId} submitted to Team Lead / Admin for approval.`)
      onAddActivityLog?.({
        id: `LOG-${Date.now()}`,
        timestamp: 'Just now',
        userName: currentUserName,
        userEmail: 'user@metaforgeit.com',
        userRole: role as any,
        userAvatar: currentUserName.charAt(0),
        action: `Requested Revoke Permission for Requirement ${reqId}`,
        category: 'Requirements',
        targetEntity: `Requirement ${reqId}`,
        targetId: reqId,
        clientName: target?.client,
        ipAddress: '192.168.1.45',
        status: 'Warning',
        details: `Reason for revoke request: ${reason}. Pending approval from Team Lead / Admin.`,
      })
    }

    setLocalRequirements(updated)
    onUpdateRequirements?.(updated)
    if (selectedReqForDetail && selectedReqForDetail.id === reqId) {
      const updatedReq = updated.find(r => r.id === reqId) || null
      setSelectedReqForDetail(updatedReq)
    }
  }

  const handleGrantRevokeApproval = async (reqId: string) => {
    const target = localRequirements.find(r => r.id === reqId)
    const requester = target?.revokeRequestedBy || 'Recruiter'
    const reason = target?.revokeReason || 'Revoke request approved'

    try {
      // Approving re-runs revoke as an admin, which detaches recruiters server-side.
      await workspaceService.revokeRequirement(target?._id || reqId, { reason })
    } catch (err: any) {
      showToast(err instanceof ApiError ? err.message : err?.message || 'Failed to approve revoke request')
      return
    }

    const updated = localRequirements.map(r =>
      r.id === reqId
        ? {
            ...r,
            owner: 'Unassigned',
            assignmentStatus: 'Unassigned' as const,
            status: 'Open' as const,
            revokeRequested: false,
            revokeReason: undefined,
            revokeRequestedBy: undefined,
            revokeRequestedAt: undefined,
          }
        : r
    )

    setLocalRequirements(updated)
    onUpdateRequirements?.(updated)
    showToast(`Granted revoke approval for ${reqId}. Requirement reverted to Unassigned state.`)

    onAddActivityLog?.({
      id: `LOG-${Date.now()}`,
      timestamp: 'Just now',
      userName: currentUserName,
      userEmail: 'user@metaforgeit.com',
      userRole: role as any,
      userAvatar: currentUserName.charAt(0),
      action: `Approved Revoke Permission for Requirement ${reqId} (Reverted to Unassigned)`,
      category: 'Requirements',
      targetEntity: `Requirement ${reqId}`,
      targetId: reqId,
      clientName: target?.client,
      ipAddress: '192.168.1.45',
      status: 'Success',
      details: `Revoke permission granted by ${currentUserName} for request by ${requester}. Reason: ${reason}. Requirement reverted to Unassigned.`,
    })
  }

  const handleDeclineRevokeRequest = (reqId: string) => {
    const target = localRequirements.find(r => r.id === reqId)
    const requester = target?.revokeRequestedBy || 'Recruiter'

    const updated = localRequirements.map(r =>
      r.id === reqId
        ? {
            ...r,
            revokeRequested: false,
            revokeReason: undefined,
            revokeRequestedBy: undefined,
            revokeRequestedAt: undefined,
          }
        : r
    )

    setLocalRequirements(updated)
    onUpdateRequirements?.(updated)
    showToast(`Declined revoke request for ${reqId}.`)

    onAddActivityLog?.({
      id: `LOG-${Date.now()}`,
      timestamp: 'Just now',
      userName: currentUserName,
      userEmail: 'user@metaforgeit.com',
      userRole: role as any,
      userAvatar: currentUserName.charAt(0),
      action: `Declined Revoke Request for Requirement ${reqId}`,
      category: 'Requirements',
      targetEntity: `Requirement ${reqId}`,
      targetId: reqId,
      clientName: target?.client,
      ipAddress: '192.168.1.45',
      status: 'Warning',
      details: `Revoke request from ${requester} for requirement ${reqId} was declined by ${currentUserName}.`,
    })
  }

  const handleUpdateReqStatus = async (reqId: string, newStatus: string) => {
    const target = localRequirements.find(r => r.id === reqId || r._id === reqId)
    if (!target) return
    const targetId = target._id || target.id || reqId

    let targetStatus = newStatus
    if (newStatus === 'Reopen') targetStatus = 'Open'

    const previousStatus = target.status

    const updated = localRequirements.map(r =>
      (r.id === reqId || r._id === reqId)
        ? {
            ...r,
            status: targetStatus as any,
          }
        : r
    )
    setLocalRequirements(updated)
    onUpdateRequirements?.(updated)

    if (selectedReqForDetail && (selectedReqForDetail.id === reqId || selectedReqForDetail._id === reqId)) {
      setSelectedReqForDetail({
        ...selectedReqForDetail,
        status: targetStatus as any,
      })
    }

    if (targetStatus === 'Hold' || targetStatus === 'On Hold') {
      s.setSelectedReqIds(prev => {
        const next = new Set(prev)
        next.delete(reqId)
        return next
      })
    }

    try {
      await workspaceService.updateRequirement(targetId, { status: targetStatus as any })

      // Reload fresh workspace data from database to ensure persistence & consistency
      try {
        const payload = await workspaceService.load()
        if (payload?.requirements) {
          setLocalRequirements(payload.requirements)
          onUpdateRequirements?.(payload.requirements)
        }
      } catch {
        // Keep optimistic state if load fails
      }

      if (targetStatus === 'Hold' || targetStatus === 'On Hold') {
        showToast(`Requirement ${reqId} placed On Hold. Normal editing and assignment controls disabled.`)
      } else if (newStatus === 'Reopen' || targetStatus === 'Open') {
        showToast(`Requirement ${reqId} reopened successfully. Editing and assignment controls enabled.`)
      } else {
        showToast(`Updated status for ${reqId} to "${targetStatus}".`)
      }

      onAddActivityLog?.({
        id: `LOG-${Date.now()}`,
        timestamp: 'Just now',
        userName: currentUserName,
        userEmail: 'user@metaforgeit.com',
        userRole: role as any,
        userAvatar: currentUserName.charAt(0),
        action: `Updated Status of Requirement ${reqId} to ${targetStatus}`,
        category: 'Requirements',
        targetEntity: `Requirement ${reqId}`,
        targetId: reqId,
        clientName: target.client,
        ipAddress: '192.168.1.45',
        status: 'Success',
        details: `Updated requirement status from ${previousStatus || 'Open'} to ${targetStatus}.`,
      })
    } catch (err: unknown) {
      // Revert optimistic update on failure
      const reverted = localRequirements.map(r =>
        (r.id === reqId || r._id === reqId)
          ? {
              ...r,
              status: previousStatus,
            }
          : r
      )
      setLocalRequirements(reverted)
      onUpdateRequirements?.(reverted)
      if (selectedReqForDetail && (selectedReqForDetail.id === reqId || selectedReqForDetail._id === reqId)) {
        setSelectedReqForDetail({
          ...selectedReqForDetail,
          status: previousStatus,
        })
      }
      const msg = err instanceof ApiError ? err.message : (err instanceof Error ? err.message : `Failed to update status for ${reqId}`)
      showToast(msg)
    }
  }

  return {
    handleConfirmRevoke, handleGrantRevokeApproval, handleDeclineRevokeRequest, handleUpdateReqStatus
  }
}
