import React, { useEffect, useMemo, useState } from 'react'
import { Requirement } from '../../../types'
import { uiCandidateToRepo, UiCandidate, apiCandidateToUi } from '../../../services/candidatePayload'
import { candidatesService } from '../../../services/workspace.service'
import { CandidateRepoItem, CandidateRepositoryPageProps } from './types'
import { useCandidateRepoEdit } from './useCandidateRepoEdit'
import { useCandidateRepoFilters } from './useCandidateRepoFilters'
import { useCandidateRepoMasking } from './useCandidateRepoMasking'
import { getSessionUser } from '../../../store/session'

const STABLE_DEFAULT_CANDIDATES: UiCandidate[] = []

export function useCandidateRepository({
  candidates = STABLE_DEFAULT_CANDIDATES,
  requirements = [],
  selectedReqId = null,
  role = 'recruiter',
  onOpenAddForm,
  onCandidateUpdated,
  onSelectRequirement,
  onBackToDashboard,
}: CandidateRepositoryPageProps) {
  const storedRole = getSessionUser()?.role || null
  const activeRoleStr = (role || storedRole || '').toLowerCase()
  const isLeadRole = activeRoleStr === 'lead' || activeRoleStr.includes('lead') || activeRoleStr === 'team lead' || activeRoleStr === 'team_lead'

  const [repoList, setRepoList] = useState<CandidateRepoItem[]>(() =>
    candidates.map(candidate => uiCandidateToRepo(candidate as UiCandidate)),
  )

  const prevCandidatesRef = React.useRef(candidates)

  useEffect(() => {
    let active = true
    candidatesService.list()
      .then(res => {
        const raw = Array.isArray(res) ? res : (res?.items || res?.candidates || res?.data || [])
        if (active && Array.isArray(raw)) {
          setRepoList(raw.map((c: any) => uiCandidateToRepo(apiCandidateToUi(c))))
        }
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (prevCandidatesRef.current === candidates) return
    const prevIds = (prevCandidatesRef.current || []).map((c: any) => c.id || c.candidateId || '').join(',')
    const currentIds = (candidates || []).map((c: any) => c.id || c.candidateId || '').join(',')
    if (prevIds === currentIds) {
      prevCandidatesRef.current = candidates
      return
    }
    prevCandidatesRef.current = candidates
    if (candidates && candidates.length > 0) {
      setRepoList(candidates.map(candidate => uiCandidateToRepo(candidate as UiCandidate)))
    }
  }, [candidates])
  const [viewMode, setViewMode] = useState<string>('list')
  const filters = useCandidateRepoFilters(repoList)
  const masking = useCandidateRepoMasking()

  const scrollToNextPageSection = () => {
    setTimeout(() => {
      const el = document.getElementById('candidate-repo-next-page-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const [activeReqId, setActiveReqId] = useState<string | null>(selectedReqId || null)
  const [isChangeReqModalOpen, setIsChangeReqModalOpen] = useState(false)
  const [pendingCandidateForSubmit, setPendingCandidateForSubmit] = useState<CandidateRepoItem | null>(null)
  const [tempModalReqId, setTempModalReqId] = useState<string>('')

  React.useEffect(() => {
    if (selectedReqId !== undefined) {
      setActiveReqId(selectedReqId)
    }
  }, [selectedReqId])

  const activeRequirement = useMemo(() => {
    if (!activeReqId) return null
    return (
      requirements.find(r => r.id === activeReqId) ||
      ({
        id: activeReqId,
        title: 'Requirement ' + activeReqId,
        client: '',
        priority: 'High',
        status: 'Active',
      } as Requirement)
    )
  }, [requirements, activeReqId])

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const toggleSelectCandidate = (id: string, e?: React.SyntheticEvent) => {
    e?.stopPropagation()
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === filters.filteredList.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filters.filteredList.map(item => item.id)))
    }
  }

  const [selectedCandidatesForSubmit, setSelectedCandidatesForSubmit] = useState<CandidateRepoItem[]>([])
  const [viewingCandidateDetail, setViewingCandidateDetail] = useState<CandidateRepoItem | null>(null)
  const [selectedSubmissionHistoryCandidate, setSelectedSubmissionHistoryCandidate] = useState<CandidateRepoItem | null>(null)
  const [submissionModalSearchQuery, setSubmissionModalSearchQuery] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const edit = useCandidateRepoEdit(setRepoList, showToast, onCandidateUpdated)
  const handleOpenEdit = (item: CandidateRepoItem, e?: React.MouseEvent) => {
    setViewingCandidateDetail(null)
    edit.handleOpenEdit(item, e)
  }

  const handleSubmitSingleToLead = (item: CandidateRepoItem, e?: React.MouseEvent) => {
    e?.stopPropagation()

    setViewingCandidateDetail(null)
    if (!activeReqId) {
      setPendingCandidateForSubmit(item)
      setTempModalReqId(requirements[0]?.id || '')
      setIsChangeReqModalOpen(true)
    } else {
      setSelectedCandidatesForSubmit([item])
      setViewMode('submit_to_lead')
    }
  }

  const handleConfirmReqSelection = (reqIdToSet: string) => {
    setActiveReqId(reqIdToSet)
    onSelectRequirement?.(reqIdToSet)
    setIsChangeReqModalOpen(false)
    if (pendingCandidateForSubmit) {
      setSelectedCandidatesForSubmit([pendingCandidateForSubmit])
      setPendingCandidateForSubmit(null)
      setViewMode('submit_to_lead')
    } else {
      showToast('Requirement selected successfully!')
    }
  }

  return {
    role,
    requirements,
    onOpenAddForm,
    onSelectRequirement,
    onBackToDashboard,
    isLeadRole,
    repoList,
    viewMode,
    setViewMode,
    ...filters,
    ...masking,
    scrollToNextPageSection,
    activeReqId,
    setActiveReqId,
    isChangeReqModalOpen,
    setIsChangeReqModalOpen,
    pendingCandidateForSubmit,
    setPendingCandidateForSubmit,
    tempModalReqId,
    setTempModalReqId,
    activeRequirement,
    selectedIds,
    setSelectedIds,
    toggleSelectCandidate,
    toggleSelectAll,
    selectedCandidatesForSubmit,
    setSelectedCandidatesForSubmit,
    viewingCandidateDetail,
    setViewingCandidateDetail,
    selectedSubmissionHistoryCandidate,
    setSelectedSubmissionHistoryCandidate,
    submissionModalSearchQuery,
    setSubmissionModalSearchQuery,
    toastMsg,
    showToast,
    ...edit,
    handleOpenEdit,
    handleSubmitSingleToLead,
    handleConfirmReqSelection,
  }
}

export type CandidateRepoVm = ReturnType<typeof useCandidateRepository>
