import type { RequirementsPageProps } from './preamble'
import { Requirement } from '../../../types'
import { CardFilterType } from '../../ui/RequirementCardsGrid'
import { usersService, workspaceService } from '../../../services/workspace.service'
import { getSessionUser } from '../../../store/session'
import { useState, useMemo } from 'react'
import React from 'react'

export function useRequirementsPageState(props: RequirementsPageProps) {
  const {
  role = 'superadmin',
  requirements = [],
  submissions = [],
  interviews = [],
  recruiters = [],
  onOpenSubmit,
  onUpdateRequirements,
  onAddActivityLog,
  onNavigateToDashboard,
}: RequirementsPageProps = props as RequirementsPageProps & Record<string, never>
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
  const [statusDropdown, setStatusDropdown] = useState<string>('Unassigned')
  const [clientDropdown, setClientDropdown] = useState<string>('All')
  const [dateFilter, setDateFilter] = useState<string>('All')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')


  // Selected card filter
  const [activeCardFilter, setActiveCardFilter] = useState<CardFilterType>('ALL')

  // Selected table rows
  const [selectedReqIds, setSelectedReqIds] = useState<Set<string>>(new Set())

  // Table Sorting state (default: Requirement ID descending)
  const [sortField, setSortField] = useState<'reqId' | 'client' | 'role' | 'arrivedTime'>('reqId')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const handleSort = (field: 'reqId' | 'client' | 'role' | 'arrivedTime') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Dynamic unique client list derived from local requirements
  const availableClients = useMemo(() => {
    const clientsSet = new Set<string>()
    localRequirements.forEach(r => {
      const c = (r.client || (r as any).clientName || '').trim()
      if (c) clientsSet.add(c)
    })
    return Array.from(clientsSet).sort()
  }, [localRequirements])

  // Assignment Modal & Toast State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Auto Email Extraction sync state
  const [isSyncingMail, setIsSyncingMail] = useState(false)
  const [mailSyncStatus, setMailSyncStatus] = useState<{
    status: string
    message: string
    lastSyncedAt?: string
    totalProcessed?: number
    totalSynced?: number
    totalDeduped?: number
    error?: string | null
  } | null>(null)

  React.useEffect(() => {
    workspaceService
      .getRequirementsSyncStatus()
      .then((res: any) => {
        if (res) setMailSyncStatus(res)
      })
      .catch(() => {})
  }, [])

  const isLeadOrAdmin = ['lead', 'admin', 'superadmin', 'devteam'].includes(String(role || '').toLowerCase())
  // States for "Assign to recruiters" modal matching screenshot
  // For team lead, super admin, or admin: self-assign should NOT be checked by default, only when clicked manually
  const [isAssignMyselfChecked, setIsAssignMyselfChecked] = useState(!isLeadOrAdmin)
  const [selectedRecruiterNames, setSelectedRecruiterNames] = useState<Set<string>>(new Set())
  const [recruiterSearchQuery, setRecruiterSearchQuery] = useState('')

  React.useEffect(() => {
    if (['lead', 'admin', 'superadmin', 'devteam'].includes(String(role || '').toLowerCase())) {
      setIsAssignMyselfChecked(false)
    }
  }, [role])

  // Current logged in user name based on role or session
  const currentUserName = useMemo(() => {
    const session = getSessionUser()
    if (session?.name) return session.name
    if (role === 'superadmin') return 'Super Admin'
    if (role === 'admin') return 'Admin'
    if (role === 'lead') return 'Team Lead'
    if (role === 'recruiter') return 'Recruiter'
    return 'User'
  }, [role])

  const [dbUsers, setDbUsers] = useState<any[]>([])

  React.useEffect(() => {
    usersService.list().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.items || data?.data || []
      setDbUsers(list)
    }).catch(() => {})
  }, [])

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
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [dbUsers])

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
    }, 5000)
  }

  // Single Self Assign handler
  return {
    role,
    requirements,
    submissions,
    interviews,
    recruiters,
    onOpenSubmit,
    onUpdateRequirements,
    onAddActivityLog,
    onNavigateToDashboard,
    localRequirements,
    setLocalRequirements,
    selectedReqForDetail,
    setSelectedReqForDetail,
    isCreatingDemand,
    setIsCreatingDemand,
    globalSearch,
    setGlobalSearch,
    statusDropdown,
    setStatusDropdown,
    clientDropdown,
    setClientDropdown,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    activeCardFilter,
    setActiveCardFilter,
    selectedReqIds,
    setSelectedReqIds,
    isAssignModalOpen,
    setIsAssignModalOpen,
    toastMessage,
    setToastMessage,
    isAssignMyselfChecked,
    setIsAssignMyselfChecked,
    selectedRecruiterNames,
    setSelectedRecruiterNames,
    recruiterSearchQuery,
    setRecruiterSearchQuery,
    availableClients,
    currentUserName,
    recruiterList,
    filteredRecruiterList,
    totalSelectedRecruitersCount,
    toggleRecruiterSelection,
    showToast,
    isSyncingMail,
    setIsSyncingMail,
    mailSyncStatus,
    setMailSyncStatus,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    handleSort,
  }
}
export type RequirementsVmState = ReturnType<typeof useRequirementsPageState>
