import { useMemo, useState } from 'react'
import { CandidateRepoItem } from './types'
import { getCandidateSubmissionsHistory } from './history'

export function useCandidateRepoFilters(repoList: CandidateRepoItem[]) {
  const [searchQuery, setSearchQuery] = useState('')
  const [submittedPeriod, setSubmittedPeriod] = useState('All time')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [totalExpFilter, setTotalExpFilter] = useState('All experience')
  const [submissionCountFilter, setSubmissionCountFilter] = useState('All Submissions')
  const [submittedClientFilter, setSubmittedClientFilter] = useState('All Clients')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const uniqueSubmittedClients = useMemo(() => {
    const set = new Set<string>()
    repoList.forEach(item => {
      const history = getCandidateSubmissionsHistory(item)
      history.companies.forEach(c => set.add(c))
    })
    return Array.from(set).sort()
  }, [repoList])

  // Filter repo list dynamically
  const filteredList = useMemo(() => {
    return repoList.filter(item => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = item.name.toLowerCase().includes(q)
        const matchId = item.candidateId.toLowerCase().includes(q)
        const matchTech = item.technology.toLowerCase().includes(q)
        const matchCreator = item.createdBy.toLowerCase().includes(q)
        const matchSkills = (item.skills || '').toLowerCase().includes(q)
        const matchCompany = (item.currentCompany || '').toLowerCase().includes(q)
        if (!matchName && !matchId && !matchTech && !matchCreator && !matchSkills && !matchCompany) return false
      }

      // Date / Submitted Period Filter
      if (submittedPeriod && submittedPeriod !== 'All time') {
        const rawDate = item.createdDate || ''
        if (!rawDate) return false
        const d = new Date(rawDate)
        if (isNaN(d.getTime())) return false

        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

        if (submittedPeriod === 'Today') {
          if (d < startOfToday || d > endOfToday) return false
        } else if (submittedPeriod === 'Yesterday') {
          const startOfYesterday = new Date(startOfToday.getTime() - 86400000)
          const endOfYesterday = new Date(endOfToday.getTime() - 86400000)
          if (d < startOfYesterday || d > endOfYesterday) return false
        } else if (submittedPeriod === 'This week') {
          const day = (now.getDay() + 6) % 7
          const startOfWeek = new Date(startOfToday.getTime() - day * 86400000)
          if (d < startOfWeek || d > endOfToday) return false
        } else if (submittedPeriod === 'This month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
          if (d < startOfMonth || d > endOfToday) return false
        } else if (submittedPeriod === 'Custom range') {
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

      const subHistory = getCandidateSubmissionsHistory(item)

      // 2. Submission Count Filter
      if (submissionCountFilter !== 'All Submissions') {
        if (submissionCountFilter === 'Not Submitted Yet' && subHistory.count !== 0) return false
        if (submissionCountFilter === 'Submitted 1+ times' && subHistory.count < 1) return false
        if (submissionCountFilter === 'Submitted 2+ times' && subHistory.count < 2) return false
        if (submissionCountFilter === 'Submitted 3+ times' && subHistory.count < 3) return false
      }

      // 3. Submitted Client Filter
      if (submittedClientFilter !== 'All Clients') {
        const clientTarget = submittedClientFilter.toLowerCase()
        const matchesClient = subHistory.companies.some(c => c.toLowerCase().includes(clientTarget))
        if (!matchesClient) return false
      }

      // 4. Total Experience Filter
      if (totalExpFilter !== 'All experience') {
        const expMatch = item.totalExperience.match(/\d+/)
        const years = expMatch ? parseInt(expMatch[0], 10) : 0
        if (totalExpFilter === '0–2 years' && (years < 0 || years > 2)) return false
        if (totalExpFilter === '2–5 years' && (years < 2 || years > 5)) return false
        if (totalExpFilter === '5–8 years' && (years < 5 || years > 8)) return false
        if (totalExpFilter === '8–10 years' && (years < 8 || years > 10)) return false
        if (totalExpFilter === '10+ years' && years < 10) return false
      }

      return true
    })
  }, [repoList, searchQuery, submittedPeriod, customStartDate, customEndDate, submissionCountFilter, submittedClientFilter, totalExpFilter])

  const paginatedRepoList = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredList.slice(start, start + pageSize)
  }, [filteredList, currentPage, pageSize])

  return {
    searchQuery,
    setSearchQuery,
    submittedPeriod,
    setSubmittedPeriod,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    totalExpFilter,
    setTotalExpFilter,
    submissionCountFilter,
    setSubmissionCountFilter,
    submittedClientFilter,
    setSubmittedClientFilter,
    uniqueSubmittedClients,
    filteredList,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    paginatedRepoList,
  }
}
