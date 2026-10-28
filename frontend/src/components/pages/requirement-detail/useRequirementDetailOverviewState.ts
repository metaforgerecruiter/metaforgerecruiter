import type { RequirementDetailOverviewProps } from './preamble'
import { useState, useMemo, useEffect, useRef } from 'react'
import React from 'react'
import { workspaceService, submissionsService } from '../../../services/workspace.service'
import { getSessionUser } from '../../../store/session'
import { mapBackendSubmission, ScreenshotSubmission } from '../submissions/preamble'
import { apiErrorMessage } from '../../../services/candidatePayload'

export interface PipelineCandidateItem {
  id: string
  name: string
  exp: string
  company: string
  notice: string
  status: string
  activity: string
  action: 'Schedule Interview' | 'View only'
  l1Status: 'locked' | 'active' | 'selected' | 'rejected'
  l2Status: 'locked' | 'active' | 'selected' | 'skipped' | 'rejected'
  finalStatus: 'locked' | 'active' | 'completed' | 'rejected'
  offerLetterStatus?: 'none' | 'ready_to_release' | 'released'
  rejectionReason?: string
  rejectedStage?: 'L1' | 'L2' | 'FINAL' | null
}

export function useRequirementDetailOverviewState(props: RequirementDetailOverviewProps) {
  const {
    requirement: initialRequirement,
    role = 'superadmin',
    onBack,
    onOpenAssignModal,
    onEditRequirement,
    onAddCandidate,
    onRevokeRequirement,
    onRequirementUpdated,
  }: RequirementDetailOverviewProps = props as RequirementDetailOverviewProps & Record<string, never>

  const [requirement, setRequirement] = useState(initialRequirement)
  const [isInternalEditing, setIsInternalEditing] = useState(false)

  useEffect(() => {
    if (initialRequirement) {
      setRequirement(initialRequirement)
    }
  }, [initialRequirement])

  const handleSaveRequirement = async (updatedReq: any) => {
    try {
      await workspaceService.updateRequirement(updatedReq.id, updatedReq)
      setRequirement(updatedReq)
      setIsInternalEditing(false)
      onRequirementUpdated?.(updatedReq)
      showToast('Requirement details updated successfully!')
    } catch (err) {
      showToast(apiErrorMessage(err) || 'Failed to update requirement')
    }
  }
  const normalizedRole = (role || '').toLowerCase()
  const isRecruiter = normalizedRole === 'recruiter'
  const isSuperAdminOrAdmin = normalizedRole === 'superadmin' || normalizedRole === 'admin' || normalizedRole === 'devteam'
  const availableTabs = isSuperAdminOrAdmin
    ? (['Overview', 'Pipeline', 'Interviews', 'Offers', 'Activity'] as const)
    : (['Overview', 'Pipeline', 'Interviews', 'Offers'] as const)

  const [activeTab, setActiveTab] = useState<'Overview' | 'Pipeline' | 'Interviews' | 'Offers' | 'Activity'>('Overview')
  const [historyTabFilter, setHistoryTabFilter] = useState<'all' | 'submitted_lead' | 'submitted_client' | 'interview' | 'selected' | 'rejected'>('all')
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [assignTabFilter, setAssignTabFilter] = useState<'all' | 'active' | 'revoked'>('all')
  const [assignSearchQuery, setAssignSearchQuery] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [schedulingCandidateRow, setSchedulingCandidateRow] = useState<any>(null)
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false)

  // Candidate Pipeline Interactive State
  const [pipelineCandidates, setPipelineCandidates] = useState<PipelineCandidateItem[]>([])

  const [rejectionModalData, setRejectionModalData] = useState<{
    candidateId: string
    candidateName: string
    stage: 'L1' | 'L2' | 'FINAL'
  } | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const handleUpdatePipelineStage = (candidateId: string, stage: 'L1' | 'L2' | 'FINAL', action: string) => {
    if (action === 'reject') {
      const candidate = pipelineCandidates.find(c => c.id === candidateId)
      if (candidate) {
        setRejectionModalData({
          candidateId,
          candidateName: candidate.name,
          stage,
        })
      }
      return
    }

    setPipelineCandidates(prev =>
      prev.map(c => {
        if (c.id !== candidateId) return c

        if (stage === 'L1') {
          if (action === 'select') {
            return {
              ...c,
              l1Status: 'selected',
              l2Status: 'active',
              status: 'L2 In Progress',
              activity: 'Just now',
            }
          }
          if (action === 'move_to_final') {
            return {
              ...c,
              l1Status: 'selected',
              l2Status: 'skipped',
              finalStatus: 'active',
              status: 'Final Round',
              activity: 'Just now',
            }
          }
        }

        if (stage === 'L2') {
          if (action === 'select') {
            return {
              ...c,
              l2Status: 'selected',
              finalStatus: 'active',
              status: 'Final Round',
              activity: 'Just now',
            }
          }
        }

        if (stage === 'FINAL') {
          if (action === 'completed') {
            return {
              ...c,
              finalStatus: 'completed',
              offerLetterStatus: 'ready_to_release',
              status: 'COMPLETED',
              activity: 'Just now',
            }
          }
        }

        return c
      })
    )

    if (action === 'select') {
      showToast(`Candidate moved to ${stage === 'L1' ? 'L2' : 'FINAL'} stage.`)
    } else if (action === 'move_to_final') {
      showToast(`Candidate moved directly from L1 to FINAL stage (L2 skipped).`)
    } else if (action === 'completed') {
      showToast(`Candidate successfully COMPLETED FINAL stage! Offer letter ready to release.`)
    }
  }

  const handleUpdateOfferLetterStatus = (candidateId: string, offerStatus: 'ready_to_release' | 'released') => {
    setPipelineCandidates(prev =>
      prev.map(c => {
        if (c.id !== candidateId) return c
        return {
          ...c,
          offerLetterStatus: offerStatus,
          activity: 'Just now',
        }
      })
    )
    if (offerStatus === 'released') {
      showToast(`Offer letter marked as Released!`)
    } else {
      showToast(`Offer letter marked as Ready to Release.`)
    }
  }

  const handleConfirmRejection = (reason: string) => {
    if (!rejectionModalData) return
    const { candidateId, stage } = rejectionModalData

    setPipelineCandidates(prev =>
      prev.map(c => {
        if (c.id !== candidateId) return c
        return {
          ...c,
          l1Status: stage === 'L1' ? 'rejected' : c.l1Status,
          l2Status: stage === 'L2' ? 'rejected' : c.l2Status,
          finalStatus: stage === 'FINAL' ? 'rejected' : c.finalStatus,
          status: 'REJECTED',
          rejectionReason: reason,
          rejectedStage: stage,
          activity: 'Just now',
        }
      })
    )

    showToast(`Rejection recorded for ${rejectionModalData.candidateName} at ${stage} stage.`)
    setRejectionModalData(null)
  }

  const currentUserName = getSessionUser()?.name || ''
  const currentUserEmail = (getSessionUser()?.email || '').toLowerCase()

  // Submissions made against this requirement (matched by its code or database id).
  const [reqSubmissions, setReqSubmissions] = useState<ScreenshotSubmission[]>([])
  useEffect(() => {
    let active = true
    const keys = new Set(
      [requirement?.id, (requirement as any)?.reqCode, (requirement as any)?._id, (requirement as any)?.displayId]
        .filter(Boolean)
        .map(String),
    )
    submissionsService
      .list()
      .then((data: any) => {
        if (!active) return
        const list: any[] = Array.isArray(data) ? data : data?.items || []
        setReqSubmissions(
          list.map(mapBackendSubmission).filter(sub => {
            const rid = sub.raw?.requirementId
            return keys.has(String(sub.reqId)) || keys.has(String(rid?._id || rid?.id || rid || ''))
          }),
        )
      })
      .catch(() => active && setReqSubmissions([]))
    return () => {
      active = false
    }
  }, [requirement?.id])

  useEffect(() => {
    setPipelineCandidates(
      reqSubmissions.map(sub => ({
        id: String(sub.id),
        name: sub.candidateName,
        exp: sub.experience || '—',
        company: sub.currentCompany || '—',
        notice: sub.noticePeriod || '—',
        status: sub.status,
        activity: sub.submittedOn,
        action: 'Schedule Interview' as const,
        l1Status: 'active' as const,
        l2Status: 'locked' as const,
        finalStatus: 'locked' as const,
      })),
    )
  }, [reqSubmissions])

  const rawHistorySubmissions = useMemo(
    () =>
      reqSubmissions.map(sub => ({
        subId: String(sub.submissionId || sub.id),
        avatar: (sub.candidateName || '?')
          .split(/\s+/)
          .map(w => w.charAt(0))
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        name: sub.candidateName,
        email: sub.email,
        submittedBy: sub.submittedBy,
        submitterEmail: String(sub.raw?.recruiterId?.email || sub.raw?.recruiterEmail || ''),
        submittedOn: sub.submittedOn,
        status: sub.status,
        canSchedule: !/interview|offer|placed|rejected/i.test(sub.status || ''),
      })),
    [reqSubmissions],
  )

  const filteredHistoryRows = useMemo(() => {
    return rawHistorySubmissions.filter(row => {
      // For recruiter module, ONLY show their own submissions!
      if (isRecruiter) {
        const isOwnSubmission =
          (currentUserEmail && row.submitterEmail.toLowerCase() === currentUserEmail) ||
          (currentUserName && row.submittedBy === currentUserName)
        if (!isOwnSubmission) return false
      }

      if (historyTabFilter !== 'all') {
        if (historyTabFilter === 'submitted_client' && row.status !== 'Submitted to Client') return false
        if (historyTabFilter === 'submitted_lead' && row.status !== 'Submitted to Lead') return false
      }

      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase()
        const matchName = row.name.toLowerCase().includes(q)
        const matchSubId = row.subId.toLowerCase().includes(q)
        const matchSubmitter = row.submittedBy.toLowerCase().includes(q)
        if (!matchName && !matchSubId && !matchSubmitter) return false
      }

      return true
    })
  }, [role, currentUserName, historyTabFilter, historySearchQuery, rawHistorySubmissions])

  const isUnassigned =
    requirement.assignmentStatus === 'Unassigned' || !requirement.owner || requirement.owner === 'Unassigned'

  const mandatorySkills = useMemo(() => {
    if (requirement.mandatorySkills && requirement.mandatorySkills.length > 0) {
      return requirement.mandatorySkills
    }
    if (requirement.skills && requirement.skills.length > 0) {
      return requirement.skills.slice(0, 4)
    }
    return []
  }, [requirement])

  const generalSkills = useMemo(() => {
    if (requirement.skills && requirement.skills.length > 0) {
      return requirement.skills
    }
    return []
  }, [requirement])

  return {
    requirement,
    setRequirement,
    isInternalEditing,
    setIsInternalEditing,
    handleSaveRequirement,
    role,
    onBack,
    onOpenAssignModal,
    onEditRequirement,
    onRequirementUpdated,
    onAddCandidate,
    onRevokeRequirement,
    activeTab,
    setActiveTab,
    historyTabFilter,
    setHistoryTabFilter,
    historySearchQuery,
    setHistorySearchQuery,
    historyPage,
    setHistoryPage,
    assignTabFilter,
    setAssignTabFilter,
    assignSearchQuery,
    setAssignSearchQuery,
    toastMsg,
    setToastMsg,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    schedulingCandidateRow,
    setSchedulingCandidateRow,
    isAddCandidateModalOpen,
    setIsAddCandidateModalOpen,
    normalizedRole,
    isRecruiter,
    isSuperAdminOrAdmin,
    availableTabs,
    currentUserName,
    rawHistorySubmissions,
    reqSubmissions,
    filteredHistoryRows,
    isUnassigned,
    showToast,
    mandatorySkills,
    generalSkills,
    pipelineCandidates,
    setPipelineCandidates,
    rejectionModalData,
    setRejectionModalData,
    handleUpdatePipelineStage,
    handleConfirmRejection,
    handleUpdateOfferLetterStatus,
  }
}
export type RequirementDetailVmState = ReturnType<typeof useRequirementDetailOverviewState>
