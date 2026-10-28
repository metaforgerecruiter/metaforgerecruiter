import { useMemo, useState, useEffect } from 'react'
import { Requirement } from '../../../types'
import type { RequirementsVmState } from './useRequirementsPageState'

/**
 * Safely extracts a canonical Date object representing when a requirement was created/received.
 * Prioritizes ISO timestamps (emailArrivedTimeRaw, firstDetectedAt, createdAt, etc.)
 * and falls back to parsing reqCode/id dates or emailArrivedTime with year correction.
 */
export function getRequirementDate(r: Requirement): Date | null {
  if (!r) return null

  // 1. Prioritize full ISO timestamp strings or Date instances
  const isoCandidates = [
    (r as any).emailArrivedTimeRaw,
    (r as any).firstDetectedAt,
    (r as any).first_detected_at,
    (r as any).sourceEmailReceivedAt,
    (r as any).source_email_received_at,
    (r as any).createdAt,
    (r as any).lastSeenAt,
    (r as any).updatedAt,
    r.dueDate,
  ]

  for (const candidate of isoCandidates) {
    if (candidate) {
      const d = candidate instanceof Date ? candidate : new Date(candidate)
      if (!isNaN(d.getTime()) && d.getFullYear() >= 2020) {
        return d
      }
    }
  }

  // 2. Extract date from reqCode or id (e.g., "2026/05/14-006", "REQ-2026-10-23-011")
  const code = (r.reqCode || r.id || '').trim()
  const m = code.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (m) {
    const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10))
    if (!isNaN(d.getTime())) {
      return d
    }
  }

  // 3. Fallback to emailArrivedTime, fixing year if it defaulted to year 2001
  if (r.emailArrivedTime) {
    const d = new Date(r.emailArrivedTime)
    if (!isNaN(d.getTime())) {
      if (d.getFullYear() < 2020) {
        d.setFullYear(new Date().getFullYear())
      }
      return d
    }
  }

  return null
}

export function getRequirementTimestamp(r: Requirement): number {
  const d = getRequirementDate(r)
  return d ? d.getTime() : 0
}

export function parseRequirementCode(req: Requirement) {
  const code = (req.reqCode || req.id || '').trim()
  const m = code.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})-(\d+)/)
  if (m) {
    const dateNum = parseInt(`${m[1]}${m[2].padStart(2, '0')}${m[3].padStart(2, '0')}`, 10)
    const seqNum = parseInt(m[4], 10)
    return { hasCode: true, dateNum, seqNum }
  }
  return { hasCode: false, dateNum: 0, seqNum: 0 }
}

/** Original creation time of the canonical requirement (never its last update). */
export function getRequirementCreatedTime(r: Requirement): number {
  const d = getRequirementDate(r)
  return d ? d.getTime() : 0
}

/**
 * Default list order, identical to the backend: newest original creation time first,
 * then database insertion order (_id). Updates, holds and reopens never move a requirement.
 */
export function compareRequirementsDescending(a: Requirement, b: Requirement): number {
  const diff = getRequirementCreatedTime(b) - getRequirementCreatedTime(a)
  if (diff !== 0) return diff
  const idA = String((a as any)._id || '')
  const idB = String((b as any)._id || '')
  if (idA !== idB) return idB.localeCompare(idA)
  return (b.reqCode || b.id || '').localeCompare(a.reqCode || a.id || '')
}

export function useRequirementsPageHandlers3(s: RequirementsVmState) {
  const {
    role, localRequirements,
    globalSearch, setGlobalSearch, statusDropdown, setStatusDropdown,
    clientDropdown, setClientDropdown,
    dateFilter, setDateFilter,
    customStartDate, setCustomStartDate,
    customEndDate, setCustomEndDate,
    activeCardFilter, setActiveCardFilter,
    selectedReqIds, setSelectedReqIds,
    sortField = 'reqId', sortOrder = 'desc',
  } = s

  const filteredRequirements = useMemo(() => {
    const list = localRequirements.filter(r => {
      // Date filter
      if (dateFilter && dateFilter !== 'All') {
        const d = getRequirementDate(r)
        if (!d) return false

        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

        if (dateFilter === 'Today') {
          if (d < startOfToday || d > endOfToday) return false
        } else if (dateFilter === 'Yesterday') {
          const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
          const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
          if (d < startOfYesterday || d > endOfYesterday) return false
        } else if (dateFilter === 'This week') {
          const day = (now.getDay() + 6) % 7 // Monday = 0
          const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0, 0, 0, 0)
          if (d < startOfWeek || d > endOfToday) return false
        } else if (dateFilter === 'This month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
          if (d < startOfMonth || d > endOfToday) return false
        } else if (dateFilter === 'Custom range') {
          if (customStartDate || customEndDate) {
            let start: Date | null = null
            let end: Date | null = null

            if (customStartDate) {
              const [sY, sM, sD] = customStartDate.split('-').map(Number)
              if (sY && sM && sD) start = new Date(sY, sM - 1, sD, 0, 0, 0, 0)
            }
            if (customEndDate) {
              const [eY, eM, eD] = customEndDate.split('-').map(Number)
              if (eY && eM && eD) end = new Date(eY, eM - 1, eD, 23, 59, 59, 999)
            }

            if (start && end && start > end) {
              const tmp = start
              start = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0, 0)
              end = new Date(tmp.getFullYear(), tmp.getMonth(), tmp.getDate(), 23, 59, 59, 999)
            }

            if (start && d < start) return false
            if (end && d > end) return false
          }
        }
      }

      // Search query filter (matches Requirement ID, Client Name, Role, Skills, Location, Recruiter, Owner, Emails)
      if (globalSearch.trim()) {
        const query = globalSearch.trim().toLowerCase()

        const reqId = (r.reqCode || r.id || (r as any)._id || '').toLowerCase()
        const clientReqId = (r.sourceClientJdId || (r as any).clientJdId || '').toLowerCase()
        const matchId = reqId.includes(query) || clientReqId.includes(query)

        const client = (r.client || (r as any).clientName || '').toLowerCase()
        const matchClient = client.includes(query)

        const title = (r.title || (r as any).role || '').toLowerCase()
        const matchTitle = title.includes(query)

        const location = (r.location || '').toLowerCase()
        const matchLocation = location.includes(query)

        const owner = (r.owner || '').toLowerCase()
        const recruiterNames = Array.isArray((r as any).assignedRecruiterNames)
          ? (r as any).assignedRecruiterNames.join(' ').toLowerCase()
          : ''
        const matchOwner = owner.includes(query) || recruiterNames.includes(query)

        const clientEmail = (r.clientEmail || '').toLowerCase()
        const toEmails = Array.isArray(r.toEmails) ? r.toEmails.join(' ').toLowerCase() : ''
        const matchEmail = clientEmail.includes(query) || toEmails.includes(query)

        const lead = (r.assignedLead || '').toLowerCase()
        const matchLead = lead.includes(query)

        const skills = Array.isArray(r.skills)
          ? r.skills.join(' ').toLowerCase()
          : (Array.isArray((r as any).skillsRequired) ? (r as any).skillsRequired.join(' ').toLowerCase() : '')
        const mandatorySkills = Array.isArray(r.mandatorySkills) ? r.mandatorySkills.join(' ').toLowerCase() : ''
        const matchSkills = skills.includes(query) || mandatorySkills.includes(query)

        const description = (r.description || '').toLowerCase()
        const matchDesc = description.includes(query)

        const sourceSubject = ((r as any).sourceSubject || (r as any).subject || '').toLowerCase()
        const matchSubject = sourceSubject.includes(query)

        if (!matchId && !matchClient && !matchTitle && !matchLocation && !matchOwner && !matchEmail && !matchLead && !matchSkills && !matchDesc && !matchSubject) {
          return false
        }
      }

      if (clientDropdown !== 'All') {
        const clientVal = (r.client || (r as any).clientName || '').toLowerCase()
        if (clientVal !== clientDropdown.toLowerCase()) return false
      }

      // Status dropdown filter: When actively searching in the global search bar, show all matching client/req records
      // unless the user has explicitly selected a specific status filter (e.g. 'Assigned', 'Closed')
      if (statusDropdown !== 'All') {
        const isDefaultUnassigned = statusDropdown === 'Unassigned'
        const hasSearch = Boolean(globalSearch.trim())

        if (!hasSearch || !isDefaultUnassigned) {
          if (statusDropdown === 'Unassigned') {
            if (r.owner && r.owner !== 'Unassigned' && r.assignmentStatus !== 'Unassigned') return false
          } else if (statusDropdown === 'Assigned') {
            if (!r.owner || r.owner === 'Unassigned' || r.assignmentStatus === 'Unassigned') return false
          } else if (statusDropdown === 'Submitted' || statusDropdown === 'Submitted to Lead' || statusDropdown === 'Submitted to Client') {
            if ((r.submissions || 0) === 0) return false
          } else if (statusDropdown === 'Interview') {
            if ((r.interviews || 0) === 0) return false
          } else if (statusDropdown === 'Selected') {
            if ((r.placed || r.selections || 0) === 0) return false
          } else if (statusDropdown === 'Rejected') {
            if ((r.rejections || 0) === 0) return false
          } else if (statusDropdown === 'Closed') {
            if (r.status !== 'Closed' && r.assignmentStatus !== 'Closed') return false
          } else if (statusDropdown === 'Custom') {
            if (r.status === 'Closed' || r.assignmentStatus === 'Closed') return false
          }
        }
      }

      // Card filters: active when not overridden by global search query
      if (!globalSearch.trim()) {
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
      }

      return true
    })

    // Dynamic sorting: default to Requirement ID descending (highest sequence first)
    const mult = sortOrder === 'asc' ? -1 : 1
    return [...list].sort((a, b) => {
      if (sortField === 'reqId') {
        return compareRequirementsDescending(a, b) * mult
      } else if (sortField === 'client') {
        const cA = a.client || ''
        const cB = b.client || ''
        const comp = cA.localeCompare(cB)
        if (comp !== 0) return comp * (sortOrder === 'asc' ? 1 : -1)
        return compareRequirementsDescending(a, b) * mult
      } else if (sortField === 'role') {
        const rA = a.title || ''
        const rB = b.title || ''
        const comp = rA.localeCompare(rB)
        if (comp !== 0) return comp * (sortOrder === 'asc' ? 1 : -1)
        return compareRequirementsDescending(a, b) * mult
      } else if (sortField === 'arrivedTime') {
        const timeA = getRequirementTimestamp(a)
        const timeB = getRequirementTimestamp(b)
        if (timeB !== timeA) return (timeB - timeA) * mult
        return compareRequirementsDescending(a, b) * mult
      }
      return compareRequirementsDescending(a, b) * mult
    })
  }, [localRequirements, globalSearch, statusDropdown, clientDropdown, dateFilter, customStartDate, customEndDate, activeCardFilter, sortField, sortOrder])

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  useEffect(() => {
    setCurrentPage(1)
  }, [globalSearch, statusDropdown, clientDropdown, dateFilter, customStartDate, customEndDate, activeCardFilter])

  const paginatedRequirements = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRequirements.slice(start, start + pageSize)
  }, [filteredRequirements, currentPage, pageSize])

  const selectablePaginatedReqs = useMemo(() => {
    return paginatedRequirements.filter(r => r.status !== 'Hold' && r.status !== 'On Hold')
  }, [paginatedRequirements])

  const isAllSelected =
    selectablePaginatedReqs.length > 0 &&
    selectablePaginatedReqs.every(r => selectedReqIds.has(r.id))

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedReqIds(new Set())
    } else {
      setSelectedReqIds(new Set(selectablePaginatedReqs.map(r => r.id)))
    }
  }

  const toggleSelectRow = (id: string) => {
    const target = localRequirements.find(r => r.id === id)
    if (target && (target.status === 'Hold' || target.status === 'On Hold')) {
      return
    }
    const next = new Set(selectedReqIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedReqIds(next)
  }

  const handleResetFilters = () => {
    setGlobalSearch('')
    setStatusDropdown('Unassigned')
    setClientDropdown('All')
    setDateFilter('All')
    setCustomStartDate('')
    setCustomEndDate('')
    setActiveCardFilter('ALL')
    setCurrentPage(1)
  }

  const roleLabel =
    role === 'superadmin' || role === 'devteam'
      ? 'Super Admin View'
      : role === 'admin'
        ? 'Admin View'
        : role === 'lead'
          ? 'Team Lead View'
          : 'Recruiter View'

  const [isEditingDemand, setIsEditingDemand] = useState(false)
  const [editingReq, setEditingReq] = useState<Requirement | null>(null)

  const pendingRevokeRequests = useMemo(() => {
    return localRequirements.filter(r => r.revokeRequested)
  }, [localRequirements])

  return {
    filteredRequirements, currentPage, setCurrentPage, pageSize, setPageSize,
    paginatedRequirements, isAllSelected, toggleSelectAll, toggleSelectRow, handleResetFilters,
    roleLabel, isEditingDemand, setIsEditingDemand, editingReq, setEditingReq, pendingRevokeRequests
  }
}
