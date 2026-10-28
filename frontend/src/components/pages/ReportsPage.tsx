import { getSessionUser } from '../../store/session'
import React, { useState, useMemo } from 'react'
import {
  FileText,
  Search,
  ChevronDown,
  Target,
  Users,
  BarChart3,
  Briefcase,
  UserCheck,
  Building2,
  Trophy,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
  XCircle,
  TrendingUp,
  Clock,
  Send,
  MessageSquare,
  Award,
  Calendar,
  Filter,
  Activity,
  ArrowUpRight,
  PieChart,
  User,
  ShieldCheck,
  Zap,
  Sparkles,
  AlertCircle,
  ArrowRight,
  MessageCircle,
  ArrowLeft,
  PieChart as PieIcon,
  Layers,
  Crown,
  Plus,
} from 'lucide-react'
import { Role, Requirement, Submission, Interview, Recruiter } from '../../types'
import { PaginationFooter } from '../ui/PaginationFooter'
import {
  RecruiterDetailAnalyticsPage,
  RecruiterDetailData,
} from './RecruiterDetailAnalyticsPage'
import {
  ClientDetailAnalyticsPage,
  ClientPerformanceData,
} from './ClientDetailAnalyticsPage'
import { HistoryPage } from './HistoryPage'
import { ActivityLogsPage } from './ActivityLogsPage'
import { SubmissionsPage } from './SubmissionsPage'
import { InterviewTrackingPage } from './InterviewTrackingPage'
import { RequirementDetailOverview } from './RequirementDetailOverview'


interface ClientSubmissionInfo {
  client: string
  submissions: number
}

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
          title={`Click to filter table and REQS count for ${clients[0]}`}
        >
          <Building2 className="w-3.5 h-3.5 text-[#5B51D8] shrink-0" />
          <span>{clients[0]}</span>
        </button>
      )}

      {/* Popover Dropdown Card */}
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
            {clients.map((client, idx) => {
              const isSelected = activeClient && client.toLowerCase().includes(activeClient.toLowerCase())
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setIsOpen(false)
                    if (onSelectClient) {
                      onSelectClient(client)
                    }
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-between gap-2 border cursor-pointer ${
                    isSelected
                      ? 'bg-[#EEF2FF] text-[#5B51D8] border-[#C7D2FE]'
                      : 'bg-slate-50 hover:bg-purple-50 hover:text-[#6B3BF6] text-slate-800 border-slate-100'
                  }`}
                  title={`Click to filter table and REQS count for ${client}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Building2 className="w-3.5 h-3.5 text-[#6B3BF6] shrink-0" />
                    <span className="truncate">{client}</span>
                  </div>
                  {isSelected && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-[#5B51D8] text-white">Active</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export interface RecruiterReqDashboardItem {
  id: string
  recruiterName: string
  recruiterRole?: string
  teamLead?: string // Team Lead under whom this recruiter works
  reqId: string
  jobTitle: string
  positions: number
  clientName: string
  submissionsCount: number
  timestamp: string // Latest Activity / Submission Timestamp (Date and Time)
  receivedTime: string // Time & Date requirement was received (displayed under Job Title)
  firstSubmissionTime: string // First Submission Date and Time for this req ID
  tat: string // TAT (Turnaround Time) calculated between receivedTime and firstSubmissionTime
  status: 'In Progress' | 'Target Achieved' | 'Active Sourcing' | 'Submissions Completed'
}

export function calculateTAT(receivedTime?: string, firstSubmissionTime?: string): string {
  if (!receivedTime || !firstSubmissionTime) return '—'
  try {
    const d1 = new Date(receivedTime)
    const d2 = new Date(firstSubmissionTime)
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '—'
    const diffMs = Math.max(0, d2.getTime() - d1.getTime())
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (diffHrs >= 24) {
      const days = Math.floor(diffHrs / 24)
      const remHrs = diffHrs % 24
      return `${days}d ${remHrs}h`
    }
    return `${diffHrs}h ${diffMins}m`
  } catch {
    return '—'
  }
}

const fmtStamp = (v?: string | Date | null) => {
  if (!v) return ''
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) return typeof v === 'string' ? v : ''
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}

const ownersOf = (r: Requirement) => (r.owner || '').split(',').map(n => n.trim()).filter(n => n && n !== 'Unassigned')
const isOwnedBy = (r: Requirement, name: string) => ownersOf(r).includes(name)
const subsFor = (r: Requirement, submissions: Submission[]) =>
  submissions.filter(s => s.req === r.id || s.reqCode === r.id || s.requirementId === (r as any)._id || s.reqCode === (r as any).reqCode)

/** One row per requirement and submitting recruiter: received time, first submission and TAT. */
function buildReqSubmissionDashboard(requirements: Requirement[], submissions: Submission[], recruiters: Recruiter[]): RecruiterReqDashboardItem[] {
  const rows: RecruiterReqDashboardItem[] = []
  for (const r of requirements) {
    const subs = subsFor(r, submissions)
    const byRecruiter = new Map<string, Submission[]>()
    for (const s of subs) byRecruiter.set(s.recruiter || '—', [...(byRecruiter.get(s.recruiter || '—') || []), s])
    for (const [name, list] of byRecruiter) {
      const times = list.map(s => new Date(s.submittedAt || s.createdAt || s.date)).filter(d => !Number.isNaN(d.getTime())).sort((a, b) => a.getTime() - b.getTime())
      const received = (r as any).firstDetectedAt || r.emailArrivedTime || r.createdAt
      const first = times[0]
      const positions = r.openings || 0
      rows.push({
        id: `dash-${r.id}-${name}`,
        recruiterName: name,
        recruiterRole: 'Recruiter',
        teamLead: recruiters.find(x => x.name === name)?.lead || '—',
        reqId: r.id,
        jobTitle: r.title,
        positions,
        clientName: r.client,
        submissionsCount: list.length,
        timestamp: fmtStamp(times[times.length - 1]),
        receivedTime: fmtStamp(received),
        firstSubmissionTime: fmtStamp(first),
        tat: calculateTAT(received, first ? first.toISOString() : undefined),
        status: positions > 0 && list.length >= positions ? 'Target Achieved' : 'Active Sourcing',
      })
    }
  }
  return rows
}

/** Per-recruiter performance from recorded counts and assigned requirements. */
function buildRecruiterPerformance(recruiters: Recruiter[], requirements: Requirement[]): RecruiterDetailData[] {
  return recruiters.map(r => {
    const reqs = requirements.filter(q => isOwnedBy(q, r.name))
    const worked = reqs.filter(q => (q.submissions || 0) > 0)
    const subs = r.submissions || 0
    return {
      id: r.id,
      name: r.name,
      role: 'Recruiter',
      team: r.lead ? `${r.lead}'s team` : '—',
      avatar: (r.name || '?').charAt(0).toUpperCase(),
      requirementsCount: reqs.length,
      workedReqs: worked.length,
      nonWorkedReqs: reqs.length - worked.length,
      submissionsCount: subs,
      shortlistedCount: 0,
      noSubmissionsCount: reqs.length - worked.length,
      interviewsCount: r.interviews || 0,
      hiresCount: r.placements || 0,
      conversionRate: subs ? `${(((r.placements || 0) / subs) * 100).toFixed(1)}%` : '0%',
      dailyTaskStatus: '—',
      weeklyProgress: '—',
      weeklyProgressPct: 0,
      teamLead: r.lead || '—',
      primaryClient: (r as any).primaryClient || '—',
      status: reqs.length > 0 && worked.length === 0 ? 'Critical' : 'On Track',
      requirementsList: reqs.map(q => ({
        id: q.id,
        title: q.title,
        client: q.client,
        status: ((q.submissions || 0) > 0 ? 'Worked' : 'Non-Worked') as 'Worked' | 'Non-Worked',
        submissions: q.submissions || 0,
        interviews: q.interviews || 0,
        positions: q.openings,
      })),
    }
  })
}

/** Per-client performance from the live requirements. */
function buildClientPerformance(requirements: Requirement[]): ClientPerformanceData[] {
  const byClient = new Map<string, Requirement[]>()
  for (const r of requirements) byClient.set(r.client || '—', [...(byClient.get(r.client || '—') || []), r])
  return [...byClient.entries()].map(([clientName, reqs], i) => {
    const subs = reqs.reduce((n, r) => n + (r.submissions || 0), 0)
    const assigned = reqs.filter(r => ownersOf(r).length > 0)
    const closed = reqs.filter(r => r.status === 'Closed')
    return {
      id: `cli-${i + 1}`,
      clientName,
      reqSent: reqs.length,
      reqAssigned: assigned.length,
      submissions: subs,
      subRatio: reqs.length ? Math.round((subs / reqs.length) * 10) / 10 : 0,
      openReqs: reqs.length - closed.length,
      closedReqs: closed.length,
      activeRecruiters: new Set(reqs.flatMap(ownersOf)).size,
      requirementsList: reqs.map(r => ({
        id: r.id,
        title: r.title,
        assignedRecruiter: ownersOf(r).join(', ') || 'Unassigned',
        submissions: r.submissions || 0,
        status: (r.status === 'Closed' ? 'Closed' : (r.submissions || 0) > 0 ? 'In Progress' : 'Open') as 'Open' | 'Closed' | 'In Progress',
        createdDate: r.createdAt ? new Date(r.createdAt).toISOString().slice(0, 10) : '',
      })),
    }
  }).sort((a, b) => b.reqSent - a.reqSent)
}


export interface ReportsPageProps {
  role?: Role
  initialMainTab?: 'performance' | 'history' | 'audit' | 'client_performance'
  initialReportsTab?: 'reports' | 'submissions' | 'interviews'
  requirements?: Requirement[]
  submissions?: Submission[]
  interviews?: Interview[]
  recruiters?: Recruiter[]
  onOpenSubmit?: (reqId?: string) => void
  onOpenFeedback?: (iv: Interview) => void
  onUpdateRequirements?: (requirements: Requirement[]) => void
}

interface ClientPerformanceTabContentProps {
  clientPerformanceList: ClientPerformanceData[]
  onSelectClient: (client: ClientPerformanceData) => void
  onSelectRequirement?: (req: Requirement) => void
}

function ClientPerformanceTabContent({
  clientPerformanceList,
  onSelectClient,
  onSelectRequirement,
}: ClientPerformanceTabContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const [drillDownModal, setDrillDownModal] = useState<{
    client: ClientPerformanceData
    metric: 'reqSent' | 'reqAssigned' | 'submissions' | 'openReqs' | 'closedReqs'
  } | null>(null)

  const filteredClients = useMemo(() => {
    return clientPerformanceList.filter(c =>
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [clientPerformanceList, searchQuery])

  const totalPages = Math.ceil(filteredClients.length / pageSize) || 1
  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredClients.slice(start, start + pageSize)
  }, [filteredClients, currentPage, pageSize])

  return (
    <div className="space-y-6 font-sans">
      {/* SEARCH BAR & HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#6B3BF6]" />
              <span>Client Performance Overview</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Comprehensive analytics, requirement delivery status, and submission ratios across client partners.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search client account..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800 font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">CLIENT</th>
                <th className="py-3.5 px-4 text-center">REQ SENT</th>
                <th className="py-3.5 px-4 text-center">REQ ASSIGNED</th>
                <th className="py-3.5 px-4 text-center">SUBMISSIONS</th>
                <th className="py-3.5 px-4 text-center">SUBMISSION RATIO</th>
                <th className="py-3.5 px-4 text-center">OPEN</th>
                <th className="py-3.5 px-4 text-center">CLOSED</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-bold text-sm">
                    No client accounts match your search.
                  </td>
                </tr>
              ) : (
                paginatedClients.map(client => (
                  <tr key={client.id} className="hover:bg-purple-50/40 transition-colors group">
                    {/* CLIENT */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        onClick={() => onSelectClient(client)}
                        className="flex items-center gap-2.5 text-left group-hover:text-[#6B3BF6] transition-colors cursor-pointer"
                      >
                        <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#6B3BF6] border border-purple-200 font-black flex items-center justify-center text-xs shrink-0">
                          {client.clientName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-xs group-hover:text-[#6B3BF6] transition-colors">
                            {client.clientName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {client.activeRecruiters} Active Recruiters
                          </div>
                        </div>
                      </button>
                    </td>

                    {/* REQ SENT */}
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setDrillDownModal({ client, metric: 'reqSent' })}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-[#6B3BF6] border border-slate-200 hover:border-purple-200 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                        title="Click to view all sent requirements"
                      >
                        {client.reqSent}
                      </button>
                    </td>

                    {/* REQ ASSIGNED */}
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setDrillDownModal({ client, metric: 'reqAssigned' })}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] border border-purple-200 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                        title="Click to view assigned requirements"
                      >
                        {client.reqAssigned}
                      </button>
                    </td>

                    {/* SUBMISSIONS */}
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setDrillDownModal({ client, metric: 'submissions' })}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] border border-purple-200 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer"
                        title="Click to view client candidate submissions"
                      >
                        {client.submissions}
                      </button>
                    </td>

                    {/* SUBMISSION RATIO */}
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-extrabold font-mono ${
                        client.subRatio >= 1.0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-purple-50 text-[#6B3BF6] border border-purple-200'
                      }`}>
                        {client.subRatio.toFixed(2)}
                      </span>
                    </td>

                    {/* OPEN */}
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setDrillDownModal({ client, metric: 'openReqs' })}
                        className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-50 text-[#6B3BF6] border border-purple-200 hover:bg-purple-100 transition-all cursor-pointer"
                        title="Click to view open requirements"
                      >
                        {client.openReqs} Open
                      </button>
                    </td>

                    {/* CLOSED */}
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setDrillDownModal({ client, metric: 'closedReqs' })}
                        className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
                        title="Click to view closed requirements"
                      >
                        {client.closedReqs} Closed
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredClients.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="clients"
        />
      </div>

      {/* DRILL-DOWN MODAL FOR NUMBERS */}
      {drillDownModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200/80 animate-in zoom-in-95 duration-150 font-sans text-slate-800">
            {/* MODAL HEADER */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#6B3BF6]" />
                  <span>{drillDownModal.client.clientName}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5 capitalize">
                  {drillDownModal.metric === 'reqSent'
                    ? 'All Requirements Sent'
                    : drillDownModal.metric === 'reqAssigned'
                    ? 'Assigned Requirements Breakdown'
                    : drillDownModal.metric === 'submissions'
                    ? 'Candidate Submissions Detail'
                    : drillDownModal.metric === 'openReqs'
                    ? 'Open Requirements'
                    : 'Closed Requirements'}
                </p>
              </div>

              <button
                onClick={() => setDrillDownModal(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-5 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-4">
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">REQ ID & TITLE</th>
                      <th className="py-3 px-4">ASSIGNED RECRUITER</th>
                      <th className="py-3 px-4 text-center">SUBMISSIONS</th>
                      <th className="py-3 px-4 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 font-medium text-slate-800">
                    {drillDownModal.client.requirementsList.map(req => (
                      <tr key={req.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectRequirement?.({
                                id: req.id,
                                title: req.title,
                                client: drillDownModal.client.clientName,
                                priority: 'Medium',
                                status: req.status === 'Open' ? 'Open' : 'Active',
                                submissions: req.submissions || 0,
                                interviews: 0,
                                placed: 0,
                                dueDate: new Date().toISOString().split('T')[0],
                                openings: 1,
                                skills: ['Java', 'React'],
                              })
                              setDrillDownModal(null)
                            }}
                            className="text-left cursor-pointer group"
                          >
                            <div className="font-extrabold text-slate-900 text-xs group-hover:text-[#6B3BF6] group-hover:underline">{req.title}</div>
                            <div className="text-[10px] text-[#6B3BF6] font-mono mt-0.5">{req.id}</div>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-bold">{req.assignedRecruiter}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-[#6B3BF6]">{req.submissions}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            req.status === 'Open' || req.status === 'In Progress'
                              ? 'bg-purple-50 text-[#6B3BF6] border border-purple-200'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
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

            {/* MODAL FOOTER */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  const targetClient = drillDownModal.client
                  setDrillDownModal(null)
                  onSelectClient(targetClient)
                }}
                className="px-4 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>View Full Client Analytics</span>
                <ArrowUpRight className="w-4 h-4 text-white" />
              </button>

              <button
                onClick={() => setDrillDownModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function ReportsPage({
  role = 'recruiter',
  initialMainTab,
  initialReportsTab = 'submissions',
  requirements = [],
  submissions = [],
  interviews = [],
  recruiters = [],
  onOpenSubmit,
  onOpenFeedback,
  onUpdateRequirements,
}: ReportsPageProps) {
  const [reportsTopTab, setReportsTopTab] = useState<'reports' | 'submissions' | 'interviews'>(initialReportsTab)
  const RECRUITER_REQ_SUBMISSION_DASHBOARD_DATA = useMemo(() => buildReqSubmissionDashboard(requirements, submissions, recruiters), [requirements, submissions, recruiters])
  const recruitersPerformanceList = useMemo(() => buildRecruiterPerformance(recruiters, requirements), [recruiters, requirements])
  const clientPerformanceList = useMemo(() => buildClientPerformance(requirements), [requirements])
  const [selectedReqForDetail, setSelectedReqForDetail] = useState<Requirement | null>(null)

  React.useEffect(() => {
    if (initialReportsTab) {
      setReportsTopTab(initialReportsTab)
    }
  }, [initialReportsTab])

  const [mainTab, setMainTab] = useState<'performance' | 'history' | 'audit' | 'client_performance'>(() => {
    if (role === 'recruiter' && initialMainTab === 'client_performance') return 'history'
    return initialMainTab || 'history'
  })

  const [activeReportView, setActiveReportView] = useState<'self' | 'charts' | 'team'>(() => {
    return role === 'recruiter' ? 'self' : 'team'
  })

  const [activeSubTab, setActiveSubTab] = useState<'recruiter' | 'client' | 'dashboard' | 'client_graphs'>('recruiter')
  const [dashSearchQuery, setDashSearchQuery] = useState('')
  const [dashRecruiterFilter, setDashRecruiterFilter] = useState('All Recruiters')
  const [dashClientFilter, setDashClientFilter] = useState('All Clients')
  const [dashDateFilter, setDashDateFilter] = useState<'today' | 'yesterday' | '7_days' | '1_month' | 'all'>('all')

  // Dashboard 1: Team Lead Individual Dashboard State
  const [dash1SearchQuery, setDash1SearchQuery] = useState('')
  const [dash1ClientFilter, setDash1ClientFilter] = useState('All Clients')
  const [dash1DateFilter, setDash1DateFilter] = useState<'today' | 'yesterday' | '7_days' | '1_month' | 'all'>('all')
  const [dash1Page, setDash1Page] = useState(1)

  // Dashboard 2: Overall Team Recruiters Dashboard State (Excludes Lead Individual Data)
  const [dash2SearchQuery, setDash2SearchQuery] = useState('')
  const [dash2RecruiterFilter, setDash2RecruiterFilter] = useState('All Recruiters')
  const [dash2ClientFilter, setDash2ClientFilter] = useState('All Clients')
  const [dash2DateFilter, setDash2DateFilter] = useState<'today' | 'yesterday' | '7_days' | '1_month' | 'all'>('all')
  const [dash2Page, setDash2Page] = useState(1)

  // Team Lead Module Dashboard Toggle: 'team_members' (Team Members Submissions - Mates) | 'individual' (Team Lead Individual Submissions)
  const [leadDashboardTab, setLeadDashboardTab] = useState<'individual' | 'team_members'>('team_members')

  // Active Graph sub-tab toggle for Analysis view: 'all_recruiters' | 'assigned_breakdown' | 'monthly_timeline' | 'stage_pipeline' | 'client_wise'
  const [activeGraphFilter, setActiveGraphFilter] = useState<
    'all_recruiters' | 'assigned_breakdown' | 'monthly_timeline' | 'stage_pipeline' | 'client_wise'
  >('all_recruiters')

  // Selected Recruiter Filter inside Analysis view
  const [analysisRecruiterFilter, setAnalysisRecruiterFilter] = useState<string>('All Recruiters')

  // Toggle mode for Assigned REQs Breakdown: 'individual' (Lead Individual Performance) vs 'team' (Team Members Comparison)
  const [assignedBreakdownToggle, setAssignedBreakdownToggle] = useState<'individual' | 'team'>(() => {
    return role === 'recruiter' ? 'individual' : 'team'
  })

  // Dashboard Table 10-item Pagination State
  const [dashPage, setDashPage] = useState(1)
  const [dashPageSize, setDashPageSize] = useState(5)
  const [dateRange, setDateRange] = useState('30_days')
  const [selectedDept, setSelectedDept] = useState('All Departments')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [clientFilter, setClientFilter] = useState('All Clients')

  // Recruiter personal tab filter
  const [personalTab, setPersonalTab] = useState<'worked' | 'non_worked'>('worked')

  // Pagination for recruiters performance table
  const [recruiterPage, setRecruiterPage] = useState(1)
  const [recruiterPageSize, setRecruiterPageSize] = useState(5)

  // Selected recruiter & client for detailed drill-down pages (Admin only)
  const [selectedRecruiter, setSelectedRecruiter] = useState<RecruiterDetailData | null>(null)
  const [selectedClient, setSelectedClient] = useState<ClientPerformanceData | null>(null)
  const [workedReqsModalRecruiter, setWorkedReqsModalRecruiter] = useState<RecruiterDetailData | null>(null)
  const [modalReqFilter, setModalReqFilter] = useState<'all' | 'worked' | 'non_worked'>('all')

  const fullAssignedReqs = useMemo(() => {
    if (!workedReqsModalRecruiter) return []
    const activeClientForModal = clientFilter !== 'All Clients' ? clientFilter : null
    return workedReqsModalRecruiter.requirementsList.filter(req => !activeClientForModal || req.client === activeClientForModal)
  }, [workedReqsModalRecruiter, clientFilter])

  const filteredModalReqs = useMemo(() => {
    if (modalReqFilter === 'worked') {
      return fullAssignedReqs.filter(req => req.status === 'Worked')
    }
    if (modalReqFilter === 'non_worked') {
      return fullAssignedReqs.filter(req => req.status === 'Non-Worked')
    }
    return fullAssignedReqs
  }, [fullAssignedReqs, modalReqFilter])

  // Reason note modal state for recruiter
  const [reasonModalReq, setReasonModalReq] = useState<{ id: string; title: string; note?: string } | null>(null)
  const [reasonNoteText, setReasonNoteText] = useState('')

  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Active Logged-In Recruiter Personal Profile Data (or Team Lead Individual Profile Data)
  const sessionName = getSessionUser()?.name || ''
  const ownProfile = useMemo<RecruiterDetailData>(() => {
    const mine = recruitersPerformanceList.find(r => r.name === sessionName)
    if (mine) return mine
    // A lead's own figures: the requirements assigned to the lead plus the team's recorded totals.
    const team = recruitersPerformanceList.filter(r => r.teamLead === sessionName)
    const reqs = requirements.filter(q => isOwnedBy(q, sessionName) || (q as any).assignedLead === sessionName)
    const worked = reqs.filter(q => (q.submissions || 0) > 0)
    const sum = (f: (r: RecruiterDetailData) => number) => team.reduce((n, r) => n + f(r), 0)
    return {
      id: 'me',
      name: sessionName,
      role: role === 'lead' ? 'Team Lead' : 'Recruiter',
      team: '—',
      avatar: (sessionName || '?').charAt(0).toUpperCase(),
      requirementsCount: reqs.length,
      workedReqs: worked.length,
      nonWorkedReqs: reqs.length - worked.length,
      submissionsCount: sum(r => r.submissionsCount),
      shortlistedCount: 0,
      noSubmissionsCount: reqs.length - worked.length,
      interviewsCount: sum(r => r.interviewsCount),
      hiresCount: sum(r => r.hiresCount),
      conversionRate: '—',
      dailyTaskStatus: '—',
      weeklyProgress: '—',
      weeklyProgressPct: 0,
      status: 'On Track',
      requirementsList: reqs.map(q => ({
        id: q.id,
        title: q.title,
        client: q.client,
        status: ((q.submissions || 0) > 0 ? 'Worked' : 'Non-Worked') as 'Worked' | 'Non-Worked',
        submissions: q.submissions || 0,
        interviews: q.interviews || 0,
        positions: q.openings,
      })),
    }
  }, [recruitersPerformanceList, requirements, sessionName, role])
  const [myPersonalProfile, setMyPersonalProfile] = useState<RecruiterDetailData>(ownProfile)
  React.useEffect(() => setMyPersonalProfile(ownProfile), [ownProfile])

  // Super Admin KPI Data
  const superAdminKPIs = {
    totalHires: recruiters.reduce((n, r) => n + (r.placements || 0), 0),
    totalSourced: submissions.length,
    offerAcceptanceRate: '—',
    avgTimeToHire: '—',
    overallConversion: submissions.length
      ? `${((recruiters.reduce((n, r) => n + (r.placements || 0), 0) / submissions.length) * 100).toFixed(1)}%`
      : '0%',
  }

  // Client Performance Data Matching Reference Screenshot

  // All Recruiters & Team Lead Performance List — Ordered by Team Lead first, followed by Team Members under each Lead

  const getRecruiterClientBreakdown = (r: RecruiterDetailData): ClientSubmissionInfo[] => {
    const map = new Map<string, number>()
    r.requirementsList.forEach(req => {
      if (req.client && req.client !== '—') {
        map.set(req.client, (map.get(req.client) || 0) + req.submissions)
      }
    })
    const result: ClientSubmissionInfo[] = Array.from(map.entries()).map(([client, submissions]) => ({
      client,
      submissions,
    }))
    result.sort((a, b) => b.submissions - a.submissions)
    return result
  }

  const getRecruiterSubmittedClients = (r: RecruiterDetailData): string => {
    const breakdown = getRecruiterClientBreakdown(r)
    if (breakdown.length === 0) return '—'
    return breakdown.map(b => b.client).join(', ')
  }

  const getRecruiterClientMetrics = (r: RecruiterDetailData, selectedClient: string) => {
    if (!selectedClient || selectedClient === 'All Clients') {
      return {
        reqsCount: r.requirementsCount,
        positionsCount: r.requirementsCount ? r.requirementsCount * 3 : 12,
        submissionsCount: r.submissionsCount,
        interviewsCount: r.interviewsCount || 0,
      }
    }

    const matchingReqs = r.requirementsList.filter(req => req.client && req.client.toLowerCase().includes(selectedClient.toLowerCase()))
    let reqsCount = matchingReqs.length
    let submissionsCount = matchingReqs.reduce((acc, item) => acc + (item.submissions || 0), 0)
    let interviewsCount = matchingReqs.reduce((acc, item) => acc + (item.interviews || 0), 0)

    const allSubmittedClients = getRecruiterClientBreakdown(r)
    const isPrimary = (r.primaryClient || '').toLowerCase().includes(selectedClient.toLowerCase())
    const hasSubmissionsToClient = allSubmittedClients.some(c => c.client.toLowerCase().includes(selectedClient.toLowerCase()))

    if (reqsCount === 0 && (isPrimary || hasSubmissionsToClient)) {
      if (isPrimary) {
        reqsCount = Math.max(1, Math.round(r.requirementsCount * 0.7))
        submissionsCount = Math.max(1, Math.round(r.submissionsCount * 0.75))
        interviewsCount = Math.max(1, Math.round(r.interviewsCount * 0.75))
      } else {
        reqsCount = Math.max(1, Math.round(r.requirementsCount * 0.3))
        submissionsCount = Math.max(1, Math.round(r.submissionsCount * 0.25))
        interviewsCount = Math.max(1, Math.round(r.interviewsCount * 0.25))
      }
    } else if (reqsCount > 0 && reqsCount < r.requirementsCount && isPrimary && r.requirementsCount > 5) {
      const targetShare = r.requirementsCount >= 30 ? 0.7 : 0.6
      reqsCount = Math.max(reqsCount, Math.round(r.requirementsCount * targetShare))
    }

    const positionsCount = reqsCount * 3

    return {
      reqsCount,
      positionsCount,
      submissionsCount: submissionsCount || Math.max(1, reqsCount * 2),
      interviewsCount: interviewsCount || Math.max(0, Math.floor(reqsCount * 0.5)),
    }
  }

  const allUniqueClientsList = useMemo(() => {
    const clientsSet = new Set<string>()
    recruitersPerformanceList.forEach(r => {
      r.requirementsList.forEach(req => {
        if (req.client && req.client !== '—') {
          clientsSet.add(req.client)
        }
      })
    })
    return Array.from(clientsSet).sort()
  }, [recruitersPerformanceList])

  const filteredRecruiters = useMemo(() => {
    return recruitersPerformanceList.filter(r => {
      // Team Lead role should exclusively see their own performance and their team members' performance
      if (role === 'lead') {
        const lead = (r.teamLead || '').toLowerCase()
        const name = r.name.toLowerCase()
        const isMyTeam = lead.includes('harish') || name.includes('harish')
        if (!isMyTeam) return false
      }

      if (searchQuery.trim() && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      if (statusFilter !== 'All Statuses' && r.status !== statusFilter) return false
      if (clientFilter !== 'All Clients') {
        const submittedClients = getRecruiterSubmittedClients(r)
        if (!submittedClients.toLowerCase().includes(clientFilter.toLowerCase())) return false
      }
      return true
    })
  }, [recruitersPerformanceList, searchQuery, statusFilter, clientFilter, role])

  const paginatedRecruiters = useMemo(() => {
    const start = (recruiterPage - 1) * recruiterPageSize
    return filteredRecruiters.slice(start, start + recruiterPageSize)
  }, [filteredRecruiters, recruiterPage, recruiterPageSize])

  const handleSaveReason = () => {
    if (!reasonModalReq) return
    const updatedReqs = myPersonalProfile.requirementsList.map(item =>
      item.id === reasonModalReq.id ? { ...item, reasonNote: reasonNoteText.trim() } : item
    )
    setMyPersonalProfile({ ...myPersonalProfile, requirementsList: updatedReqs })
    showToast(`Saved non-submission reason for ${reasonModalReq.id}!`)
    setReasonModalReq(null)
    setReasonNoteText('')
  }

  const isDateInFilterRange = (dateStr: string, filter: string): boolean => {
    if (filter === 'all') return true
    try {
      const parts = dateStr.split(',')
      const datePart = parts[0].trim()
      const itemDate = new Date(datePart)
      if (isNaN(itemDate.getTime())) return true

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const diffTime = today.getTime() - itemDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 3600 * 24))

      if (filter === 'today') {
        return diffDays === 0
      }
      if (filter === 'yesterday') {
        return diffDays === 1
      }
      if (filter === '7_days') {
        return diffDays >= 0 && diffDays <= 7
      }
      if (filter === '1_month') {
        return diffDays >= 0 && diffDays <= 30
      }
    } catch {
      return true
    }
    return true
  }

  interface SubmissionsDashboardConfig {
    type?: 'recruiter_self' | 'lead_self' | 'team_members_only' | 'overall_company'
    title?: string
    subtitle?: string
    leadName?: string
  }

  const renderSubmissionsDashboardCard = (config?: SubmissionsDashboardConfig) => {
    const cardType = config?.type || (role === 'recruiter' ? 'recruiter_self' : 'overall_company')
    const leadName = config?.leadName || ''

    let searchQ = dashSearchQuery
    let setSearchQ = setDashSearchQuery
    let recFilter = dashRecruiterFilter
    let setRecFilter = setDashRecruiterFilter
    let cliFilter = dashClientFilter
    let setCliFilter = setDashClientFilter
    let dateF = dashDateFilter
    let setDateF = setDashDateFilter
    let currentPage = dashPage
    let setCurrentPage = setDashPage

    if (cardType === 'lead_self') {
      searchQ = dash1SearchQuery
      setSearchQ = setDash1SearchQuery
      cliFilter = dash1ClientFilter
      setCliFilter = setDash1ClientFilter
      dateF = dash1DateFilter
      setDateF = setDash1DateFilter
      currentPage = dash1Page
      setCurrentPage = setDash1Page
    } else if (cardType === 'team_members_only') {
      searchQ = dash2SearchQuery
      setSearchQ = setDash2SearchQuery
      recFilter = dash2RecruiterFilter
      setRecFilter = setDash2RecruiterFilter
      cliFilter = dash2ClientFilter
      setCliFilter = setDash2ClientFilter
      dateF = dash2DateFilter
      setDateF = setDash2DateFilter
      currentPage = dash2Page
      setCurrentPage = setDash2Page
    }

    const filteredItems = RECRUITER_REQ_SUBMISSION_DASHBOARD_DATA.filter(item => {
      if (cardType === 'recruiter_self') {
        const myName = (myPersonalProfile.name || '').toLowerCase().trim()
        const recName = item.recruiterName.toLowerCase().trim()
        if (!recName.includes(myName) && !myName.includes(recName)) return false
      } else if (cardType === 'lead_self') {
        const lead = leadName.toLowerCase().trim()
        const recName = item.recruiterName.toLowerCase().trim()
        if (!recName.includes(lead) && !lead.includes(recName)) return false
      } else if (cardType === 'team_members_only') {
        const lead = leadName.toLowerCase().trim()
        const recName = item.recruiterName.toLowerCase().trim()
        const itemLead = (item.teamLead || '').toLowerCase().trim()

        // 1. MUST NOT be the Team Lead himself
        if (recName.includes(lead) || lead.includes(recName)) return false

        // 2. MUST belong to this particular Team Lead's team (not recruiters under other leads!)
        if (item.teamLead) {
          if (!itemLead.includes(lead) && !lead.includes(itemLead)) return false
        } else {
          const leadTeamRecruiters = recruiters.filter(r => (r.lead || '').toLowerCase().includes(lead)).map(r => r.name.toLowerCase())
          if (leadTeamRecruiters.length > 0 && !leadTeamRecruiters.some(r => recName.includes(r))) return false
        }
      }

      if (dateF !== 'all') {
        const matchLatest = isDateInFilterRange(item.timestamp, dateF)
        const matchFirst = isDateInFilterRange(item.firstSubmissionTime, dateF)
        if (!matchLatest && !matchFirst) return false
      }

      if (searchQ.trim()) {
        const q = searchQ.toLowerCase().trim()
        const m1 = item.recruiterName.toLowerCase().includes(q)
        const m2 = item.reqId.toLowerCase().includes(q)
        const m3 = item.jobTitle.toLowerCase().includes(q)
        const m4 = item.clientName.toLowerCase().includes(q)
        if (!m1 && !m2 && !m3 && !m4) return false
      }

      if (cardType !== 'recruiter_self' && cardType !== 'lead_self' && recFilter !== 'All Recruiters' && item.recruiterName !== recFilter) {
        return false
      }
      if (cliFilter !== 'All Clients' && item.clientName !== cliFilter) return false

      return true
    })

    const totalPages = Math.ceil(filteredItems.length / dashPageSize) || 1
    const startIdx = (currentPage - 1) * dashPageSize
    const paginatedItems = filteredItems.slice(startIdx, startIdx + dashPageSize)

    const handleExportCSV = () => {
      const headers = [
        'Recruiter Name',
        'Requirement ID',
        'Job Title',
        'Requirement Received Date & Time',
        'Number of Positions',
        'Client Name',
        'Submissions Done',
        'First Submission Date & Time',
        'TAT (Turnaround Time)',
        'Last Activity Timestamp',
        'Status',
      ]

      const rows = filteredItems.map(item => [
        `"${item.recruiterName}"`,
        `"${item.reqId}"`,
        `"${item.jobTitle}"`,
        `"${item.receivedTime || ''}"`,
        item.positions,
        `"${item.clientName}"`,
        item.submissionsCount,
        `"${item.firstSubmissionTime}"`,
        `"${item.tat || calculateTAT(item.receivedTime, item.firstSubmissionTime)}"`,
        `"${item.timestamp}"`,
        `"${item.status}"`,
      ])

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement('a')
      const exportName =
        cardType === 'lead_self'
          ? `Team_Lead_${leadName.replace(/\s+/g, '_')}_Individual_Submissions`
          : cardType === 'team_members_only'
          ? 'Team_Recruiters_Submissions_Excluding_Lead'
          : cardType === 'recruiter_self'
          ? 'Recruiter_Individual_Submissions'
          : 'Requirement_Submissions_Dashboard'

      link.setAttribute('href', encodedUri)
      link.setAttribute('download', `${exportName}_${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast(`Exported ${config?.title || 'Dashboard'} to CSV!`)
    }

    const defaultTitle =
      cardType === 'lead_self'
        ? 'Team Lead Individual Submissions Dashboard'
        : cardType === 'team_members_only'
        ? 'Team Recruiters Overall Submissions Dashboard'
        : cardType === 'recruiter_self'
        ? 'Requirement Submissions Dashboard'
        : 'Requirement Submissions Dashboard'

    const defaultSubtitle =
      cardType === 'lead_self'
        ? `Showing requirement submissions, received date/time, first submission date/time, and TAT turnaround SLA for ${leadName} only.`
        : cardType === 'team_members_only'
        ? `Requirement-wise breakdown of recruiter submissions, requirement received timestamp, first submission date/time, and calculated TAT for team members under ${leadName} (Excludes Lead Individual Data & Other Teams).`
        : cardType === 'recruiter_self'
        ? `Requirement submissions, received date/time, first submission date/time, and TAT turnaround SLA for ${myPersonalProfile.name}.`
        : 'Requirement-wise breakdown of recruiter submissions, requirement received timestamp, first submission date/time, and calculated TAT.'

    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-5 font-sans animate-in fade-in duration-200">
        {/* HEADER & ACTION BUTTONS */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-purple-100 text-[#6B3BF6] rounded-xl font-bold">
                <PieIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2 flex-wrap">
                  <span>{config?.title || defaultTitle}</span>
                  <span className="px-3 py-1 rounded-xl text-xs font-mono font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Avg TAT: 3h 25m</span>
                  </span>

                  {cardType === 'lead_self' ? (
                    <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-[#6B3BF6] text-white shadow-2xs flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-white" />
                      <span>Team Lead Individual: {leadName}</span>
                    </span>
                  ) : cardType === 'team_members_only' ? (
                    <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-blue-700" />
                      <span>Team Members under {leadName} (Excludes Lead & Other Teams)</span>
                    </span>
                  ) : cardType === 'recruiter_self' ? (
                    <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-[#6B3BF6] text-white shadow-2xs flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-white" />
                      <span>Recruiter: {myPersonalProfile.name}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-[#6B3BF6] border border-purple-200">
                      Company Overview
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {config?.subtitle || defaultSubtitle}
                </p>
              </div>
            </div>
          </div>

          {role !== 'recruiter' && role !== 'lead' && role !== 'admin' && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* SEARCH AND FILTERS */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={cardType === 'recruiter_self' || cardType === 'lead_self' ? "Search req ID, job title, client..." : "Search recruiter, req ID, job title, client..."}
              value={searchQ}
              onChange={e => {
                setSearchQ(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6]"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
            {/* DATE RANGE FILTER DROPDOWN */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-[#6B3BF6]" />
              <select
                value={dateF}
                onChange={e => {
                  setDateF(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="7_days">Last 7 Days</option>
                <option value="1_month">One Month</option>
              </select>
            </div>

            {/* Recruiter filter: Only shown when multiple recruiters are in the table */}
            {(cardType === 'team_members_only' || cardType === 'overall_company') && (
              <select
                value={recFilter}
                onChange={e => {
                  setRecFilter(e.target.value)
                  setCurrentPage(1)
                }}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
              >
                <option value="All Recruiters">All Recruiters</option>
                {Array.from(
                  new Set(
                    RECRUITER_REQ_SUBMISSION_DASHBOARD_DATA
                      .filter(i => {
                        if (cardType === 'team_members_only') {
                          const lead = leadName.toLowerCase().trim()
                          const recName = i.recruiterName.toLowerCase().trim()
                          const itemLead = (i.teamLead || '').toLowerCase().trim()
                          if (recName.includes(lead) || lead.includes(recName)) return false
                          if (i.teamLead) {
                            return itemLead.includes(lead) || lead.includes(itemLead)
                          }
                          const leadTeamRecruiters = recruiters.filter(r => (r.lead || '').toLowerCase().includes(lead)).map(r => r.name.toLowerCase())
                          return leadTeamRecruiters.length === 0 || leadTeamRecruiters.some(r => recName.includes(r))
                        }
                        return true
                      })
                      .map(i => i.recruiterName)
                  )
                ).map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}

            <select
              value={cliFilter}
              onChange={e => {
                setCliFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All Clients">All Clients</option>
              {Array.from(
                new Set(
                  RECRUITER_REQ_SUBMISSION_DASHBOARD_DATA
                    .filter(i => {
                      if (cardType === 'lead_self') {
                        const lead = leadName.toLowerCase().trim()
                        const recName = i.recruiterName.toLowerCase().trim()
                        return recName.includes(lead) || lead.includes(recName)
                      }
                      if (cardType === 'team_members_only') {
                        const lead = leadName.toLowerCase().trim()
                        const recName = i.recruiterName.toLowerCase().trim()
                        const itemLead = (i.teamLead || '').toLowerCase().trim()
                        if (recName.includes(lead) || lead.includes(recName)) return false
                        if (i.teamLead) {
                          return itemLead.includes(lead) || lead.includes(itemLead)
                        }
                        const leadTeamRecruiters = recruiters.filter(r => (r.lead || '').toLowerCase().includes(lead)).map(r => r.name.toLowerCase())
                        return leadTeamRecruiters.length === 0 || leadTeamRecruiters.some(r => recName.includes(r))
                      }
                      if (cardType === 'recruiter_self') {
                        const myName = (myPersonalProfile.name || '').toLowerCase().trim()
                        const recName = i.recruiterName.toLowerCase().trim()
                        return recName.includes(myName) || myName.includes(recName)
                      }
                      return true
                    })
                    .map(i => i.clientName)
                )
              ).map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* DASHBOARD TABLE */}
        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {cardType !== 'recruiter_self' && cardType !== 'lead_self' && <th className="py-3.5 px-4">RECRUITER NAME</th>}
                <th className="py-3.5 px-4">REQUIREMENT ID</th>
                <th className="py-3.5 px-4">JOB TITLE & RECEIVED DATE/TIME</th>
                <th className="py-3.5 px-4 text-center">POSITIONS</th>
                <th className="py-3.5 px-4">CLIENT NAME</th>
                <th className="py-3.5 px-4 text-center">SUBMISSIONS DONE</th>
                <th className="py-3.5 px-4">FIRST SUBMISSION DATE & TIME</th>
                <th className="py-3.5 px-4 text-center">TAT (TURNAROUND TIME)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={cardType === 'recruiter_self' || cardType === 'lead_self' ? 7 : 8} className="py-8 text-center text-slate-400 text-xs italic">
                    No requirement submissions found matching search filter.
                  </td>
                </tr>
              ) : (
                paginatedItems.map(item => (
                  <tr key={item.id} className="hover:bg-purple-50/40 transition-colors">
                    {/* Recruiter Name (Only when multiple recruiters exist) */}
                    {cardType !== 'recruiter_self' && cardType !== 'lead_self' && (
                      <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-[#6B3BF6] font-bold text-[10px] flex items-center justify-center shrink-0 border border-purple-200">
                            {item.recruiterName.charAt(0)}
                          </div>
                          <span>{item.recruiterName}</span>
                        </div>
                      </td>
                    )}

                    {/* Requirement ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {item.reqId}
                    </td>

                    {/* Job Title & Requirement Received Date/Time */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-bold text-slate-900 leading-snug">{item.jobTitle}</div>
                      <div className="text-[11px] text-slate-500 font-mono font-normal mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Received: <strong className="text-slate-700 font-semibold">{item.receivedTime}</strong></span>
                      </div>
                    </td>

                    {/* Positions */}
                    <td className="py-3.5 px-4 text-center font-extrabold text-slate-800">
                      <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-mono">
                        {item.positions}
                      </span>
                    </td>

                    {/* Client Name */}
                    <td className="py-3.5 px-4 font-bold text-purple-700 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-800 border border-purple-200 rounded-xl text-xs">
                        {item.clientName}
                      </span>
                    </td>

                    {/* Submissions Done */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl font-extrabold text-xs font-mono">
                        {item.submissionsCount}
                      </span>
                    </td>

                    {/* First Submission Date & Time */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-emerald-800 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-bold">{item.firstSubmissionTime}</span>
                      </div>
                    </td>

                    {/* TAT */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-extrabold bg-[#EEF2FF] text-[#5B51D8] border border-[#C7D2FE] shadow-2xs">
                        ⚡ {item.tat || calculateTAT(item.receivedTime, item.firstSubmissionTime)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredItems.length}
          pageSize={dashPageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setDashPageSize}
        />
      </div>
    )
  }

  // Drill-down views (Admin only)
  if (role !== 'recruiter' && selectedRecruiter) {
    return (
      <RecruiterDetailAnalyticsPage
        recruiter={selectedRecruiter}
        onBack={() => {
          setSelectedRecruiter(null)
          setActiveReportView('team')
        }}
      />
    )
  }

  if (role !== 'recruiter' && selectedClient) {
    return (
      <ClientDetailAnalyticsPage
        client={selectedClient}
        requirements={requirements}
        onBack={() => {
          setSelectedClient(null)
          setActiveReportView('team')
        }}
      />
    )
  }

  if (selectedReqForDetail) {
    return (
      <RequirementDetailOverview
        requirement={selectedReqForDetail}
        role={role}
        onBack={() => setSelectedReqForDetail(null)}
        onRequirementUpdated={updatedReq => {
          setSelectedReqForDetail(updatedReq)
          if (onUpdateRequirements && requirements.length > 0) {
            const updated = requirements.map(r => (r.id === updatedReq.id ? updatedReq : r))
            onUpdateRequirements(updated)
          }
        }}
      />
    )
  }

  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800">
      {/* PRIMARY CONSOLIDATED TOP NAVIGATION TAB BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-[#6B3BF6]" />
              <span>Reports Page</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Unified hub for Reports & Analytics, Total Submissions, and Interview Tracking.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setReportsTopTab('submissions')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
              reportsTopTab === 'submissions'
                ? 'bg-[#6B3BF6] text-white shadow-md shadow-purple-500/20 scale-[1.02]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Total Submissions</span>
          </button>

          <button
            type="button"
            onClick={() => setReportsTopTab('interviews')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
              reportsTopTab === 'interviews'
                ? 'bg-[#6B3BF6] text-white shadow-md shadow-purple-500/20 scale-[1.02]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Interview Tracking</span>
          </button>

          <button
            type="button"
            onClick={() => setReportsTopTab('reports')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
              reportsTopTab === 'reports'
                ? 'bg-[#6B3BF6] text-white shadow-md shadow-purple-500/20 scale-[1.02]'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Reports & Analytics</span>
          </button>
        </div>
      </div>

      {reportsTopTab === 'submissions' ? (
        <SubmissionsPage
          role={role}
          submissions={submissions}
          requirements={requirements}
          onOpenSubmitCandidate={onOpenSubmit ? (reqId?: string) => onOpenSubmit(reqId) : undefined}
          onUpdateRequirements={onUpdateRequirements}
        />
      ) : reportsTopTab === 'interviews' ? (
        <InterviewTrackingPage
          role={role}
          interviews={interviews}
          onOpenFeedbackModal={onOpenFeedback}
          requirements={requirements}
          onUpdateRequirements={onUpdateRequirements}
        />
      ) : (
        <>
          {/* CONSOLIDATED REPORTS SUB TABS */}
          {role !== 'recruiter' && (
            <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 w-fit">
              <button
                type="button"
                onClick={() => setMainTab('history')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  mainTab === 'history' || mainTab === 'performance'
                    ? 'bg-white text-[#6B3BF6] shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-[#6B3BF6]" />
                <span>Recruiter Performance & History</span>
              </button>

              <button
                type="button"
                onClick={() => setMainTab('client_performance')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  mainTab === 'client_performance'
                    ? 'bg-white text-[#6B3BF6] shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Building2 className="w-4 h-4 text-[#6B3BF6]" />
                <span>Client Performance</span>
              </button>

              <button
                type="button"
                onClick={() => setMainTab('audit')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  mainTab === 'audit'
                    ? 'bg-white text-[#6B3BF6] shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#6B3BF6]" />
                <span>Entry of Audit Logs</span>
              </button>
            </div>
          )}

          {mainTab === 'client_performance' && role !== 'recruiter' ? (
            <ClientPerformanceTabContent
              clientPerformanceList={clientPerformanceList}
              onSelectClient={cli => setSelectedClient(cli)}
              onSelectRequirement={target => setSelectedReqForDetail(target)}
            />
          ) : mainTab === 'audit' && role !== 'recruiter' ? (
            <ActivityLogsPage role={role} />
          ) : (
            <HistoryPage role={role} recruiters={recruiters} requirements={requirements} submissions={submissions} />
          )}
        </>
      )}

      {/* REASON MODAL FOR RECRUITER */}
      {reasonModalReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#6B3BF6]" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Non-Submission Reason Note ({reasonModalReq.id})
                </h3>
              </div>
              <button
                onClick={() => setReasonModalReq(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Provide or select the reason why no submissions have been made yet for requirement <strong className="text-slate-800">{reasonModalReq.title}</strong>:
            </p>

            {/* Quick Preset Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Quick Select Common Reasons:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Client JD requirements unclear / pending clarification',
                  'Candidate salary expectation exceeds client budget',
                  'Location constraint / No local candidates available',
                  'Requirement put on hold by hiring manager',
                  'Niche skill set requiring extended sourcing timeline',
                ].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReasonNoteText(preset)}
                    className="text-[10px] font-semibold bg-slate-100 hover:bg-purple-50 hover:text-[#6B3BF6] hover:border-purple-200 border border-slate-200 px-2.5 py-1 rounded-xl text-slate-700 transition-all cursor-pointer text-left"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                Custom Reason Note:
              </label>
              <textarea
                rows={3}
                value={reasonNoteText}
                onChange={e => setReasonNoteText(e.target.value)}
                placeholder="Type your custom non-submission reason or details here..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setReasonModalReq(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReason}
                className="px-4 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Save Reason Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WORKED REQUIREMENTS MODAL FOR RECRUITER */}
      {workedReqsModalRecruiter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* MODAL HEADER */}
            <div className="p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 text-white font-extrabold flex items-center justify-center text-lg border border-white/20 backdrop-blur-md">
                  {workedReqsModalRecruiter.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-white tracking-tight">
                      {workedReqsModalRecruiter.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                      {workedReqsModalRecruiter.role}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/80 mt-0.5">
                    {clientFilter !== 'All Clients'
                      ? `Assigned Requirements for ${clientFilter} (${fullAssignedReqs.length} REQs Assigned)`
                      : `Assigned Requirements List (${fullAssignedReqs.length} Total REQs Assigned)`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWorkedReqsModalRecruiter(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MODAL CONTENT TABLE */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-[#6B3BF6]" />
                  <span>Requirements Assigned ({fullAssignedReqs.length})</span>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setModalReqFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      modalReqFilter === 'all'
                        ? 'bg-white text-[#6B3BF6] shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Assigned ({fullAssignedReqs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalReqFilter('worked')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      modalReqFilter === 'worked'
                        ? 'bg-white text-emerald-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Worked ({fullAssignedReqs.filter(q => q.status === 'Worked').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalReqFilter('non_worked')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      modalReqFilter === 'non_worked'
                        ? 'bg-white text-amber-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Non-Worked ({fullAssignedReqs.filter(q => q.status === 'Non-Worked').length})
                  </button>
                </div>
              </div>

              {filteredModalReqs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No matching requirements found for this filter.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-4">REQ ID</th>
                        <th className="py-3 px-4">JOB TITLE</th>
                        <th className="py-3 px-4">SUBMITTED CLIENTS</th>
                        <th className="py-3 px-4 text-center">POSITIONS</th>
                        <th className="py-3 px-4 text-center">SUBMISSIONS</th>
                        <th className="py-3 px-4 text-center">INTERVIEWS</th>
                        <th className="py-3 px-4 text-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                      {filteredModalReqs.map((req, idx) => {
                        const clientList: string[] = req.client
                          ? [req.client]
                          : workedReqsModalRecruiter.primaryClient
                          ? [workedReqsModalRecruiter.primaryClient]
                          : ['—']
                        return (
                          <tr key={req.id || idx} className="hover:bg-purple-50/30 transition-colors">
                            <td className="py-3 px-4 font-mono font-extrabold text-[#6B3BF6]">
                              <button
                                type="button"
                                onClick={() => {
                                  const found = requirements.find(r => r.id === req.id || r._id === req.id || r.title.toLowerCase() === req.title.toLowerCase())
                                  const targetReq: Requirement = found || {
                                    id: req.id,
                                    title: req.title,
                                    client: req.client || clientList[0] || 'Client',
                                    priority: 'Medium',
                                    status: req.status === 'Non-Worked' ? 'Open' : 'Active',
                                    submissions: req.submissions || 0,
                                    interviews: req.interviews || 0,
                                    placed: 0,
                                    dueDate: new Date().toISOString().split('T')[0],
                                    openings: req.positions || 1,
                                    skills: ['JavaScript', 'React'],
                                  }
                                  setSelectedReqForDetail(targetReq)
                                  setWorkedReqsModalRecruiter(null)
                                }}
                                className="font-mono font-extrabold text-[#6B3BF6] hover:underline cursor-pointer text-left"
                              >
                                {req.id}
                              </button>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                              <button
                                type="button"
                                onClick={() => {
                                  const found = requirements.find(r => r.id === req.id || r._id === req.id || r.title.toLowerCase() === req.title.toLowerCase())
                                  const targetReq: Requirement = found || {
                                    id: req.id,
                                    title: req.title,
                                    client: req.client || clientList[0] || 'Client',
                                    priority: 'Medium',
                                    status: req.status === 'Non-Worked' ? 'Open' : 'Active',
                                    submissions: req.submissions || 0,
                                    interviews: req.interviews || 0,
                                    placed: 0,
                                    dueDate: new Date().toISOString().split('T')[0],
                                    openings: req.positions || 1,
                                    skills: ['JavaScript', 'React'],
                                  }
                                  setSelectedReqForDetail(targetReq)
                                  setWorkedReqsModalRecruiter(null)
                                }}
                                className="font-bold text-slate-900 hover:text-[#6B3BF6] hover:underline cursor-pointer text-left max-w-xs truncate block"
                              >
                                {req.title}
                              </button>
                            </td>
                            <td className="py-3 px-4">
                              <SubmittedClientsPillCell clients={clientList} />
                            </td>
                            <td className="py-3 px-4 text-center font-extrabold text-indigo-700">
                              {req.positions || 3}
                            </td>
                            <td className="py-3 px-4 text-center font-extrabold text-purple-700">
                              {req.submissions}
                            </td>
                            <td className="py-3 px-4 text-center font-extrabold text-slate-700">
                              {req.interviews || 0}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                req.status === 'Worked'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                  : req.status === 'Non-Worked'
                                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                                  : 'bg-blue-100 text-blue-800 border-blue-200'
                              }`}>
                                {req.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500 font-medium">
                Recruiter Pod: <strong className="text-slate-800">{workedReqsModalRecruiter.team}</strong> • Lead: <strong className="text-slate-800">{workedReqsModalRecruiter.teamLead}</strong>
              </div>
              <button
                type="button"
                onClick={() => setWorkedReqsModalRecruiter(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                Close
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
