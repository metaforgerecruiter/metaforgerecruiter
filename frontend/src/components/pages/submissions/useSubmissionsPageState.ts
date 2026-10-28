import type { SubmissionsPageProps, ScreenshotSubmission } from './preamble'
import { mapBackendSubmission, apiErrorMessage } from './preamble'
import { Requirement } from '../../../types'
import { useState, useEffect, useCallback } from 'react'
import React from 'react'
import { submissionsService } from '../../../services/workspace.service'
import { saveSubmissionsStore } from '../../../data/submissionsStore'

export function useSubmissionsPageState(props: SubmissionsPageProps) {
  const {
    role,
    currentUserName,
    submissions = [],
    requirements = [],
    onOpenSubmitCandidate,
    onUpdateRequirements,
  }: SubmissionsPageProps = props as SubmissionsPageProps & Record<string, never>

  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('All')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [clientFilter, setClientFilter] = useState('All')
  const [selectedSub, setSelectedSub] = useState<ScreenshotSubmission | null>(null)

  const [selectedReqDetail, setSelectedReqDetail] = useState<Requirement | null>(null)
  const [isEditingReq, setIsEditingReq] = useState(false)
  const [editingReq, setEditingReq] = useState<Requirement | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Interview Schedule Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [targetSubForInterview, setTargetSubForInterview] = useState<ScreenshotSubmission | null>(null)

  // Submissions List State
  const [submissionsList, setSubmissionsList] = useState<ScreenshotSubmission[]>(() => {
    if (submissions && submissions.length > 0) {
      const mapped = submissions.map(s => mapBackendSubmission(s))
      return mapped
    }
    return []
  })

  useEffect(() => {
    if (submissions && submissions.length > 0) {
      const mapped = submissions.map(s => mapBackendSubmission(s))
      setSubmissionsList(mapped)
    }
  }, [submissions])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Load backend submissions
  const reloadSubmissions = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await submissionsService.list()
      if (Array.isArray(data)) {
        const mapped = data.map(s => mapBackendSubmission(s))
        setSubmissionsList(mapped)
        if (mapped.length > 0) {
          saveSubmissionsStore(mapped as any)
        }
        if (selectedSub) {
          const updatedSelected = mapped.find(m => m.id === selectedSub.id || m.submissionId === selectedSub.id)
          if (updatedSelected) {
            setSelectedSub(updatedSelected)
          }
        }
      }
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [selectedSub])

  useEffect(() => {
    let active = true
    const fetchInit = async () => {
      try {
        const data = await submissionsService.list()
        if (active && Array.isArray(data)) {
          const mapped = data.map(s => mapBackendSubmission(s))
          if (mapped.length > 0) {
            setSubmissionsList(mapped)
            saveSubmissionsStore(mapped as any)
          }
        }
      } catch (err) {
        if (active) {
          showToast(apiErrorMessage(err))
        }
      }
    }
    fetchInit()

    const handleSubmissionsUpdated = () => {
      reloadSubmissions()
    }
    window.addEventListener('submissions_updated', handleSubmissionsUpdated)

    return () => {
      active = false
      window.removeEventListener('submissions_updated', handleSubmissionsUpdated)
    }
  }, [reloadSubmissions])

  // Action: Update Stage
  const handleUpdateStage = async (id: string, stage: string, notes?: string) => {
    try {
      await submissionsService.updateStage(id, { stage, notes })
      showToast(`Submission stage updated to "${stage}"`)
      await reloadSubmissions()
    } catch (err) {
      showToast(apiErrorMessage(err))
    }
  }

  // Action: Lead Approval
  const handleLeadApproval = async (id: string, approved: boolean, status?: string, reason?: string) => {
    try {
      await submissionsService.leadApproval(id, { approved, status, reason })
      const statusText = status || (approved ? 'Approved' : 'Rejected')
      showToast(`Lead approval updated: ${statusText}`)
      await reloadSubmissions()
    } catch (err) {
      showToast(apiErrorMessage(err))
    }
  }

  // Action: Forward to Client
  const handleForwardClient = async (id: string, notes?: string) => {
    try {
      await submissionsService.forwardClient(id, { notes })
      showToast('Submission successfully forwarded to client')
      await reloadSubmissions()
    } catch (err) {
      showToast(apiErrorMessage(err))
    }
  }

  return {
    role,
    currentUserName,
    submissions,
    requirements,
    onOpenSubmitCandidate,
    onUpdateRequirements,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    statusFilter,
    setStatusFilter,
    clientFilter,
    setClientFilter,
    selectedSub,
    setSelectedSub,
    selectedReqDetail,
    setSelectedReqDetail,
    isEditingReq,
    setIsEditingReq,
    editingReq,
    setEditingReq,
    toastMsg,
    setToastMsg,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    targetSubForInterview,
    setTargetSubForInterview,
    submissionsList,
    setSubmissionsList,
    isLoading,
    showToast,
    reloadSubmissions,
    handleUpdateStage,
    handleLeadApproval,
    handleForwardClient,
  }
}
export type SubmissionsVmState = ReturnType<typeof useSubmissionsPageState>

