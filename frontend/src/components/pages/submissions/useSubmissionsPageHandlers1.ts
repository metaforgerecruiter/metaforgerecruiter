import React, { useMemo, useState } from 'react'
import { Requirement } from '../../../types'
import { getSessionUser } from '../../../store/session'
import type { ScreenshotSubmission } from './preamble'
import type { SubmissionsVmState } from './useSubmissionsPageState'

export function getSubmissionTimestamp(item: ScreenshotSubmission): number {
  const raw = item.raw || {}
  const rawDate = raw.updatedAt || raw.submittedAt || raw.createdAt || item.submittedOn || raw.date
  if (rawDate) {
    const t = new Date(rawDate).getTime()
    if (!isNaN(t) && t > 0) return t
  }
  const idMatch = (item.id || item.submissionId || '').match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (idMatch) {
    const d = new Date(`${idMatch[1]}-${idMatch[2].padStart(2, '0')}-${idMatch[3].padStart(2, '0')}`).getTime()
    if (!isNaN(d)) return d
  }
  return 0
}

export function useSubmissionsPageHandlers1(s: SubmissionsVmState) {
  const {
    role, submissions, requirements, onUpdateRequirements,
    searchQuery, dateFilter, customStartDate, customEndDate,
    setSelectedReqDetail, targetSubForInterview, setTargetSubForInterview, submissionsList,
    setSubmissionsList, showToast, clientFilter, statusFilter
  } = s
  const handleScheduleSuccess = (data: any) => {
    const scheduledStatus = data.interviewRound ? `${data.interviewRound} Scheduled` : 'Interview Scheduled'

    // Update status in Submissions table
    setSubmissionsList(prev =>
      prev.map(item => {
        if (targetSubForInterview && item.id === targetSubForInterview.id) {
          return { ...item, status: scheduledStatus }
        }
        if (data.submission && data.submission.includes(item.candidateName)) {
          return { ...item, status: scheduledStatus }
        }
        return item
      })
    )

    // Update Requirement status and Recruitment Progress step if callback exists
    if (onUpdateRequirements && requirements.length > 0) {
      const targetReqId = targetSubForInterview?.reqId || ''
      const updatedReqs: Requirement[] = requirements.map(r => {
        if (r.id === targetReqId) {
          return {
            ...r,
            interviews: (r.interviews || 0) + 1,
            stage: 'Interview Scheduled',
          } as Requirement
        }
        return r
      })
      onUpdateRequirements(updatedReqs)
    }

    const emailNotice = data?.emailSent ? ` Invite email sent to ${data.candidateEmail || 'candidate'}.` : ''
    const waNotice = data?.whatsappSent ? ' WhatsApp link opened.' : ''
    showToast(`Interview scheduled! Candidate status updated to "${scheduledStatus}".${emailNotice}${waNotice}`)
    setTargetSubForInterview(null)
  }

  const handleOpenReqOverview = (reqId: string, position: string, company: string) => {
    const existing = requirements.find(r => r.id === reqId || r.title === position)
    if (existing) {
      setSelectedReqDetail(existing)
    } else {
      setSelectedReqDetail({ id: reqId, title: position, client: company, company } as any)
    }
  }

  // Rejection reasons map (read-only in table column, set via candidate profile modal)
  const [reasons, setReasons] = useState<Record<string, string>>({
    'SUB-005': 'Notice period > 60 days',
    'SUB-007': 'Expected CTC exceeds approved budget limit',
  })

  // Scope filter: 'my_submissions' (lead only), 'team_members' (members only), 'all' (members + lead)
  const [scopeTab, setScopeTab] = useState<'my_submissions' | 'team_members' | 'all'>('my_submissions')

  // Scope submissions data for team lead and recruiter roles
  const scopeSubmissions = useMemo(() => {
    const session = getSessionUser()
    const activeRecruiterName = (s.currentUserName || session?.name || '').trim().toLowerCase()
    const activeRecruiterId = session?.id || ''
    const activeRecruiterEmail = (session?.email || '').trim().toLowerCase()

    if (role === 'lead') {
      return submissionsList.filter(item => {
        const by = item.submittedBy.toLowerCase()
        if (scopeTab === 'my_submissions') {
          return by.includes('harish') || by.includes('lead')
        }
        if (scopeTab === 'team_members') {
          return !by.includes('harish') && !by.includes('lead')
        }
        return true
      })
    }

    if (role === 'recruiter') {
      const matchRecruiter = (item: ScreenshotSubmission) => {
        const by = (item.submittedBy || '').toLowerCase().trim()
        if (activeRecruiterId && item.raw?.recruiterId && String(item.raw.recruiterId) === String(activeRecruiterId)) return true
        if (activeRecruiterEmail && item.raw?.recruiterEmail && String(item.raw.recruiterEmail).toLowerCase() === activeRecruiterEmail) return true
        if (activeRecruiterName) {
          if (by === activeRecruiterName || by.includes(activeRecruiterName) || activeRecruiterName.includes(by)) return true
          const activeTokens = activeRecruiterName.split(/\s+/).filter(t => t.length >= 3)
          const byTokens = by.split(/\s+/).filter(t => t.length >= 3)
          if (activeTokens.some(t => byTokens.includes(t))) return true
          return false
        }
        return true
      }

      const isClientSubmission = (item: ScreenshotSubmission) => {
        const st = (item.status || '').toLowerCase().trim()
        const leadStatus = (item.leadApprovalStatus || '').toLowerCase().trim()

        // Exclude internal-only draft or submitted to lead
        if (st === 'submitted to lead' || st === 'draft' || leadStatus === 'pending') {
          return false
        }

        return (
          st === 'submitted to client' ||
          st.includes('client') ||
          st.includes('interview') ||
          st.includes('select') ||
          st.includes('offer') ||
          st.includes('place') ||
          leadStatus === 'forwarded' ||
          leadStatus === 'approved' ||
          (st === 'rejected' && !leadStatus.includes('lead') && !(item.rejectionReason || '').toLowerCase().includes('lead'))
        )
      }

      return submissionsList.filter(item => matchRecruiter(item) && isClientSubmission(item))
    }

    return submissionsList
  }, [submissionsList, role, scopeTab, s.currentUserName])

  // Extract unique client names dynamically for the client-wise filter dropdown
  const clientOptions = useMemo(() => {
    const clientsSet = new Set<string>()
    scopeSubmissions.forEach(item => {
      if (item.clientName) {
        clientsSet.add(item.clientName)
      }
    })
    return Array.from(clientsSet).sort()
  }, [scopeSubmissions])

  // Map submission counts per client for stats & quick filter pills
  const clientCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    scopeSubmissions.forEach(item => {
      const client = item.clientName || 'Unknown Client'
      counts[client] = (counts[client] || 0) + 1
    })
    return counts
  }, [scopeSubmissions])

  // Dynamic filter
  const filteredData = useMemo(() => {
    const list = scopeSubmissions.filter(item => {
      // Search text
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase()
        const matchCandidate = item.candidateName.toLowerCase().includes(q)
        const matchCompany = item.currentCompany.toLowerCase().includes(q)
        const matchReq = item.requirement.toLowerCase().includes(q)
        const matchRecruiter = item.submittedBy.toLowerCase().includes(q)
        const matchClient = (item.clientName || '').toLowerCase().includes(q)

        if (!matchCandidate && !matchCompany && !matchReq && !matchRecruiter && !matchClient) {
          return false
        }
      }

      // Date filter
      if (dateFilter && dateFilter !== 'All') {
        const rawDate = item.submittedOn || ''
        if (!rawDate) return false
        const d = new Date(rawDate)
        if (isNaN(d.getTime())) return false

        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

        if (dateFilter === 'Today') {
          if (d < startOfToday || d > endOfToday) return false
        } else if (dateFilter === 'Yesterday') {
          const startOfYesterday = new Date(startOfToday.getTime() - 86400000)
          const endOfYesterday = new Date(endOfToday.getTime() - 86400000)
          if (d < startOfYesterday || d > endOfYesterday) return false
        } else if (dateFilter === 'This week') {
          const day = (now.getDay() + 6) % 7
          const startOfWeek = new Date(startOfToday.getTime() - day * 86400000)
          if (d < startOfWeek || d > endOfToday) return false
        } else if (dateFilter === 'This month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          if (d < startOfMonth || d > endOfToday) return false
        } else if (dateFilter === 'Custom range') {
          if (customStartDate) {
            const start = new Date(`${customStartDate}T00:00:00`)
            if (d < start) return false
          }
          if (customEndDate) {
            const end = new Date(`${customEndDate}T23:59:59.999`)
            if (d > end) return false
          }
        }
      }

      if (clientFilter !== 'All') {
        if (item.clientName?.toLowerCase() !== clientFilter.toLowerCase()) {
          return false
        }
      }

      const itemStatus = item.status.toLowerCase().trim()
      const filterVal = statusFilter.toLowerCase().trim()

      if (filterVal !== 'all') {
        if (filterVal === 'submitted to client') {
          if (!itemStatus.includes('client')) return false
        } else if (filterVal === 'submitted to lead') {
          if (!itemStatus.includes('lead')) return false
        } else if (filterVal === 'interview scheduled') {
          if (!itemStatus.includes('interview')) return false
        } else if (filterVal === 'selected') {
          if (!itemStatus.includes('select')) return false
        } else if (filterVal === 'placed') {
          if (!itemStatus.includes('place')) return false
        } else if (filterVal === 'rejected') {
          if (!itemStatus.includes('reject')) return false
        }
      }

      return true
    })

    return [...list].sort((a, b) => {
      const timeA = getSubmissionTimestamp(a)
      const timeB = getSubmissionTimestamp(b)
      if (timeB !== timeA) return timeB - timeA
      return (b.id || '').localeCompare(a.id || '')
    })
  }, [
    scopeSubmissions,
    searchQuery,
    dateFilter,
    customStartDate,
    customEndDate,
    clientFilter,
    statusFilter,
  ])

  return {
    handleScheduleSuccess, handleOpenReqOverview, scopeSubmissions, clientOptions,
    clientCounts, filteredData, reasons, setReasons, scopeTab, setScopeTab
  }
}
