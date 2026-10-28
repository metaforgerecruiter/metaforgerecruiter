import React, { useState } from 'react'
import { Interview, Requirement, Submission, ActivityLogItem } from '../../types'
import { RequirementDetailOverview } from '../pages/RequirementDetailOverview'
import { CandidateRepositoryPage } from '../pages/CandidateRepositoryPage'
import { SubmissionsPage } from '../pages/SubmissionsPage'
import { InterviewTrackingPage } from '../pages/InterviewTrackingPage'
import {
  Send,
  MessageSquare,
  CheckCircle2,
  ClipboardList,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  UserPlus,
  ExternalLink,
  Plus,
  Briefcase,
  ArrowUp,
} from 'lucide-react'
import { PaginationFooter } from '../ui/PaginationFooter'
import { PageHeader } from '../layout/PageHeader'

interface Props {
  submissions: Submission[]
  interviews: Interview[]
  requirements: Requirement[]
  activityLogs?: ActivityLogItem[]
  currentUserName?: string
  currentUserEmail?: string
  onOpenSubmitCandidate?: (reqId?: string) => void
  onOpenCandidateRepo?: (reqId?: string) => void
  onOpenFeedbackModal?: (interview: Interview) => void
  onOpenCandidateDetail?: (sub: Submission) => void
  onAddActivityLog?: (log: ActivityLogItem) => void
}

interface ActiveReqRow {
  type: string
  id: string
  name: string
  client: string
  status: string
  timestamp: string
}

const DEFAULT_ACTIVE_REQS: ActiveReqRow[] = [
  {
    type: 'Requirement',
    id: 'REQ-2026-06-19-001',
    name: 'AI Data Engineer',
    client: 'harish',
    status: 'Assigned',
    timestamp: 'Jun 19, 2026, 07:29 PM',
  },
  {
    type: 'Requirement',
    id: 'REQ-2026-06-19-002',
    name: 'Fullstack React Developer',
    client: 'Metaforge IT',
    status: 'Submitted',
    timestamp: 'Jun 20, 2026, 10:15 AM',
  },
  {
    type: 'Requirement',
    id: 'REQ-2026-06-19-003',
    name: 'DevOps Cloud Specialist',
    client: 'Continental Automotive',
    status: 'Selected for interview',
    timestamp: 'Jun 21, 2026, 02:45 PM',
  },
]

export function RecruiterDashboard({
  submissions,
  interviews,
  requirements,
  activityLogs,
  currentUserName = 'Harish Gadipally',
  currentUserEmail,
  onOpenSubmitCandidate,
  onOpenCandidateRepo,
  onOpenFeedbackModal,
  onOpenCandidateDetail,
  onAddActivityLog,
}: Props) {
  // Filter activity logs specifically performed by or relevant to the logged-in user/recruiter
  const userActivityLogs = React.useMemo(() => {
    const targetName = (currentUserName || 'Harish Gadipally').toLowerCase()
    const targetEmail = (currentUserEmail || '').toLowerCase()

    // 1. Explicit activity logs matching user name or email
    const explicitLogs = (activityLogs || []).filter(log => {
      const matchName = log.userName && log.userName.toLowerCase().includes(targetName)
      const matchEmail = targetEmail && log.userEmail && log.userEmail.toLowerCase().includes(targetEmail)
      return matchName || matchEmail
    })

    // 2. Synthesize log items from candidate submissions performed by this recruiter
    const submissionLogs: ActivityLogItem[] = submissions
      .filter(s => !targetName || s.recruiter.toLowerCase().includes(targetName) || targetName.includes('harish'))
      .map(s => ({
        id: `sub-activity-${s.id}`,
        timestamp: s.date || 'Recently',
        userName: s.recruiter,
        userEmail: currentUserEmail || '',
        userRole: 'recruiter',
        userAvatar: s.recruiter.charAt(0).toUpperCase(),
        action: `Submitted candidate ${s.candidate} for ${s.req}`,
        category: 'Submissions',
        targetEntity: `Candidate ${s.candidate}`,
        targetId: s.id,
        clientName: s.client,
        ipAddress: '192.168.1.45',
        status: s.stage.toLowerCase().includes('reject') ? 'Warning' : 'Success',
        details: `Submitted to client ${s.client} | Current Stage: ${s.stage}`,
      }))

    // 3. Synthesize log items from interview tracking
    const interviewLogs: ActivityLogItem[] = interviews
      .filter(i => !targetName || (i.recruiter && i.recruiter.toLowerCase().includes(targetName)) || targetName.includes('harish'))
      .map(i => ({
        id: `iv-activity-${i.id}`,
        timestamp: i.date || 'Recently',
        userName: i.recruiter || currentUserName || 'Harish Gadipally',
        userEmail: currentUserEmail || '',
        userRole: 'recruiter',
        userAvatar: (i.recruiter || 'H').charAt(0).toUpperCase(),
        action: `Scheduled interview (${i.stage || 'Round'}) for ${i.candidate}`,
        category: 'Interviews',
        targetEntity: `Interview with ${i.candidate}`,
        targetId: i.id,
        clientName: i.client || 'Client',
        ipAddress: '192.168.1.45',
        status: i.status === 'Passed' ? 'Success' : 'Warning',
        details: `Status: ${i.status} | Client: ${i.client || 'Partner'}`,
      }))

    // Combine and deduplicate
    const combined = [...explicitLogs, ...submissionLogs, ...interviewLogs]
    const seen = new Set<string>()
    return combined.filter(item => {
      const key = `${item.action}-${item.timestamp}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [activityLogs, submissions, interviews, currentUserName, currentUserEmail])
  const [selectedReqForDetail, setSelectedReqForDetail] = useState<Requirement | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isAssignMyselfChecked, setIsAssignMyselfChecked] = useState(true)
  const [selectedRecruiterNames, setSelectedRecruiterNames] = useState<Set<string>>(new Set())
  const [recruiterSearchQuery, setRecruiterSearchQuery] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Assigned')
  const [selectedReqIds, setSelectedReqIds] = useState<Set<string>>(new Set())
  const [recentSubmissionsFilter, setRecentSubmissionsFilter] = useState('All Status')

  // Pagination state for active requirements table
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Inline View state for KPI cards (Total Submissions, Interviews Handled, etc.)
  const [inlineView, setInlineView] = useState<'submissions' | 'interviews' | null>(null)

  // Inline Candidate Repository & Submission workflow state (kept strictly inside My Work page)
  const [inlineReqId, setInlineReqId] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const handleOpenInlineCandidateRepo = (reqId: string) => {
    setInlineReqId(reqId)
    setTimeout(() => {
      const el = document.getElementById('inline-candidate-repo-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100)
  }

  const handleOpenReqOverview = (reqId: string, reqName?: string, reqClient?: string) => {
    const found = requirements.find(r => r.id === reqId) || {
      id: reqId,
      client: reqClient || 'harish',
      title: reqName || 'Implement and support SAP Transportation Management solutions in S 4HANA',
      priority: 'Medium' as const,
      status: 'Active' as const,
      assignmentStatus: 'Assigned' as const,
      owner: 'Harish Gadipally',
      submissions: 7,
      interviews: 0,
      placed: 0,
      rejections: 0,
      clientEmail: reqClient || 'harish',
      clientPhone: '+91 98765 43210',
      location: 'Remote, Hybrid, Onsite',
      openings: 1,
      dueDate: '2026-06-19',
      emailArrivedTime: 'Jun 19, 2026, 05:30 AM',
      budget: '₹5,000,000',
    }
    setSelectedReqForDetail(found)
  }

  const recruiterList = [
    { id: '1', name: 'Adirala sathvika', email: 'No email' },
    { id: '2', name: 'Arvind GR', email: 'arvind.gr@metaforgeit.com' },
    { id: '3', name: 'Charlie Darwin', email: 'charlie@metaforgeit.com' },
    { id: '4', name: 'Harini Sindey', email: 'harini.s@metaforgeit.com' },
    { id: '5', name: 'Harish Gadipally', email: 'harish.g@metaforgeit.com' },
    { id: '6', name: 'Puttapaka Saiteja', email: 'saiteja.p@metaforgeit.com' },
    { id: '7', name: 'Kallol Chakraborty', email: 'kallol.c@ltts.com' },
  ]

  const filteredRecruiterList = recruiterList.filter(
    r =>
      !recruiterSearchQuery.trim() ||
      r.name.toLowerCase().includes(recruiterSearchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(recruiterSearchQuery.toLowerCase())
  )

  const totalSelectedRecruitersCount = (isAssignMyselfChecked ? 1 : 0) + selectedRecruiterNames.size

  const toggleRecruiterSelection = (name: string) => {
    const next = new Set(selectedRecruiterNames)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setSelectedRecruiterNames(next)
  }

  const handleConfirmReassign = () => {
    const assignees: string[] = []
    if (isAssignMyselfChecked) assignees.push('Harish Gadipally')
    selectedRecruiterNames.forEach(n => assignees.push(n))

    if (assignees.length === 0) return

    const assigneesText = assignees.join(', ')

    if (selectedReqForDetail) {
      setSelectedReqForDetail({
        ...selectedReqForDetail,
        owner: assigneesText,
        assignmentStatus: 'Assigned',
        submissions: selectedReqForDetail.submissions || 7,
      })
    }

    setIsAssignModalOpen(false)
    setSelectedRecruiterNames(new Set())
    setIsAssignMyselfChecked(true)
    setRecruiterSearchQuery('')
  }

  if (selectedReqForDetail) {
    return (
      <>
        <RequirementDetailOverview
          requirement={selectedReqForDetail}
          role="recruiter"
          onBack={() => setSelectedReqForDetail(null)}
          onAddCandidate={() => onOpenSubmitCandidate?.(selectedReqForDetail.id)}
        />

        {/* REASSIGN MODAL OVERLAY */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden border border-slate-100 font-sans">
              {/* Header */}
              <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                    Reassign
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-1">
                    Select yourself and/or other recruiters for this requirement in one step.
                  </p>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Assign myself card */}
                <label className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer hover:bg-blue-50 transition-colors block">
                  <input
                    type="checkbox"
                    checked={isAssignMyselfChecked}
                    onChange={e => setIsAssignMyselfChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                  <div>
                    <div className="text-sm font-bold text-blue-900 leading-snug">
                      Assign myself (Harish Gadipally)
                    </div>
                    <div className="text-xs text-blue-600/90 leading-normal mt-0.5 font-normal">
                      Include yourself along with any recruiters selected below.
                    </div>
                  </div>
                </label>

                {/* Search recruiter input */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    ASSIGN TO RECRUITER
                  </div>
                  <input
                    type="text"
                    placeholder="Search recruiter by name or email"
                    value={recruiterSearchQuery}
                    onChange={e => setRecruiterSearchQuery(e.target.value)}
                    className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400 shadow-2xs transition-all"
                  />
                </div>

                {/* Showing counter */}
                <div className="text-xs text-slate-500 font-medium px-0.5">
                  Showing {filteredRecruiterList.length} of {recruiterList.length} recruiters
                </div>

                {/* Recruiter cards scrollable list */}
                <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
                  {filteredRecruiterList.map(rec => {
                    const isChecked = selectedRecruiterNames.has(rec.name)
                    return (
                      <label
                        key={rec.id}
                        className={`border rounded-2xl p-3.5 flex items-center gap-3.5 cursor-pointer transition-all ${
                          isChecked
                            ? 'border-blue-300 bg-blue-50/50'
                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleRecruiterSelection(rec.name)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                        />
                        <div>
                          <div className="text-sm font-bold text-slate-900 leading-snug">
                            {rec.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 font-normal">
                            {rec.email}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-5 h-11 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReassign}
                  disabled={totalSelectedRecruitersCount === 0}
                  className="px-6 h-11 bg-[#6B3BF6] hover:bg-[#5833E0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  Assign {totalSelectedRecruitersCount} recruiter(s)
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Exclude unassigned requirements from My Work page. Requirements appear in My Work ONLY after assignment by Super Admin, Admin, or Lead.
  const assignedRequirements = requirements.filter(
    r => r.owner && r.owner !== 'Unassigned' && r.assignmentStatus !== 'Unassigned'
  )

  // Map assigned requirements to table rows or fallback to active assigned demo data
  const activeReqRows: ActiveReqRow[] = assignedRequirements.length > 0
    ? assignedRequirements.map(r => ({
        type: 'Requirement',
        id: r.id,
        name: r.title,
        client: r.client,
        status: r.assignmentStatus || 'Assigned',
        timestamp: r.dueDate ? `${r.dueDate}, 07:29 PM` : 'Jun 19, 2026, 07:29 PM',
      }))
    : DEFAULT_ACTIVE_REQS.filter(r => r.status !== 'Unassigned')

  // Filter requirements by merged searchQuery and statusFilter
  const filteredReqs = activeReqRows.filter(req => {
    // Explicitly reject any Unassigned requirements
    if (req.status.toLowerCase() === 'unassigned') return false

    const q = searchQuery.trim().toLowerCase()
    const matchesQuery = !q || req.client.toLowerCase().includes(q) || req.id.toLowerCase().includes(q) || req.name.toLowerCase().includes(q)
    
    const filterLower = statusFilter.toLowerCase().trim()
    let matchesStatus = true
    if (filterLower === 'assigned') {
      matchesStatus = req.status.toLowerCase().includes('assign') || req.status.toLowerCase() === 'active' || req.status.toLowerCase() === 'open'
    } else if (filterLower === 'submitted') {
      matchesStatus = req.status.toLowerCase().includes('submit')
    } else if (filterLower === 'selected for interview') {
      matchesStatus = req.status.toLowerCase().includes('interview') || req.status.toLowerCase().includes('select')
    }

    return matchesQuery && matchesStatus
  })

  const paginatedReqs = filteredReqs.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Submissions filtered by recentSubmissionsFilter
  const filteredSubmissions = submissions.filter(sub => {
    if (recentSubmissionsFilter === 'All Status' || recentSubmissionsFilter === 'All') return true
    return sub.stage.toLowerCase() === recentSubmissionsFilter.toLowerCase()
  })

  if (inlineView === 'submissions') {
    return (
      <div className="w-full pb-12 font-sans animate-in fade-in duration-200 space-y-4">
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setInlineView(null)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>Back to My Workspace</span>
            </button>
            <span className="text-xs font-bold text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-700">Total Submissions Overview</span>
          </div>
        </div>

        <SubmissionsPage
          role="recruiter"
          submissions={submissions}
          requirements={requirements}
          onOpenSubmitCandidate={onOpenSubmitCandidate}
        />
      </div>
    )
  }

  if (inlineView === 'interviews') {
    return (
      <div className="w-full pb-12 font-sans animate-in fade-in duration-200 space-y-4">
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setInlineView(null)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>Back to My Workspace</span>
            </button>
            <span className="text-xs font-bold text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-700">Interview Tracking Overview</span>
          </div>
        </div>

        <InterviewTrackingPage
          role="recruiter"
          interviews={interviews}
          onOpenFeedbackModal={onOpenFeedbackModal}
        />
      </div>
    )
  }

  if (inlineReqId) {
    return (
      <div className="w-full pb-12 font-sans animate-in fade-in duration-200">
        <CandidateRepositoryPage
          selectedReqId={inlineReqId}
          role="recruiter"
          requirements={requirements}
          onBackToDashboard={() => {
            setInlineReqId(null)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onOpenAddForm={() => {
            showToast('Use candidate upload form to add new candidate profiles.')
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-8 w-full pb-12 font-sans">
      {/* Header */}
      <PageHeader
        title="My Workspace"
        subtitle="Your personal assignments, submissions, and daily activity"
      />

      {/* Performance Summary Section */}
      <section>
        <h2 className="text-base font-semibold text-slate-800 mb-3">Performance Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Submissions */}
          <div
            onClick={() => setInlineView('submissions')}
            className="bg-[#E6F8F0] border border-[#A7F3D0] rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer hover:scale-[1.01] group"
            title="Click to view Total Submissions details"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Total Submissions</p>
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">
                {submissions.length > 0 ? submissions.length : 6}
              </p>
              <p className="text-[11px] font-medium text-emerald-700 mt-1">Click to view Total Submissions data</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#00BA7C] text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <Send className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Interviews Handled */}
          <div
            onClick={() => setInlineView('interviews')}
            className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer hover:scale-[1.01] group"
            title="Click to view Interview Tracking details"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Interviews Handled</p>
                <ExternalLink className="w-3.5 h-3.5 text-[#5B51D8] opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">
                {interviews.length}
              </p>
              <p className="text-[11px] font-medium text-[#5B51D8] mt-1">Click to view Interview Tracker data</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#5B51D8] text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Selections Achieved */}
          <div
            onClick={() => setInlineView('submissions')}
            className="bg-[#F4EFFE] border border-[#E9D8FD] rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer hover:scale-[1.01] group"
            title="Click to view Selections details"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Selections Achieved</p>
                <ExternalLink className="w-3.5 h-3.5 text-purple-600 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">0</p>
              <p className="text-[11px] font-medium text-purple-700 mt-1">Click to view candidate selections</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Assigned Requirements */}
          <div
            onClick={() => {
              setInlineView(null)
              setStatusFilter('Assigned')
              const el = document.getElementById('active-requirements-section')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="bg-[#EBF3FF] border border-[#BFDBFE] rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer hover:scale-[1.01] group"
            title="Click to view Assigned Requirements"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Assigned Requirements</p>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">
                {filteredReqs.length > 0 ? filteredReqs.length : 8}
              </p>
              <p className="text-[11px] font-medium text-blue-700 mt-1">Click to view active requirements</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#2F80ED] text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Active Requirements + Submitted Candidates Section */}
      <section id="active-requirements-section" className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Active Requirements + Submitted Candidates
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Your open workload across currently active job demands.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client or requirement ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200/90 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] transition-all placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <div className="w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2.5 rounded-xl border border-slate-200/90 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] cursor-pointer shadow-2xs"
            >
              <option value="Assigned">Status: Assigned</option>
              <option value="Submitted">Status: Submitted</option>
              <option value="Selected for interview">Status: Selected for interview</option>
            </select>
          </div>
        </div>

        {/* Requirements Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="px-4 py-3">
                    REQUIREMENT ID
                  </th>
                  <th className="px-4 py-3">
                    REQUIREMENT NAME
                  </th>
                  <th className="px-4 py-3">
                    CLIENT
                  </th>
                  <th className="px-4 py-3">
                    STATUS
                  </th>
                  <th className="px-4 py-3">
                    TIMESTAMP (ASSIGNED ON)
                  </th>
                  <th className="px-4 py-3 text-right">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-normal bg-white">
                {paginatedReqs.length > 0 ? (
                  paginatedReqs.map((req, idx) => (
                    <tr key={req.id || idx} className="hover:bg-slate-50/60 transition-colors align-middle">
                      <td className="px-4 py-3 font-mono text-slate-900 align-middle">
                        <button
                          onClick={() => handleOpenReqOverview(req.id, req.name, req.client)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          title="Click to view Requirement Overview"
                        >
                          {req.id}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 align-middle">
                        <button
                          onClick={() => handleOpenReqOverview(req.id, req.name, req.client)}
                          className="text-xs font-semibold text-slate-900 hover:text-blue-600 hover:underline cursor-pointer text-left"
                          title="Click to view Requirement Overview"
                        >
                          {req.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium align-middle">{req.client}</td>
                      <td className="px-4 py-3 align-middle">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{req.status}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 align-middle">{req.timestamp}</td>
                      <td className="px-4 py-3 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => handleOpenInlineCandidateRepo(req.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF2FF] hover:bg-[#6B3BF6] text-[#5B51D8] hover:text-white border border-[#C7D2FE] hover:border-[#6B3BF6] rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-98 whitespace-nowrap group shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5 text-[#5B51D8] group-hover:text-white transition-colors" />
                          <span>Candidate Repo</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 text-xs font-medium">
                      No active requirements found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <PaginationFooter
            currentPage={currentPage}
            totalPages={Math.ceil(filteredReqs.length / pageSize)}
            totalItems={filteredReqs.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="requirements"
          />
        </div>
      </section>

      {/* My Recent Submissions Section (Kept at bottom of My Work page) */}
      <section className="space-y-4 pt-4 border-t border-slate-200/60">
        <div>
          <h2 className="text-lg font-bold text-slate-900">My Recent Submissions</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your latest candidate activity across requirements.
          </p>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50">
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    CANDIDATE NAME
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    RECRUITER
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    ROLE
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    CLIENT
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    STATUS
                  </th>
                  <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    SUBMITTED ON
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map(sub => (
                    <tr
                      key={sub.id}
                      onClick={() => onOpenCandidateDetail?.(sub)}
                      className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3.5 font-semibold text-slate-900">{sub.candidate}</td>
                      <td className="px-4 py-3.5 text-slate-600">{sub.recruiter}</td>
                      <td className="px-4 py-3.5 text-slate-600">{sub.req}</td>
                      <td className="px-4 py-3.5 text-slate-600">{sub.client}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${
                            sub.stage.toLowerCase().includes('reject')
                              ? 'bg-red-50 text-red-600 border-red-200/80'
                              : 'bg-blue-50 text-blue-700 border-blue-200/60'
                          }`}
                        >
                          {sub.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500">{sub.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-medium">
                      No submissions found for your user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Actions and updates performed in your recruiter account.
            </p>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 shadow-2xs">
            {userActivityLogs.length} Action{userActivityLogs.length === 1 ? '' : 's'} Logged
          </span>
        </div>

        {userActivityLogs.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {userActivityLogs.slice(0, 10).map((log, idx) => {
              const isSubmission = log.category === 'Submissions' || log.action.toLowerCase().includes('submit')
              const isInterview = log.category === 'Interviews' || log.action.toLowerCase().includes('interview')

              let iconBg = 'bg-blue-50 text-blue-600 border-blue-200'
              let IconComp = ClipboardList

              if (isSubmission) {
                iconBg = 'bg-emerald-50 text-emerald-600 border-emerald-200'
                IconComp = Send
              } else if (isInterview) {
                iconBg = 'bg-purple-50 text-purple-600 border-purple-200'
                IconComp = MessageSquare
              }

              return (
                <div key={log.id || idx} className="p-4 flex items-start justify-between gap-4 hover:bg-slate-50/60 transition-colors align-middle">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-900 leading-snug">
                          {log.action}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {log.category || 'Activity'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-normal line-clamp-1">
                        {log.details || `Performed by ${log.userName || currentUserName || 'Recruiter'}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap">
                      {log.timestamp}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${log.status === 'Warning' ? 'bg-amber-400' : 'bg-emerald-500'}`} title={log.status} />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs py-10 px-6 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No recent activity recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">Actions you perform across requirements, candidates, and interviews will show up here.</p>
          </div>
        )}
      </section>

      {/* Toast Notification Container */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
