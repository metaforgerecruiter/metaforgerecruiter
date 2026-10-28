import React, { useState, useMemo } from 'react'
import { Requirement, Submission, Interview, Recruiter } from '../../types'
import { brand } from '../../theme'
import {
  FileText,
  Send,
  UserX,
  UserCheck,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  Search,
  ChevronDown,
  Filter,
  Plus,
  ArrowUpDown,
  RefreshCw,
  UserPlus,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react'

import { RequirementCardsGrid, CardFilterType } from '../ui/RequirementCardsGrid'
import { RequirementDetailOverview } from './RequirementDetailOverview'
import { CreateJobDemandForm } from './CreateJobDemandForm'
import { PaginationFooter } from '../ui/PaginationFooter'
import { RevokeRequirementModal } from '../modals/RevokeRequirementModal'

interface RequirementsPageProps {
  role?: string
  requirements: Requirement[]
  submissions?: Submission[]
  interviews?: Interview[]
  recruiters?: Recruiter[]
  onOpenSubmit?: (reqId?: string) => void
  onUpdateRequirements?: (updated: Requirement[]) => void
  onAddActivityLog?: (log: any) => void
  onNavigateToDashboard?: () => void
}

export function RequirementsPage({
  role = 'superadmin',
  requirements = [],
  submissions = [],
  interviews = [],
  recruiters = [],
  onOpenSubmit,
  onUpdateRequirements,
  onAddActivityLog,
  onNavigateToDashboard,
}: RequirementsPageProps) {
  // Local requirements state so assignments take immediate visual effect
  const [localRequirements, setLocalRequirements] = useState<Requirement[]>(requirements)

  React.useEffect(() => {
    setLocalRequirements(requirements)
  }, [requirements])

  // Selected requirement for detail overview screen
  const [selectedReqForDetail, setSelectedReqForDetail] = useState<Requirement | null>(null)

  // Create Job Demand state
  const [isCreatingDemand, setIsCreatingDemand] = useState(false)

  // Search and Filter states
  const [globalSearch, setGlobalSearch] = useState('')
  const [statusDropdown, setStatusDropdown] = useState<string>('All')
  const [clientDropdown, setClientDropdown] = useState<string>('All')

  // Selected card filter
  const [activeCardFilter, setActiveCardFilter] = useState<CardFilterType>('ALL')

  // Selected table rows
  const [selectedReqIds, setSelectedReqIds] = useState<Set<string>>(new Set())

  // Dynamic unique client list derived from local requirements
  const availableClients = useMemo(() => {
    const clientsSet = new Set<string>()
    localRequirements.forEach(r => {
      if (r.client) clientsSet.add(r.client)
    })
    return Array.from(clientsSet).sort()
  }, [localRequirements])

  // Assignment Modal & Toast State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // States for "Assign to recruiters" modal matching screenshot
  const [isAssignMyselfChecked, setIsAssignMyselfChecked] = useState(true)
  const [selectedRecruiterNames, setSelectedRecruiterNames] = useState<Set<string>>(new Set())
  const [recruiterSearchQuery, setRecruiterSearchQuery] = useState('')

  // Current logged in user name based on role (defaults to Harish Gadipally as shown in screenshot)
  const currentUserName = useMemo(() => {
    if (role === 'superadmin') return 'Harish Gadipally'
    if (role === 'admin') return 'Harish Gadipally'
    if (role === 'lead') return 'Sarah Kim'
    if (role === 'recruiter') return 'Harish Gadipally'
    return 'Harish Gadipally'
  }, [role])

  // List of recruiters matching screenshot (Showing 17 recruiters)
  const recruiterList = useMemo(() => {
    return [
      { id: '1', name: 'Adirala sathvika', email: 'No email' },
      { id: '2', name: 'Arvind GR', email: 'arvind.gr@metaforgeit.com' },
      { id: '3', name: 'Charlie Darwin', email: 'charlie@metaforgeit.com' },
      { id: '4', name: 'Harini Sindey', email: 'harini.s@metaforgeit.com' },
      { id: '5', name: 'Harish Gadipally', email: 'harish.g@metaforgeit.com' },
      { id: '6', name: 'Puttapaka Saiteja', email: 'saiteja.p@metaforgeit.com' },
      { id: '7', name: 'Kallol Chakraborty', email: 'kallol.c@ltts.com' },
      { id: '8', name: 'Marcus Chen', email: 'm.chen@talentflow.io' },
      { id: '9', name: 'Sarah Kim', email: 's.kim@talentflow.io' },
      { id: '10', name: 'David Park', email: 'd.park@talentflow.io' },
      { id: '11', name: 'Alex Turner', email: 'alex.t@dev.com' },
      { id: '12', name: 'Nina Brooks', email: 'n.brooks@talentflow.io' },
      { id: '13', name: 'Priya Sharma', email: 'priya.s@talentflow.io' },
      { id: '14', name: 'James O\'Brien', email: 'j.obrien@talentflow.io' },
      { id: '15', name: 'Carlos Rivera', email: 'c.rivera@talentflow.io' },
      { id: '16', name: 'Tejasree Chakravarthy', email: 'tejasree@metaforgeit.com' },
      { id: '17', name: 'Rahul Verma', email: 'rahul.v@metaforgeit.com' },
    ]
  }, [])

  // Filtered recruiter list based on search input
  const filteredRecruiterList = useMemo(() => {
    if (!recruiterSearchQuery.trim()) return recruiterList
    const q = recruiterSearchQuery.trim().toLowerCase()
    return recruiterList.filter(
      r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    )
  }, [recruiterList, recruiterSearchQuery])

  // Count total selected recruiters for footer button label
  const totalSelectedRecruitersCount = (isAssignMyselfChecked ? 1 : 0) + selectedRecruiterNames.size

  const toggleRecruiterSelection = (name: string) => {
    const next = new Set(selectedRecruiterNames)
    if (next.has(name)) next.delete(name)
    else next.add(name)
    setSelectedRecruiterNames(next)
  }

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage(null)
    }, 4000)
  }

  // Single Self Assign handler
  const handleSingleSelfAssign = (req: Requirement) => {
    const updated = localRequirements.map(r =>
      r.id === req.id
        ? { ...r, owner: currentUserName, assignmentStatus: 'Assigned' as const }
        : r
    )
    setLocalRequirements(updated)
    onUpdateRequirements?.(updated)
    showToast(`Successfully assigned requirement ${req.id} to ${currentUserName} (Myself)`)

    if (onNavigateToDashboard) {
      setTimeout(() => {
        onNavigateToDashboard()
      }, 400)
    }
  }

  // Self Assign handler shortcut
  const handleSelfAssign = () => {
    if (selectedReqIds.size === 0) return
    const count = selectedReqIds.size
    const updated = localRequirements.map(r =>
      selectedReqIds.has(r.id)
        ? { ...r, owner: currentUserName, assignmentStatus: 'Assigned' as const }
        : r
    )
    setLocalRequirements(updated)
    onUpdateRequirements?.(updated)
    setSelectedReqIds(new Set())
    showToast(`Successfully assigned ${count} requirement(s) to ${currentUserName} (Myself)`)

    if (onNavigateToDashboard) {
      setTimeout(() => {
        onNavigateToDashboard()
      }, 400)
    }
  }

  // Confirm assignment from the modal
  const handleConfirmModalAssignment = () => {
    const assignees: string[] = []
    if (isAssignMyselfChecked) {
      assignees.push(currentUserName)
    }
    selectedRecruiterNames.forEach(name => assignees.push(name))

    if (assignees.length === 0) return

    const assigneesText = assignees.join(', ')
    const updated = localRequirements.map(r =>
      selectedReqIds.has(r.id) || (selectedReqForDetail && r.id === selectedReqForDetail.id)
        ? { ...r, owner: assigneesText, assignmentStatus: 'Assigned' as const, submissions: r.submissions || 7 }
        : r
    )

    setLocalRequirements(updated)
    onUpdateRequirements?.(updated)

    if (selectedReqForDetail) {
      setSelectedReqForDetail({
        ...selectedReqForDetail,
        owner: assigneesText,
        assignmentStatus: 'Assigned',
        submissions: selectedReqForDetail.submissions || 7,
      })
    }

    const assignedToMyself = isAssignMyselfChecked || assignees.some(a => a.toLowerCase().includes(currentUserName.toLowerCase()) || a.toLowerCase().includes('harish'))

    setSelectedReqIds(new Set())
    setIsAssignModalOpen(false)
    setSelectedRecruiterNames(new Set())
    setIsAssignMyselfChecked(true)
    setRecruiterSearchQuery('')

    showToast(`Successfully assigned ${assignees.length} recruiter(s)`)

    onAddActivityLog?.({
      id: `LOG-${Date.now()}`,
      timestamp: 'Just now',
      userName: currentUserName,
      userEmail: 'user@metaforgeit.com',
      userRole: role as any,
      userAvatar: currentUserName.charAt(0),
      action: `Assigned Requirement(s) to ${assigneesText}`,
      category: 'Requirements',
      targetEntity: `Requirement Assignment`,
      ipAddress: '192.168.1.45',
      status: 'Success',
      details: `Assigned requirement workload to ${assigneesText}.`,
    })

    if (assignedToMyself && onNavigateToDashboard) {
      setTimeout(() => {
        onNavigateToDashboard()
      }, 400)
    }
  }

  // Revoke Modal State & Handlers
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false)
  const [selectedReqForRevoke, setSelectedReqForRevoke] = useState<Requirement | null>(null)

  const handleOpenRevoke = (req: Requirement) => {
    setSelectedReqForRevoke(req)
    setIsRevokeModalOpen(true)
  }

  const handleConfirmRevoke = (reqId: string, reason: string, isDirectRevoke: boolean) => {
    const target = localRequirements.find(r => r.id === reqId)
    const oldOwner = target?.owner || 'Assigned Recruiter'

    let updated: Requirement[]
    if (isDirectRevoke) {
      // Direct Revoke by Lead / Admin / SuperAdmin -> Reverts to Unassigned immediately
      updated = localRequirements.map(r =>
        r.id === reqId
          ? {
              ...r,
              owner: 'Unassigned',
              assignmentStatus: 'Unassigned' as const,
              revokeRequested: false,
              revokeReason: undefined,
              revokeRequestedBy: undefined,
              revokeRequestedAt: undefined,
            }
          : r
      )
      showToast(`Requirement ${reqId} revoked successfully and reverted to Unassigned state.`)
      onAddActivityLog?.({
        id: `LOG-${Date.now()}`,
        timestamp: 'Just now',
        userName: currentUserName,
        userEmail: 'user@metaforgeit.com',
        userRole: role as any,
        userAvatar: currentUserName.charAt(0),
        action: `Revoked Requirement ${reqId} & Reverted to Unassigned`,
        category: 'Requirements',
        targetEntity: `Requirement ${reqId}`,
        targetId: reqId,
        clientName: target?.client,
        ipAddress: '192.168.1.45',
        status: 'Success',
        details: `Reason for revocation: ${reason}. Previous owner was ${oldOwner}. Reverted requirement to Unassigned state.`,
      })
    } else {
      // Permission request by Recruiter -> Needs Lead / Admin approval
      updated = localRequirements.map(r =>
        r.id === reqId
          ? {
              ...r,
              revokeRequested: true,
              revokeReason: reason,
              revokeRequestedBy: currentUserName,
              revokeRequestedAt: 'Just now',
            }
          : r
      )
      showToast(`Revoke permission request for ${reqId} submitted to Team Lead / Admin for approval.`)
      onAddActivityLog?.({
        id: `LOG-${Date.now()}`,
        timestamp: 'Just now',
        userName: currentUserName,
        userEmail: 'user@metaforgeit.com',
        userRole: role as any,
        userAvatar: currentUserName.charAt(0),
        action: `Requested Revoke Permission for Requirement ${reqId}`,
        category: 'Requirements',
        targetEntity: `Requirement ${reqId}`,
        targetId: reqId,
        clientName: target?.client,
        ipAddress: '192.168.1.45',
        status: 'Warning',
        details: `Reason for revoke request: ${reason}. Pending approval from Team Lead / Admin.`,
      })
    }

    setLocalRequirements(updated)
    onUpdateRequirements?.(updated)
    if (selectedReqForDetail && selectedReqForDetail.id === reqId) {
      const updatedReq = updated.find(r => r.id === reqId) || null
      setSelectedReqForDetail(updatedReq)
    }
  }

  const handleGrantRevokeApproval = (reqId: string) => {
    const target = localRequirements.find(r => r.id === reqId)
    const requester = target?.revokeRequestedBy || 'Recruiter'
    const reason = target?.revokeReason || 'Revoke request approved'

    const updated = localRequirements.map(r =>
      r.id === reqId
        ? {
            ...r,
            owner: 'Unassigned',
            assignmentStatus: 'Unassigned' as const,
            revokeRequested: false,
            revokeReason: undefined,
            revokeRequestedBy: undefined,
            revokeRequestedAt: undefined,
          }
        : r
    )

    setLocalRequirements(updated)
    onUpdateRequirements?.(updated)
    showToast(`Granted revoke approval for ${reqId}. Requirement reverted to Unassigned state.`)

    onAddActivityLog?.({
      id: `LOG-${Date.now()}`,
      timestamp: 'Just now',
      userName: currentUserName,
      userEmail: 'user@metaforgeit.com',
      userRole: role as any,
      userAvatar: currentUserName.charAt(0),
      action: `Approved Revoke Permission for Requirement ${reqId} (Reverted to Unassigned)`,
      category: 'Requirements',
      targetEntity: `Requirement ${reqId}`,
      targetId: reqId,
      clientName: target?.client,
      ipAddress: '192.168.1.45',
      status: 'Success',
      details: `Revoke permission granted by ${currentUserName} for request by ${requester}. Reason: ${reason}. Requirement reverted to Unassigned.`,
    })
  }

  const handleDeclineRevokeRequest = (reqId: string) => {
    const target = localRequirements.find(r => r.id === reqId)
    const requester = target?.revokeRequestedBy || 'Recruiter'

    const updated = localRequirements.map(r =>
      r.id === reqId
        ? {
            ...r,
            revokeRequested: false,
            revokeReason: undefined,
            revokeRequestedBy: undefined,
            revokeRequestedAt: undefined,
          }
        : r
    )

    setLocalRequirements(updated)
    onUpdateRequirements?.(updated)
    showToast(`Declined revoke request for ${reqId}.`)

    onAddActivityLog?.({
      id: `LOG-${Date.now()}`,
      timestamp: 'Just now',
      userName: currentUserName,
      userEmail: 'user@metaforgeit.com',
      userRole: role as any,
      userAvatar: currentUserName.charAt(0),
      action: `Declined Revoke Request for Requirement ${reqId}`,
      category: 'Requirements',
      targetEntity: `Requirement ${reqId}`,
      targetId: reqId,
      clientName: target?.client,
      ipAddress: '192.168.1.45',
      status: 'Warning',
      details: `Revoke request from ${requester} for requirement ${reqId} was declined by ${currentUserName}.`,
    })
  }

  // Filter requirements based on single global search field & active card filter
  const filteredRequirements = useMemo(() => {
    return localRequirements.filter(r => {
      // Global single search filter (matches ID, Client, Role, Location, Owner, Email, Lead, Skills)
      if (globalSearch.trim()) {
        const query = globalSearch.trim().toLowerCase()
        const matchId = r.id.toLowerCase().includes(query)
        const matchClient = r.client.toLowerCase().includes(query)
        const matchTitle = r.title.toLowerCase().includes(query)
        const matchLocation = (r.location || '').toLowerCase().includes(query)
        const matchOwner = (r.owner || '').toLowerCase().includes(query)
        const matchEmail = (r.clientEmail || '').toLowerCase().includes(query)
        const matchLead = (r.assignedLead || '').toLowerCase().includes(query)
        const matchSkills = (r.skills || []).some(s =>
          s.toLowerCase().includes(query)
        )

        if (
          !matchId &&
          !matchClient &&
          !matchTitle &&
          !matchLocation &&
          !matchOwner &&
          !matchEmail &&
          !matchLead &&
          !matchSkills
        ) {
          return false
        }
      }

      // Client dropdown filter
      if (clientDropdown !== 'All') {
        if (r.client !== clientDropdown) return false
      }

      // Status dropdown filter
      if (statusDropdown !== 'All') {
        if (statusDropdown === 'Unassigned') {
          if (r.owner && r.owner !== 'Unassigned' && r.assignmentStatus !== 'Unassigned') return false
        } else if (statusDropdown === 'Assigned') {
          if (!r.owner || r.owner === 'Unassigned' || r.assignmentStatus === 'Unassigned') return false
        } else if (statusDropdown === 'Submitted') {
          if ((r.submissions || 0) === 0) return false
        } else if (statusDropdown === 'Submitted to Lead') {
          if ((r.submissions || 0) === 0) return false
        } else if (statusDropdown === 'Submitted to Client') {
          if ((r.submissions || 0) === 0) return false
        } else if (statusDropdown === 'Interview') {
          if ((r.interviews || 0) === 0) return false
        } else if (statusDropdown === 'Selected') {
          if ((r.placed || r.selections || 0) === 0) return false
        } else if (statusDropdown === 'Rejected') {
          if ((r.rejections || 0) === 0) return false
        } else if (statusDropdown === 'Closed') {
          if (r.status !== 'Closed' && r.assignmentStatus !== 'Closed') return false
        }
      }

      // Card filter
      if (activeCardFilter === 'UNASSIGNED') {
        return !r.owner || r.owner === 'Unassigned'
      } else if (activeCardFilter === 'ASSIGNED') {
        return r.owner && r.owner !== 'Unassigned'
      } else if (activeCardFilter === 'IN_PROGRESS') {
        return r.status === 'Active' || r.assignmentStatus === 'In Progress'
      } else if (activeCardFilter === 'SUBMISSIONS') {
        return r.submissions > 0
      } else if (activeCardFilter === 'INTERVIEWS') {
        return r.interviews > 0
      } else if (activeCardFilter === 'SELECTIONS') {
        return (r.placed || r.selections || 0) > 0
      } else if (activeCardFilter === 'REJECTIONS') {
        return (r.rejections || 0) > 0
      }

      return true
    })
  }, [
    localRequirements,
    globalSearch,
    statusDropdown,
    clientDropdown,
    activeCardFilter,
  ])

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const paginatedRequirements = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRequirements.slice(start, start + pageSize)
  }, [filteredRequirements, currentPage, pageSize])

  // Select all checkbox state
  const isAllSelected =
    paginatedRequirements.length > 0 &&
    paginatedRequirements.every(r => selectedReqIds.has(r.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedReqIds(new Set())
    } else {
      setSelectedReqIds(new Set(paginatedRequirements.map(r => r.id)))
    }
  }

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedReqIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedReqIds(next)
  }

  const handleResetFilters = () => {
    setGlobalSearch('')
    setStatusDropdown('Unassigned')
    setClientDropdown('All')
    setActiveCardFilter('ALL')
  }

  const roleLabel =
    role === 'superadmin' || role === 'devteam'
      ? 'Super Admin View'
      : role === 'admin'
        ? 'Admin View'
        : role === 'lead'
          ? 'Team Lead View'
          : 'Recruiter View'

  // Edit Job Demand state
  const [isEditingDemand, setIsEditingDemand] = useState(false)
  const [editingReq, setEditingReq] = useState<Requirement | null>(null)

  // Pending Revoke Requests list for Lead / Admin approval (Declared before early returns to satisfy React Hook rules)
  const pendingRevokeRequests = useMemo(() => {
    return localRequirements.filter(r => r.revokeRequested)
  }, [localRequirements])

  if (isCreatingDemand && role !== 'admin') {
    return (
      <CreateJobDemandForm
        userRole={roleLabel}
        mode="create"
        onCancel={() => setIsCreatingDemand(false)}
        onSubmit={newReq => {
          const updated = [newReq, ...localRequirements]
          setLocalRequirements(updated)
          if (onUpdateRequirements) {
            onUpdateRequirements(updated)
          }
          setIsCreatingDemand(false)
        }}
      />
    )
  }

  if (isEditingDemand && editingReq) {
    return (
      <CreateJobDemandForm
        userRole={roleLabel}
        mode="edit"
        initialData={editingReq}
        onCancel={() => setIsEditingDemand(false)}
        onSubmit={updatedReq => {
          const updatedList = localRequirements.map(r =>
            r.id === updatedReq.id ? updatedReq : r
          )
          setLocalRequirements(updatedList)
          onUpdateRequirements?.(updatedList)
          setSelectedReqForDetail(updatedReq)
          setIsEditingDemand(false)
          setEditingReq(null)
          showToast('Requirement details updated successfully!')
        }}
      />
    )
  }

  if (selectedReqForDetail) {
    return (
      <>
        <RequirementDetailOverview
          requirement={selectedReqForDetail}
          role={role}
          onBack={() => setSelectedReqForDetail(null)}
          onAddCandidate={() => onOpenSubmit?.(selectedReqForDetail.id)}
          onEditRequirement={() => {
            setEditingReq(selectedReqForDetail)
            setIsEditingDemand(true)
          }}
          onOpenAssignModal={role !== 'recruiter' ? () => {
            setSelectedReqIds(new Set([selectedReqForDetail.id]))
            setIsAssignModalOpen(true)
          } : undefined}
          onRevokeRequirement={() => handleOpenRevoke(selectedReqForDetail)}
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
                      Assign myself ({currentUserName})
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
                  onClick={handleConfirmModalAssignment}
                  disabled={totalSelectedRecruitersCount === 0}
                  className="px-6 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
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

  return (
    <div className="space-y-5 w-full pb-10">
      {/* 8 TOP CARDS GRID */}
      <RequirementCardsGrid
        requirements={localRequirements}
        submissions={submissions}
        interviews={interviews}
        activeCardFilter={activeCardFilter}
        onSelectFilter={setActiveCardFilter}
        onCreateNewJobDemand={role === 'admin' ? undefined : () => setIsCreatingDemand(true)}
        title="Requirements Dashboard"
        badgeLabel={roleLabel}
        hideCards={role === 'recruiter' || role === 'lead'}
      />

      {/* PENDING REVOKE APPROVAL BANNER (EXCLUSIVELY FOR SUPER ADMIN & ADMIN) */}
      {(role === 'superadmin' || role === 'admin' || role === 'devteam') && pendingRevokeRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-300/80 rounded-2xl p-4 shadow-sm space-y-3 font-sans animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Pending Revoke Permission Requests</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                    {pendingRevokeRequests.length} Pending
                  </span>
                </h4>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Recruiters have requested permission to revoke requirement assignments. Approving will revert the requirement to Unassigned.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {pendingRevokeRequests.map(pReq => (
              <div
                key={pReq.id}
                className="bg-white/90 backdrop-blur-xs border border-amber-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-bold">
                    <span className="text-[#6B3BF6]">{pReq.id}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-800">{pReq.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      {pReq.client}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    <span className="font-extrabold text-amber-700">Requested by:</span> {pReq.revokeRequestedBy || pReq.owner || 'Recruiter'}
                    {pReq.revokeReason && (
                      <>
                        <span className="mx-1.5 text-slate-300">|</span>
                        <span className="font-bold text-slate-700">Reason:</span> "{pReq.revokeReason}"
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleGrantRevokeApproval(pReq.id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Grant Approval & Revert</span>
                  </button>

                  <button
                    onClick={() => handleDeclineRevokeRequest(pReq.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UNIFIED SINGLE SEARCH BAR */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Requirement ID, Client name, Role, Location, Owner or Recruiter..."
              value={globalSearch}
              onChange={e => setGlobalSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 placeholder-gray-400 bg-gray-50/50 transition-all"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center bg-gray-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Client Filter Dropdown */}
          <div className="relative shrink-0 w-full sm:w-52">
            <select
              value={clientDropdown}
              onChange={e => setClientDropdown(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 bg-gray-50/50 font-medium cursor-pointer"
            >
              <option value="All">All Clients ({availableClients.length})</option>
              {availableClients.map(clientName => (
                <option key={clientName} value={clientName}>
                  🏢 {clientName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative shrink-0 w-full sm:w-44">
            <select
              value={statusDropdown}
              onChange={e => setStatusDropdown(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 bg-gray-50/50 font-semibold cursor-pointer"
            >
              <option value="All">All Requirements</option>
              <option value="Unassigned">Unassigned</option>
              <option value="Assigned">Assigned</option>
              <option value="Submitted">Submitted</option>
              <option value="Interview">Interview</option>
              <option value="Selected">Selected</option>
              <option value="Rejected">Rejected</option>
              <option value="Closed">Closed</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* REQUIREMENTS COUNT & ASSIGNMENT ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">
            {filteredRequirements.length} requirement(s)
          </span>
        </div>

        {selectedReqIds.size > 0 && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-2 rounded-xl shadow-md border border-blue-700/50 flex flex-wrap items-center gap-2.5 animate-in fade-in duration-200">
            <span className="bg-blue-600/80 text-white font-bold px-2.5 py-0.5 rounded text-xs border border-blue-400/40">
              {selectedReqIds.size} Selected
            </span>

            {/* Self Assign Button */}
            <button
              onClick={handleSelfAssign}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title={`Assign to ${currentUserName}`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Self Assign ({currentUserName})</span>
            </button>

            {/* Assign to Someone Button — Hidden for recruiters */}
            {role !== 'recruiter' && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign to Someone...</span>
              </button>
            )}

            <button
              onClick={() => setSelectedReqIds(new Set())}
              className="text-xs text-blue-300 hover:text-white px-2 py-1 font-medium transition-colors cursor-pointer ml-auto"
            >
              Deselect
            </button>
          </div>
        )}
      </div>

      {/* REQUIREMENTS DATA TABLE (MATCHING ATTACHED SCREENSHOT) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4 font-bold">REQUIREMENT ID</th>
                <th className="py-3 px-4 font-bold">CLIENT NAME</th>
                <th className="py-3 px-4 font-bold">ROLE</th>
                <th className="py-3 px-4 font-bold text-center">POSITIONS</th>
                <th className="py-3 px-4 font-bold">PRIORITY</th>
                <th className="py-3 px-4 font-bold">ASSIGNED TO RECRUITER</th>
                <th className="py-3 px-4 font-bold">EMAIL ARRIVED TIME</th>
                <th className="py-3 px-4 font-bold">OPEN SINCE</th>
                <th className="py-3 px-4 font-bold text-center">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredRequirements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-400">
                    <p className="text-sm font-medium">
                      No requirements match your current search or filter.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedRequirements.map(req => {
                  const isUnassigned =
                    !req.owner || req.owner === 'Unassigned'
                  const isSelected = selectedReqIds.has(req.id)

                  return (
                    <tr
                      key={req.id}
                      className={`hover:bg-blue-50/30 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(req.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Requirement ID */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        <div className="space-y-1">
                          <button
                            onClick={() => setSelectedReqForDetail(req)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer flex items-center gap-1 group text-left"
                            title="Click to view full requirement overview"
                          >
                            <span>{req.id}</span>
                          </button>
                          <div>
                            <span
                              className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                                isUnassigned
                                  ? 'bg-gray-100 text-gray-600 border-gray-300'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {req.owner || 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Client Name */}
                      <td className="py-3.5 px-4 font-medium text-gray-800 whitespace-nowrap">
                        {req.client}
                      </td>

                      {/* Role & Subtext */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-gray-900 leading-snug line-clamp-2">
                          {req.title}
                        </div>
                        {req.location && (
                          <div className="text-[11px] text-gray-400 mt-0.5 truncate">
                            {req.location}
                          </div>
                        )}
                      </td>

                      {/* Count of Positions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold tabular-nums">
                          {req.openings || 1}
                        </span>
                      </td>

                      {/* Priority Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            req.priority === 'High'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : req.priority === 'Medium'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {req.priority || 'Low'}
                        </span>
                      </td>

                      {/* Submitted to Recruiter */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isUnassigned ? 'bg-slate-100 text-slate-500 border border-slate-200' : 'bg-purple-100 text-[#6B3BF6] border border-purple-200 shadow-2xs'
                          }`}>
                            {isUnassigned ? '?' : (req.owner || 'R').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={`text-xs ${isUnassigned ? 'text-slate-400 italic font-medium' : 'text-slate-900 font-extrabold'}`}>
                              {req.owner || 'Unassigned'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {isUnassigned ? 'Pending assignment' : 'Assigned Recruiter'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Email Arrived Time */}
                      <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                        {req.emailArrivedTime || 'Aug 6, 2026, 11:05 AM'}
                      </td>

                      {/* Open Since */}
                      <td className="py-3.5 px-4 text-gray-700 font-medium whitespace-nowrap">
                        {req.openDays !== undefined
                          ? `${req.openDays} days`
                          : '0 days'}
                      </td>

                      {/* SLA */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Clock className="w-3 h-3 text-purple-500" />
                          {req.sla || (req.priority === 'High' ? '24 Hours' : req.priority === 'Medium' ? '48 Hours' : '72 Hours')}
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
          totalPages={Math.ceil(filteredRequirements.length / pageSize)}
          totalItems={filteredRequirements.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="requirements"
        />
      </div>

      {/* ASSIGN TO RECRUITERS / REASSIGN MODAL (MATCHING ATTACHED SCREENSHOT) */}
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
                    Assign myself ({currentUserName})
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
                onClick={handleConfirmModalAssignment}
                disabled={totalSelectedRecruitersCount === 0}
                className="px-6 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
              >
                Assign {totalSelectedRecruitersCount} recruiter(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE REQUIREMENT MODAL */}
      <RevokeRequirementModal
        isOpen={isRevokeModalOpen}
        onClose={() => setIsRevokeModalOpen(false)}
        requirement={selectedReqForRevoke}
        userRole={role as any}
        currentUserName={currentUserName}
        onSubmitRevoke={handleConfirmRevoke}
      />

      {/* SUCCESS TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
