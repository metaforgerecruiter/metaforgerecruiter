import type { RecruiterDetailAnalyticsPageProps, RecruiterDetailData } from './preamble'
import { useState, useMemo, useEffect, useRef } from 'react'
import React from 'react'

export function useRecruiterDetailAnalyticsState(props: RecruiterDetailAnalyticsPageProps) {
  const {
  recruiter: initialRecruiter,
  onBack,
  userRole = 'recruiter',
}: RecruiterDetailAnalyticsPageProps = props as RecruiterDetailAnalyticsPageProps & Record<string, never>
  const [recruiter, setRecruiter] = useState<RecruiterDetailData>(initialRecruiter)
  const [activeTab, setActiveTab] = useState<'requirements' | 'submissions'>('requirements')
  const [dateFilter, setDateFilter] = useState<'today' | 'this_week' | 'this_month' | 'custom'>('this_month')
  const [startDate, setStartDate] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0, 10) })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))

  // Reason Modal State
  const [selectedReqForReason, setSelectedReqForReason] = useState<{ id: string; title: string; currentReason?: string } | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleOpenReasonModal = (req: { id: string; title: string; reasonNote?: string }) => {
    setSelectedReqForReason({ id: req.id, title: req.title, currentReason: req.reasonNote })
    setReasonText(req.reasonNote || '')
  }

  const handleSaveReasonNote = () => {
    if (!selectedReqForReason) return
    const updatedList = recruiter.requirementsList.map((item: RecruiterDetailData['requirementsList'][number]) =>
      item.id === selectedReqForReason.id ? { ...item, reasonNote: reasonText.trim() } : item
    )
    setRecruiter({ ...recruiter, requirementsList: updatedList })
    showToast(`Saved non-submission reason for ${selectedReqForReason.id}!`)
    setSelectedReqForReason(null)
    setReasonText('')
  }

  const PRESET_REASONS = [
    'Client JD requirements unclear / pending clarification',
    'Candidate salary expectation exceeds client budget',
    'Location constraint / No local candidates available',
    'Requirement put on hold by hiring manager',
    'Niche skill set requiring extended sourcing timeline',
  ]

  return {
    recruiter,
    onBack,
    userRole,
    setRecruiter,
    activeTab,
    setActiveTab,
    dateFilter,
    setDateFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedReqForReason,
    setSelectedReqForReason,
    reasonText,
    setReasonText,
    toastMsg,
    setToastMsg,
    showToast,
    handleOpenReasonModal,
    handleSaveReasonNote,
    PRESET_REASONS,
  }
}
export type RecruiterDetailVmState = ReturnType<typeof useRecruiterDetailAnalyticsState>
