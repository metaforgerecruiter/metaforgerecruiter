import React, { useEffect, useMemo, useState } from 'react'
import { Interview, Requirement, Submission, ActivityLogItem, Candidate, Role } from '../../types'
import { RequirementDetailOverview } from '../pages/RequirementDetailOverview'
import { workspaceService, usersService } from '../../services/workspace.service'
import { getSessionUser } from '../../store/session'
import { CandidateRepositoryPage } from '../pages/CandidateRepositoryPage'
import { SubmissionsPage } from '../pages/SubmissionsPage'
import { InterviewTrackingPage } from '../pages/InterviewTrackingPage'
import { RequirementsPage } from '../pages/RequirementsPage'
import { RevokeRequirementModal } from '../modals/RevokeRequirementModal'
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
  Calendar,
} from 'lucide-react'
import { PaginationFooter } from '../ui/PaginationFooter'
import { PageHeader } from '../layout/PageHeader'
import { useScrollReveal, useStaggerEnter } from '../../lib/animations'

interface Props {
  candidates?: Candidate[]
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
  onUpdateRequirements?: (next: Requirement[]) => void
}

interface ActiveReqRow {
  type: string
  id: string
  name: string
  client: string
  status: string
  timestamp: string
}

export function RecruiterDashboard({
  candidates,
  submissions,
  interviews,
  requirements,
  activityLogs,
  currentUserName: propUserName,
  currentUserEmail: propUserEmail,
  onOpenSubmitCandidate,
  onOpenCandidateRepo,
  onOpenFeedbackModal,
  onOpenCandidateDetail,
  onAddActivityLog,
  onUpdateRequirements,
}: Props) {
  const session = getSessionUser()
  const currentUserName = propUserName || session?.name || 'Recruiter'
  const currentUserEmail = propUserEmail || session?.email || ''
  const sessionRole = String(session?.role || 'recruiter').toLowerCase()
  const canDirectRevoke = ['superadmin', 'admin', 'devteam', 'lead'].includes(sessionRole)
  const [recentActivityPageSize, setRecentActivityPageSize] = React.useState<number>(5)
  const [dbUsers, setDbUsers] = useState<any[]>([])
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  useEffect(() => {
    usersService.list().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.items || data?.data || []
      setDbUsers(list)
    }).catch(() => {})
  }, [])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    window.setTimeout(() => setToastMsg(null), 3500)
  }

  // Filter activity logs specifically performed by or relevant to the logged-in user/recruiter
  const userActivityLogs = React.useMemo(() => {
    const targetName = (currentUserName || session?.name || 'Recruiter').toLowerCase()
    const targetEmail = (currentUserEmail || session?.email || '').toLowerCase()

    // 1. Explicit activity logs matching user name or email
    const explicitLogs = (activityLogs || []).filter(log => {
      const matchName = log.userName && log.userName.toLowerCase().includes(targetName)
      const matchEmail = targetEmail && log.userEmail && log.userEmail.toLowerCase().includes(targetEmail)
      return matchName || matchEmail
    })

    // 2. Synthesize log items from candidate submissions performed by this recruiter
    const submissionLogs: ActivityLogItem[] = submissions
      .filter(s => !targetName || s.recruiter.toLowerCase().includes(targetName))
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
      .filter(i => !targetName || (i.recruiter && i.recruiter.toLowerCase().includes(targetName)))
      .map(i => ({
        id: `iv-activity-${i.id}`,
        timestamp: i.date || 'Recently',
        userName: i.recruiter || currentUserName || 'Recruiter',
        userEmail: currentUserEmail || '',
        userRole: 'recruiter',
        userAvatar: (i.recruiter || currentUserName || 'R').charAt(0).toUpperCase(),
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
  const isLeadOrAdmin = ['lead', 'admin', 'superadmin', 'devteam'].includes(sessionRole)
  const [isAssignMyselfChecked, setIsAssignMyselfChecked] = useState(!isLeadOrAdmin)
  const [selectedRecruiterNames, setSelectedRecruiterNames] = useState<Set<string>>(new Set())
  const [recruiterSearchQuery, setRecruiterSearchQuery] = useState('')

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('Assigned')
  const [reqDateFilter, setReqDateFilter] = useState('All')
  const [reqCustomStartDate, setReqCustomStartDate] = useState('')
  const [reqCustomEndDate, setReqCustomEndDate] = useState('')
  const [selectedReqIds, setSelectedReqIds] = useState<Set<string>>(new Set())
  const [recentSubmissionsFilter, setRecentSubmissionsFilter] = useState('All Status')

  // Pagination state for active requirements table
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  // Inline View state for KPI cards (Assigned Requirements, Total Submissions, Interviews Handled, Onboarding)
  const [inlineView, setInlineView] = useState<'requirements' | 'submissions' | 'interviews' | 'onboarding' | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mrap_recruiter_inline_view')
        if (saved === 'requirements' || saved === 'submissions' || saved === 'interviews' || saved === 'onboarding') {
          return saved as any
        }
      } catch {}
    }
    return null
  })

  const handleSetInlineView = (view: 'requirements' | 'submissions' | 'interviews' | 'onboarding' | null) => {
    setInlineView(view)
    if (typeof window !== 'undefined') {
      try {
        if (view) {
          localStorage.setItem('mrap_recruiter_inline_view', view)
        } else {
          localStorage.removeItem('mrap_recruiter_inline_view')
        }
      } catch {}
    }
  }

  // Inline Candidate Repository & Submission workflow state (kept strictly inside My Work page)
  const [inlineReqId, setInlineReqId] = useState<string | null>(null)

  // Hooks must stay above any early returns (selectedReqForDetail / inlineView).
  const activeReqsRef = useScrollReveal<HTMLElement>({ y: 20, duration: 0.6 })
  const kpiGridRef = useStaggerEnter<HTMLDivElement>({ y: 16, duration: 0.4, stagger: 0.07 })

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
    // The real requirement; when it is not loaded, only what the row itself shows.
    const found =
      requirements.find(r => r.id === reqId) ||
      ({ id: reqId, client: reqClient || '', title: reqName || '' } as unknown as Requirement)
    setSelectedReqForDetail(found)
  }

  const recruiterList = useMemo(() => {
    return dbUsers
      .filter(u => u && !u.deletedAt && u.active !== false)
      .filter(u => String(u.role || '').toLowerCase() === 'recruiter')
      .filter(u => u.name && (u.id || u._id))
      .map(u => ({
        id: String(u.id || u._id),
        name: String(u.name),
        email: u.email || '',
      }))
      .filter(r => r.name.toLowerCase() !== (currentUserName || '').toLowerCase())
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [dbUsers, currentUserName])

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

  const handleConfirmReassign = async () => {
    const activeSession = getSessionUser()
    const activeName = currentUserName || activeSession?.name || 'Recruiter'
    if (totalSelectedRecruitersCount === 0 || !selectedReqForDetail) return

    const selectedOthers = recruiterList.filter(r => selectedRecruiterNames.has(r.name))
    const recruiterIds: string[] = []
    const ownerNames: string[] = []

    if (isAssignMyselfChecked) {
      recruiterIds.push(activeSession?.id || activeName)
      ownerNames.push(activeName)
    }
    for (const rec of selectedOthers) {
      recruiterIds.push(rec.id)
      ownerNames.push(rec.name)
    }

    const reqKey = selectedReqForDetail._id || selectedReqForDetail.id
    try {
      await workspaceService.assignRequirement(reqKey, { recruiterIds })
    } catch (err: any) {
      console.error('Failed to reassign requirement:', err)
      showToast(err?.message || 'Failed to reassign requirement')
      return
    }

    const ownersText = ownerNames.join(', ')
    const nowIso = new Date().toISOString()
    const updatedReq: Requirement = {
      ...selectedReqForDetail,
      owner: ownersText,
      assignmentStatus: 'Assigned',
      status: 'Assigned',
      submissions: selectedReqForDetail.submissions || 0,
      updatedAt: nowIso,
    }

    const nextRequirements = requirements.map(r =>
      r.id === selectedReqForDetail.id || r._id === selectedReqForDetail._id ? updatedReq : r
    )
    onUpdateRequirements?.(nextRequirements)

    const stillMine = isAssignMyselfChecked
    if (stillMine) {
      setSelectedReqForDetail(updatedReq)
    } else {
      setSelectedReqForDetail(null)
    }

    showToast(
      stillMine
        ? `Requirement reassigned to ${ownersText}.`
        : `Requirement reassigned to ${ownersText}. It left your My Work list.`
    )

    setIsAssignModalOpen(false)
    setSelectedRecruiterNames(new Set())
    setIsAssignMyselfChecked(!isLeadOrAdmin)
    setRecruiterSearchQuery('')
  }

  const handleConfirmRevoke = async (reqId: string, reason: string) => {
    const target = selectedReqForDetail?.id === reqId || selectedReqForDetail?._id === reqId
      ? selectedReqForDetail
      : requirements.find(r => r.id === reqId || r._id === reqId)
    if (!target) return

    const reqKey = target._id || target.id
    let saved: any
    try {
      saved = await workspaceService.revokeRequirement(reqKey, { reason })
    } catch (err: any) {
      console.error('Failed to revoke requirement:', err)
      showToast(err?.message || 'Failed to submit revoke request')
      return
    }

    // Lead/Admin revokes detach the recruiters immediately; a recruiter only files a request.
    const isDirectRevoke = canDirectRevoke || saved?.assignmentStatus === 'Unassigned'
    const updatedReq: Requirement = isDirectRevoke
      ? {
          ...target,
          owner: 'Unassigned',
          assignmentStatus: 'Unassigned',
          status: 'Open',
          revokeRequested: false,
          revokeReason: reason,
          revokeRequestedBy: undefined,
          revokeRequestedAt: undefined,
          updatedAt: new Date().toISOString(),
        }
      : {
          ...target,
          status: 'On Hold',
          revokeRequested: true,
          revokeReason: reason,
          revokeRequestedBy: currentUserName,
          revokeRequestedAt: 'Just now',
        }
    const nextRequirements = requirements.map(r =>
      r.id === target.id || r._id === target._id ? updatedReq : r
    )
    onUpdateRequirements?.(nextRequirements)
    setIsRevokeModalOpen(false)
    if (isDirectRevoke) {
      // No longer assigned to anyone, so it leaves My Workspace.
      setSelectedReqForDetail(null)
      showToast(`Requirement ${target.id} revoked and set to Unassigned. It left your My Workspace list.`)
    } else {
      setSelectedReqForDetail(updatedReq)
      showToast('Revoke request submitted. Requirement is On Hold pending approval.')
    }

    onAddActivityLog?.({
      id: `LOG-${Date.now()}`,
      timestamp: 'Just now',
      userName: currentUserName,
      userEmail: currentUserEmail || '',
      userRole: (sessionRole || 'recruiter') as any,
      userAvatar: currentUserName.charAt(0),
      action: isDirectRevoke
        ? `Revoked Requirement ${target.id} (Reverted to Unassigned)`
        : `Requested Revoke Permission for Requirement ${target.id}`,
      category: 'Requirements',
      targetEntity: `Requirement ${target.id}`,
      targetId: target.id,
      clientName: target.client,
      ipAddress: '192.168.1.45',
      status: isDirectRevoke ? 'Success' : 'Warning',
      details: isDirectRevoke
        ? `Reason for revocation: ${reason}. Previous owner was ${target.owner || 'Assigned Recruiter'}. Requirement reverted to Unassigned.`
        : `Reason for revoke request: ${reason}. Pending approval from Team Lead / Admin.`,
    })
  }

  if (selectedReqForDetail) {
    return (
      <>
        <RequirementDetailOverview
          requirement={selectedReqForDetail}
          role="recruiter"
          onBack={() => setSelectedReqForDetail(null)}
          onOpenAssignModal={() => {
            setIsAssignMyselfChecked(!isLeadOrAdmin)
            setSelectedRecruiterNames(new Set())
            setRecruiterSearchQuery('')
            setIsAssignModalOpen(true)
          }}
          onRevokeRequirement={() => setIsRevokeModalOpen(true)}
          onAddCandidate={() => onOpenSubmitCandidate?.(selectedReqForDetail.id)}
          onRequirementUpdated={updated => {
            setSelectedReqForDetail(updated)
          }}
        />

        {/* REASSIGN MODAL */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden border border-slate-100 font-sans">
              <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Reassign</h3>
                  <p className="text-xs text-slate-500 font-normal mt-1">
                    Keep yourself and/or assign other recruiters for this requirement.
                  </p>
                </div>
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <label className={`border rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer transition-all block ${
                  isAssignMyselfChecked
                    ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-200'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                }`}>
                  <input
                    type="checkbox"
                    checked={isAssignMyselfChecked}
                    onChange={e => setIsAssignMyselfChecked(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                  <div>
                    <div className={`text-sm font-bold leading-snug ${isAssignMyselfChecked ? 'text-blue-900' : 'text-slate-800'}`}>
                      Keep myself ({currentUserName})
                    </div>
                    <div className={`text-xs leading-normal mt-0.5 font-normal ${isAssignMyselfChecked ? 'text-blue-600/90' : 'text-slate-500'}`}>
                      Stay assigned along with any recruiters selected below.
                    </div>
                  </div>
                </label>

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

                <div className="text-xs text-slate-500 font-medium px-0.5">
                  Showing {filteredRecruiterList.length} of {recruiterList.length} recruiters
                </div>

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
                          <div className="text-sm font-bold text-slate-900 leading-snug">{rec.name}</div>
                          <div className="text-xs text-slate-400 mt-0.5 font-normal">{rec.email}</div>
                        </div>
                      </label>
                    )
                  })}
                  {filteredRecruiterList.length === 0 && (
                    <div className="text-xs text-slate-400 py-4 text-center">No other recruiters found.</div>
                  )}
                </div>
              </div>

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
                  className="px-6 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  Assign {totalSelectedRecruitersCount} recruiter(s)
                </button>
              </div>
            </div>
          </div>
        )}

        <RevokeRequirementModal
          isOpen={isRevokeModalOpen}
          onClose={() => setIsRevokeModalOpen(false)}
          requirement={selectedReqForDetail}
          userRole={(canDirectRevoke ? sessionRole : 'recruiter') as Role}
          currentUserName={currentUserName}
          onSubmitRevoke={(reqId, reason) => {
            void handleConfirmRevoke(reqId, reason)
          }}
        />

        {toastMsg && (
          <div className="fixed bottom-6 right-6 z-[60] bg-slate-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg max-w-sm">
            {toastMsg}
          </div>
        )}
      </>
    )
  }

  const assignedToMe = (owner?: string) => {
    const me = (currentUserName || '').trim().toLowerCase()
    if (!me) return false
    return (owner || '')
      .split(',')
      .map(name => name.trim().toLowerCase())
      .includes(me)
  }

  const assignedRequirements = requirements.filter(
    r => r.assignmentStatus !== 'Unassigned' && assignedToMe(r.owner)
  )

  const activeReqRows: ActiveReqRow[] = [...assignedRequirements]
    .sort((a, b) => {
      const rawDateA = (a as any).updatedAt || a.emailArrivedTime || (a as any).createdAt || a.dueDate
      const rawDateB = (b as any).updatedAt || b.emailArrivedTime || (b as any).createdAt || b.dueDate
      const timeA = rawDateA ? new Date(rawDateA).getTime() || 0 : 0
      const timeB = rawDateB ? new Date(rawDateB).getTime() || 0 : 0
      if (timeB !== timeA) return timeB - timeA
      return (b.id || '').localeCompare(a.id || '')
    })
    .map(r => ({
      type: 'Requirement',
      id: r.id,
      name: r.title,
      client: r.client,
      status: r.assignmentStatus || 'Assigned',
      timestamp: r.emailArrivedTime || r.dueDate || '',
    }))

  // Filter requirements by merged searchQuery and statusFilter
  const filteredReqs = activeReqRows.filter(req => {
    // Explicitly reject any Unassigned requirements
    if (req.status.toLowerCase() === 'unassigned') return false

    // Date filter
    if (reqDateFilter && reqDateFilter !== 'All') {
      const rawDate = req.timestamp || ''
      if (!rawDate) return false
      const d = new Date(rawDate)
      if (isNaN(d.getTime())) return false

      const now = new Date()
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

      if (reqDateFilter === 'Today') {
        if (d < startOfToday || d > endOfToday) return false
      } else if (reqDateFilter === 'Yesterday') {
        const startOfYesterday = new Date(startOfToday.getTime() - 86400000)
        const endOfYesterday = new Date(endOfToday.getTime() - 86400000)
        if (d < startOfYesterday || d > endOfYesterday) return false
      } else if (reqDateFilter === 'This week') {
        const day = (now.getDay() + 6) % 7
        const startOfWeek = new Date(startOfToday.getTime() - day * 86400000)
        if (d < startOfWeek || d > endOfToday) return false
      } else if (reqDateFilter === 'This month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        if (d < startOfMonth || d > endOfToday) return false
      } else if (reqDateFilter === 'Custom range') {
        if (reqCustomStartDate) {
          const start = new Date(`${reqCustomStartDate}T00:00:00`)
          if (d < start) return false
        }
        if (reqCustomEndDate) {
          const end = new Date(`${reqCustomEndDate}T23:59:59.999`)
          if (d > end) return false
        }
      }
    }

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

  if (inlineView === 'requirements') {
    return (
      <div className="w-full pb-12 font-sans animate-in fade-in duration-200 space-y-4">
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleSetInlineView(null)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>Back to My Workspace</span>
            </button>
            <span className="text-xs font-bold text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-700">Assigned Requirements Overview</span>
          </div>
        </div>

        <RequirementsPage
          role="recruiter"
          requirements={assignedRequirements}
          submissions={submissions}
          interviews={interviews}
          onOpenSubmit={onOpenSubmitCandidate}
          onNavigateToDashboard={() => {
            handleSetInlineView(null)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </div>
    )
  }

  if (inlineView === 'submissions') {
    return (
      <div className="w-full pb-12 font-sans animate-in fade-in duration-200 space-y-4">
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleSetInlineView(null)
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
          currentUserName={currentUserName}
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
                handleSetInlineView(null)
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
          requirements={requirements}
        />
      </div>
    )
  }

  if (inlineView === 'onboarding') {
    return (
      <div className="w-full pb-12 font-sans animate-in fade-in duration-200 space-y-4">
        <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                handleSetInlineView(null)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span>Back to My Workspace</span>
            </button>
            <span className="text-xs font-bold text-slate-300">|</span>
            <span className="text-xs font-bold text-slate-700">Onboarding Overview</span>
          </div>
        </div>

        <InterviewTrackingPage
          role="recruiter"
          interviews={interviews}
          onOpenFeedbackModal={onOpenFeedbackModal}
          requirements={requirements}
          initialStatusToggle="onboarding"
        />
      </div>
    )
  }

  if (inlineReqId) {
    return (
      <div className="w-full pb-12 font-sans animate-in fade-in duration-200">
        <CandidateRepositoryPage
          candidates={candidates}
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
        <div ref={kpiGridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Assigned Requirements */}
          <div
            onClick={() => handleSetInlineView('requirements')}
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

          {/* Card 2: Total Submissions */}
          <div
            onClick={() => handleSetInlineView('submissions')}
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

          {/* Card 3: Interviews Handled */}
          <div
            onClick={() => handleSetInlineView('interviews')}
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

          {/* Card 4: Onboarding */}
          <div
            onClick={() => handleSetInlineView('onboarding')}
            className="bg-[#F4EFFE] border border-[#E9D8FD] rounded-2xl p-5 flex items-center justify-between shadow-sm transition-all duration-200 hover:shadow-md cursor-pointer hover:scale-[1.01] group"
            title="Click to view Onboarding details"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs sm:text-sm font-semibold text-slate-700">Onboarding</p>
                <ExternalLink className="w-3.5 h-3.5 text-purple-600 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">0</p>
              <p className="text-[11px] font-medium text-purple-700 mt-1">Click to view candidate selections & onboarding</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>
      </section>

      {/* Active Requirements + Submitted Candidates Section */}
      <section id="active-requirements-section" ref={activeReqsRef} className="space-y-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
              Assigned Requirements
            </h2>
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

          <div className="flex items-center gap-2">
            <div className="relative w-44">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={reqDateFilter}
                onChange={e => setReqDateFilter(e.target.value)}
                className="w-full appearance-none pl-9 pr-8 py-2.5 text-xs border border-slate-200/90 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-700 bg-white font-semibold cursor-pointer shadow-2xs"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="This week">This week</option>
                <option value="This month">This month</option>
                <option value="Custom range">Custom range...</option>
              </select>
            </div>
          </div>
        </div>

        {reqDateFilter === 'Custom range' && (
          <div className="flex flex-wrap items-center gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in duration-150">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Date Range:</span>
            </span>
            <input
              type="date"
              value={reqCustomStartDate}
              onChange={e => setReqCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 bg-white font-medium"
            />
            <span className="text-xs text-slate-400 font-bold">to</span>
            <input
              type="date"
              value={reqCustomEndDate}
              onChange={e => setReqCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 bg-white font-medium"
            />
            <button
              type="button"
              onClick={() => {
                setReqCustomStartDate('')
                setReqCustomEndDate('')
                setReqDateFilter('All')
              }}
              className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Clear Date Filter
            </button>
          </div>
        )}

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

      {/* Recent Activity Section */}
      <section className="space-y-4 overflow-visible">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Activity</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Actions and updates performed in your recruiter account.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-2xs relative z-20">
              <label htmlFor="dashboard-recent-page-size" className="text-xs text-slate-500 font-medium whitespace-nowrap">Page size:</label>
              <select
                id="dashboard-recent-page-size"
                value={recentActivityPageSize}
                onChange={(e) => setRecentActivityPageSize(Number(e.target.value))}
                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer border-none p-0"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60 shadow-2xs">
              Showing {Math.min(userActivityLogs.length, recentActivityPageSize)} of {userActivityLogs.length} Action{userActivityLogs.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {userActivityLogs.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs divide-y divide-slate-100 overflow-hidden">
            {userActivityLogs.slice(0, recentActivityPageSize).map((log, idx) => {
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
