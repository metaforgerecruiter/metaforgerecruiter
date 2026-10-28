import React, { useState, useMemo } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bell,
  Search,
  Filter,
  Video,
  Edit2,
  Trash2,
  Plus,
  RefreshCw,
  X,
  UserCheck,
  UserX,
  MessageSquare,
  Building2,
  ExternalLink,
  ChevronRight,
  User,
  Star,
  FileText,
  Briefcase,
  AlertTriangle,
  Building,
  Users,
  ChevronLeft,
  Activity,
  CalendarRange,
  Laptop,
  Play,
  Send,
  Mail,
  Phone,
} from 'lucide-react'
import { Interview, Role, Requirement } from '../../types'
import { ScheduleInterviewModal } from '../modals/ScheduleInterviewModal'
import { RequirementDetailOverview } from './RequirementDetailOverview'
import { PaginationFooter } from '../ui/PaginationFooter'
import { interviewsService, offersService, submissionsService } from '../../services/workspace.service'
import { apiErrorMessage } from './submissions/preamble'
import { getSessionUser } from '../../store/session'

export function mapBackendOfferToOfferRow(item: any): OfferLetterRowItem {
  const candidateName = item.candidateName || item.candidate || '—'
  const position = item.requirementTitle || item.position || 'Position'
  const client = item.clientName || item.client || 'Client'
  const requirementId = typeof item.requirementId === 'string' ? item.requirementId : item.requirementId?.reqCode || item.requirementId?._id || ''
  const offerDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
  const offeredCTC = typeof item.offeredCtc === 'number' ? `₹${item.offeredCtc.toLocaleString('en-IN')} PA` : (item.offeredCTC || '₹18,00,000 PA')
  const joiningDate = item.joiningDate ? new Date(item.joiningDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : undefined
  const status = item.status || 'Offer Released'
  const notJoinedNote = item.notJoinedNote || item.declinedReason || undefined
  const declineReason = item.declinedReason || undefined

  return {
    id: item.id || item._id || item.offerId,
    candidateName,
    position,
    client,
    requirementId,
    offerDate,
    offeredCTC,
    joiningDate,
    status,
    declineReason,
    notJoinedReason: notJoinedNote ? notJoinedNote.split(':')[0] : undefined,
    notJoinedNote,
    submittedBy: item.recruiter || 'Recruiter',
    raw: item,
  }
}

export function mapBackendInterviewToScheduleRow(item: any): ScheduleRowItem {
  const candidateName = item.candidateName || item.candidate || '—'
  const position = item.requirementTitle || item.position || 'Software Engineer'
  const company = item.clientName || item.client || 'Client'
  const round = item.round || item.stage || 'L1 Technical'
  const dateTimeStr = item.dateTime
    ? new Date(item.dateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : (item.date || 'Today')
  const mode = item.mode || 'Online'
  const rawStatus = item.status || 'Scheduled'

  let status: 'Upcoming' | 'In Progress' | 'Completed' | 'Scheduled' | 'Rejected' = 'Scheduled'
  if (rawStatus === 'Confirmed' || rawStatus === 'Passed' || rawStatus === 'Completed') {
    status = 'Completed'
  } else if (rawStatus === 'Rejected' || rawStatus === 'Cancelled') {
    status = 'Rejected'
  } else if (rawStatus === 'In Progress' || rawStatus === 'Pending') {
    status = 'In Progress'
  } else if (rawStatus === 'Upcoming' || rawStatus === 'Scheduled' || rawStatus === 'Rescheduled') {
    status = 'Upcoming'
  }

  return {
    id: item.id || item._id || item.interviewId,
    interviewId: item.interviewId || item.id || item._id,
    candidateName,
    position,
    company,
    round,
    dateTime: dateTimeStr,
    mode,
    status,
    requirementId: typeof item.requirementId === 'string' ? item.requirementId : item.requirementId?.reqCode || item.requirementId?._id || '',
    submissionId: typeof item.submissionId === 'string' ? item.submissionId : item.submissionId?._id || item.submissionId?.submissionId,
    candidateId: typeof item.candidateId === 'string' ? item.candidateId : item.candidateId?._id,
    submittedBy: item.recruiter || item.interviewerName || 'Recruiter',
    candidateEmail: item.candidateId?.email || item.candidateEmail || '',
    candidatePhone: item.candidateId?.phone || item.candidatePhone || '',
    meetingUrl: item.meetingUrl,
    interviewerName: item.interviewerName,
    rejectionReason: item.status === 'Cancelled' ? 'Interview Cancelled' : item.rejectionReason,
    raw: item,
  }
}

export interface ScheduleRowItem {

  id: string
  interviewId?: string
  submissionId?: string
  candidateId?: string
  candidateName: string
  position: string
  company: string
  round: string // 'L1' | 'Final'
  dateTime: string
  mode: string // 'Online' | 'In-Person'
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Scheduled' | 'Rejected'
  requirementId?: string
  teamLead?: string
  submittedBy?: string
  rejectionReason?: string
  remark?: string
  candidateEmail?: string
  candidatePhone?: string
  meetingUrl?: string
  interviewerName?: string
  experience?: string
  skills?: string[]
  raw?: any
}

export interface FinalDecisionRowItem {
  id: string
  candidateName: string
  requirementId: string
  requirement: string
  decision: 'Selected for Interview' | 'Rejected in Interview' | 'Pending'
  rejectionReason: string
  offerLetter: string
  client?: string
  teamLead?: string
  submittedBy?: string
}

export type RejectionStageType = 'Screening' | 'L1 Technical' | 'L2 Technical' | 'L3 / Manager' | 'Final HR Round'

export interface RejectedCandidateRowItem {
  id: string
  candidateName: string
  position: string
  company: string
  rejectedStage: RejectionStageType
  rejectionReason: string
  evaluatorNotes: string
  evaluatedBy: string
  submittedBy?: string
  teamLead?: string
  rejectionDate: string
  requirementId: string
  candidateId?: string
}

export interface OfferLetterRowItem {
  id: string
  candidateName: string
  position: string
  client: string
  requirementId: string
  offerDate: string
  offeredCTC: string
  joiningDate?: string
  status: 'Offer Released' | 'Accepted' | 'Joined' | 'Not Joined' | 'Declined'
  declineReason?: string
  notJoinedReason?: string
  notJoinedNote?: string
  notJoinedDate?: string
  submittedBy?: string
  raw?: any
}

interface InterviewTrackingPageProps {
  role?: Role
  interviews?: Interview[]
  onOpenFeedbackModal?: (iv: Interview) => void
  initialStatusToggle?: 'upcoming' | 'completed' | 'rejections' | 'all' | 'onboarding'
  onUpdateRequirements?: (requirements: Requirement[]) => void
  /** Live requirements, used to open the real requirement behind an interview row. */
  requirements?: Requirement[]
}

export function InterviewTrackingPage({
  role = 'recruiter',
  interviews,
  requirements = [],
  onOpenFeedbackModal,
  initialStatusToggle,
  onUpdateRequirements,
}: InterviewTrackingPageProps) {
  const normalizedRole = (role || '').toLowerCase()
  const isLead = normalizedRole === 'lead'
  const isRecruiter = normalizedRole === 'recruiter'
  const sessionUser = getSessionUser()
  const activeUserName = (sessionUser?.name || '').toLowerCase().trim()

  // Scope filter for Team Lead: 'my_interviews' (lead only), 'team_members' (members only), 'all' (members + lead)
  const [scopeTab, setScopeTab] = useState<'my_interviews' | 'team_members' | 'all'>('my_interviews')

  // Toggle Switcher ('upcoming' | 'completed' | 'rejections' | 'all' | 'onboarding')
  const [statusToggle, setStatusToggle] = useState<'upcoming' | 'completed' | 'rejections' | 'all' | 'onboarding'>(initialStatusToggle || 'all')

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom_range'>('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [clientFilter, setClientFilter] = useState('All Clients')
  const [roundFilter, setRoundFilter] = useState('All Rounds')
  const [rejectionStageFilter, setRejectionStageFilter] = useState<string>('All Stages')

  // Tables State
  const [scheduleList, setScheduleList] = useState<ScheduleRowItem[]>([])
  const [finalDecisions, setFinalDecisions] = useState<FinalDecisionRowItem[]>([])
  const [offerLetters, setOfferLetters] = useState<OfferLetterRowItem[]>([])
  const [rejectedList, setRejectedList] = useState<RejectedCandidateRowItem[]>([])

  // Modals & Requirement Overview State
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [calendarStateFilter, setCalendarStateFilter] = useState<'all' | 'Upcoming' | 'In Progress' | 'Completed'>('all')
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleRowItem | null>(null)
  const [remindModalCandidate, setRemindModalCandidate] = useState<ScheduleRowItem | null>(null)
  const [rejectModalCandidate, setRejectModalCandidate] = useState<ScheduleRowItem | null>(null)
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>('Technical evaluation score below threshold')
  const [selectedRejectionStage, setSelectedRejectionStage] = useState<RejectionStageType>('L1 Technical')
  const [customRejectionNote, setCustomRejectionNote] = useState<string>('')
  const [selectedReqDetail, setSelectedReqDetail] = useState<Requirement | null>(null)
  const [selectedRejectedCandidateModal, setSelectedRejectedCandidateModal] = useState<RejectedCandidateRowItem | null>(null)

  // Candidate Detail & Remark Modal State
  const [selectedCandidateDetailModal, setSelectedCandidateDetailModal] = useState<ScheduleRowItem | null>(null)
  const [modalRemarkText, setModalRemarkText] = useState('')
  const [modalStatusChoice, setModalStatusChoice] = useState<'Remark' | 'Rejected'>('Remark')

  const handleOpenCandidateDetailModal = (item: ScheduleRowItem) => {
    setSelectedCandidateDetailModal(item)
    setModalRemarkText(item.remark || item.rejectionReason || '')
    setModalStatusChoice(item.status === 'Rejected' || !!item.rejectionReason ? 'Rejected' : 'Remark')
  }

  const handleSaveCandidateRemark = () => {
    if (!selectedCandidateDetailModal) return
    const targetId = selectedCandidateDetailModal.id
    const updatedText = modalRemarkText.trim()
    const isRejected = modalStatusChoice === 'Rejected'

    setScheduleList(prev =>
      prev.map(row => {
        if (row.id === targetId) {
          return {
            ...row,
            status: isRejected ? ('Rejected' as const) : row.status,
            rejectionReason: isRejected ? updatedText || 'Candidate rejected during evaluation' : undefined,
            remark: !isRejected ? updatedText : undefined,
          }
        }
        return row
      })
    )

    if (isRejected) {
      setRejectedList(prev => [
        {
          id: `rej-${Date.now()}`,
          candidateName: selectedCandidateDetailModal.candidateName,
          candidateId: `CAND-${selectedCandidateDetailModal.id}`,
          position: selectedCandidateDetailModal.position,
          company: selectedCandidateDetailModal.company,
          rejectedStage: selectedCandidateDetailModal.round === 'L1' ? 'L1 Technical' : 'L2 Technical',
          rejectionReason: updatedText || 'Candidate rejected during evaluation',
          evaluatorNotes: updatedText || 'Candidate evaluation notes updated by recruiter.',
          evaluatedBy: selectedCandidateDetailModal.submittedBy || 'Recruiter',
          submittedBy: selectedCandidateDetailModal.submittedBy || 'Recruiter',
          teamLead: selectedCandidateDetailModal.teamLead || 'Team Lead',
          rejectionDate: '—',
          requirementId: selectedCandidateDetailModal.requirementId || '',
        },
        ...prev,
      ])
    }

    showToast(`Saved remark & details for candidate ${selectedCandidateDetailModal.candidateName}!`)
    setSelectedCandidateDetailModal(null)
  }

  // Onboarding & Offer Outcome State
  const [offerOutcomeFilter, setOfferOutcomeFilter] = useState<'all' | 'joined' | 'not_joined' | 'pending'>('all')
  const [notJoinedModalCandidate, setNotJoinedModalCandidate] = useState<OfferLetterRowItem | null>(null)
  const [selectedNotJoinedReason, setSelectedNotJoinedReason] = useState<string>('Competing offer with higher compensation')
  const [notJoinedCustomNote, setNotJoinedCustomNote] = useState<string>('')
  const [viewNotJoinedDetailModal, setViewNotJoinedDetailModal] = useState<OfferLetterRowItem | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const reloadInterviews = React.useCallback(async () => {
    try {
      const data = await interviewsService.list()
      if (Array.isArray(data)) {
        setScheduleList(data.map(mapBackendInterviewToScheduleRow))
      }
    } catch (err) {
      showToast(apiErrorMessage(err))
    }
  }, [])

  const reloadOffers = React.useCallback(async () => {
    try {
      const data = await offersService.list()
      if (Array.isArray(data)) {
        setOfferLetters(data.map(mapBackendOfferToOfferRow))
      }
    } catch (err) {
      showToast(apiErrorMessage(err))
    }
  }, [])

  React.useEffect(() => {
    let active = true
    const fetchInit = async () => {
      try {
        const [intData, offerData] = await Promise.all([
          interviewsService.list().catch(() => []),
          offersService.list().catch(() => []),
        ])
        if (active && Array.isArray(intData)) {
          setScheduleList(intData.map(mapBackendInterviewToScheduleRow))
        }
        if (active && Array.isArray(offerData)) {
          setOfferLetters(offerData.map(mapBackendOfferToOfferRow))
        }
      } catch (err) {
        if (active) showToast(apiErrorMessage(err))
      }
    }
    fetchInit()
    return () => {
      active = false
    }
  }, [])

  const handleRescheduleInterview = async (id: string, dateTimeIso: string, reason?: string) => {
    try {
      await interviewsService.reschedule(id, { dateTime: dateTimeIso, reason })
      showToast('Interview rescheduled successfully!')
      await reloadInterviews()
    } catch (err) {
      showToast(apiErrorMessage(err))
    }
  }

  const handleCancelInterview = async (id: string, reason?: string) => {
    try {
      await interviewsService.cancel(id, { reason: reason || 'Cancelled by recruiter' })
      showToast('Interview cancelled successfully!')
      await reloadInterviews()
    } catch (err) {
      showToast(apiErrorMessage(err))
    }
  }

  const handleSubmitInterviewFeedback = async (id: string, recommendation: string, notes: string, rating?: number) => {
    try {
      await interviewsService.submitFeedback(id, {
        recommendation,
        feedbackNotes: notes,
        technicalScore: rating || 4,
      })
      showToast('Interview feedback submitted successfully!')
      await reloadInterviews()
    } catch (err) {
      showToast(apiErrorMessage(err))
    }
  }


  const handleOpenReqOverview = (reqId: string, position: string, company: string) => {
    // Open the real requirement; when it is not in the loaded list, show only what the row knows.
    const key = String(reqId || '').trim()
    const real = requirements.find(r =>
      [r.id, (r as any).reqCode, (r as any)._id, (r as any).displayId].some(v => v && String(v) === key),
    )
    setSelectedReqDetail((real || { id: key, title: position, client: company, company }) as any)
  }

  // Map passed interviews prop into ScheduleRowItems
  const mappedPropInterviews: ScheduleRowItem[] = useMemo(() => {
    if (interviews && interviews.length > 0) {
      return interviews.map((iv, idx) => {
        const sStr = (iv.status as string) || ''
        const isUpcoming = sStr === 'Confirmed' || sStr === 'Scheduled'
        const isCompleted = sStr === 'Passed' || sStr === 'Completed' || sStr === 'Rejected'
        const isInProgress = sStr === 'In Progress' || sStr === 'Pending'

        const mappedStatus: 'Upcoming' | 'In Progress' | 'Completed' = isUpcoming
          ? 'Upcoming'
          : isCompleted
          ? 'Completed'
          : isInProgress
          ? 'In Progress'
          : 'Upcoming'

        return {
          id: iv.id || `prop-iv-${idx}`,
          candidateName: iv.candidate,
          position: iv.position,
          company: iv.client,
          round: iv.stage || 'L1',
          dateTime: iv.date || '',
          mode: 'Online',
          status: mappedStatus,
          requirementId: (iv as any).requirementId || '',
        }
      })
    }
    return []
  }, [interviews])

  // Combine state scheduleList with mappedPropInterviews
  const combinedScheduleList = useMemo(() => {
    const existingIds = new Set(scheduleList.map(s => s.id))
    const extras = mappedPropInterviews.filter(m => !existingIds.has(m.id))
    return [...scheduleList, ...extras]
  }, [scheduleList, mappedPropInterviews])

  // Scope interviews data by role (single recruiter vs team lead scope)
  const scopeScheduleList = useMemo(() => {
    if (isLead) {
      return combinedScheduleList.filter(s => {
        const by = (s.submittedBy || '').toLowerCase()
        const isLeadSub = activeUserName ? by.includes(activeUserName) : true
        if (scopeTab === 'my_interviews') return isLeadSub
        if (scopeTab === 'team_members') return !isLeadSub
        return true
      })
    }
    if (isRecruiter && activeUserName) {
      return combinedScheduleList.filter(s => {
        const by = (s.submittedBy || '').toLowerCase()
        return !by || by.includes(activeUserName) || activeUserName.includes(by)
      })
    }
    return combinedScheduleList
  }, [combinedScheduleList, isLead, isRecruiter, scopeTab, activeUserName])

  // Scope offer letters by role
  const scopeOfferLetters = useMemo(() => {
    if (isLead) {
      return offerLetters.filter(o => {
        const by = ((o as any).submittedBy || '').toLowerCase()
        const isLeadSub = activeUserName ? by.includes(activeUserName) : true
        if (scopeTab === 'my_interviews') return isLeadSub
        if (scopeTab === 'team_members') return !isLeadSub
        return true
      })
    }
    if (isRecruiter && activeUserName) {
      return offerLetters.filter(o => {
        const by = ((o as any).submittedBy || '').toLowerCase()
        return !by || by.includes(activeUserName) || activeUserName.includes(by)
      })
    }
    return offerLetters
  }, [offerLetters, isLead, isRecruiter, scopeTab, activeUserName])

  const checkDateMatch = (
    rawDateStr: string | undefined,
    filter: 'all' | 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom_range',
    customStart?: string,
    customEnd?: string
  ): boolean => {
    if (filter === 'all') return true
    if (!rawDateStr) return false
    const d = new Date(rawDateStr)
    if (isNaN(d.getTime())) return false

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    if (filter === 'today') {
      return d >= startOfToday && d <= endOfToday
    }
    if (filter === 'yesterday') {
      const startOfYesterday = new Date(startOfToday.getTime() - 86400000)
      const endOfYesterday = new Date(endOfToday.getTime() - 86400000)
      return d >= startOfYesterday && d <= endOfYesterday
    }
    if (filter === 'this_week') {
      const day = (now.getDay() + 6) % 7 // Monday = 0
      const startOfWeek = new Date(startOfToday.getTime() - day * 86400000)
      return d >= startOfWeek && d <= endOfToday
    }
    if (filter === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      return d >= startOfMonth && d <= endOfToday
    }
    if (filter === 'custom_range') {
      if (customStart) {
        const start = new Date(`${customStart}T00:00:00`)
        if (d < start) return false
      }
      if (customEnd) {
        const end = new Date(`${customEnd}T23:59:59.999`)
        if (d > end) return false
      }
      return true
    }
    return true
  }

  // Filter offer letters by outcome filter, search query & date filter
  const filteredOfferLetters = useMemo(() => {
    return scopeOfferLetters.filter(item => {
      if (!checkDateMatch(item.offerDate || item.joiningDate, dateFilter, customStartDate, customEndDate)) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = item.candidateName.toLowerCase().includes(q)
        const matchPos = item.position.toLowerCase().includes(q)
        const matchComp = item.client.toLowerCase().includes(q)
        const matchNote = (item.notJoinedNote || '').toLowerCase().includes(q)
        const matchReason = (item.notJoinedReason || item.declineReason || '').toLowerCase().includes(q)
        if (!matchName && !matchPos && !matchComp && !matchNote && !matchReason) return false
      }

      if (clientFilter !== 'All Clients' && item.client !== clientFilter) {
        return false
      }

      if (offerOutcomeFilter === 'joined') {
        return item.status === 'Joined'
      }
      if (offerOutcomeFilter === 'not_joined') {
        return item.status === 'Not Joined' || item.status === 'Declined'
      }
      if (offerOutcomeFilter === 'pending') {
        return item.status === 'Offer Released' || item.status === 'Accepted'
      }

      return true
    })
  }, [scopeOfferLetters, searchQuery, clientFilter, offerOutcomeFilter, dateFilter, customStartDate, customEndDate])

  // Scope final decisions by role
  const scopeFinalDecisions = useMemo(() => {
    if (isLead) {
      return finalDecisions.filter(d => {
        const by = (d.submittedBy || '').toLowerCase()
        const isLeadSub = activeUserName ? by.includes(activeUserName) : true
        if (scopeTab === 'my_interviews') return isLeadSub
        if (scopeTab === 'team_members') return !isLeadSub
        return true
      })
    }
    if (isRecruiter && activeUserName) {
      return finalDecisions.filter(d => {
        const by = (d.submittedBy || '').toLowerCase()
        return !by || by.includes(activeUserName) || activeUserName.includes(by)
      })
    }
    return finalDecisions
  }, [finalDecisions, isLead, isRecruiter, scopeTab, activeUserName])

  // Evaluated Schedule List:
  // 1. Scheduled in future -> Upcoming
  // 2. Intermediate rounds (L1, L2, Screening, Tech 1/2) -> In Progress
  // 3. Completed all rounds (L3, Final Round, Final HR, Offer Released) -> Completed
  const evaluatedScheduleList = useMemo(() => {
    const now = new Date()

    return scopeScheduleList.map(row => {
      const roundLower = (row.round || '').toLowerCase()

      // Check if all rounds are completed (L3, Final, HR Round, Offer Released, Cleared All Rounds)
      const isCompletedAllRounds =
        roundLower.includes('l3') ||
        roundLower.includes('final') ||
        roundLower.includes('offer released') ||
        roundLower.includes('completed all')

      // Check if intermediate round (L1, L2, Screening, Technical Round 1, Technical Round 2)
      const isIntermediateRound =
        roundLower.includes('l1') ||
        roundLower.includes('l2') ||
        roundLower.includes('screening') ||
        roundLower.includes('technical round 1') ||
        roundLower.includes('technical round 2') ||
        roundLower.includes('evaluation')

      // If round explicitly indicates all rounds finished OR explicitly marked Completed for non-intermediate round
      if (isCompletedAllRounds || (row.status === 'Completed' && !isIntermediateRound)) {
        return { ...row, status: 'Completed' as const }
      }

      // If intermediate round, keep as In Progress (or Upcoming if explicitly scheduled in future)
      if (isIntermediateRound) {
        if (row.status === 'Upcoming') {
          const timeStr = row.dateTime || ''
          if (timeStr.toLowerCase().includes('today')) {
            const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
            if (match) {
              let hour = parseInt(match[1], 10)
              const min = parseInt(match[2], 10)
              const ampm = match[3].toUpperCase()
              if (ampm === 'PM' && hour < 12) hour += 12
              if (ampm === 'AM' && hour === 12) hour = 0

              const schedTime = new Date()
              schedTime.setHours(hour, min, 0, 0)

              if (now >= schedTime) {
                return { ...row, status: 'In Progress' as const }
              }
            }
          }
          return { ...row, status: 'Upcoming' as const }
        }
        return { ...row, status: 'In Progress' as const }
      }

      if (
        row.status === 'Completed' ||
        (row.status as string) === 'Selected' ||
        (row.status as string) === 'Rejected'
      ) {
        return { ...row, status: 'Completed' as const }
      }

      if (row.status === 'In Progress') {
        return { ...row, status: 'In Progress' as const }
      }

      return { ...row, status: 'Upcoming' as const }
    })
  }, [scopeScheduleList])

  // Filter Schedule Rows according to selected statusToggle, searchQuery, clientFilter, roundFilter, and dateFilter
  const filteredScheduleList = useMemo(() => {
    return evaluatedScheduleList.filter(row => {
      if (!checkDateMatch(row.dateTime, dateFilter, customStartDate, customEndDate)) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = row.candidateName.toLowerCase().includes(q)
        const matchPos = row.position.toLowerCase().includes(q)
        const matchComp = row.company.toLowerCase().includes(q)
        const matchRound = row.round.toLowerCase().includes(q)
        if (!matchName && !matchPos && !matchComp && !matchRound) return false
      }

      if (clientFilter !== 'All Clients' && row.company !== clientFilter) {
        return false
      }

      if (roundFilter !== 'All Rounds' && !row.round.toLowerCase().includes(roundFilter.toLowerCase())) {
        return false
      }

      if (statusToggle === 'upcoming') {
        return (row.status as string) === 'Upcoming' || (row.status as string) === 'Scheduled'
      }
      if (statusToggle === 'completed') {
        return row.status === 'Completed'
      }
      return true
    })
  }, [evaluatedScheduleList, searchQuery, statusToggle, clientFilter, roundFilter, dateFilter, customStartDate, customEndDate])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const totalPages = Math.ceil(filteredScheduleList.length / pageSize) || 1

  const paginatedScheduleList = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredScheduleList.slice(start, start + pageSize)
  }, [filteredScheduleList, currentPage, pageSize])

  const getRoundBadgeStyle = (round: string) => {
    const r = round.toLowerCase()
    if (r.includes('l1') || r.includes('screening') || r.includes('l2') || r.includes('technical')) {
      return 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return 'bg-slate-100 text-slate-800 border-slate-200'
  }

  // Scope rejected list by role
  const scopeRejectedList = useMemo(() => {
    if (isLead) {
      return rejectedList.filter(r => {
        const by = (r.submittedBy || '').toLowerCase()
        const isLeadSub = activeUserName ? by.includes(activeUserName) : true
        if (scopeTab === 'my_interviews') return isLeadSub
        if (scopeTab === 'team_members') return !isLeadSub
        return true
      })
    }
    if (isRecruiter && activeUserName) {
      return rejectedList.filter(r => {
        const by = (r.submittedBy || '').toLowerCase()
        return !by || by.includes(activeUserName) || activeUserName.includes(by)
      })
    }
    return rejectedList
  }, [rejectedList, isLead, isRecruiter, scopeTab, activeUserName])

  const filteredRejectedList = useMemo(() => {
    return scopeRejectedList.filter(item => {
      if (!checkDateMatch(item.rejectionDate, dateFilter, customStartDate, customEndDate)) {
        return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = item.candidateName.toLowerCase().includes(q)
        const matchPos = item.position.toLowerCase().includes(q)
        const matchComp = item.company.toLowerCase().includes(q)
        const matchStage = item.rejectedStage.toLowerCase().includes(q)
        const matchReason = item.rejectionReason.toLowerCase().includes(q)
        if (!matchName && !matchPos && !matchComp && !matchStage && !matchReason) return false
      }

      if (clientFilter !== 'All Clients' && item.company !== clientFilter) {
        return false
      }

      if (rejectionStageFilter !== 'All Stages' && item.rejectedStage !== rejectionStageFilter) {
        return false
      }

      return true
    })
  }, [scopeRejectedList, searchQuery, clientFilter, rejectionStageFilter, dateFilter, customStartDate, customEndDate])

  const rejectedTotalPages = Math.ceil(filteredRejectedList.length / pageSize) || 1

  const paginatedRejectedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRejectedList.slice(start, start + pageSize)
  }, [filteredRejectedList, currentPage, pageSize])

  const getRejectionStageBadgeStyle = (stage: RejectionStageType) => {
    switch (stage) {
      case 'L1 Technical':
      case 'L2 Technical':
      case 'Final HR Round':
        return 'bg-purple-100 text-purple-900 border-purple-200 font-bold'
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200 font-bold'
    }
  }

  // Move Upcoming Interview to In Progress
  const handleShiftToInProgress = (id: string, candidateName: string) => {
    setScheduleList(prev =>
      prev.map(item => (item.id === id ? { ...item, status: 'In Progress' } : item))
    )
    showToast(`Interview for ${candidateName} shifted to In Progress`)
  }

  // Action in In Progress: Select in Interview
  const handleSelectInInterview = (row: ScheduleRowItem) => {
    const roundLower = (row.round || '').toLowerCase()

    if (roundLower.includes('l1') || roundLower.includes('screening')) {
      // Advance candidate from L1 to L2 Technical (remains In Progress)
      setScheduleList(prev =>
        prev.map(item =>
          item.id === row.id
            ? { ...item, round: 'L2 Technical', status: 'In Progress' }
            : item
        )
      )
      showToast(`${row.candidateName} cleared L1! Advanced to L2 Technical (In Progress).`)
    } else if (roundLower.includes('l2') || roundLower.includes('technical round 2')) {
      // Advance candidate from L2 to L3 / Final Round (remains In Progress until completed)
      setScheduleList(prev =>
        prev.map(item =>
          item.id === row.id
            ? { ...item, round: 'L3 / Final Round', status: 'In Progress' }
            : item
        )
      )
      showToast(`${row.candidateName} cleared L2! Advanced to L3 / Final Round (In Progress).`)
    } else {
      // Completed all rounds (L3 / Final Round / Final HR)
      setScheduleList(prev =>
        prev.map(item =>
          item.id === row.id
            ? { ...item, round: `${row.round} (All Rounds Completed)`, status: 'Completed' }
            : item
        )
      )
      setFinalDecisions(prev => [
        {
          id: `fd-${Date.now()}`,
          candidateName: row.candidateName,
          requirementId: row.requirementId || '',
          requirement: `${row.position} for ${row.company}`,
          decision: 'Selected for Interview',
          rejectionReason: '—',
          offerLetter: '—',
        },
        ...prev,
      ])
      showToast(`${row.candidateName} completed all interview rounds! Moved to Completed tab.`)
    }
  }

  // Action in In Progress: Open Rejection Reason Modal
  const handleRejectInInterview = (row: ScheduleRowItem) => {
    setSelectedRejectionReason('Technical evaluation score below threshold')
    let initialStage: RejectionStageType = 'L1 Technical'
    const r = (row.round || '').toLowerCase()
    if (r.includes('screening')) initialStage = 'Screening'
    else if (r.includes('l1')) initialStage = 'L1 Technical'
    else if (r.includes('l2')) initialStage = 'L2 Technical'
    else if (r.includes('l3') || r.includes('manager')) initialStage = 'L3 / Manager'
    else if (r.includes('final') || r.includes('hr')) initialStage = 'Final HR Round'

    setSelectedRejectionStage(initialStage)
    setCustomRejectionNote('')
    setRejectModalCandidate(row)
  }

  // Confirm and save rejection with reason
  const handleConfirmRejectCandidate = () => {
    if (!rejectModalCandidate) return
    const finalReason = selectedRejectionReason === 'Other' && customRejectionNote.trim()
      ? customRejectionNote.trim()
      : selectedRejectionReason

    setScheduleList(prev =>
      prev.map(item => (item.id === rejectModalCandidate.id ? { ...item, status: 'Completed' } : item))
    )
    setFinalDecisions(prev => [
      {
        id: `fd-${Date.now()}`,
        candidateName: rejectModalCandidate.candidateName,
        requirementId: rejectModalCandidate.requirementId || '',
        requirement: `${rejectModalCandidate.position} for ${rejectModalCandidate.company}`,
        decision: 'Rejected in Interview',
        rejectionReason: `${selectedRejectionStage}: ${finalReason}`,
        offerLetter: '—',
      },
      ...prev,
    ])

    const newRejectedItem: RejectedCandidateRowItem = {
      id: `rej-${Date.now()}`,
      candidateName: rejectModalCandidate.candidateName,
      candidateId: `CAND-${Math.floor(Math.random() * 9000 + 10000)}`,
      position: rejectModalCandidate.position,
      company: rejectModalCandidate.company,
      rejectedStage: selectedRejectionStage,
      rejectionReason: finalReason,
      evaluatorNotes: customRejectionNote.trim() || `Candidate rejected during ${selectedRejectionStage} evaluation.`,
      evaluatedBy: rejectModalCandidate.submittedBy || 'Tech Evaluation Panel',
      submittedBy: rejectModalCandidate.submittedBy || 'Recruiter',
      teamLead: rejectModalCandidate.teamLead || '—',
      rejectionDate: '—',
      requirementId: rejectModalCandidate.requirementId || '',
    }

    setRejectedList(prev => [newRejectedItem, ...prev])
    showToast(`Rejection recorded for ${rejectModalCandidate.candidateName} at stage [${selectedRejectionStage}]: "${finalReason}"!`)
    setRejectModalCandidate(null)
    setCustomRejectionNote('')
  }

  const handleDeleteSchedule = (id: string) => {
    setScheduleList(prev => prev.filter(item => item.id !== id))
    showToast('Interview schedule record deleted')
  }

  const handleUpdateDecision = (id: string, decision: 'Selected for Interview' | 'Rejected in Interview') => {
    setFinalDecisions(prev =>
      prev.map(item => (item.id === id ? { ...item, decision } : item))
    )
    showToast(`Final decision updated to ${decision}`)
  }

  const handleOpenNotJoinedModal = (candidate: OfferLetterRowItem) => {
    setNotJoinedModalCandidate(candidate)
    setSelectedNotJoinedReason(candidate.notJoinedReason || 'Competing offer with higher compensation')
    setNotJoinedCustomNote(candidate.notJoinedNote || '')
  }

  const handleSaveNotJoinedRecord = async () => {
    if (!notJoinedModalCandidate) return
    try {
      const note = notJoinedCustomNote.trim() || `Candidate backed out / did not join: ${selectedNotJoinedReason}`
      await offersService.updateStatus(notJoinedModalCandidate.id, {
        status: 'Not Joined',
        declinedReason: selectedNotJoinedReason,
        notJoinedNote: note,
      })
      showToast(`Non-joining record and note saved for candidate ${notJoinedModalCandidate.candidateName}!`)
      setNotJoinedModalCandidate(null)
      setNotJoinedCustomNote('')
      await reloadOffers()
    } catch (err) {
      showToast(apiErrorMessage(err))
    }
  }

  const handleMarkOfferJoined = async (item: OfferLetterRowItem) => {
    try {
      await offersService.updateStatus(item.id, { status: 'Joined' })
      showToast(`Candidate ${item.candidateName} marked as Joined / On-boarded! 🎉`)
      await reloadOffers()
    } catch (err) {
      showToast(apiErrorMessage(err))
    }
  }

  const handleUpdateOffer = async (id: string, offeredCtc?: number, joiningDate?: string, status?: string) => {
    try {
      await offersService.update(id, { offeredCtc, joiningDate, status })
      showToast('Offer updated successfully!')
      await reloadOffers()
    } catch (err) {
      showToast(apiErrorMessage(err))
    }
  }

  const handleCreateOfferPrompt = async () => {
    try {
      const subs = await submissionsService.list()
      if (!Array.isArray(subs) || subs.length === 0) {
        showToast('No active submissions found to create an offer.')
        return
      }
      const optionsText = subs.slice(0, 10).map((s: any, idx: number) => `[${idx}] ${s.candidateName || s.candidate} — ${s.requirementTitle || s.requirement}`).join('\n')
      const subChoice = prompt(`Select candidate submission index (0 to ${Math.min(subs.length - 1, 9)}):\n` + optionsText, '0')
      if (subChoice === null) return
      const selectedSub = subs[Number(subChoice)] || subs[0]
      const subId = selectedSub.id || selectedSub._id

      const ctcStr = prompt('Enter Offered CTC in INR (e.g. 2500000):', '2500000')
      if (!ctcStr) return
      const joiningDateStr = prompt('Enter Joining Date (YYYY-MM-DD):', '2026-11-01') || '2026-11-01'

      await offersService.create({
        submissionId: subId,
        offeredCtc: Number(ctcStr) || 2500000,
        joiningDate: new Date(joiningDateStr).toISOString(),
        status: 'Offer Released',
      })
      showToast('Offer created successfully and saved to MongoDB!')
      await reloadOffers()
    } catch (err) {
      showToast(apiErrorMessage(err))
    }
  }

  if (selectedReqDetail) {
    return (
      <RequirementDetailOverview
        requirement={selectedReqDetail}
        role={role}
        onBack={() => setSelectedReqDetail(null)}
        onRequirementUpdated={updated => {
          setSelectedReqDetail(updated)
          onUpdateRequirements?.([updated])
        }}
      />
    )
  }

  return (
    <div className="space-y-6 w-full pb-20 font-sans text-slate-800 animate-in fade-in duration-200">
      {/* 1. TOP PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interview Schedule</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track upcoming interviews, final decisions, and offer letters
          </p>
        </div>


      </div>

      {/* 2. TEAM LEAD INTERVIEW SCOPE TOGGLE (Only shown for Team Lead role) */}
      {isLead && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-200 px-3 py-1 rounded-lg">
              Team Lead Interview Scope
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setScopeTab('my_interviews')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                scopeTab === 'my_interviews'
                  ? 'bg-[#6B3BF6] text-white shadow-md font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>My Individual Candidates Interviews (Team Lead)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScopeTab('team_members')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                scopeTab === 'team_members'
                  ? 'bg-[#6B3BF6] text-white shadow-md font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Members Candidates Interviews</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScopeTab('all')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                scopeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-md font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>All Candidates Interviews (Lead + Team)</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. FRONT CONTROLS & FILTER BAR (MOVED TO FRONT) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        {/* ROW 1: STATUS TOGGLE PILLS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => {
                setStatusToggle('all')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                statusToggle === 'all'
                  ? 'bg-slate-900 text-white shadow-md font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>All Interviews</span>
            </button>

            <button
              onClick={() => {
                setStatusToggle('upcoming')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                statusToggle === 'upcoming'
                  ? 'bg-[#6B3BF6] text-white shadow-md font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Upcoming</span>
            </button>

            <button
              onClick={() => {
                setStatusToggle('completed')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                statusToggle === 'completed'
                  ? 'bg-slate-900 text-white shadow-md font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Completed</span>
            </button>

            <button
              onClick={() => {
                setStatusToggle('onboarding')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                statusToggle === 'onboarding'
                  ? 'bg-[#6B3BF6] text-white shadow-md font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Onboarding</span>
            </button>

            <button
              onClick={() => {
                setStatusToggle('rejections')
                setCurrentPage(1)
              }}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                statusToggle === 'rejections'
                  ? 'bg-slate-900 text-white shadow-md font-extrabold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <UserX className="w-4 h-4" />
              <span>Rejections Track</span>
            </button>
          </div>
        </div>

        {/* ROW 2: SEARCH & UPFRONT FILTER DROPDOWNS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search candidate name, position, round..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-xs font-medium text-slate-800"
            />
          </div>

          <div>
            <select
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All Clients">All Client Partners</option>
              {Array.from(
                new Set(
                  [...scheduleList.map(r => r.company), ...offerLetters.map(r => r.client), ...finalDecisions.map(r => r.client), ...rejectedList.map(r => r.company)]
                    .filter((c): c is string => Boolean(c) && c !== '—'),
                ),
              )
                .sort()
                .map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <select
              value={roundFilter}
              onChange={e => setRoundFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All Rounds">All Interview Rounds</option>
              <option value="L1">L1 Technical</option>
              <option value="L2">L2 Technical</option>
              <option value="Final">Final HR / Executive</option>
            </select>
          </div>

          <div>
            <select
              value={rejectionStageFilter}
              onChange={e => setRejectionStageFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-extrabold text-slate-800 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All Stages">Filter Rejection Stage: All</option>
              <option value="Screening">Stage: Screening Rejections</option>
              <option value="L1 Technical">Stage: L1 Technical Rejections</option>
              <option value="L2 Technical">Stage: L2 Technical Rejections</option>
              <option value="L3 / Manager">Stage: L3 / Manager Rejections</option>
              <option value="Final HR Round">Stage: Final HR Round Rejections</option>
            </select>
          </div>

          <div className="relative">
            <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="this_week">This week</option>
              <option value="this_month">This month</option>
              <option value="custom_range">Custom range...</option>
            </select>
          </div>
        </div>

        {dateFilter === 'custom_range' && (
          <div className="flex flex-wrap items-center gap-2.5 pt-2.5 border-t border-slate-100 animate-in fade-in duration-150 text-xs">
            <span className="font-bold text-slate-500 flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Date Range:</span>
            </span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 bg-white font-medium"
            />
            <span className="text-slate-400 font-bold">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 bg-white font-medium"
            />
            <button
              type="button"
              onClick={() => {
                setCustomStartDate('')
                setCustomEndDate('')
                setDateFilter('all')
              }}
              className="px-3 py-1.5 font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Clear Date Filter
            </button>
          </div>
        )}
      </div>

      {/* HELPER BANNERS FOR CURRENT STAGE */}
      {statusToggle === 'upcoming' && (
        <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl flex items-center justify-between text-xs text-purple-950 font-medium">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#6B3BF6]" />
            <span>
              <strong>Upcoming Interviews:</strong> All scheduled interviews reflect here.
            </span>
          </div>
        </div>
      )}

      {statusToggle === 'completed' && (
        <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-900 font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-slate-700" />
            <span>
              <strong>Completed Interviews:</strong> Displays final evaluation results of interviews, candidate decision outcomes, rejection reasons, and offer letter tracking.
            </span>
          </div>
        </div>
      )}

      {statusToggle === 'onboarding' && (
        <div className="p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-xl flex items-center justify-between text-xs text-purple-950 font-medium">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#6B3BF6]" />
            <span>
              <strong>Onboarding Track:</strong> Filter and track candidate onboarding completion, candidates who joined, and candidates who backed out / did not join with detailed recruiter notes.
            </span>
          </div>
        </div>
      )}

      {statusToggle === 'rejections' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-slate-900 font-medium shadow-2xs">
            <div className="flex items-start gap-2.5">
              <UserX className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900 font-extrabold text-sm block">Rejection Stage Track & Candidate Audit Trail</strong>
                <span>
                  Track all candidates who were rejected across every evaluation stage: <strong>Screening</strong>, <strong>L1 Technical</strong>, <strong>L2 Technical</strong>, <strong>L3 / Manager Round</strong>, and <strong>Final HR Round</strong>. Review detailed evaluator feedback, rejection reasons, and candidate submission history.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px] font-bold text-slate-800 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
              <span>Total Rejections: {filteredRejectedList.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">Screening</span>
              <span className="text-xl font-extrabold text-slate-900">
                {scopeRejectedList.filter(r => r.rejectedStage === 'Screening').length}
              </span>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-purple-800 uppercase block">L1 Technical</span>
              <span className="text-xl font-extrabold text-[#6B3BF6]">
                {scopeRejectedList.filter(r => r.rejectedStage === 'L1 Technical').length}
              </span>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-purple-800 uppercase block">L2 Technical</span>
              <span className="text-xl font-extrabold text-[#6B3BF6]">
                {scopeRejectedList.filter(r => r.rejectedStage === 'L2 Technical').length}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">L3 / Manager</span>
              <span className="text-xl font-extrabold text-slate-900">
                {scopeRejectedList.filter(r => r.rejectedStage === 'L3 / Manager').length}
              </span>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <span className="text-[10px] font-bold text-purple-800 uppercase block">Final HR Round</span>
              <span className="text-xl font-extrabold text-[#6B3BF6]">
                {scopeRejectedList.filter(r => r.rejectedStage === 'Final HR Round').length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. CARD 1: INTERVIEW SCHEDULE / REJECTIONS TABLE */}
      {statusToggle === 'rejections' ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <UserX className="w-4 h-4 text-slate-700" />
                <span>Rejected Candidates Track ({filteredRejectedList.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit log of candidates rejected during initial screening, technical assessments (L1/L2), manager evaluation (L3), or HR round.
              </p>
            </div>
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
              Showing {paginatedRejectedList.length} of {filteredRejectedList.length} rejections
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="px-4 py-3.5">CANDIDATE NAME & ID</th>
                  <th className="px-4 py-3.5">REQUIREMENT & ROLE</th>
                  <th className="px-4 py-3.5">CLIENT PARTNER</th>
                  <th className="px-4 py-3.5">REJECTED STAGE</th>
                  <th className="px-4 py-3.5">REJECTION REASON & EVALUATOR NOTES</th>
                  <th className="px-4 py-3.5">EVALUATED BY & DATE</th>
                  <th className="px-4 py-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {paginatedRejectedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No candidate rejections found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedRejectedList.map(item => (
                    <tr key={item.id} className="hover:bg-rose-50/20 transition-colors align-top">
                      {/* 1. CANDIDATE NAME & ID */}
                      <td className="px-4 py-4">
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.candidateName}</span>
                        </div>
                        {item.candidateId && (
                          <div className="text-[10px] font-mono text-slate-500 font-bold mt-0.5">
                            ID: {item.candidateId}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          Submitted by: <strong className="text-slate-600">{item.submittedBy || '—'}</strong>
                        </div>
                      </td>

                      {/* 2. REQUIREMENT & ROLE */}
                      <td className="px-4 py-4 max-w-xs">
                        <div className="flex items-center gap-1.5 mb-1">
                          <button
                            onClick={() => handleOpenReqOverview(item.requirementId, item.position, item.company)}
                            className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] border border-purple-200 font-mono hover:underline cursor-pointer transition-all flex items-center gap-1"
                            title="Click to view Requirement Overview"
                          >
                            <span>{item.requirementId}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-[#6B3BF6]" />
                          </button>
                        </div>
                        <div className="font-extrabold text-slate-900 text-xs">{item.position}</div>
                      </td>

                      {/* 3. CLIENT PARTNER */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#6B3BF6] inline shrink-0" />
                          <span>{item.company}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                          Lead: {item.teamLead || '—'}
                        </div>
                      </td>

                      {/* 4. REJECTED STAGE */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold border ${getRejectionStageBadgeStyle(item.rejectedStage)}`}>
                          {item.rejectedStage}
                        </span>
                      </td>

                      {/* 5. REJECTION REASON & EVALUATOR NOTES */}
                      <td className="px-4 py-4 max-w-md">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{item.rejectionReason}</span>
                        </div>
                        {item.evaluatorNotes && (
                          <div className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/80 mt-1.5 leading-relaxed font-medium">
                            <span className="font-bold text-slate-700">Notes: </span>
                            {item.evaluatorNotes}
                          </div>
                        )}
                      </td>

                      {/* 6. EVALUATED BY & DATE */}
                      <td className="px-4 py-4 whitespace-nowrap text-xs">
                        <div className="font-bold text-slate-800">{item.evaluatedBy}</div>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <CalendarIcon className="w-3 h-3 text-slate-400" />
                          <span>{item.rejectionDate}</span>
                        </div>
                      </td>

                      {/* 7. ACTIONS */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRejectedCandidateModal(item)}
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#6B3BF6]" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <PaginationFooter
            currentPage={currentPage}
            totalPages={rejectedTotalPages}
            totalItems={filteredRejectedList.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      ) : statusToggle === 'onboarding' ? null : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-3 p-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              {statusToggle === 'upcoming'
                ? 'Upcoming Interviews'
                : statusToggle === 'completed'
                ? 'Completed Interviews'
                : 'All Scheduled & Conducted Interviews'}
            </h2>
            <span className="text-xs text-slate-400 font-medium">
              Showing {filteredScheduleList.length} of {combinedScheduleList.length} interviews
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  {statusToggle === 'all' ? (
                    <>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        CANDIDATE NAME
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        REQUIREMENT ID & ROLE
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        CLIENT
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        INTERVIEW ROUND
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        MODE & SCHEDULE
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        STATUS
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        REMARKS / REJECTION REASON
                      </th>
                    </>
                  ) : statusToggle === 'upcoming' ? (
                    <>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        NAME
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        REQUIREMENT ID + ROLE
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        CLIENT
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        ROUND
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        MODE
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        SCHEDULE ACTIONS
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        REMARKS / REJECTION REASON
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        NAME
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        REQUIREMENT ID + ROLE
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        CLIENT
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        ROUND
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        MODE
                      </th>
                      <th className="px-4 py-3.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        REMARKS / REJECTION REASON
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {paginatedScheduleList.length === 0 ? (
                  <tr>
                    <td colSpan={statusToggle === 'completed' ? 6 : 7} className="py-10 text-center text-slate-400">
                      No interviews in this section.
                    </td>
                  </tr>
                ) : (
                  paginatedScheduleList.map(row => (
                    <tr key={row.id} className="hover:bg-purple-50/30 transition-colors">
                      {statusToggle === 'all' ? (
                        <>
                          {/* 1. CANDIDATE NAME */}
                          <td className="px-4 py-4 font-extrabold text-slate-900">
                            <button
                              onClick={() => handleOpenCandidateDetailModal(row)}
                              className="flex items-center gap-2 text-[#6B3BF6] hover:underline cursor-pointer text-left font-extrabold group"
                              title="Click to view candidate details & evaluation"
                            >
                              <User className="w-4 h-4 text-[#6B3BF6] shrink-0" />
                              <span className="group-hover:text-[#5b2fd8]">{row.candidateName}</span>
                            </button>
                          </td>

                          {/* 2. REQUIREMENT ID + ROLE */}
                          <td className="px-4 py-4 max-w-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              <button
                                onClick={() => handleOpenReqOverview(row.requirementId || '', row.position, row.company)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] border border-purple-200 font-mono hover:underline cursor-pointer transition-all flex items-center gap-1"
                                title="Click to view Requirement Overview"
                              >
                                <span>{row.requirementId || ''}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-[#6B3BF6]" />
                              </button>
                            </div>
                            <div className="font-extrabold text-slate-900 text-xs">{row.position}</div>
                          </td>

                          {/* 3. CLIENT */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#6B3BF6] inline shrink-0" />
                              <span>{row.company || 'Accenture'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              Lead: {row.teamLead || '—'} | By: {row.submittedBy || '—'}
                            </div>
                          </td>

                          {/* 4. ROUND */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getRoundBadgeStyle(row.round)}`}>
                              {row.round}
                            </span>
                          </td>

                          {/* 5. MODE & SCHEDULE */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold">
                              <Laptop className="w-3.5 h-3.5 text-slate-500" />
                              <span>{row.mode} ({row.dateTime})</span>
                            </div>
                          </td>

                          {/* 6. STATUS */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                                (row.status as string) === 'Completed'
                                  ? 'bg-slate-100 text-slate-800 border-slate-200'
                                  : (row.status as string) === 'Rejected'
                                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                                  : 'bg-purple-100 text-purple-800 border-purple-200'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>

                          {/* 7. REMARKS / REJECTION REASON */}
                          <td className="px-4 py-4 max-w-xs">
                            {row.rejectionReason ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{row.rejectionReason}</span>
                              </div>
                            ) : row.remark ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 border border-purple-200 text-purple-700">
                                <FileText className="w-3.5 h-3.5 text-[#6B3BF6] shrink-0" />
                                <span>{row.remark}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenCandidateDetailModal(row)}
                                className="text-xs text-slate-400 hover:text-[#6B3BF6] font-medium underline cursor-pointer flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>+ Add remark / reason</span>
                              </button>
                            )}
                          </td>
                        </>
                      ) : statusToggle === 'upcoming' ? (
                        <>
                          {/* 1. NAME */}
                          <td className="px-4 py-4 font-extrabold text-slate-900">
                            <button
                              onClick={() => handleOpenCandidateDetailModal(row)}
                              className="flex items-center gap-2 text-[#6B3BF6] hover:underline cursor-pointer text-left font-extrabold group"
                              title="Click to view candidate details & evaluation"
                            >
                              <User className="w-4 h-4 text-[#6B3BF6] shrink-0" />
                              <span className="group-hover:text-[#5b2fd8]">{row.candidateName}</span>
                            </button>
                          </td>

                          {/* 2. REQUIREMENT ID + ROLE */}
                          <td className="px-4 py-4 max-w-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              <button
                                onClick={() => handleOpenReqOverview(row.requirementId || '', row.position, row.company)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] border border-purple-200 font-mono hover:underline cursor-pointer transition-all flex items-center gap-1"
                                title="Click to view Requirement Overview"
                              >
                                <span>{row.requirementId || ''}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-[#6B3BF6]" />
                              </button>
                            </div>
                            <div className="font-extrabold text-slate-900 text-xs">{row.position}</div>
                          </td>

                          {/* 3. CLIENT */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#6B3BF6] inline shrink-0" />
                              <span>{row.company || 'Accenture'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              Lead: {row.teamLead || '—'} | By: {row.submittedBy || '—'}
                            </div>
                          </td>

                          {/* 4. ROUND */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                              {row.round}
                            </span>
                          </td>

                          {/* 5. MODE */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-xs text-slate-800 font-semibold">
                              <Laptop className="w-3.5 h-3.5 text-slate-500" />
                              <span>{row.mode} ({row.dateTime})</span>
                            </div>
                          </td>

                          {/* 6. SCHEDULE ACTIONS: EDIT & REMIND */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setRemindModalCandidate(row)}
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs flex items-center gap-1.5"
                              >
                                <Bell className="w-3.5 h-3.5 text-[#6B3BF6]" />
                                <span>Remind Candidate</span>
                              </button>

                              <button
                                onClick={() => setSelectedSchedule(row)}
                                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer shadow-2xs flex items-center gap-1.5"
                                title="Edit schedule"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Edit</span>
                              </button>
                            </div>
                          </td>

                          {/* 7. REMARKS / REJECTION REASON */}
                          <td className="px-4 py-4 max-w-xs">
                            {row.rejectionReason ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{row.rejectionReason}</span>
                              </div>
                            ) : row.remark ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 border border-purple-200 text-purple-700">
                                <FileText className="w-3.5 h-3.5 text-[#6B3BF6] shrink-0" />
                                <span>{row.remark}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenCandidateDetailModal(row)}
                                className="text-xs text-slate-400 hover:text-[#6B3BF6] font-medium underline cursor-pointer flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>+ Add remark / reason</span>
                              </button>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          {/* 1. NAME */}
                          <td className="px-4 py-4 font-extrabold text-slate-900">
                            <button
                              onClick={() => handleOpenCandidateDetailModal(row)}
                              className="flex items-center gap-2 text-[#6B3BF6] hover:underline cursor-pointer text-left font-extrabold group"
                              title="Click to view candidate details & evaluation"
                            >
                              <User className="w-4 h-4 text-[#6B3BF6] shrink-0" />
                              <span className="group-hover:text-[#5b2fd8]">{row.candidateName}</span>
                            </button>
                          </td>

                          {/* 2. REQUIREMENT ID + ROLE */}
                          <td className="px-4 py-4 max-w-xs">
                            <div className="flex items-center gap-1.5 mb-1">
                              <button
                                onClick={() => handleOpenReqOverview(row.requirementId || '', row.position, row.company)}
                                className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] border border-purple-200 font-mono hover:underline cursor-pointer transition-all flex items-center gap-1"
                                title="Click to view Requirement Overview"
                              >
                                <span>{row.requirementId || ''}</span>
                                <ExternalLink className="w-2.5 h-2.5 text-[#6B3BF6]" />
                              </button>
                            </div>
                            <div className="font-extrabold text-slate-900 text-xs">{row.position}</div>
                          </td>

                          {/* 3. CLIENT */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-[#6B3BF6] inline shrink-0" />
                              <span>{row.company || 'Accenture'}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                              Lead: {row.teamLead || '—'} | By: {row.submittedBy || '—'}
                            </div>
                          </td>

                          {/* 4. ROUND */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getRoundBadgeStyle(row.round)}`}
                            >
                              {row.round}
                            </span>
                          </td>

                          {/* 5. MODE */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold">
                              <Laptop className="w-3.5 h-3.5 text-blue-500" />
                              <span>{row.mode} ({row.dateTime})</span>
                            </div>
                          </td>

                          {/* 6. REMARKS / REJECTION REASON */}
                          <td className="px-4 py-4 max-w-xs">
                            {row.rejectionReason ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{row.rejectionReason}</span>
                              </div>
                            ) : row.remark ? (
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 border border-purple-200 text-purple-700">
                                <FileText className="w-3.5 h-3.5 text-[#6B3BF6] shrink-0" />
                                <span>{row.remark}</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleOpenCandidateDetailModal(row)}
                                className="text-xs text-slate-400 hover:text-[#6B3BF6] font-medium underline cursor-pointer flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>+ Add remark / reason</span>
                              </button>
                            )}
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 10-ITEM PAGINATION FOOTER */}
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredScheduleList.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}



      {/* 5. CARD 3: RELEASED OFFER LETTER & ONBOARDING TRACK (JOINED VS NOT JOINED - SHOWN ONLY WHEN ONBOARDING TOGGLE IS CLICKED) */}
      {statusToggle === 'onboarding' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs p-5 space-y-4">
          {/* Header & Sub-Pill Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#6B3BF6]" />
                <span>Onboarding & Offer Outcome Track</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track candidate onboarding completion, joined candidates, and backed-out / not-joined candidates with detailed recruiter notes.
              </p>
            </div>

            {/* Sub-Pill Filters & Create Offer Button */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCreateOfferPrompt}
                className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Offer</span>
              </button>

              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setOfferOutcomeFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  offerOutcomeFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Offers ({scopeOfferLetters.length})
              </button>

              <button
                type="button"
                onClick={() => setOfferOutcomeFilter('joined')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  offerOutcomeFilter === 'joined'
                    ? 'bg-emerald-600 text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Joined ({scopeOfferLetters.filter(o => o.status === 'Joined').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setOfferOutcomeFilter('not_joined')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  offerOutcomeFilter === 'not_joined'
                    ? 'bg-slate-900 text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Not Joined ({scopeOfferLetters.filter(o => o.status === 'Not Joined' || o.status === 'Declined').length})</span>
              </button>

              <button
                type="button"
                onClick={() => setOfferOutcomeFilter('pending')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  offerOutcomeFilter === 'pending'
                    ? 'bg-[#6B3BF6] text-white shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending Response ({scopeOfferLetters.filter(o => o.status === 'Offer Released' || o.status === 'Accepted').length})
              </button>
            </div>
          </div>
        </div>

          {/* Quick Summary Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-medium">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Offers Released</span>
                <span className="text-lg font-extrabold text-slate-900 tabular-nums">{scopeOfferLetters.length}</span>
              </div>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-purple-800 uppercase tracking-wider block">Joined / On-boarded</span>
                <span className="text-lg font-extrabold text-[#6B3BF6] tabular-nums">
                  {scopeOfferLetters.filter(o => o.status === 'Joined').length}
                  <span className="text-xs font-bold text-purple-700 ml-1">
                    ({Math.round((scopeOfferLetters.filter(o => o.status === 'Joined').length / (scopeOfferLetters.length || 1)) * 100)}%)
                  </span>
                </span>
              </div>
              <UserCheck className="w-4 h-4 text-[#6B3BF6]" />
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Not Joined / Backed Out</span>
                <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                  {scopeOfferLetters.filter(o => o.status === 'Not Joined' || o.status === 'Declined').length}
                </span>
              </div>
              <UserX className="w-4 h-4 text-slate-600" />
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-purple-800 uppercase tracking-wider block">Awaiting Onboarding</span>
                <span className="text-lg font-extrabold text-[#6B3BF6] tabular-nums">
                  {scopeOfferLetters.filter(o => o.status === 'Offer Released' || o.status === 'Accepted').length}
                </span>
              </div>
              <Clock className="w-4 h-4 text-[#6B3BF6]" />
            </div>
          </div>

          {/* Offer Letters Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="px-4 py-3.5">CANDIDATE NAME</th>
                  <th className="px-4 py-3.5">REQUIREMENT & ROLE</th>
                  <th className="px-4 py-3.5">CLIENT PARTNER</th>
                  <th className="px-4 py-3.5">ONBOARDING STATUS</th>
                  <th className="px-4 py-3.5 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredOfferLetters.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                      No offer records found matching current selection.
                    </td>
                  </tr>
                ) : (
                  filteredOfferLetters.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors align-top">
                      {/* 1. CANDIDATE NAME */}
                      <td className="px-4 py-4">
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{item.candidateName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Recruiter: <strong className="text-slate-600">{item.submittedBy || '—'}</strong>
                        </div>
                      </td>

                      {/* 2. REQUIREMENT & ROLE */}
                      <td className="px-4 py-4 max-w-xs">
                        <span className="text-[10px] font-mono text-[#6B3BF6] font-bold block">{item.requirementId}</span>
                        <span className="text-xs text-slate-800 font-semibold">{item.position}</span>
                      </td>

                      {/* 3. CLIENT PARTNER */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#6B3BF6]" />
                          <span>{item.client}</span>
                        </div>
                      </td>

                      {/* 4. ONBOARDING STATUS */}
                      <td className="px-4 py-4">
                        {item.status === 'Joined' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200 inline-flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-[#6B3BF6]" />
                            <span>Joined / On-boarded</span>
                          </span>
                        )}

                        {(item.status === 'Not Joined' || item.status === 'Declined') && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200 inline-flex items-center gap-1">
                            <UserX className="w-3.5 h-3.5 text-slate-700" />
                            <span>Not Joined / Backed Out</span>
                          </span>
                        )}

                        {item.status === 'Offer Released' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200 inline-block">
                            Offer Released (Awaiting Joining)
                          </span>
                        )}

                        {item.status === 'Accepted' && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200 inline-block">
                            Offer Accepted (Joining Pending)
                          </span>
                        )}
                      </td>

                      {/* 5. ACTIONS */}
                      <td className="px-4 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {(item.status === 'Offer Released' || item.status === 'Accepted') && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleMarkOfferJoined(item)}
                                className="px-2.5 py-1.5 bg-[#6B3BF6] hover:bg-[#5b30d9] text-white text-[11px] font-extrabold rounded-xl cursor-pointer transition-all shadow-2xs flex items-center gap-1"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Mark Joined</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenNotJoinedModal(item)}
                                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-extrabold rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                              >
                                <UserX className="w-3.5 h-3.5" />
                                <span>Mark Not Joined</span>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenNotJoinedModal(item)}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-[11px] font-extrabold rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#6B3BF6]" />
                            <span>Note</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setViewNotJoinedDetailModal(item)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold rounded-xl cursor-pointer transition-all shadow-2xs"
                          >
                            <span>View Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INTERVIEW MANAGE MODAL (RESCHEDULE, FEEDBACK, CANCEL) */}
      {selectedSchedule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150 font-sans text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Manage Interview — {selectedSchedule.candidateName}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedSchedule.position} · {selectedSchedule.company} ({selectedSchedule.round})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSchedule(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const newDt = prompt('Enter new Date & Time (YYYY-MM-DD THH:MM):', selectedSchedule.dateTime)
                  if (newDt) {
                    const reason = prompt('Reason for rescheduling:') || 'Rescheduled via UI'
                    handleRescheduleInterview(selectedSchedule.id, new Date(newDt).toISOString(), reason)
                    setSelectedSchedule(null)
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-[#6B3BF6] hover:bg-[#5b30d9] text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-2xs text-center"
              >
                📅 Reschedule
              </button>

              <button
                type="button"
                onClick={() => {
                  const rec = prompt('Enter Recommendation (Passed / Rejected / Hold):', 'Passed')
                  if (rec) {
                    const notes = prompt('Enter Feedback Notes:') || 'Interview feedback submitted'
                    handleSubmitInterviewFeedback(selectedSchedule.id, rec, notes)
                    setSelectedSchedule(null)
                  }
                }}
                className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-2xs text-center"
              >
                💬 Submit Feedback
              </button>

              <button
                type="button"
                onClick={() => {
                  const reason = prompt('Enter cancellation reason:') || 'Cancelled by recruiter'
                  handleCancelInterview(selectedSchedule.id, reason)
                  setSelectedSchedule(null)
                }}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-all shadow-2xs text-center"
              >
                ❌ Cancel
              </button>
            </div>

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setSelectedSchedule(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {isScheduleModalOpen && (
        <ScheduleInterviewModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          onScheduleSuccess={async () => {
            showToast('Interview scheduled successfully!')
            await reloadInterviews()
            setIsScheduleModalOpen(false)
          }}
        />
      )}


      {/* REMIND CANDIDATE MODAL */}
      {remindModalCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-[#6B3BF6]">
                <Bell className="w-5 h-5" />
                <h3 className="text-base font-extrabold text-slate-900">Send Candidate Interview Reminder</h3>
              </div>
              <button
                onClick={() => setRemindModalCandidate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <p className="font-semibold">
                Would you like to send an automated interview reminder notification to candidate <strong className="text-slate-900">{remindModalCandidate.candidateName}</strong>?
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Candidate:</span>
                  <span className="font-bold text-slate-900">{remindModalCandidate.candidateName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requirement / Role:</span>
                  <span className="font-bold text-slate-900">{remindModalCandidate.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-bold text-purple-700">{remindModalCandidate.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled Time:</span>
                  <span className="font-bold text-slate-800">{remindModalCandidate.dateTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Channels:</span>
                  <span className="font-bold text-[#6B3BF6]">Email & SMS Notification</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRemindModalCandidate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast(`Interview reminder sent to ${remindModalCandidate.candidateName} via Email & SMS!`)
                  setRemindModalCandidate(null)
                }}
                className="px-4 py-2 bg-[#6B3BF6] hover:bg-[#5b30d9] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Reminder to Candidate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL UI */}
      {rejectModalCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <UserX className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-extrabold text-slate-900">Record Interview Rejection Reason</h3>
              </div>
              <button
                onClick={() => setRejectModalCandidate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Candidate:</span>
                  <span className="font-bold text-slate-900">{rejectModalCandidate.candidateName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requirement / Role:</span>
                  <span className="font-bold text-slate-900">{rejectModalCandidate.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Round:</span>
                  <span className="font-bold text-purple-700">{rejectModalCandidate.round}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    Select Rejection Stage / Round <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['Screening', 'L1 Technical', 'L2 Technical', 'L3 / Manager', 'Final HR Round'] as RejectionStageType[]).map(stage => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => setSelectedRejectionStage(stage)}
                        className={`px-2.5 py-2 rounded-xl text-[11px] font-extrabold text-left border transition-all cursor-pointer flex items-center justify-between ${
                          selectedRejectionStage === stage
                            ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{stage}</span>
                        {selectedRejectionStage === stage && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#6B3BF6] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Select Reason for Rejection <span className="text-slate-500">*</span>
                  </label>
                  <div className="space-y-1.5">
                    {[
                      'Technical evaluation score below threshold',
                      'Domain experience mismatch for client requirement',
                      'Salary expectation exceeds approved budget',
                      'Communication / soft skills mismatch',
                      'Candidate withdrew / unavailable for next round',
                      'Other',
                    ].map(reason => (
                      <label
                        key={reason}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          selectedRejectionReason === reason
                            ? 'border-purple-600 bg-purple-50/60 font-bold text-slate-900 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="rejectionReasonRadio"
                          value={reason}
                          checked={selectedRejectionReason === reason}
                          onChange={() => setSelectedRejectionReason(reason)}
                          className="text-[#6B3BF6] focus:ring-[#6B3BF6]"
                        />
                        <span>{reason}</span>
                      </label>
                    ))}
                  </div>

                  {selectedRejectionReason === 'Other' && (
                    <div className="pt-2 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-700">Specify Custom Rejection Reason</label>
                      <textarea
                        rows={2}
                        value={customRejectionNote}
                        onChange={e => setCustomRejectionNote(e.target.value)}
                        placeholder="Type custom reason for rejection..."
                        className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectModalCandidate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectCandidate}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Submit Rejection & Move to Final Decision</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE INTERVIEW CALENDAR MODAL */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 font-sans max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-[#6B3BF6]" />
                  <h3 className="text-lg font-extrabold text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — Interview Schedule Calendar</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-[#6B3BF6] border border-purple-200">
                    Live Calendar View
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Interviews mapped by scheduled date, status state (Upcoming, In Progress, Completed), and client company
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* State Filter Buttons */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-extrabold">
                  <button
                    onClick={() => setCalendarStateFilter('all')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      calendarStateFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All States
                  </button>
                  <button
                    onClick={() => setCalendarStateFilter('Upcoming')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      calendarStateFilter === 'Upcoming'
                        ? 'bg-[#6B3BF6] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    onClick={() => setCalendarStateFilter('In Progress')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      calendarStateFilter === 'In Progress'
                        ? 'bg-[#6B3BF6] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => setCalendarStateFilter('Completed')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      calendarStateFilter === 'Completed'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Completed
                  </button>
                </div>

                <button
                  onClick={() => setIsCalendarModalOpen(false)}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Days of Week Bar */}
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-50 p-2 rounded-xl border border-slate-100">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Monthly Calendar Grid (Aug 2026) */}
            <div className="grid grid-cols-7 gap-2">
              {/* Previous month filler days */}
              {(() => {
                const now = new Date()
                const lead = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
                return Array.from({ length: lead }, (_, i) => (
                  <div key={`blank-${i}`} className="min-h-24 p-2 bg-slate-50/40 rounded-2xl border border-slate-100/60 opacity-40" />
                ))
              })()}

              {/* Days of the current month */}
              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }, (_, i) => i + 1).map(day => {
                const now = new Date()
                const isToday = day === now.getDate()
                const monthLabel = now.toLocaleDateString('en-US', { month: 'short' })
                const dayInterviews = combinedScheduleList.filter(s => {
                  if (calendarStateFilter !== 'all' && s.status !== calendarStateFilter) return false
                  const d = new Date(s.dateTime)
                  return !Number.isNaN(d.getTime()) && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === day
                })

                return (
                  <div
                    key={`day-${day}`}
                    className={`min-h-28 p-2.5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isToday
                        ? 'bg-purple-50/40 border-purple-300 ring-2 ring-[#6B3BF6]/20'
                        : 'bg-white border-slate-200/80 hover:border-purple-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-extrabold ${isToday ? 'text-[#6B3BF6] bg-purple-100 px-2 py-0.5 rounded-full' : 'text-slate-700'}`}>
                        {monthLabel} {day}
                      </span>
                      {dayInterviews.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-[#6B3BF6] animate-pulse" />
                      )}
                    </div>

                    <div className="space-y-1.5 overflow-y-auto max-h-20">
                      {dayInterviews.length === 0 ? (
                        <span className="text-[10px] text-slate-300 font-medium italic block pt-2">No interviews</span>
                      ) : (
                        dayInterviews.map(item => (
                          <div
                            key={item.id}
                            onClick={() => {
                              setIsCalendarModalOpen(false)
                              setSelectedSchedule(item)
                            }}
                            className={`p-1.5 rounded-xl border text-[10px] font-extrabold cursor-pointer transition-all hover:scale-102 shadow-2xs space-y-0.5 ${
                              item.status === 'Completed'
                                ? 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                                : 'bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200'
                            }`}
                            title={`Click to view/edit ${item.candidateName}'s interview`}
                          >
                            <div className="truncate text-slate-900">{item.candidateName}</div>
                            <div className="text-[9px] font-semibold text-purple-700 flex items-center justify-between">
                              <span>{item.company}</span>
                              <span className="opacity-80">{item.round}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Modal Footer Legend */}
            <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-4">
                <span className="text-slate-500 font-bold">Interview Status States:</span>
                <span className="flex items-center gap-1 text-[#6B3BF6] font-extrabold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6B3BF6]" /> Upcoming / In Progress
                </span>
                <span className="flex items-center gap-1 text-slate-700 font-extrabold">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Completed
                </span>
              </div>

              <button
                onClick={() => setIsCalendarModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer"
              >
                Close Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTED CANDIDATE DETAIL MODAL */}
      {selectedRejectedCandidateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <UserX className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-extrabold text-slate-900">Rejected Candidate Detailed Feedback</h3>
              </div>
              <button
                onClick={() => setSelectedRejectedCandidateModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-900 text-sm">{selectedRejectedCandidateModal.candidateName}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${getRejectionStageBadgeStyle(selectedRejectedCandidateModal.rejectedStage)}`}>
                    Rejected at {selectedRejectedCandidateModal.rejectedStage}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600">
                  Requirement: <strong className="text-slate-900">{selectedRejectedCandidateModal.position}</strong> ({selectedRejectedCandidateModal.requirementId})
                </div>
                <div className="text-[11px] text-purple-800 font-bold">
                  Client: {selectedRejectedCandidateModal.company}
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Primary Rejection Reason</div>
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>{selectedRejectedCandidateModal.rejectionReason}</span>
                  </div>
                </div>

                {selectedRejectedCandidateModal.evaluatorNotes && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Evaluator Notes & Assessment</div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {selectedRejectedCandidateModal.evaluatorNotes}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold block">Evaluated By</span>
                    <span className="font-bold text-slate-800">{selectedRejectedCandidateModal.evaluatedBy}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold block">Rejection Date</span>
                    <span className="font-bold text-slate-800">{selectedRejectedCandidateModal.rejectionDate}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold block">Submitted By</span>
                    <span className="font-bold text-slate-800">{selectedRejectedCandidateModal.submittedBy || 'Recruiter'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-400 font-bold block">Team Lead</span>
                    <span className="font-bold text-slate-800">{selectedRejectedCandidateModal.teamLead || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  showToast(`Rejection evaluation report downloaded for ${selectedRejectedCandidateModal.candidateName}`)
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-[#6B3BF6]" />
                <span>Download Evaluation Report</span>
              </button>
              <button
                onClick={() => setSelectedRejectedCandidateModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MARK NOT JOINED & ADD REASON NOTE MODAL */}
      {notJoinedModalCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <UserX className="w-5 h-5 text-slate-700" />
                <h3 className="text-base font-extrabold text-slate-900">Record Non-Joining Reason & Recruiter Note</h3>
              </div>
              <button
                type="button"
                onClick={() => setNotJoinedModalCandidate(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1 font-medium">
                <div className="flex justify-between">
                  <span className="text-slate-500">Candidate:</span>
                  <span className="font-bold text-slate-900">{notJoinedModalCandidate.candidateName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requirement / Role:</span>
                  <span className="font-bold text-slate-900">{notJoinedModalCandidate.position}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client:</span>
                  <span className="font-bold text-purple-700">{notJoinedModalCandidate.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Offered CTC:</span>
                  <span className="font-bold text-[#6B3BF6]">{notJoinedModalCandidate.offeredCTC}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Select Primary Reason for Not Joining <span className="text-slate-500">*</span>
                </label>
                <div className="space-y-1.5">
                  {[
                    'Competing offer with higher compensation',
                    'Counter offer from current employer',
                    'Relocation / Location constraint',
                    'Shift timing / work mode mismatch',
                    'Personal / Family / Health issues',
                    'Joined another organization',
                    'Other',
                  ].map(reason => (
                    <label
                      key={reason}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer ${
                        selectedNotJoinedReason === reason
                          ? 'border-purple-600 bg-purple-50/70 font-bold text-slate-900 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="notJoinedReasonRadio"
                        value={reason}
                        checked={selectedNotJoinedReason === reason}
                        onChange={() => setSelectedNotJoinedReason(reason)}
                        className="text-[#6B3BF6] focus:ring-[#6B3BF6]"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-2 space-y-1">
                  <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Recruiter Non-Joining Note / Background Details</span>
                    <span className="text-[10px] text-slate-400 font-normal">Required for audit tracking</span>
                  </label>
                  <textarea
                    rows={3}
                    value={notJoinedCustomNote}
                    onChange={e => setNotJoinedCustomNote(e.target.value)}
                    placeholder=""
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800 font-medium leading-relaxed"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setNotJoinedModalCandidate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveNotJoinedRecord}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                <span>Save Non-Joining Note & Update Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW ONBOARDING / OFFER DETAILS MODAL */}
      {viewNotJoinedDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-800">
                <FileText className="w-5 h-5 text-[#6B3BF6]" />
                <h3 className="text-base font-extrabold text-slate-900">Onboarding & Offer Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setViewNotJoinedDetailModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              {/* CANDIDATE & ROLE SUMMARY */}
              <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 space-y-1">
                <div className="font-extrabold text-slate-900 text-sm flex items-center justify-between">
                  <span>{viewNotJoinedDetailModal.candidateName}</span>
                  <span className="text-[10px] text-slate-500 font-normal">Recruiter: {viewNotJoinedDetailModal.submittedBy || '—'}</span>
                </div>
                <div className="text-slate-600 font-medium text-xs">Role: {viewNotJoinedDetailModal.position} ({viewNotJoinedDetailModal.requirementId})</div>
                <div className="text-[#6B3BF6] font-bold text-xs">Client: {viewNotJoinedDetailModal.client}</div>
              </div>

              {/* OFFER DATE & CTC */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">Offered CTC</span>
                  <span className="font-extrabold text-slate-900 text-xs">{viewNotJoinedDetailModal.offeredCTC || 'N/A'}</span>
                  {viewNotJoinedDetailModal.offerDate && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">Offered on: {viewNotJoinedDetailModal.offerDate}</span>
                  )}
                </div>

                {/* JOINING DATE */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-0.5">Joining Date</span>
                  <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-[#6B3BF6]" />
                    <span>{viewNotJoinedDetailModal.joiningDate || 'Not Scheduled'}</span>
                  </div>
                </div>
              </div>

              {/* ONBOARDING STATUS */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold block text-[10px] uppercase tracking-wider mb-1">Onboarding Status</span>
                {viewNotJoinedDetailModal.status === 'Joined' && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200 inline-flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#6B3BF6]" />
                    <span>Joined / On-boarded</span>
                  </span>
                )}
                {(viewNotJoinedDetailModal.status === 'Not Joined' || viewNotJoinedDetailModal.status === 'Declined') && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200 inline-flex items-center gap-1">
                    <UserX className="w-3.5 h-3.5 text-slate-700" />
                    <span>Not Joined / Backed Out</span>
                  </span>
                )}
                {viewNotJoinedDetailModal.status === 'Offer Released' && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200 inline-block">
                    Offer Released (Awaiting Joining)
                  </span>
                )}
                {viewNotJoinedDetailModal.status === 'Accepted' && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-200 inline-block">
                    Offer Accepted (Joining Pending)
                  </span>
                )}
              </div>

              {/* RECRUITER NOTES */}
              {(viewNotJoinedDetailModal.notJoinedReason || viewNotJoinedDetailModal.notJoinedNote) ? (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <MessageSquare className="w-3.5 h-3.5 text-[#6B3BF6]" />
                    <span>Recruiter Non-Joining Notes</span>
                  </div>
                  {viewNotJoinedDetailModal.notJoinedReason && (
                    <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{viewNotJoinedDetailModal.notJoinedReason}</span>
                    </div>
                  )}
                  {viewNotJoinedDetailModal.notJoinedNote && (
                    <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-2.5 rounded-lg border border-slate-200/80">
                      {viewNotJoinedDetailModal.notJoinedNote}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-400 text-xs italic">
                  No additional non-joining notes recorded for this candidate.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const item = viewNotJoinedDetailModal
                  setViewNotJoinedDetailModal(null)
                  handleOpenNotJoinedModal(item)
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#6B3BF6]" />
                <span>Note</span>
              </button>
              <button
                type="button"
                onClick={() => setViewNotJoinedDetailModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANDIDATE DETAILS & REMARKS / EVALUATION POPUP MODAL */}
      {selectedCandidateDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-[#6B3BF6] font-black text-base shrink-0">
                  {selectedCandidateDetailModal.candidateName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {selectedCandidateDetailModal.candidateName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Candidate Evaluation & Profile Summary
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidateDetailModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="space-y-4">
              {/* Candidate Info Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Contact Email</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-[#6B3BF6] shrink-0" />
                    <span className="truncate">{selectedCandidateDetailModal.candidateEmail || 'candidate@example.com'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Phone Number</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#6B3BF6] shrink-0" />
                    <span>{selectedCandidateDetailModal.candidatePhone || '—'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Total Experience</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#6B3BF6] shrink-0" />
                    <span>{selectedCandidateDetailModal.experience || '5+ Years'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Client Company</span>
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#6B3BF6] shrink-0" />
                    <span>{selectedCandidateDetailModal.company || 'Accenture'}</span>
                  </div>
                </div>
              </div>

              {/* Requirement & Round summary */}
              <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">Requirement & Position</span>
                  <span className="font-extrabold text-slate-900 text-xs">
                    {selectedCandidateDetailModal.position} ({selectedCandidateDetailModal.requirementId || '—'})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">Round</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getRoundBadgeStyle(selectedCandidateDetailModal.round)}`}>
                    {selectedCandidateDetailModal.round}
                  </span>
                </div>
              </div>

              {/* Key Skills */}
              {selectedCandidateDetailModal.skills && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Key Skills & Tech Stack</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(selectedCandidateDetailModal.skills)
                      ? selectedCandidateDetailModal.skills
                      : String(selectedCandidateDetailModal.skills).split(',')
                    ).map((skill: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Evaluation Outcome Status Selection */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="text-xs font-extrabold text-slate-800 block">
                  Evaluation Outcome & Remark Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalStatusChoice('Remark')}
                    className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      modalStatusChoice === 'Remark'
                        ? 'bg-purple-50 border-[#6B3BF6] text-[#6B3BF6] ring-2 ring-purple-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>General Remark / Note</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalStatusChoice('Rejected')}
                    className={`p-2.5 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      modalStatusChoice === 'Rejected'
                        ? 'bg-rose-50 border-rose-500 text-rose-600 ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Candidate Rejected</span>
                  </button>
                </div>
              </div>

              {/* Remark / Rejection Reason Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-800 flex items-center justify-between">
                  <span>
                    {modalStatusChoice === 'Rejected' ? 'Rejection Reason & Remarks' : 'Candidate Evaluation Remark'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Displayed directly in table</span>
                </label>
                <textarea
                  value={modalRemarkText}
                  onChange={(e) => setModalRemarkText(e.target.value)}
                  placeholder={
                    modalStatusChoice === 'Rejected'
                      ? 'Type the reason for rejection (e.g., Technical gap in React & System Design, High salary expectation)...'
                      : 'Type remark or evaluation feedback about the candidate...'
                  }
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] font-medium resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCandidateDetailModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCandidateRemark}
                className="px-5 py-2 bg-[#6B3BF6] hover:bg-[#5b2fd8] text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Display in Table</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed bottom-12 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
