import { useEffect, useRef, useState } from 'react'
import { Requirement } from '../../../types'
import type { RequirementsVmState } from './useRequirementsPageState'
import { workspaceService } from '../../../services/workspace.service'
import { ApiError } from '../../../lib/api'
import { getSessionUser } from '../../../store/session'

export function useRequirementsPageHandlers1(s: RequirementsVmState) {
  const {
    role, onUpdateRequirements, onAddActivityLog,
    onNavigateToDashboard, localRequirements, setLocalRequirements, selectedReqForDetail,
    setSelectedReqForDetail, selectedReqIds, setSelectedReqIds, setIsAssignModalOpen,
    isAssignMyselfChecked, setIsAssignMyselfChecked, selectedRecruiterNames, setSelectedRecruiterNames,
    setRecruiterSearchQuery, currentUserName, showToast, recruiterList,
    setStatusDropdown, setActiveCardFilter,
    isSyncingMail, setIsSyncingMail, mailSyncStatus, setMailSyncStatus
  } = s

  const assignmentError = (err: unknown) => {
    if (err instanceof ApiError) return err.message
    if (err instanceof Error && err.message) return err.message
    return 'Failed to assign requirement'
  }

  const refreshRequirements = async (optimistic?: Requirement[]) => {
    if (optimistic) {
      setLocalRequirements(optimistic)
      onUpdateRequirements?.(optimistic)
    }
    try {
      const payload = await workspaceService.load()
      if (payload?.requirements) {
        setLocalRequirements(payload.requirements)
        onUpdateRequirements?.(payload.requirements)
      }
    } catch {
      // The assignment is already saved. Keep the optimistic list if refresh fails.
    }
  }

  // The backend scheduler pulls Microsoft 365 mail on its own; when a background run
  // finishes, reload the list so newly extracted requirements show up without a manual sync.
  const lastSeenSyncAt = useRef<string | null>(null)
  const isSyncingMailRef = useRef(isSyncingMail)
  isSyncingMailRef.current = isSyncingMail
  useEffect(() => {
    const check = async () => {
      if (isSyncingMailRef.current) return
      try {
        const status = await workspaceService.getRequirementsSyncStatus()
        if (!status) return
        setMailSyncStatus(status)
        const finishedAt = status.lastSyncedAt ? String(status.lastSyncedAt) : null
        if (lastSeenSyncAt.current === null) {
          lastSeenSyncAt.current = finishedAt || ''
          return
        }
        if (finishedAt && finishedAt !== lastSeenSyncAt.current) {
          lastSeenSyncAt.current = finishedAt
          if (status.status === 'completed' && (status.totalSynced > 0 || status.totalDeduped > 0)) {
            await refreshRequirements()
            if (status.totalSynced > 0) {
              showToast(`${status.totalSynced} new requirement(s) extracted from Outlook.`)
            }
          }
        }
      } catch {
        // Status polling is best-effort.
      }
    }
    check()
    const timer = setInterval(check, 60000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSyncEmails = async (limit = 25) => {
    if (isSyncingMail) return

    setIsSyncingMail(true)
    showToast('Connecting to Microsoft 365... Auto email extraction in progress.')

    try {
      await workspaceService.syncRequirementsFromEmail(limit)

      // Start polling sync status every 3s
      const pollInterval = setInterval(async () => {
        try {
          const status = await workspaceService.getRequirementsSyncStatus()
          if (status) {
            setMailSyncStatus(status)
            if (status.status === 'completed') {
              clearInterval(pollInterval)
              setIsSyncingMail(false)
              lastSeenSyncAt.current = status.lastSyncedAt ? String(status.lastSyncedAt) : lastSeenSyncAt.current
              await refreshRequirements()
              if (status.totalSynced > 0) {
                showToast(`Sync complete! Extracted ${status.totalSynced} new requirement(s) from Outlook emails.`)
              } else {
                showToast(`Outlook sync complete. Checked ${status.totalProcessed} email(s). All requirements up to date.`)
              }
              onAddActivityLog?.({
                id: `LOG-${Date.now()}`,
                timestamp: 'Just now',
                userName: currentUserName,
                userEmail: 'user@metaforgeit.com',
                userRole: role as any,
                userAvatar: currentUserName.charAt(0),
                action: 'Synced Outlook Emails',
                category: 'Requirements',
                targetEntity: 'Auto Mail Extraction',
                ipAddress: '192.168.1.45',
                status: 'Success',
                details: `Extracted requirements from Microsoft 365 Outlook. ${status.totalSynced} new, ${status.totalProcessed} processed.`,
              })
            } else if (status.status === 'failed') {
              clearInterval(pollInterval)
              setIsSyncingMail(false)
              showToast(`Mail extraction failed: ${status.error || status.message || 'Error occurred during sync'}`)
            }
          }
        } catch {
          // Keep polling until completed or timeout
        }
      }, 3000)

      // Fail-safe: stop polling after 20 minutes (matches the backend's MAIL_EXTRACTION_TIMEOUT_MINUTES default);
      // AI extraction of a full batch can take well over the old 3 minutes.
      setTimeout(() => {
        clearInterval(pollInterval)
        setIsSyncingMail(false)
      }, 20 * 60 * 1000)
    } catch (err: any) {
      setIsSyncingMail(false)
      showToast(err?.message || 'Failed to trigger email sync')
    }
  }

  const handleAssignRecruiter = async (req: Requirement, recruiterId: string) => {
    if (req.status === 'Hold' || req.status === 'On Hold') {
      showToast(`Cannot assign requirement ${req.id} because it is On Hold`)
      return
    }

    try {
      const targetId = req._id || req.id
      const isUnassigning = !recruiterId || recruiterId === 'Unassigned'
      const selected = recruiterList.find(rec => rec.id === recruiterId)
      const payload = isUnassigning ? { recruiterIds: [] } : { recruiterIds: [selected?.id || recruiterId] }

      await workspaceService.assignRequirement(targetId, payload)

      const updatedOwner = isUnassigning ? 'Unassigned' : (selected?.name || recruiterId)
      const updatedAssignmentStatus = isUnassigning ? ('Unassigned' as const) : ('Assigned' as const)
      const updatedStatus = isUnassigning ? ('Open' as const) : ('Assigned' as const)

      const nowIso = new Date().toISOString()
      const updated = localRequirements.map(r =>
        (r.id === req.id || r._id === req._id)
          ? {
              ...r,
              owner: updatedOwner,
              assignmentStatus: updatedAssignmentStatus,
              status: updatedStatus,
              updatedAt: nowIso,
            }
          : r
      )

      if (!isUnassigning) {
        setStatusDropdown('All')
        setActiveCardFilter('ALL')
      }

      if (selectedReqForDetail && (selectedReqForDetail.id === req.id || selectedReqForDetail._id === req._id)) {
        setSelectedReqForDetail({
          ...selectedReqForDetail,
          owner: updatedOwner,
          assignmentStatus: updatedAssignmentStatus,
          status: updatedStatus,
        })
      }

      showToast(isUnassigning ? `Requirement ${req.id} set to Unassigned.` : `Requirement ${req.id} assigned to ${updatedOwner}.`)
      await refreshRequirements(updated)

      onAddActivityLog?.({
        id: `LOG-${Date.now()}`,
        timestamp: 'Just now',
        userName: currentUserName,
        userEmail: 'user@metaforgeit.com',
        userRole: role as any,
        userAvatar: currentUserName.charAt(0),
        action: isUnassigning ? `Unassigned Requirement ${req.id}` : `Assigned Requirement ${req.id} to ${updatedOwner}`,
        category: 'Requirements',
        targetEntity: `Requirement Assignment`,
        ipAddress: '192.168.1.45',
        status: 'Success',
        details: isUnassigning ? `Requirement ${req.id} reverted to Unassigned state.` : `Assigned requirement ${req.id} to ${updatedOwner}.`,
      })
    } catch (err: unknown) {
      showToast(assignmentError(err))
    }
  }

  const handleSingleSelfAssign = async (req: Requirement) => {
    if (req.status === 'Hold' || req.status === 'On Hold') {
      showToast(`Cannot assign requirement ${req.id} because it is On Hold`)
      return
    }

    try {
      const targetId = req._id || req.id
      const session = getSessionUser()
      const selfId = session?.id || currentUserName
      const selfName = session?.name || currentUserName
      await workspaceService.assignRequirement(targetId, { recruiterIds: [selfId] })

      const nowIso = new Date().toISOString()
      const updated = localRequirements.map(r =>
        r.id === req.id
          ? { ...r, owner: selfName, assignmentStatus: 'Assigned' as const, status: 'Assigned' as const, updatedAt: nowIso }
          : r
      )
      setStatusDropdown('All')
      setActiveCardFilter('ALL')
      showToast('A requirement has been assigned to you.')
      await refreshRequirements(updated)

      if (onNavigateToDashboard) {
        setTimeout(() => {
          onNavigateToDashboard()
        }, 400)
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to assign requirement')
    }
  }

  const handleSelfAssign = async () => {
    if (selectedReqIds.size === 0) return
    const validReqs = Array.from(selectedReqIds)
      .map(id => localRequirements.find(item => item.id === id))
      .filter((r): r is Requirement => !!r && r.status !== 'Hold' && r.status !== 'On Hold')

    if (validReqs.length === 0) {
      showToast('Selected requirement(s) are On Hold and cannot be assigned.')
      setSelectedReqIds(new Set())
      return
    }

    try {
      const session = getSessionUser()
      const selfId = session?.id || currentUserName
      const selfName = session?.name || currentUserName
      for (const r of validReqs) {
        await workspaceService.assignRequirement(r._id || r.id, { recruiterIds: [selfId] })
      }

      const nowIso = new Date().toISOString()
      const validIds = validReqs.map(r => r.id)
      const updated = localRequirements.map(r =>
        validIds.includes(r.id)
          ? { ...r, owner: selfName, assignmentStatus: 'Assigned' as const, status: 'Assigned' as const, updatedAt: nowIso }
          : r
      )
      setSelectedReqIds(new Set())
      setStatusDropdown('All')
      setActiveCardFilter('ALL')
      showToast('Requirement(s) assigned to you.')
      await refreshRequirements(updated)

      if (onNavigateToDashboard) {
        setTimeout(() => {
          onNavigateToDashboard()
        }, 400)
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to assign requirements')
    }
  }

  const handleConfirmModalAssignment = async () => {
    const session = getSessionUser()
    const assignees: string[] = []
    if (isAssignMyselfChecked) {
      assignees.push(session?.id || currentUserName)
    }
    selectedRecruiterNames.forEach(name => {
      const match = recruiterList.find(rec => rec.name === name || rec.id === name)
      assignees.push(match?.id || name)
    })

    if (assignees.length === 0) return

    const validReqs = Array.from(selectedReqIds)
      .map(id => localRequirements.find(item => item.id === id))
      .filter((r): r is Requirement => !!r && r.status !== 'Hold' && r.status !== 'On Hold')
    
    const isDetailValid = selectedReqForDetail && selectedReqForDetail.status !== 'Hold' && selectedReqForDetail.status !== 'On Hold'

    if (validReqs.length === 0 && !isDetailValid) {
      showToast('Selected requirement(s) are On Hold and cannot be assigned.')
      setIsAssignModalOpen(false)
      setSelectedReqIds(new Set())
      return
    }

    const allTargetReqs: Requirement[] = [...validReqs]
    if (selectedReqForDetail && isDetailValid && !allTargetReqs.some(r => r.id === selectedReqForDetail.id)) {
      allTargetReqs.push(selectedReqForDetail)
    }

    try {
      for (const r of allTargetReqs) {
        await workspaceService.assignRequirement(r._id || r.id, { recruiterIds: assignees })
      }

      const assigneesText = assignees
        .map(id => recruiterList.find(rec => rec.id === id)?.name || (id === session?.id ? session.name : id))
        .join(', ')
      const targetIds = allTargetReqs.map(r => r.id)
      const nowIso = new Date().toISOString()
      const updated = localRequirements.map(r =>
        targetIds.includes(r.id)
          ? { ...r, owner: assigneesText, assignmentStatus: 'Assigned' as const, status: 'Assigned' as const, updatedAt: nowIso }
          : r
      )

      setStatusDropdown('All')
      setActiveCardFilter('ALL')

      if (selectedReqForDetail && isDetailValid) {
        setSelectedReqForDetail({
          ...selectedReqForDetail,
          owner: assigneesText,
          assignmentStatus: 'Assigned',
          status: 'Assigned',
        })
      }

      const assignedToMyself = isAssignMyselfChecked || assignees.some(a => a.toLowerCase().includes(currentUserName.toLowerCase()))

      setSelectedReqIds(new Set())
      setIsAssignModalOpen(false)
      setSelectedRecruiterNames(new Set())
      const isLeadOrAdmin = ['lead', 'admin', 'superadmin', 'devteam'].includes(String(role || '').toLowerCase())
      setIsAssignMyselfChecked(!isLeadOrAdmin)
      setRecruiterSearchQuery('')

      showToast('Requirement(s) assigned successfully.')
      await refreshRequirements(updated)

      onAddActivityLog?.({
        id: `LOG-${Date.now()}`,
        timestamp: 'Just now',
        userName: currentUserName,
        userEmail: 'user@metaforgeit.com',
        userRole: role as any,
        userAvatar: currentUserName.charAt(0),
        action: `Assigned Requirement(s) to ${assigneesText}`,
        category: 'Requirements',
        targetEntity: `Requirement Assignment`,
        ipAddress: '192.168.1.45',
        status: 'Success',
        details: `Assigned requirement workload to ${assigneesText}.`,
      })

      if (assignedToMyself && onNavigateToDashboard) {
        setTimeout(() => {
          onNavigateToDashboard()
        }, 400)
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || err.message || 'Failed to assign requirement')
    }
  }

  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false)
  const [selectedReqForRevoke, setSelectedReqForRevoke] = useState<Requirement | null>(null)

  const handleOpenRevoke = (req: Requirement) => {
    setSelectedReqForRevoke(req)
    setIsRevokeModalOpen(true)
  }

  return {
    handleAssignRecruiter, handleSingleSelfAssign, handleSelfAssign, handleConfirmModalAssignment, handleOpenRevoke,
    isRevokeModalOpen, setIsRevokeModalOpen, selectedReqForRevoke, handleSyncEmails
  }
}
