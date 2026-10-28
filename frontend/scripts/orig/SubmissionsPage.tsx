import React, { useState, useMemo } from 'react'
import { Submission, Requirement, Role } from '../../types'
import { RequirementDetailOverview } from './RequirementDetailOverview'
import { CreateJobDemandForm } from './CreateJobDemandForm'
import { PaginationFooter } from '../ui/PaginationFooter'
import { PageHeader } from '../layout/PageHeader'
import { SubmissionCandidateDetailModal } from '../modals/SubmissionCandidateDetailModal'
import {
  Search,
  ChevronDown,
  FileText,
  UserCheck,
  Users,
  Send,
  Calendar,
  Building,
  CheckCircle,
  Clock,
  Filter,
  Plus,
  UserPlus,
  Edit2,
  Check,
  X,
  ExternalLink,
} from 'lucide-react'

import { ScheduleInterviewModal } from '../modals/ScheduleInterviewModal'

interface SubmissionsPageProps {
  role?: Role
  submissions?: Submission[]
  requirements?: Requirement[]
  onOpenSubmitCandidate?: (reqId?: string) => void
  onUpdateRequirements?: (updated: Requirement[]) => void
}

interface ScreenshotSubmission {
  id: string
  candidateName: string
  requirement: string
  reqId?: string
  clientName?: string
  experience: string
  currentCompany: string
  submittedBy: string
  submittedOn: string
  status: string
  rejectionReason?: string
}

const DEFAULT_SCREENSHOT_SUBMISSIONS: ScreenshotSubmission[] = [
  {
    id: 'SUB-201',
    candidateName: 'Alex Turner',
    requirement: 'Senior React Developer',
    reqId: 'REQ-2026-08-12-001',
    clientName: 'Accenture',
    experience: '7 Years 6 Months',
    currentCompany: 'Cognizant Technology Solutions',
    submittedBy: 'Marcus Chen',
    submittedOn: 'Aug 17, 2026',
    status: 'Submitted to Client',
  },
  {
    id: 'SUB-211',
    candidateName: 'Rohan Joshi',
    requirement: 'FinTech Java Lead',
    reqId: 'REQ-2026-08-06-005',
    clientName: 'Goldman Sachs',
    experience: '11 Years',
    currentCompany: 'JP Morgan Chase',
    submittedBy: 'Marcus Chen',
    submittedOn: 'Aug 16, 2026',
    status: 'Submitted to Lead',
  },
  {
    id: 'SUB-212',
    candidateName: 'Deepa Roy',
    requirement: 'Low Latency C++ Developer',
    reqId: 'REQ-2026-08-06-005',
    clientName: 'Goldman Sachs',
    experience: '9 Years',
    currentCompany: 'Barclays Investment',
    submittedBy: 'Marcus Chen',
    submittedOn: 'Aug 14, 2026',
    status: 'Interview Scheduled',
  },
  {
    id: 'SUB-213',
    candidateName: 'Kiran Verma',
    requirement: 'Full Stack Node.js Engineer',
    reqId: 'REQ-2026-08-07-006',
    clientName: 'Tesla',
    experience: '6 Years 2 Months',
    currentCompany: 'TCS Digital',
    submittedBy: 'Marcus Chen',
    submittedOn: 'Aug 10, 2026',
    status: 'Selected in Interview',
  },
  {
    id: 'SUB-214',
    candidateName: 'Neha Deshmukh',
    requirement: 'DevOps / Kubernetes Lead',
    reqId: 'REQ-2026-07-20-009',
    clientName: 'ITC Infotech',
    experience: '8 Years',
    currentCompany: 'Wipro Technologies',
    submittedBy: 'Marcus Chen',
    submittedOn: 'Jul 28, 2026',
    status: 'Submitted to Client',
  },
  {
    id: 'SUB-202',
    candidateName: 'Vidyasagar Gade',
    requirement: 'Cloud Solutions Architect',
    reqId: 'REQ-2026-08-12-003',
    clientName: 'Accenture',
    experience: '10 Years',
    currentCompany: 'Infosys Ltd',
    submittedBy: 'Priya Sharma',
    submittedOn: 'Aug 16, 2026',
    status: 'Interview Scheduled',
  },
  {
    id: 'SUB-203',
    candidateName: 'Suresh Kulkarni (Candidate)',
    requirement: 'PLM / PDM Lead Engineer',
    reqId: 'REQ-2026-08-12-004',
    clientName: 'Accenture',
    experience: '8 Years 2 Months',
    currentCompany: 'Wipro Limited',
    submittedBy: 'Suresh kulkarni',
    submittedOn: 'Aug 16, 2026',
    status: 'Rejected',
    rejectionReason: 'Technical evaluation score below threshold (C++ & PLM architecture round)',
  },
  {
    id: 'SUB-204',
    candidateName: 'Harish Gadipally (Lead Candidate)',
    requirement: 'Senior React / Fullstack Architect',
    reqId: 'REQ-2026-08-12-001',
    clientName: 'Accenture',
    experience: '12 Years',
    currentCompany: 'Metaforge IT Solutions',
    submittedBy: 'Harish Gadipally',
    submittedOn: 'Aug 15, 2026',
    status: 'Submitted to Client',
  },
  {
    id: 'SUB-205',
    candidateName: 'Rania Khalil',
    requirement: 'Java Cloud Architect',
    reqId: 'REQ-2026-08-06-005',
    clientName: 'Goldman Sachs',
    experience: '11 Years',
    currentCompany: 'Morgan Stanley',
    submittedBy: 'lakshmi.v Recruiter',
    submittedOn: 'Aug 14, 2026',
    status: 'Interview Scheduled',
  },
  {
    id: 'SUB-206',
    candidateName: 'Abhijit Narke',
    requirement: 'Java Lead Engineer',
    reqId: 'REQ-2026-08-06-005',
    clientName: 'Goldman Sachs',
    experience: '9 Years',
    currentCompany: 'Barclays India',
    submittedBy: 'Lingoji Pavani',
    submittedOn: 'Aug 14, 2026',
    status: 'Rejected',
    rejectionReason: 'Notice period exceeds 60 days budget limit',
  },
  {
    id: 'SUB-207',
    candidateName: 'Kanchan Meshram',
    requirement: 'Automotive Embedded Systems Engineer',
    reqId: 'REQ-2026-08-07-006',
    clientName: 'Tesla',
    experience: '6 Years 8 Months',
    currentCompany: 'Bosch Engineering',
    submittedBy: 'rahimoon Shaik',
    submittedOn: 'Aug 13, 2026',
    status: 'Submitted to Client',
  },
  {
    id: 'SUB-208',
    candidateName: 'Ben Wallace',
    requirement: 'Python ML Specialist',
    reqId: 'REQ-2026-08-07-007',
    clientName: 'Tesla',
    experience: '5 Years 4 Months',
    currentCompany: 'Nvidia India',
    submittedBy: 'Adirala sathvika',
    submittedOn: 'Aug 13, 2026',
    status: 'Rejected',
    rejectionReason: 'Salary expectation exceeds approved budget for Senior Machine Learning band',
  },
  {
    id: 'SUB-209',
    candidateName: 'Arpit Srivastav',
    requirement: 'SAP MM + Ariba Functional Lead',
    reqId: 'REQ-2026-07-20-009',
    clientName: 'ITC Infotech',
    experience: '8 Years',
    currentCompany: 'ITC Limited',
    submittedBy: 'Harini Sindey',
    submittedOn: 'Aug 12, 2026',
    status: 'Selected in Interview',
  },
  {
    id: 'SUB-210',
    candidateName: 'TEJENDRA RAMAN',
    requirement: '.NET Core Backend Architect',
    reqId: 'REQ-2026-06-08-001',
    clientName: 'LTTS Mobility',
    experience: '9 Years',
    currentCompany: 'HCL Technologies Ltd',
    submittedBy: 'Viswanath Reddy',
    submittedOn: 'Aug 11, 2026',
    status: 'Submitted to Client',
  },
]

export function SubmissionsPage({
  role,
  submissions = [],
  requirements = [],
  onOpenSubmitCandidate,
  onUpdateRequirements,
}: SubmissionsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('All')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [clientFilter, setClientFilter] = useState('All')
  const [selectedSub, setSelectedSub] = useState<ScreenshotSubmission | null>(
    null
  )

  const [selectedReqDetail, setSelectedReqDetail] = useState<Requirement | null>(null)
  const [isEditingReq, setIsEditingReq] = useState(false)
  const [editingReq, setEditingReq] = useState<Requirement | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Interview Schedule Modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [targetSubForInterview, setTargetSubForInterview] = useState<ScreenshotSubmission | null>(null)

  // Dynamic Submissions List State
  const [submissionsList, setSubmissionsList] = useState<ScreenshotSubmission[]>(() => {
    if (submissions && submissions.length > 0) {
      const mapped = submissions.map(s => ({
        id: s.id,
        candidateName: s.candidate,
        requirement: s.req || 'Senior Developer',
        reqId: s.req || 'REQ-2026-08-12-001',
        clientName: s.client || 'Accenture',
        experience: s.experience || '6 Years',
        currentCompany: s.client || 'Tech Enterprise',
        submittedBy: s.recruiter || 'Marcus Chen',
        submittedOn: s.date || 'Aug 17, 2026',
        status: s.stage === 'Submitted' ? 'Submitted to Client' : s.stage,
      }))
      return [...DEFAULT_SCREENSHOT_SUBMISSIONS, ...mapped]
    }
    return DEFAULT_SCREENSHOT_SUBMISSIONS
  })

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

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
      const targetReqId = targetSubForInterview?.reqId || 'REQ-2026-08-12-001'
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

    showToast(`Interview scheduled! Candidate status updated to "${scheduledStatus}" in table and recruitment progress.`)
    setTargetSubForInterview(null)
  }

  const handleOpenReqOverview = (reqId: string, position: string, company: string) => {
    const existing = requirements.find(r => r.id === reqId || r.title === position)
    if (existing) {
      setSelectedReqDetail(existing)
    } else {
      setSelectedReqDetail({
        id: reqId,
        title: position,
        client: company,
        company: company,
        status: 'Interview Scheduled',
        createdDate: '12 Aug 2026',
        submissionsCount: 7,
        interviewsCount: 3,
        owner: 'Harish Gadipally',
        assignedRecruiter: 'Harish Gadipally',
        experienceRequired: '5 - 10 Years',
        location: 'Hyderabad / Remote',
        salaryRange: '₹18 - ₹28 LPA',
        skills: ['.NET Core', 'C#', 'SQL Server', 'Microservices', 'Azure'],
        description: `Requirement details for ${position} at ${company}. Full job overview, candidate pipeline, and submission history.`,
      } as any)
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
      return submissionsList.filter(item => {
        const by = item.submittedBy.toLowerCase()
        return by.includes('marcus') || by === 'marcus chen'
      })
    }
    return submissionsList
  }, [submissionsList, role, scopeTab])

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
    return scopeSubmissions.filter(item => {
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
      const d = item.submittedOn || ''
      if (dateFilter !== 'All') {
        if (dateFilter === 'Today') {
          if (!d.includes('Aug 17') && !d.includes('Today')) return false
        } else if (dateFilter === 'Yesterday') {
          if (!d.includes('Aug 16') && !d.includes('Yesterday')) return false
        } else if (dateFilter === 'This week' || dateFilter === 'This month') {
          if (!d.includes('Aug')) return false
        } else if (dateFilter === 'Custom range') {
          if (customStartDate && d < customStartDate) return false
          if (customEndDate && d > customEndDate) return false
        }
      }

      // Client filter
      if (clientFilter !== 'All') {
        if (item.clientName?.toLowerCase() !== clientFilter.toLowerCase()) {
          return false
        }
      }

      // Status filter
      const itemStatus = item.status.toLowerCase().trim()
      const filterVal = statusFilter.toLowerCase().trim()

      if (filterVal !== 'all') {
        if (filterVal === 'submitted to lead') {
          if (!itemStatus.includes('lead') && !itemStatus.includes('submit')) return false
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
  }, [
    scopeSubmissions,
    searchQuery,
    dateFilter,
    customStartDate,
    customEndDate,
    clientFilter,
    statusFilter,
  ])

  const [currentPage, setCurrentPage] = useState(1)

  // Reset pagination to page 1 whenever any filter changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateFilter, customStartDate, customEndDate, clientFilter, statusFilter, scopeTab])

  const pageSize = 10

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1

  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  // Get status pill style
  const getStatusBadgeStyle = (status: string) => {
    const s = status.toLowerCase()
    if (s.includes('lead')) {
      return 'bg-purple-100 text-purple-800 border-purple-200'
    }
    if (s.includes('client')) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    if (s.includes('interview')) {
      return 'bg-amber-100 text-amber-800 border-amber-200'
    }
    if (s.includes('select')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
    if (s.includes('reject')) {
      return 'bg-rose-100 text-rose-800 border-rose-200'
    }
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  if (isEditingReq && editingReq) {
    return (
      <CreateJobDemandForm
        userRole={role === 'superadmin' ? 'Super Admin View' : role === 'admin' ? 'Admin View' : 'Recruiter View'}
        mode="edit"
        initialData={editingReq}
        onCancel={() => {
          setIsEditingReq(false)
          setEditingReq(null)
        }}
        onSubmit={updatedReq => {
          setSelectedReqDetail(updatedReq)
          if (onUpdateRequirements && requirements.length > 0) {
            const updatedList = requirements.map(r => (r.id === updatedReq.id ? updatedReq : r))
            onUpdateRequirements(updatedList)
          }
          setIsEditingReq(false)
          setEditingReq(null)
          showToast('Requirement details updated successfully!')
        }}
      />
    )
  }

  if (selectedReqDetail) {
    return (
      <RequirementDetailOverview
        requirement={selectedReqDetail}
        role={role}
        onBack={() => setSelectedReqDetail(null)}
        onAddCandidate={() => onOpenSubmitCandidate?.(selectedReqDetail.id)}
        onEditRequirement={() => {
          setEditingReq(selectedReqDetail)
          setIsEditingReq(true)
        }}
      />
    )
  }

  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Total Submissions</h1>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-[#6B3BF6] border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-[#6B3BF6]" />
              <span>
                {filteredData.length} {dateFilter === 'Today' ? 'Candidates Submitted Today' : dateFilter === 'Yesterday' ? 'Candidates Submitted Yesterday' : dateFilter === 'This week' ? 'Candidates Submitted This Week' : dateFilter === 'This month' ? 'Candidates Submitted This Month' : 'Candidates Submitted'}
              </span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track candidate submissions sent to internal leads and client partners.
          </p>
        </div>


      </div>

      {/* 2. Enhanced KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {dateFilter === 'Today' ? 'Submissions Today' : dateFilter === 'Yesterday' ? 'Submissions Yesterday' : dateFilter === 'This week' ? 'Submissions This Week' : dateFilter === 'This month' ? 'Submissions This Month' : 'Total Submissions'}
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {filteredData.length}
            </p>
            <span className="text-[10px] text-purple-600 font-semibold mt-0.5 block">
              {clientFilter !== 'All' ? `Filtered by ${clientFilter}` : `Across ${clientOptions.length} Clients`}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6B3BF6] shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Client Partners
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {new Set(filteredData.map(d => d.clientName || 'Accenture')).size}
            </p>
            <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
              Active Client Organizations
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Submitted to Client
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {filteredData.filter(d => d.status.toLowerCase().includes('client')).length}
            </p>
            <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 block">
              Client Stage Submissions
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Interviews & Selections
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {filteredData.filter(d => d.status.toLowerCase().includes('interview') || d.status.toLowerCase().includes('select')).length}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
              Active Interviews & Placements
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Scope Filter Toggle Controls Bar for Team Lead */}
      {role === 'lead' && (
        <div className="bg-[#F8FAFC] p-1.5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center gap-2 shadow-2xs">
          <button
            type="button"
            onClick={() => setScopeTab('my_submissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              scopeTab === 'my_submissions'
                ? 'bg-[#6B3BF6] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-purple-50 hover:text-[#6B3BF6] border border-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>My Individual Submissions (Team Lead)</span>
          </button>
          <button
            type="button"
            onClick={() => setScopeTab('team_members')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              scopeTab === 'team_members'
                ? 'bg-[#6B3BF6] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-purple-50 hover:text-[#6B3BF6] border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Members Submissions</span>
          </button>
          <button
            type="button"
            onClick={() => setScopeTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              scopeTab === 'all'
                ? 'bg-[#6B3BF6] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-purple-50 hover:text-[#6B3BF6] border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>All Submissions (Lead + Team Members)</span>
          </button>
        </div>
      )}



      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center gap-3 justify-between">
          {/* Search Bar & Submissions Count Pill */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name, client, requirement..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-400 bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center bg-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Submission Count Pill beside Search Bar */}
            <div className="px-3.5 py-2 rounded-xl bg-purple-50 text-[#6B3BF6] border border-purple-200 text-xs font-extrabold flex items-center gap-2 shrink-0 shadow-2xs animate-in fade-in duration-150">
              <FileText className="w-3.5 h-3.5 text-[#6B3BF6]" />
              <span>
                {filteredData.length} {clientFilter !== 'All' ? `Submissions (${clientFilter})` : 'Total Submissions'}
              </span>
            </div>
          </div>

          {/* Right Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Client Filter Dropdown */}
            <div className="relative w-full sm:w-48">
              <select
                value={clientFilter}
                onChange={e => setClientFilter(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-700 bg-white font-bold cursor-pointer"
              >
                <option value="All">All Clients ({scopeSubmissions.length})</option>
                {clientOptions.map(client => (
                  <option key={client} value={client}>
                    Client: {client} ({clientCounts[client] || 0})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Date filter dropdown */}
            <div className="relative w-full sm:w-44">
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-700 bg-white font-bold cursor-pointer"
              >
                <option value="All">All Submissions</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="This week">This week</option>
                <option value="This month">This month</option>
                <option value="Custom range">Custom range...</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Custom Range Date Pickers */}
            {dateFilter === 'Custom range' && (
              <div className="flex items-center gap-2 animate-in fade-in duration-150">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#6B3BF6]"
                />
                <span className="text-xs text-slate-400 font-bold">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#6B3BF6]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('')
                    setCustomEndDate('')
                    setDateFilter('All')
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Status Filter Dropdown */}
            <div className="relative w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-700 bg-white font-bold cursor-pointer"
              >
                <option value="All">All Candidate Statuses</option>
                <option value="Submitted to Lead">Submitted to Client / Lead</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Selected">Selected in Interview</option>
                <option value="Placed">Placed</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. Submissions Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">CANDIDATE & ROLE</th>
                <th className="py-3.5 px-4">REQUIREMENT ID</th>
                <th className="py-3.5 px-4">CURRENT COMPANY & EXP</th>
                <th className="py-3.5 px-4">SUBMITTED BY & DATE</th>
                <th className="py-3.5 px-4">SUBMITTED TO (CLIENT)</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4">REASON FOR REJECTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {paginatedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-sm">No candidate submissions found</p>
                    <p className="text-xs mt-1">Try adjusting your search query, client filter, or date range filter above</p>
                  </td>
                </tr>
              ) : (
                paginatedSubmissions.map(sub => (
                  <tr
                    key={sub.id}
                    className="hover:bg-purple-50/30 transition-colors"
                  >
                    {/* 1. CANDIDATE & ROLE */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#5B51D8] font-extrabold flex items-center justify-center text-xs shrink-0 border border-[#C7D2FE]">
                          {sub.candidateName.charAt(0)}
                        </div>
                        <div>
                          <button
                            onClick={() => setSelectedSub(sub)}
                            className="font-extrabold text-slate-900 text-xs hover:text-[#6B3BF6] hover:underline text-left cursor-pointer transition-colors block"
                            title="Click to view candidate profile"
                          >
                            {sub.candidateName}
                          </button>
                          <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                            {sub.requirement}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. REQUIREMENT ID */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenReqOverview(sub.reqId || 'REQ-2026-08-12-001', sub.requirement, sub.clientName || 'ITC Limited')}
                        className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-mono flex items-center gap-1 cursor-pointer transition-all hover:underline shadow-2xs"
                        title="Click to view Requirement Overview"
                      >
                        <span>{sub.reqId || 'REQ-2026-08-12-001'}</span>
                        <ExternalLink className="w-3 h-3 text-blue-600" />
                      </button>
                    </td>

                    {/* 3. CURRENT COMPANY & EXP */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 text-xs">
                        {sub.currentCompany}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Experience: {sub.experience}
                      </div>
                    </td>

                    {/* 4. SUBMITTED BY & DATE */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-xs">{sub.submittedBy}</span>
                        {sub.submittedBy.toLowerCase().includes('harish') && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                            Team Lead
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        {sub.submittedOn}
                      </div>
                    </td>

                    {/* 5. SUBMITTED TO (CLIENT NAME) */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-slate-900 text-xs">
                        {sub.clientName || 'ITC Limited'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                        Direct Client
                      </div>
                    </td>

                    {/* 6. STATUS */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold border inline-block ${getStatusBadgeStyle(
                          sub.status
                        )}`}
                      >
                        {sub.status}
                      </span>
                    </td>

                    {/* 7. REASON FOR REJECTION */}
                    <td className="py-4 px-4">
                      {reasons[sub.id] || sub.rejectionReason ? (
                        <span className="text-slate-700 font-medium text-xs block leading-relaxed max-w-xs">
                          {reasons[sub.id] || sub.rejectionReason}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Candidate Detail Modal */}
      {selectedSub && (
        <SubmissionCandidateDetailModal
          role={role}
          submission={{
            id: selectedSub.id,
            candidate: selectedSub.candidateName,
            reqId: 'REQ-2026-05',
            req: selectedSub.requirement,
            client: selectedSub.currentCompany,
            experience: selectedSub.experience,
            recruiter: selectedSub.submittedBy,
            date: selectedSub.submittedOn,
            stage: selectedSub.status,
            email: 'candidate@email.com',
            phone: '+91 98765 43210',
            location: 'Bangalore, India',
            noticePeriod: '30 Days',
            currentCtc: '14 LPA',
            expectedCtc: '18 LPA',
            skills: ['Java', 'Spring Boot', 'Microservices', 'SQL'],
          }}
          rejectionReason={reasons[selectedSub.id] || selectedSub.rejectionReason}
          onSaveRejectionReason={(id, newReason) => {
            setReasons(prev => ({ ...prev, [id]: newReason }))
          }}
          onClose={() => setSelectedSub(null)}
        />
      )}

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        initialSubmission={targetSubForInterview ? `${targetSubForInterview.candidateName} — ${targetSubForInterview.requirement}` : undefined}
        onClose={() => {
          setIsScheduleModalOpen(false)
          setTargetSubForInterview(null)
        }}
        onScheduleSuccess={handleScheduleSuccess}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in duration-200 border border-slate-800">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  )
}
