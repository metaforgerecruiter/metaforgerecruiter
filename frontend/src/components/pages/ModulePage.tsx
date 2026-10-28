import React, { useState } from 'react'
import { Requirement, Submission, Interview, Recruiter, Candidate, ActivityLogItem } from '../../types'
import { Role } from '../../types'
import { renderModulePage } from './ModulePage.routes'

interface ModulePageProps {
  pageKey: string
  role: Role
  requirements?: Requirement[]
  submissions?: Submission[]
  interviews?: Interview[]
  recruiters?: Recruiter[]
  selectedReqId?: string | null
  activityLogs?: ActivityLogItem[]
  currentUserName?: string
  currentUserEmail?: string
  initialCandidates?: Candidate[]
  onOpenSubmit?: (reqId?: string) => void
  onOpenFeedback?: (iv: Interview) => void
  onOpenCandidate?: (sub: Submission) => void
  onUpdateRequirements?: (requirements: Requirement[]) => void
  onSelectRequirement?: (reqId: string | null) => void
  onAddActivityLog?: (log: ActivityLogItem) => void
  onNavigateToDashboard?: () => void
  onCandidatesChange?: (candidates: Candidate[]) => void
}

export function ModulePage({
  pageKey,
  role,
  requirements = [],
  submissions = [],
  interviews = [],
  recruiters = [],
  selectedReqId = null,
  activityLogs = [],
  currentUserName,
  currentUserEmail,
  onOpenSubmit,
  onOpenFeedback,
  onOpenCandidate,
  onUpdateRequirements,
  onSelectRequirement,
  onAddActivityLog,
  onNavigateToDashboard,
  onCandidatesChange,
  initialCandidates = [],
}: ModulePageProps) {
  const [candidatesList, setCandidatesList] = useState<Candidate[]>(initialCandidates)
  const prevCandidatesRef = React.useRef(initialCandidates)

  React.useEffect(() => {
    setCandidatesList(initialCandidates)
    prevCandidatesRef.current = initialCandidates
  }, [initialCandidates])

  const updateCandidatesList: React.Dispatch<React.SetStateAction<Candidate[]>> = updater => {
    setCandidatesList(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      return next
    })
  }

  React.useEffect(() => {
    if (prevCandidatesRef.current !== candidatesList) {
      prevCandidatesRef.current = candidatesList
      onCandidatesChange?.(candidatesList)
    }
  }, [candidatesList, onCandidatesChange])

  const [candidateViewMode, setCandidateViewMode] = useState<'add' | 'repository'>('add')
  const [addOpenedFromRepository, setAddOpenedFromRepository] = useState(false)

  const handleCandidateViewModeChange = (mode: 'add' | 'repository') => {
    if (mode === 'add' && candidateViewMode === 'repository') {
      setAddOpenedFromRepository(true)
    }
    if (mode === 'repository') {
      setAddOpenedFromRepository(false)
    }
    setCandidateViewMode(mode)
  }

  React.useEffect(() => {
    if (selectedReqId) {
      setCandidateViewMode('repository')
      setAddOpenedFromRepository(false)
    }
  }, [selectedReqId, pageKey])

  // Sidebar nav to Candidates resets nested-back state for a clean top-level entry
  React.useEffect(() => {
    if (pageKey === 'Candidates' || pageKey === 'Candidate Search') {
      if (!selectedReqId) {
        setAddOpenedFromRepository(false)
      }
    } else {
      setAddOpenedFromRepository(false)
    }
  }, [pageKey, selectedReqId])

  return renderModulePage({
    pageKey,
    role,
    requirements,
    submissions,
    interviews,
    recruiters,
    selectedReqId,
    activityLogs,
    currentUserName,
    currentUserEmail,
    candidatesList,
    candidateViewMode,
    onOpenSubmit,
    onOpenFeedback,
    onOpenCandidate,
    onUpdateRequirements,
    onSelectRequirement,
    onAddActivityLog,
    onNavigateToDashboard,
    handleCandidateViewModeChange,
    setCandidatesList: updateCandidatesList,
    addOpenedFromRepository,
  })
}
