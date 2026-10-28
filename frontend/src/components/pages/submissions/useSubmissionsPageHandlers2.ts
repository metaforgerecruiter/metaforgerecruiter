import React, { useMemo, useState } from 'react'
import type { SubmissionsVmState } from './useSubmissionsPageState'

export function useSubmissionsPageHandlers2(s: SubmissionsVmState & Record<string, any>) {
  const {
    searchQuery, dateFilter, customStartDate, customEndDate,
    statusFilter, clientFilter, filteredData, scopeTab
  } = s

  const [currentPage, setCurrentPage] = useState(1)

  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateFilter, customStartDate, customEndDate, clientFilter, statusFilter, scopeTab])

  const [pageSize, setPageSize] = useState(5)

  const totalPages = Math.ceil((filteredData?.length || 0) / pageSize) || 1

  const paginatedSubmissions = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return (filteredData || []).slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  const getStatusBadgeStyle = (status: string) => {
    const styleKey = status.toLowerCase()
    if (styleKey.includes('lead')) {
      return 'bg-purple-100 text-purple-800 border-purple-200'
    }
    if (styleKey.includes('client')) {
      return 'bg-blue-100 text-blue-800 border-blue-200'
    }
    if (styleKey.includes('interview')) {
      return 'bg-amber-100 text-amber-800 border-amber-200'
    }
    if (styleKey.includes('select')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    }
    if (styleKey.includes('reject')) {
      return 'bg-rose-100 text-rose-800 border-rose-200'
    }
    return 'bg-slate-100 text-slate-700 border-slate-200'
  }

  return {
    currentPage, setCurrentPage, pageSize, setPageSize, totalPages, paginatedSubmissions, getStatusBadgeStyle
  }
}
