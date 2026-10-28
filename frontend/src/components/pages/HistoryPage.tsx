import React, { useState, useMemo } from 'react'
import {
  History,
  Users,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  Briefcase,
  ShieldCheck,
  Layers,
  ChevronRight,
  PauseCircle,
  PlayCircle,
  BarChart3,
  UserCheck,
  ChevronDown,
  XCircle,
  Sparkles,
  User,
  Calendar,
  ArrowUpRight,
  Check,
  ArrowLeft,
  X,
} from 'lucide-react'
import { Role, Recruiter, Requirement, Submission } from '../../types'
import { PaginationFooter } from '../ui/PaginationFooter'

interface SubmittedClientsPillCellProps {
  clients: string[]
  onSelectClient?: (clientName: string) => void
  activeClient?: string
}

function SubmittedClientsPillCell({ clients, onSelectClient, activeClient }: SubmittedClientsPillCellProps) {
  const [isOpen, setIsOpen] = useState(false)

  if (!clients || clients.length === 0) {
    return <span className="text-slate-400 font-medium">—</span>
  }

  const primaryClient =
    activeClient && activeClient !== 'All Clients' && clients.some(c => c.toLowerCase().includes(activeClient.toLowerCase()))
      ? clients.find(c => c.toLowerCase().includes(activeClient.toLowerCase())) || clients[0]
      : clients[0]

  const hasMultiple = clients.length > 1

  return (
    <div className="relative inline-flex items-center" onClick={e => e.stopPropagation()}>
      {hasMultiple ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#5B51D8] border border-[#C7D2FE] transition-all cursor-pointer shadow-2xs active:scale-95"
          title={`Click to view all ${clients.length} submitted clients`}
        >
          <Building2 className="w-3.5 h-3.5 text-[#5B51D8] shrink-0" />
          <span>{primaryClient}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-[#5B51D8] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onSelectClient?.(clients[0])}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-extrabold bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#5B51D8] border border-[#C7D2FE] shadow-2xs cursor-pointer transition-all active:scale-95"
          title={`Click to filter table for ${clients[0]}`}
        >
          <Building2 className="w-3.5 h-3.5 text-[#5B51D8] shrink-0" />
          <span>{clients[0]}</span>
        </button>
      )}

      {isOpen && hasMultiple && (
        <div className="absolute left-0 top-full mt-1.5 z-50 w-56 bg-white border border-slate-200 rounded-2xl p-3 shadow-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-1.5 flex items-center justify-between">
            <span>Submitted Clients ({clients.length})</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
            {clients.map(client => (
              <button
                key={client}
                type="button"
                onClick={() => {
                  onSelectClient?.(client)
                  setIsOpen(false)
                }}
                className="w-full text-left px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-purple-50 hover:text-[#6B3BF6] rounded-xl transition-colors flex items-center gap-2"
              >
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{client}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export interface RecruiterHistoryItem {
  id: string
  recruiterName: string
  recruiterEmail: string
  recruiterAvatar: string
  roleTitle: string
  userRole: 'recruiter' | 'lead'
  teamLead: string
  clientAccounts: string[]
  assignedRequirementsCount: number
  sourcedProfilesCount: number // Candidate Repository history
  submittedProfilesCount: number // Total Submissions page count
  interviewsCount?: number // Total Interviews count
  workingProfilesCount: number // Active in progress / working candidates
  onHoldProfilesCount: number // On hold candidates
  placedCount: number // Offers accepted / joined
  topSkillsSourced: string[]
  recentSourcedCandidates: {
    id: string
    candidateName: string
    requirementName: string
    clientName: string
    sourcedDate: string
    status: 'Submitted' | 'Working' | 'On Hold' | 'Sourced'
    experience: string
    skills?: string[]
    contactEmail?: string
  }[]
  assignedRequirementsList: {
    id: string
    reqName: string
    clientName: string
    status: 'Open' | 'In Progress' | 'Closed'
    assignedDate: string
    submissionsCount: number
    sourcedCount?: number
    workingCount?: number
  }[]
}

const fmtDate = (v?: string) => {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const subStatus = (stage?: string): 'Submitted' | 'Working' | 'On Hold' | 'Sourced' => {
  const v = (stage || '').toLowerCase()
  if (v.includes('hold')) return 'On Hold'
  if (/interview|shortlist|offer|review|selected/.test(v)) return 'Working'
  return 'Submitted'
}

/** History rows built from live recruiters, their assigned requirements and their submissions. */
export function buildRecruiterHistory(
  recruiters: Recruiter[],
  requirements: Requirement[],
  submissions: Submission[],
): RecruiterHistoryItem[] {
  const assigned = (name: string) =>
    requirements.filter(r => (r.owner || '').split(',').map(n => n.trim()).includes(name))
  const recruiterRows: RecruiterHistoryItem[] = recruiters.map(r => {
    const reqs = assigned(r.name)
    const subs = submissions.filter(s => s.recruiter === r.name)
    const clients = [...new Set([...reqs.map(q => q.client), ...subs.map(s => s.client)].filter(Boolean))]
    return {
      id: `HIST-${r.id}`,
      recruiterName: r.name,
      recruiterEmail: r.email || '',
      recruiterAvatar: (r.name || '?').charAt(0).toUpperCase(),
      roleTitle: 'Recruiter',
      userRole: 'recruiter',
      teamLead: r.lead || '—',
      clientAccounts: clients,
      assignedRequirementsCount: reqs.length,
      sourcedProfilesCount: subs.length,
      submittedProfilesCount: r.submissions || subs.length,
      interviewsCount: r.interviews || 0,
      workingProfilesCount: subs.filter(s => subStatus(s.stage) === 'Working').length,
      onHoldProfilesCount: subs.filter(s => subStatus(s.stage) === 'On Hold').length,
      placedCount: r.placements || 0,
      topSkillsSourced: [],
      recentSourcedCandidates: subs.map(s => ({
        id: s.id,
        candidateName: s.candidate,
        requirementName: requirements.find(q => q.id === s.req || (q as any).reqCode === s.req)?.title || s.req,
        clientName: s.client,
        sourcedDate: fmtDate(s.submittedAt || s.createdAt || s.date),
        status: subStatus(s.stage),
        experience: s.experience || '—',
        contactEmail: s.email,
      })),
      assignedRequirementsList: reqs.map(q => ({
        id: q.id,
        reqName: q.title,
        clientName: q.client,
        status: (q.status === 'Closed' ? 'Closed' : (q.submissions || 0) > 0 ? 'In Progress' : 'Open') as 'Open' | 'In Progress' | 'Closed',
        assignedDate: fmtDate(q.createdAt),
        submissionsCount: q.submissions || 0,
      })),
    }
  })
  // Each lead: the sum of the lead's recruiters.
  const leadNames = [...new Set(recruiters.map(r => r.lead).filter(Boolean))] as string[]
  const leadRows: RecruiterHistoryItem[] = leadNames.map(lead => {
    const team = recruiterRows.filter(x => x.teamLead === lead)
    const sum = (f: (x: RecruiterHistoryItem) => number) => team.reduce((n, x) => n + f(x), 0)
    return {
      id: `HIST-LEAD-${lead}`,
      recruiterName: lead,
      recruiterEmail: '',
      recruiterAvatar: lead.charAt(0).toUpperCase(),
      roleTitle: 'Team Lead',
      userRole: 'lead',
      teamLead: lead,
      clientAccounts: [...new Set(team.flatMap(x => x.clientAccounts))],
      assignedRequirementsCount: sum(x => x.assignedRequirementsCount),
      sourcedProfilesCount: sum(x => x.sourcedProfilesCount),
      submittedProfilesCount: sum(x => x.submittedProfilesCount),
      interviewsCount: sum(x => x.interviewsCount || 0),
      workingProfilesCount: sum(x => x.workingProfilesCount),
      onHoldProfilesCount: sum(x => x.onHoldProfilesCount),
      placedCount: sum(x => x.placedCount),
      topSkillsSourced: [],
      recentSourcedCandidates: team.flatMap(x => x.recentSourcedCandidates),
      assignedRequirementsList: team.flatMap(x => x.assignedRequirementsList),
    }
  })
  return [...leadRows, ...recruiterRows]
}

interface HistoryPageProps {
  role: Role
  recruiters?: Recruiter[]
  requirements?: Requirement[]
  submissions?: Submission[]
  currentUserName?: string
  currentUserEmail?: string
}

export function HistoryPage({ role, currentUserName, currentUserEmail, recruiters = [], requirements = [], submissions = [] }: HistoryPageProps) {
  const RECRUITERS_HISTORY_DATA = useMemo(() => buildRecruiterHistory(recruiters, requirements, submissions), [recruiters, requirements, submissions])
  // Determine if viewing as Super Admin / Admin or as a Recruiter / Lead
  const isSuperAdminOrAdmin = role === 'superadmin' || role === 'admin' || role === 'devteam'
  const isAuthorized = isSuperAdminOrAdmin || role === 'recruiter' || role === 'lead'

  // Search State
  const [searchQuery, setSearchQuery] = useState('')

  // Selected Recruiter Drawer / Modal State (for Super Admin View)
  const [selectedRecruiterDetail, setSelectedRecruiterDetail] = useState<RecruiterHistoryItem | null>(null)
  const [recruiterDetailModalTab, setRecruiterDetailModalTab] = useState<'requirements' | 'sourced'>('requirements')

  // Helpers to get full list of worked requirements and sourced profiles matching counts
  const getFullAssignedRequirements = (rec: RecruiterHistoryItem) => rec.assignedRequirementsList || []

  const getFullSourcedCandidates = (rec: RecruiterHistoryItem) => rec.recentSourcedCandidates || []

  // Recruiter Personal View Active Tab & Status Filter
  const [recruiterTab, setRecruiterTab] = useState<'requirements' | 'sourced'>('requirements')
  const [statusFilter, setStatusFilter] = useState<'All' | 'Submitted' | 'Working' | 'On Hold' | 'Sourced'>('All')
  const [selectedReqFilter, setSelectedReqFilter] = useState<string | null>(null)
  const [selectedCandidateDetail, setSelectedCandidateDetail] = useState<any | null>(null)
  const [selectedRequirementDetail, setSelectedRequirementDetail] = useState<any | null>(null)

  // Team Lead View Tab State: 'self' (My Individual Performance) | 'team' (Team Members Performance)
  const [leadViewTab, setLeadViewTab] = useState<'self' | 'team'>('self')

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Identify logged in recruiter item for Recruiter / Lead view
  const myRecruiterHistory = useMemo(() => {
    if (currentUserEmail) {
      const found = RECRUITERS_HISTORY_DATA.find(
        r => r.recruiterEmail.toLowerCase() === currentUserEmail.toLowerCase()
      )
      if (found) return found
    }
    if (currentUserName) {
      const found = RECRUITERS_HISTORY_DATA.find(
        r => r.recruiterName.toLowerCase() === currentUserName.toLowerCase()
      )
      if (found) return found
    }
    if (role === 'lead') {
      return RECRUITERS_HISTORY_DATA.find(r => r.userRole === 'lead') || null
    }
    return null
  }, [RECRUITERS_HISTORY_DATA, currentUserEmail, currentUserName, role])

  // Filtered Recruiters List for Super Admin or Team Lead
  const filteredRecruiters = useMemo(() => {
    return RECRUITERS_HISTORY_DATA.filter(rec => {
      // If role is lead, filter recruiters belonging to this Team Lead's pod/team
      if (role === 'lead') {
        const myName = (myRecruiterHistory?.recruiterName || currentUserName || '').toLowerCase()
        const leadName = (rec.teamLead || '').toLowerCase()
        const recName = (rec.recruiterName || '').toLowerCase()

        const isMyTeam = !myName || leadName.includes(myName) || recName.includes(myName)
        if (!isMyTeam) return false
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = rec.recruiterName.toLowerCase().includes(q)
        const matchEmail = rec.recruiterEmail.toLowerCase().includes(q)
        const matchLead = rec.teamLead.toLowerCase().includes(q)
        const matchClients = rec.clientAccounts.some(c => c.toLowerCase().includes(q))
        const matchSkills = rec.topSkillsSourced.some(s => s.toLowerCase().includes(q))
        if (!matchName && !matchEmail && !matchLead && !matchClients && !matchSkills) return false
      }
      return true
    })
  }, [searchQuery, role, myRecruiterHistory])

  // Super Admin / Team Lead Paginated List
  const paginatedRecruiters = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRecruiters.slice(start, start + pageSize)
  }, [filteredRecruiters, currentPage])

  const totalPages = Math.ceil(filteredRecruiters.length / pageSize) || 1

  // Summary Totals for Super Admin or Team Lead View
  const totals = useMemo(() => {
    return filteredRecruiters.reduce(
      (acc, r) => {
        acc.requirements += r.assignedRequirementsCount
        acc.sourced += r.sourcedProfilesCount
        acc.submitted += r.submittedProfilesCount
        acc.working += r.workingProfilesCount
        acc.onHold += r.onHoldProfilesCount
        acc.placed += r.placedCount
        return acc
      },
      { requirements: 0, sourced: 0, submitted: 0, working: 0, onHold: 0, placed: 0 }
    )
  }, [filteredRecruiters])

  // Filtered requirements for Recruiter View
  const filteredMyRequirements = useMemo(() => {
    if (!myRecruiterHistory) return []
    return myRecruiterHistory.assignedRequirementsList.filter(req => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        req.reqName.toLowerCase().includes(q) ||
        req.clientName.toLowerCase().includes(q) ||
        req.id.toLowerCase().includes(q) ||
        req.status.toLowerCase().includes(q)
      )
    })
  }, [myRecruiterHistory, searchQuery])

  // Filtered sourced candidates for Recruiter View
  const filteredMySourcedCandidates = useMemo(() => {
    if (!myRecruiterHistory) return []
    return myRecruiterHistory.recentSourcedCandidates.filter(cand => {
      if (selectedReqFilter && cand.requirementName !== selectedReqFilter) return false
      if (statusFilter !== 'All' && cand.status !== statusFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        cand.candidateName.toLowerCase().includes(q) ||
        cand.requirementName.toLowerCase().includes(q) ||
        cand.clientName.toLowerCase().includes(q) ||
        cand.status.toLowerCase().includes(q) ||
        (cand.skills && cand.skills.some(s => s.toLowerCase().includes(q)))
      )
    })
  }, [myRecruiterHistory, searchQuery, selectedReqFilter, statusFilter])

  // Export Super Admin CSV Handler
  const handleExportSuperAdminCSV = () => {
    const headers = [
      'Recruiter Name',
      'Email',
      'Role Title',
      'Team Lead',
      'Assigned Requirements',
      'Sourced Profiles (Repo History)',
      'Profiles Submitted',
      'Working Profiles (In Progress)',
      'On Hold Profiles',
      'Placed Candidates',
    ]

    const rows = filteredRecruiters.map(r => {
      return [
        `"${r.recruiterName}"`,
        `"${r.recruiterEmail}"`,
        `"${r.roleTitle}"`,
        `"${r.teamLead}"`,
        r.assignedRequirementsCount,
        r.sourcedProfilesCount,
        r.submittedProfilesCount,
        r.workingProfilesCount,
        r.onHoldProfilesCount,
        r.placedCount,
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `All_Recruiters_Performance_History_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export Recruiter Personal CSV Handler
  const handleExportRecruiterCSV = () => {
    if (!myRecruiterHistory) return

    const headersReq = ['Type', 'ID / Code', 'Name / Candidate', 'Client Account', 'Assigned / Sourced Date', 'Submissions / Status', 'Working Pipeline']
    const reqRows = myRecruiterHistory.assignedRequirementsList.map(r => [
      '"Requirement"',
      `"${r.id}"`,
      `"${r.reqName}"`,
      `"${r.clientName}"`,
      `"${r.assignedDate}"`,
      `"${r.submissionsCount} Submissions (${r.status})"`,
      `"${r.workingCount || 0} Working"`,
    ])

    const candRows = myRecruiterHistory.recentSourcedCandidates.map(c => [
      '"Sourced Candidate"',
      `"${c.id}"`,
      `"${c.candidateName} (${c.experience})"`,
      `"${c.clientName}"`,
      `"${c.sourcedDate}"`,
      `"${c.status}"`,
      `"${c.requirementName}"`,
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [
      headersReq.join(','),
      ...reqRows.map(e => e.join(',')),
      '',
      ...candRows.map(e => e.join(',')),
    ].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `My_Sourcing_and_Requirement_History_${myRecruiterHistory.recruiterName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isAuthorized) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 space-y-4 shadow-xl font-sans">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Restricted Access Module</h2>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">
          The <strong>History</strong> module is accessible exclusively to active portal users.
        </p>
      </div>
    )
  }

  // =========================================================================
  // VIEW A: RECRUITER PERSONAL HISTORY VIEW (Or Team Lead Individual View)
  // =========================================================================
  if (role === 'recruiter' || (role === 'lead' && leadViewTab === 'self')) {
    return (
      <div className="space-y-6 w-full pb-20 font-sans text-slate-800 animate-in fade-in duration-200">
        {/* TEAM LEAD SUB-TAB CONTROL BAR */}
        {role === 'lead' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLeadViewTab('self')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  leadViewTab === 'self'
                    ? 'bg-[#6B3BF6] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>My Individual Performance & History</span>
              </button>
              <button
                type="button"
                onClick={() => setLeadViewTab('team')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  leadViewTab === 'team'
                    ? 'bg-[#6B3BF6] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Team Members Performance ({filteredRecruiters.length})</span>
              </button>
            </div>

            <div className="text-xs font-extrabold text-[#6B3BF6] bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
              Team Lead Module • {myRecruiterHistory?.recruiterName || currentUserName || '—'}
            </div>
          </div>
        )}

        {/* 1. HEADER & EXPORT */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                My Performance & Requirement History
              </h1>
              <span className="px-2.5 py-0.5 bg-purple-50 text-[#6B3BF6] text-[11px] font-extrabold rounded-full border border-purple-200 flex items-center gap-1 shadow-2xs">
                <History className="w-3 h-3 text-[#6B3BF6]" />
                <span>{role === 'lead' ? 'Team Lead Module' : 'Recruiter Module'}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Personal history tracking your assigned requirements, candidate repo profiles, submissions, pipeline, and on-hold records.
            </p>
          </div>

          {role !== 'recruiter' && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleExportRecruiterCSV}
                className="px-3 py-1.5 bg-[#6B3BF6] hover:bg-[#5833E0] text-white rounded-xl text-xs font-extrabold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export History Report (CSV)</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. COMPACT INTERACTIVE RECRUITER PERSONAL KPI SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* ASSIGNED REQS */}
          <button
            onClick={() => {
              setRecruiterTab('requirements')
              setStatusFilter('All')
              setSelectedReqFilter(null)
            }}
            className={`rounded-xl p-2.5 shadow-2xs flex items-center justify-between text-left transition-all duration-200 ease-in-out cursor-pointer active:scale-98 ${
              recruiterTab === 'requirements' && !selectedReqFilter && statusFilter === 'All'
                ? 'bg-purple-100/90 border-2 border-[#6B3BF6] ring-2 ring-purple-500/30'
                : 'bg-purple-50/80 border border-purple-200/90 hover:border-purple-300 hover:shadow-xs'
            }`}
          >
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B3BF6] block">Assigned Reqs</span>
              <div className="text-lg font-black text-slate-900 tracking-tight font-mono">
                {myRecruiterHistory?.assignedRequirementsCount ?? 0} Reqs
              </div>
              <span className="text-[9px] text-[#6B3BF6] font-bold block mt-0.5">Click to view list →</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#6B3BF6] flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </button>

          {/* SOURCED PROFILES */}
          <button
            onClick={() => {
              setRecruiterTab('sourced')
              setStatusFilter('All')
              setSelectedReqFilter(null)
            }}
            className={`rounded-xl p-2.5 shadow-2xs flex items-center justify-between text-left transition-all duration-200 ease-in-out cursor-pointer active:scale-98 ${
              recruiterTab === 'sourced' && statusFilter === 'All' && !selectedReqFilter
                ? 'bg-purple-100/90 border-2 border-[#6B3BF6] ring-2 ring-purple-500/30'
                : 'bg-purple-50/80 border border-purple-200/90 hover:border-purple-300 hover:shadow-xs'
            }`}
          >
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B3BF6] block">Sourced Profiles</span>
              <div className="text-lg font-black text-slate-900 tracking-tight font-mono">
                {myRecruiterHistory?.sourcedProfilesCount ?? 0} Sourced
              </div>
              <span className="text-[9px] text-[#6B3BF6] font-bold block mt-0.5">Click to view repo →</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-[#6B3BF6] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </button>

          {/* PROFILES SUBMITTED */}
          <button
            onClick={() => {
              setRecruiterTab('sourced')
              setStatusFilter('Submitted')
              setSelectedReqFilter(null)
            }}
            className={`rounded-xl p-2.5 shadow-2xs flex items-center justify-between text-left transition-all duration-200 ease-in-out cursor-pointer active:scale-98 ${
              recruiterTab === 'sourced' && statusFilter === 'Submitted'
                ? 'bg-slate-200/90 border-2 border-slate-600 ring-2 ring-slate-400/30'
                : 'bg-slate-100/90 border border-slate-200 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">Submitted Profiles</span>
              <div className="text-lg font-black text-slate-900 tracking-tight font-mono">
                {myRecruiterHistory?.submittedProfilesCount ?? 0} Submitted
              </div>
              <span className="text-[9px] text-slate-600 font-bold block mt-0.5">Click to view list →</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
          </button>

          {/* WORKING PROFILES */}
          <button
            onClick={() => {
              setRecruiterTab('sourced')
              setStatusFilter('Working')
              setSelectedReqFilter(null)
            }}
            className={`rounded-xl p-2.5 shadow-2xs flex items-center justify-between text-left transition-all duration-200 ease-in-out cursor-pointer active:scale-98 ${
              recruiterTab === 'sourced' && statusFilter === 'Working'
                ? 'bg-slate-200/90 border-2 border-slate-600 ring-2 ring-slate-400/30'
                : 'bg-slate-100/90 border border-slate-200 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-700 block">Working Profiles</span>
              <div className="text-lg font-black text-slate-900 tracking-tight font-mono">
                {myRecruiterHistory?.workingProfilesCount ?? 0} Working
              </div>
              <span className="text-[9px] text-slate-600 font-bold block mt-0.5">Click to view current working requirements →</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
              <PlayCircle className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* 4. CONTROLS BAR: SEARCH & TAB NAVIGATION */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* SEARCH INPUT & BACK BUTTON */}
            <div className="flex items-center gap-2.5 w-full">
              {(recruiterTab === 'sourced' || selectedReqFilter || statusFilter !== 'All') && (
                <button
                  onClick={() => {
                    setRecruiterTab('requirements')
                    setSelectedReqFilter(null)
                    setStatusFilter('All')
                  }}
                  className="px-3 py-2 bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] border border-purple-200 rounded-xl text-xs font-extrabold shadow-2xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 shrink-0"
                  title="Go back to Assigned Requirements History"
                >
                  <ArrowLeft className="w-4 h-4 text-[#6B3BF6]" />
                  <span className="hidden sm:inline">Back to Reqs</span>
                </button>
              )}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={recruiterTab === 'requirements' ? "Search assigned requirements, client, ID..." : "Search sourced candidates, requirements, skills..."}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800 font-medium"
                />
              </div>
            </div>
          </div>

          {(selectedReqFilter || statusFilter !== 'All') && (
            <div className="flex flex-wrap items-center gap-2 bg-purple-50 text-[#6B3BF6] px-3 py-1.5 rounded-xl border border-purple-200 text-xs font-medium">
              {selectedReqFilter && (
                <span>Requirement Filter: <strong>{selectedReqFilter}</strong></span>
              )}
              {statusFilter !== 'All' && (
                <span>Pipeline Status: <strong className="uppercase">{statusFilter}</strong></span>
              )}
              <button
                onClick={() => {
                  setSelectedReqFilter(null)
                  setStatusFilter('All')
                }}
                className="ml-auto text-purple-700 hover:text-purple-900 font-extrabold text-xs cursor-pointer flex items-center gap-1"
              >
                Clear Filter ✕
              </button>
            </div>
          )}
        </div>

        {/* 5. TAB CONTENT TABLES WITH SMOOTH FADE ANIMATION */}
        <div key={`${recruiterTab}-${statusFilter}-${selectedReqFilter || ''}`} className="animate-in fade-in duration-300 transition-all ease-in-out">

        {/* TAB 1: ASSIGNED REQUIREMENTS TABLE */}
        {recruiterTab === 'requirements' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#6B3BF6]" />
                <h3 className="font-extrabold text-slate-900 text-sm">Assigned Requirements History</h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">Showing {filteredMyRequirements.length} assigned requirements</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">REQUIREMENT ID & TITLE</th>
                    <th className="py-3.5 px-4">CLIENT ACCOUNT</th>
                    <th className="py-3.5 px-4">ASSIGNED DATE</th>
                    <th className="py-3.5 px-4 text-center">SOURCED PROFILES</th>
                    <th className="py-3.5 px-4 text-center">SUBMISSIONS</th>
                    <th className="py-3.5 px-4 text-center">WORKING PIPELINE</th>
                    <th className="py-3.5 px-4 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredMyRequirements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-bold text-sm">
                        No assigned requirement history matches your search.
                      </td>
                    </tr>
                  ) : (
                    filteredMyRequirements.map(req => (
                      <tr key={req.id} className="hover:bg-purple-50/40 transition-colors group">
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-extrabold text-slate-900 text-xs group-hover:text-[#6B3BF6] transition-colors">
                            {req.reqName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{req.id}</div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-50 text-[#6B3BF6] border border-purple-200">
                            {req.clientName}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {req.assignedDate}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <span className="px-2 py-1 bg-purple-50 text-[#6B3BF6] border border-purple-200 rounded-lg text-xs font-bold font-mono">
                            {req.sourcedCount || 0} Sourced
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold font-mono">
                            {req.submissionsCount} Submitted
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold font-mono">
                            {req.workingCount || 0} Working
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            req.status === 'In Progress' || req.status === 'Open'
                              ? 'bg-purple-50 text-[#6B3BF6] border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SOURCED PROFILES HISTORY TABLE */}
        {recruiterTab === 'sourced' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setRecruiterTab('requirements')
                    setSelectedReqFilter(null)
                    setStatusFilter('All')
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-purple-50 text-[#6B3BF6] border border-purple-200 rounded-xl text-xs font-extrabold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  title="Go back to Assigned Requirements History"
                >
                  <ArrowLeft className="w-4 h-4 text-[#6B3BF6]" />
                  <span>Back to Requirements</span>
                </button>
                <div className="h-5 w-px bg-slate-200" />
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#6B3BF6]" />
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {statusFilter === 'Submitted'
                      ? 'Submitted Profiles Sourcing History'
                      : statusFilter === 'Working'
                      ? 'Working Pipeline Candidates History'
                      : statusFilter === 'On Hold'
                      ? 'On-Hold Candidate Records History'
                      : 'Sourced Candidate Repository History'}
                  </h3>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-medium">Showing {filteredMySourcedCandidates.length} sourced candidate records</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">CANDIDATE NAME & EXP</th>
                    <th className="py-3.5 px-4">TARGET REQUIREMENT</th>
                    <th className="py-3.5 px-4">CLIENT ACCOUNT</th>
                    <th className="py-3.5 px-4">SOURCED DATE</th>
                    <th className="py-3.5 px-4 text-center">PIPELINE STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredMySourcedCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400 font-bold text-sm">
                        No sourced candidates match the specified search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMySourcedCandidates.map(cand => (
                      <tr key={cand.id} className="hover:bg-purple-50/40 transition-colors group">
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-extrabold text-slate-900 text-xs group-hover:text-[#6B3BF6] transition-colors">
                            {cand.candidateName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Exp: {cand.experience} • {cand.contactEmail || `${cand.id.toLowerCase()}@candidate.io`}
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-900">{cand.requirementName}</div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-50 text-[#6B3BF6] border border-purple-200">
                            {cand.clientName}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {cand.sourcedDate}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-center">
                          {cand.status === 'Submitted' || cand.status === 'Sourced' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-50 text-[#6B3BF6] border border-purple-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-[#6B3BF6]" />
                              <span>{cand.status}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                              <PauseCircle className="w-3 h-3 text-slate-500" />
                              <span>{cand.status}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>

        {/* RECRUITER CANDIDATE INSPECTION MODAL */}
        {selectedCandidateDetail && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 font-sans">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6B3BF6] text-white font-bold flex items-center justify-center text-sm">
                    {selectedCandidateDetail.candidateName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">{selectedCandidateDetail.candidateName}</h3>
                    <p className="text-xs text-slate-500 font-medium">Experience: {selectedCandidateDetail.experience}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCandidateDetail(null)}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-purple-50/60 p-3.5 rounded-2xl border border-purple-100 space-y-1.5">
                  <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Requirement Details</div>
                  <div className="font-extrabold text-slate-900 text-sm">{selectedCandidateDetail.requirementName}</div>
                  <div className="text-slate-600 font-medium">Client Account: <span className="font-bold text-[#6B3BF6]">{selectedCandidateDetail.clientName}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Sourced Date</span>
                    <span className="font-mono font-bold text-slate-900 text-xs">{selectedCandidateDetail.sourcedDate}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Pipeline Status</span>
                    <span className="font-extrabold text-purple-700 text-xs">{selectedCandidateDetail.status}</span>
                  </div>
                </div>

                {selectedCandidateDetail.skills && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Matched Technical Skills</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidateDetail.skills.map((s: string) => (
                        <span key={s} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold border border-slate-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedCandidateDetail(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
                >
                  Close Detail
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =========================================================================
  // VIEW B: SUPER ADMIN / ADMIN / TEAM LEAD DASHBOARD HISTORY VIEW (TEAM MEMBERS / ALL RECRUITERS)
  // =========================================================================
  return (
    <div className="space-y-6 w-full pb-20 font-sans text-slate-800 animate-in fade-in duration-200">
      {/* TEAM LEAD SUB-TAB CONTROL BAR */}
      {role === 'lead' && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLeadViewTab('self')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                leadViewTab === 'self'
                  ? 'bg-[#6B3BF6] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>My Individual Performance & History</span>
            </button>
            <button
              type="button"
              onClick={() => setLeadViewTab('team')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                leadViewTab === 'team'
                  ? 'bg-[#6B3BF6] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Team Members Performance ({filteredRecruiters.length})</span>
            </button>
          </div>

          <div className="text-xs font-extrabold text-[#6B3BF6] bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200">
            Team Lead Module • {myRecruiterHistory?.recruiterName || currentUserName || '—'}
          </div>
        </div>
      )}

      {/* 1. HEADER & EXPORT */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {role === 'lead' ? 'Team Members Performance & Sourcing History' : 'Recruiter Performance & Sourcing History'}
            </h1>
            <span className="px-3 py-1 bg-purple-50 text-[#6B3BF6] text-xs font-extrabold rounded-full border border-purple-200 flex items-center gap-1.5 shadow-2xs">
              <History className="w-3.5 h-3.5 text-[#6B3BF6]" />
              <span>{role === 'lead' ? 'Team Lead Module' : 'Admin & Super Admin Module'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {role === 'lead'
              ? `Tracking assigned requirements, repository sourced profiles, submitted candidates, and working pipeline records for ${myRecruiterHistory?.recruiterName || currentUserName || '—'}'s team members.`
              : 'Centralized history tracking assigned requirements, repository sourced profiles, submitted candidates, active working pipeline, and on-hold candidate records per recruiter.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSuperAdminCSV}
            className="px-4 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white rounded-xl text-xs font-extrabold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{role === 'lead' ? 'Export Team History Report (CSV)' : 'Export History Report (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY KPI CARDS BANNER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* ASSIGNED REQUIREMENTS */}
        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-[#6B3BF6]">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Assigned Reqs</span>
            <Layers className="w-4 h-4 text-[#6B3BF6]" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {totals.requirements} Reqs
          </div>
          <div className="text-[11px] text-[#6B3BF6] font-semibold">
            Active requirement allocations
          </div>
        </div>

        {/* SOURCED PROFILES (CANDIDATE REPO HISTORY) */}
        <div className="bg-purple-50/80 border border-purple-200/90 rounded-2xl p-4.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-[#6B3BF6]">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Sourced Profiles</span>
            <Users className="w-4 h-4 text-[#6B3BF6]" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {totals.sourced} Sourced
          </div>
          <div className="text-[11px] text-[#6B3BF6] font-semibold">
            Added to candidate repository
          </div>
        </div>

        {/* PROFILES SUBMITTED */}
        <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-4.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Submitted Profiles</span>
            <FileText className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {totals.submitted} Submitted
          </div>
          <div className="text-[11px] text-slate-600 font-semibold">
            Pushed to client submissions
          </div>
        </div>

        {/* WORKING PROFILES */}
        <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-4.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Working Profiles</span>
            <PlayCircle className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {totals.working} Working
          </div>
          <div className="text-[11px] text-slate-600 font-semibold">
            Active in interview pipeline
          </div>
        </div>

        {/* ON HOLD PROFILES */}
        <div className="bg-slate-100/90 border border-slate-200 rounded-2xl p-4.5 space-y-1.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">On-Hold Profiles</span>
            <PauseCircle className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight font-mono">
            {totals.onHold} On Hold
          </div>
          <div className="text-[11px] text-slate-600 font-semibold">
            Temporarily paused candidates
          </div>
        </div>
      </div>

      {/* 3. SEARCH CONTROL */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search recruiter, email, client, skills..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800 font-medium"
          />
        </div>
      </div>

      {/* 4. RECRUITER HISTORY MASTER TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                <th className="py-3.5 px-4">RECRUITER NAME & TEAM LEAD</th>
                <th className="py-3.5 px-4 text-center">ASSIGNED REQS</th>
                <th className="py-3.5 px-4 text-center">SOURCED PROFILES (REPO)</th>
                <th className="py-3.5 px-4 text-center">SUBMISSIONS</th>
                <th className="py-3.5 px-4">SUBMITTED CLIENTS</th>
                <th className="py-3.5 px-4 text-center">INTERVIEWS</th>
                <th className="py-3.5 px-4 text-center">WORKING PROFILES</th>
                <th className="py-3.5 px-4 text-center">ON HOLD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedRecruiters.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-bold text-sm">
                    No recruiter history records match the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedRecruiters.map(item => {
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedRecruiterDetail(item)}
                      className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                    >
                      {/* RECRUITER NAME & TEAM LEAD */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#6B3BF6] border border-purple-200 font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                            {item.recruiterAvatar}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs group-hover:text-[#6B3BF6] transition-colors">
                              {item.recruiterName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">{item.roleTitle}</div>
                            <div className="text-[10px] text-[#6B3BF6] font-extrabold flex items-center gap-1 mt-0.5">
                              <ShieldCheck className="w-3 h-3 text-[#6B3BF6]" />
                              <span>Team Lead: {item.teamLead}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ASSIGNED REQS */}
                      <td className="py-4 px-4 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setRecruiterDetailModalTab('requirements')
                            setSelectedRecruiterDetail(item)
                          }}
                          className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] border border-purple-200 tabular-nums transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                          title={`Click to view all ${item.assignedRequirementsCount} worked requirements for ${item.recruiterName}`}
                        >
                          {item.assignedRequirementsCount} Reqs
                        </button>
                      </td>

                      {/* SOURCED PROFILES (REPO HISTORY) */}
                      <td className="py-4 px-4 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setRecruiterDetailModalTab('sourced')
                            setSelectedRecruiterDetail(item)
                          }}
                          className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] border border-purple-200 tabular-nums transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                          title={`Click to view all ${item.sourcedProfilesCount} sourced profiles for ${item.recruiterName}`}
                        >
                          {item.sourcedProfilesCount} Sourced
                        </button>
                      </td>

                      {/* SUBMISSIONS */}
                      <td className="py-4 px-4 whitespace-nowrap text-center" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => {
                            setRecruiterDetailModalTab('sourced')
                            setSelectedRecruiterDetail(item)
                          }}
                          className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#5B51D8] border border-[#C7D2FE] tabular-nums transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                          title={`Click to view all ${item.submittedProfilesCount} submissions by ${item.recruiterName}`}
                        >
                          {item.submittedProfilesCount} Submissions
                        </button>
                      </td>

                      {/* SUBMITTED CLIENTS */}
                      <td className="py-4 px-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <SubmittedClientsPillCell
                          clients={item.clientAccounts}
                          onSelectClient={(selectedClient) => {
                            setSearchQuery(selectedClient)
                          }}
                        />
                      </td>

                      {/* INTERVIEWS */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
                          {item.interviewsCount ?? Math.floor(item.submittedProfilesCount * 0.4) ?? 5} Interviews
                        </span>
                      </td>

                      {/* WORKING PROFILES */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
                          {item.workingProfilesCount} Working
                        </span>
                      </td>

                      {/* ON HOLD PROFILES */}
                      <td className="py-4 px-4 whitespace-nowrap text-center">
                        <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 tabular-nums">
                          {item.onHoldProfilesCount} On Hold
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredRecruiters.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* 5. RECRUITER FULL HISTORY INSPECTION MODAL */}
      {selectedRecruiterDetail && (() => {
        const fullReqsList = getFullAssignedRequirements(selectedRecruiterDetail)
        const fullSourcedList = getFullSourcedCandidates(selectedRecruiterDetail)

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full p-6 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 font-sans max-h-[90vh] overflow-y-auto">
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#6B3BF6] font-black text-base flex items-center justify-center shrink-0 border border-purple-200 shadow-xs">
                    {selectedRecruiterDetail.recruiterAvatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{selectedRecruiterDetail.recruiterName}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-[#6B3BF6] border border-purple-200">
                        {selectedRecruiterDetail.roleTitle}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Lead: <strong>{selectedRecruiterDetail.teamLead}</strong> • Clients: <strong>{selectedRecruiterDetail.clientAccounts.join(', ')}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRecruiterDetail(null)}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* STATS OVERVIEW CARDS (Interactive - 2 Pastel Colors) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => setRecruiterDetailModalTab('requirements')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    recruiterDetailModalTab === 'requirements'
                      ? 'bg-purple-100/90 border-purple-300 shadow-xs ring-2 ring-purple-400/30 scale-102'
                      : 'bg-purple-50/80 hover:bg-purple-100/50 border-purple-200'
                  }`}
                >
                  <span className="text-[10px] font-bold text-[#6B3BF6] uppercase block">Assigned Reqs</span>
                  <span className="text-xl font-black text-slate-900 font-mono">{selectedRecruiterDetail.assignedRequirementsCount}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecruiterDetailModalTab('sourced')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    recruiterDetailModalTab === 'sourced'
                      ? 'bg-purple-100/90 border-purple-300 shadow-xs ring-2 ring-purple-400/30 scale-102'
                      : 'bg-purple-50/80 hover:bg-purple-100/50 border-purple-200'
                  }`}
                >
                  <span className="text-[10px] font-bold text-[#6B3BF6] uppercase block">Sourced Profiles</span>
                  <span className="text-xl font-black text-slate-900 font-mono">{selectedRecruiterDetail.sourcedProfilesCount}</span>
                </button>

                <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-700 uppercase block">Submissions</span>
                  <span className="text-xl font-black text-slate-900 font-mono">{selectedRecruiterDetail.submittedProfilesCount}</span>
                </div>

                <div className="p-3 bg-slate-100/90 rounded-2xl border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-700 uppercase block">Working Pipeline</span>
                  <span className="text-xl font-black text-slate-900 font-mono">{selectedRecruiterDetail.workingProfilesCount}</span>
                </div>
              </div>

              {/* MODAL NAVIGATION TABS */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <button
                  type="button"
                  onClick={() => setRecruiterDetailModalTab('requirements')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    recruiterDetailModalTab === 'requirements'
                      ? 'bg-[#6B3BF6] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Assigned Requirements ({fullReqsList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecruiterDetailModalTab('sourced')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    recruiterDetailModalTab === 'sourced'
                      ? 'bg-[#6B3BF6] text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Sourced Profiles ({fullSourcedList.length})</span>
                </button>
              </div>

              {/* TAB CONTENT 1: ASSIGNED REQUIREMENTS TABLE */}
              {recruiterDetailModalTab === 'requirements' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    All Worked & Assigned Requirements for {selectedRecruiterDetail.recruiterName} ({fullReqsList.length} REQs)
                  </h4>
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-bold text-slate-600 uppercase">
                            <th className="py-2.5 px-3">REQ ID</th>
                            <th className="py-2.5 px-3">JOB TITLE</th>
                            <th className="py-2.5 px-3">CLIENT</th>
                            <th className="py-2.5 px-3">ASSIGNED DATE</th>
                            <th className="py-2.5 px-3 text-center">SOURCED</th>
                            <th className="py-2.5 px-3 text-center">SUBMISSIONS</th>
                            <th className="py-2.5 px-3 text-center">WORKING</th>
                            <th className="py-2.5 px-3 text-center">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 text-slate-800 font-medium">
                          {fullReqsList.map((req, idx) => (
                            <tr key={req.id || idx} className="hover:bg-white transition-colors">
                              <td className="py-2.5 px-3 font-mono font-extrabold text-[#6B3BF6]">
                                {req.id}
                              </td>
                              <td className="py-2.5 px-3 font-bold text-slate-900 max-w-xs truncate">
                                {req.reqName}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-[#6B3BF6] border border-purple-200">
                                  {req.clientName}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                                {req.assignedDate}
                              </td>
                              <td className="py-2.5 px-3 text-center font-extrabold text-[#6B3BF6]">
                                {req.sourcedCount || 0}
                              </td>
                              <td className="py-2.5 px-3 text-center font-extrabold text-slate-700">
                                {req.submissionsCount}
                              </td>
                              <td className="py-2.5 px-3 text-center font-extrabold text-slate-700">
                                {req.workingCount || 0}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  req.status === 'In Progress' || req.status === 'Open'
                                    ? 'bg-purple-50 text-[#6B3BF6] border-purple-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT 2: SOURCED PROFILES HISTORY TABLE */}
              {recruiterDetailModalTab === 'sourced' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Candidate Repository Sourcing History for {selectedRecruiterDetail.recruiterName} ({fullSourcedList.length} Profiles)
                  </h4>
                  <div className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-bold text-slate-600 uppercase">
                            <th className="py-2.5 px-3">CANDIDATE NAME</th>
                            <th className="py-2.5 px-3">REQUIREMENT & CLIENT</th>
                            <th className="py-2.5 px-3">SOURCED DATE</th>
                            <th className="py-2.5 px-3 text-center">CURRENT STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 text-slate-800 font-medium">
                          {fullSourcedList.map((cand, idx) => (
                            <tr key={cand.id || idx} className="hover:bg-white transition-colors">
                              <td className="py-2.5 px-3 font-bold text-slate-900">
                                {cand.candidateName}
                                <span className="text-[10px] text-slate-400 font-normal block">{cand.experience}</span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-900">{cand.requirementName}</div>
                                <div className="text-[10px] text-[#6B3BF6] font-bold">{cand.clientName}</div>
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                                {cand.sourcedDate}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {cand.status === 'Submitted' || cand.status === 'Sourced' ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-50 text-[#6B3BF6] border border-purple-200">
                                    {cand.status}
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                    {cand.status}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* MODAL FOOTER */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => setSelectedRecruiterDetail(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
                >
                  Close History Details
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
