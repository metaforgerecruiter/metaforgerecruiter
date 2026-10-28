import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Activity,
  Search,
  ChevronDown,
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  Eye,
  RefreshCw,
  Download,
  Calendar,
  Lock,
  LogIn,
  LogOut,
  X,
  AlertCircle,
  Laptop,
} from 'lucide-react'
import { Role, ActivityLogItem } from '../../types'
import { PaginationFooter } from '../ui/PaginationFooter'
import { auditService, UserAuditLogItem } from '../../services/workspace.service'

export type { ActivityLogItem }

interface ActivityLogsPageProps {
  role?: Role
  logs?: ActivityLogItem[]
}

function getTodayIST(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function getYesterdayIST(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return '—'
  const parts = dateStr.split('-').map(Number)
  if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return dateStr
  const [y, m, d] = parts
  const dt = new Date(Date.UTC(y, m - 1, d))
  return dt.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  })
}

export function ActivityLogsPage({ role = 'superadmin', logs = [] }: ActivityLogsPageProps) {
  const isSuperAdmin = role === 'superadmin' || role === 'devteam'

  // Main Tab State: 'login_reports' (User Audit Logs) | 'audit_trail' (Action Logs)
  const [activeTab, setActiveTab] = useState<'login_reports' | 'audit_trail'>('login_reports')

  // Date Filter State
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('all')
  const [customDate, setCustomDate] = useState<string>('')

  // Search & Role & Status Filters for Tab 1
  const [loginSearch, setLoginSearch] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All Roles')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Statuses')

  // Pagination for Tab 1
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Data State for Tab 1
  const [auditRecords, setAuditRecords] = useState<UserAuditLogItem[]>([])
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditTotalPages, setAuditTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('')

  // Modal State
  const [selectedRecord, setSelectedRecord] = useState<UserAuditLogItem | null>(null)
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null)

  // Tab 2 (Action Logs) Filters & Pagination
  const [auditSearchQuery, setAuditSearchQuery] = useState('')
  const [auditRoleFilter, setAuditRoleFilter] = useState('All Roles')
  const [auditCategoryFilter, setAuditCategoryFilter] = useState('All Categories')
  const [auditStatusFilter, setAuditStatusFilter] = useState('All Statuses')
  const [auditCurrentPage, setAuditCurrentPage] = useState(1)
  const [auditPageSize, setAuditPageSize] = useState(10)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Calculate actual Date query parameter
  const computedDateFilter = useMemo(() => {
    if (selectedDatePreset === 'today') return getTodayIST()
    if (selectedDatePreset === 'yesterday') return getYesterdayIST()
    if (selectedDatePreset === 'custom' && customDate) return customDate
    return undefined
  }, [selectedDatePreset, customDate])

  // Fetch real audit logs from backend
  const fetchAuditLogs = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setIsLoading(true)
      try {
        const res = await auditService.getUserLogs({
          date: computedDateFilter,
          role: selectedRoleFilter !== 'All Roles' ? selectedRoleFilter.toLowerCase() : undefined,
          status: selectedStatusFilter !== 'All Statuses' ? selectedStatusFilter : undefined,
          search: loginSearch.trim() || undefined,
          page: currentPage,
          limit: pageSize,
        })

        if (res && res.success) {
          setAuditRecords(res.data || [])
          setAuditTotal(res.meta?.total || 0)
          setAuditTotalPages(res.meta?.totalPages || 1)
          const nowStr = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          }).format(new Date())
          setLastRefreshedAt(nowStr)
        }
      } catch (err: any) {
        console.error('Failed to fetch user audit logs:', err)
        if (!isSilent) {
          showToast(`Error loading audit logs: ${err.message || 'Server error'}`)
        }
      } finally {
        if (!isSilent) setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [computedDateFilter, selectedRoleFilter, selectedStatusFilter, loginSearch, currentPage, pageSize]
  )

  // Initial and reactive fetch
  useEffect(() => {
    fetchAuditLogs(false)
  }, [fetchAuditLogs])

  // Auto-refresh every 15 seconds to automatically update user statuses using live database data
  useEffect(() => {
    const timer = setInterval(() => {
      fetchAuditLogs(true)
    }, 15000)
    return () => clearInterval(timer)
  }, [fetchAuditLogs])

  // Manual Refresh
  const handleManualRefresh = () => {
    setIsRefreshing(true)
    fetchAuditLogs(false)
    showToast('Audit logs refreshed successfully!')
  }

  // Super Admin CSV Export Handler
  const handleExportCsv = async () => {
    if (!isSuperAdmin) {
      showToast('Access Denied: Only Super Admin is authorized to download audit logs as CSV.')
      return
    }

    setIsExporting(true)
    try {
      await auditService.downloadCsv({
        date: computedDateFilter,
        role: selectedRoleFilter !== 'All Roles' ? selectedRoleFilter.toLowerCase() : undefined,
        status: selectedStatusFilter !== 'All Statuses' ? selectedStatusFilter : undefined,
        search: loginSearch.trim() || undefined,
      })
      showToast('Filtered audit logs CSV exported successfully!')
    } catch (err: any) {
      showToast(`Export failed: ${err.message || 'Unauthorized or server error'}`)
    } finally {
      setIsExporting(false)
    }
  }

  // Role Badge Helper
  const getRoleBadge = (roleName?: string) => {
    const r = (roleName || '').toLowerCase()
    if (r.includes('super')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-900 border border-rose-200">
          Super Admin
        </span>
      )
    }
    if (r.includes('admin')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">
          Admin
        </span>
      )
    }
    if (r.includes('lead')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
          Team Lead
        </span>
      )
    }
    if (r.includes('dev')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-200">
          Dev Team
        </span>
      )
    }
    if (r.includes('client')) {
      return (
        <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
          Client
        </span>
      )
    }
    return (
      <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-100 text-[#6B3BF6] border border-purple-200">
        Recruiter
      </span>
    )
  }

  // Status Badge Helper
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active</span>
          </span>
        )
      case 'Logged Out':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <LogOut className="w-3 h-3 text-slate-500" />
            <span>Logged Out</span>
          </span>
        )
      case 'Session Expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Session Expired</span>
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {status || 'Unknown'}
          </span>
        )
    }
  }

  // KPI Calculations from real backend data
  const kpiActiveCount = useMemo(
    () => auditRecords.filter((r) => r.status === 'Active').length,
    [auditRecords]
  )
  const kpiLoggedOutCount = useMemo(
    () => auditRecords.filter((r) => r.status === 'Logged Out').length,
    [auditRecords]
  )
  const kpiExpiredCount = useMemo(
    () => auditRecords.filter((r) => r.status === 'Session Expired').length,
    [auditRecords]
  )

  // Filtered logs for Tab 2 (Action Logs)
  const filteredActionLogs = useMemo(() => {
    return (logs || []).filter((log) => {
      if (auditRoleFilter !== 'All Roles') {
        const r = (log.userRole || '').toLowerCase()
        if (auditRoleFilter === 'Team Lead' && r !== 'lead') return false
        if (auditRoleFilter === 'Recruiter' && r !== 'recruiter') return false
        if (auditRoleFilter === 'Admin' && r !== 'admin') return false
        if (auditRoleFilter === 'Super Admin' && r !== 'superadmin' && r !== 'devteam') return false
      }
      if (auditCategoryFilter !== 'All Categories' && log.category !== auditCategoryFilter) return false
      if (auditStatusFilter !== 'All Statuses' && log.status !== auditStatusFilter) return false
      if (auditSearchQuery.trim()) {
        const q = auditSearchQuery.toLowerCase()
        const matchUser = (log.userName || '').toLowerCase().includes(q)
        const matchEmail = (log.userEmail || '').toLowerCase().includes(q)
        const matchAction = (log.action || '').toLowerCase().includes(q)
        const matchClient = (log.clientName || '').toLowerCase().includes(q)
        if (!matchUser && !matchEmail && !matchAction && !matchClient) return false
      }
      return true
    })
  }, [logs, auditRoleFilter, auditCategoryFilter, auditStatusFilter, auditSearchQuery])

  const paginatedActionLogs = useMemo(() => {
    const start = (auditCurrentPage - 1) * auditPageSize
    return filteredActionLogs.slice(start, start + auditPageSize)
  }, [filteredActionLogs, auditCurrentPage, auditPageSize])

  const totalActionPages = Math.ceil(filteredActionLogs.length / auditPageSize) || 1

  return (
    <div className="space-y-6 w-full pb-20 font-sans text-slate-800 animate-in fade-in duration-200">
      {/* 1. HEADER & CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
            <span className="px-3 py-1 bg-purple-50 text-[#6B3BF6] text-xs font-extrabold rounded-full border border-purple-200 flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#6B3BF6]" />
              <span>Admin & Super Admin Audit Module</span>
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Sync (Asia/Kolkata)</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Displaying user name, role, date, preserved first login time of each day, latest logout time, and real-time status.
            {lastRefreshedAt && <span className="ml-2 font-mono text-[11px] text-slate-400">• Last synced at {lastRefreshedAt} IST</span>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* CSV Export Button: Enabled for Super Admin, Disabled with Lock for Admin */}
          {isSuperAdmin ? (
            <button
              onClick={handleExportCsv}
              disabled={isExporting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Download filtered audit logs as CSV"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
              <span>{isExporting ? 'Exporting CSV...' : 'Download CSV'}</span>
            </button>
          ) : (
            <div className="relative group">
              <button
                disabled
                className="px-4 py-2 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-not-allowed opacity-80"
                title="Only Super Admin is authorized to download audit logs as CSV"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Download CSV (Super Admin Only)</span>
              </button>
              <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[11px] px-2.5 py-1 rounded-lg shadow-xl whitespace-nowrap z-20">
                Admin can view logs; only Super Admin can export CSV.
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing || isLoading}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
            title="Refresh logs from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-[#6B3BF6]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. TAB NAVIGATION SWITCHER */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
        <button
          onClick={() => {
            setActiveTab('login_reports')
            setCurrentPage(1)
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'login_reports'
              ? 'bg-[#6B3BF6] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>User Login & Session Audit Logs</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-white/20 font-black">
            {auditTotal}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('audit_trail')
            setAuditCurrentPage(1)
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'audit_trail'
              ? 'bg-[#6B3BF6] text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>System Action Audit Trail</span>
          <span className="px-2 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-700 font-black">
            {filteredActionLogs.length}
          </span>
        </button>
      </div>

      {/* TAB 1: USER AUDIT LOGS */}
      {activeTab === 'login_reports' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* KPI METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-purple-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Audit Log Entries</span>
                <ShieldCheck className="w-4 h-4 text-[#6B3BF6]" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{auditTotal}</p>
              <p className="text-[10px] text-purple-700 font-medium">Logged user sessions recorded</p>
            </div>

            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Sessions</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{kpiActiveCount}</p>
              <p className="text-[10px] text-emerald-700 font-medium">Users currently active in application</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-slate-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Logged Out Today</span>
                <LogOut className="w-4 h-4 text-slate-500" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{kpiLoggedOutCount}</p>
              <p className="text-[10px] text-slate-500 font-medium">Sessions with confirmed sign out</p>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-1 shadow-2xs">
              <div className="flex items-center justify-between text-amber-800">
                <span className="text-[11px] font-bold uppercase tracking-wider">Session Expired</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 font-mono">{kpiExpiredCount}</p>
              <p className="text-[10px] text-amber-700 font-medium">Timed-out or closed sessions</p>
            </div>
          </div>

          {/* FILTER CONTROLS FOR USER AUDIT LOGS */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user name or email..."
                  value={loginSearch}
                  onChange={(e) => {
                    setLoginSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800 font-medium"
                />
              </div>

              {/* Filter Controls: Date, Role, Status */}
              <div className="flex flex-wrap items-center gap-3">
                {/* DATE FILTER */}
                <div className="flex items-center gap-2 bg-purple-50/80 border border-purple-200 rounded-xl px-3 py-1.5 shadow-2xs">
                  <Calendar className="w-4 h-4 text-[#6B3BF6] shrink-0" />
                  <span className="text-xs font-black text-[#6B3BF6] whitespace-nowrap">Date:</span>
                  <div className="relative">
                    <select
                      value={selectedDatePreset}
                      onChange={(e) => {
                        const val = e.target.value
                        setSelectedDatePreset(val)
                        if (val !== 'custom') setCustomDate('')
                        setCurrentPage(1)
                      }}
                      className="appearance-none pl-2.5 pr-7 py-1 text-xs bg-white border border-purple-200 rounded-lg font-bold text-slate-800 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
                    >
                      <option value="all">All Dates</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="custom">Custom Date</option>
                    </select>
                    <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>

                  {selectedDatePreset === 'custom' && (
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => {
                        setCustomDate(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="px-2.5 py-1 text-xs bg-white border border-purple-300 rounded-lg font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#6B3BF6]"
                    />
                  )}

                  {(selectedDatePreset !== 'all' || customDate !== '') && (
                    <button
                      onClick={() => {
                        setSelectedDatePreset('all')
                        setCustomDate('')
                        setCurrentPage(1)
                      }}
                      className="p-1 hover:bg-purple-200/80 rounded-lg text-purple-700 transition-colors cursor-pointer"
                      title="Clear Date Filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* ROLE FILTER */}
                <div className="relative">
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => {
                      setSelectedRoleFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="appearance-none pl-3.5 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
                  >
                    <option value="All Roles">All Roles</option>
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="lead">Team Lead</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="devteam">Dev Team</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* STATUS FILTER */}
                <div className="relative">
                  <select
                    value={selectedStatusFilter}
                    onChange={(e) => {
                      setSelectedStatusFilter(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="appearance-none pl-3.5 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
                  >
                    <option value="All Statuses">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Logged Out">Logged Out</option>
                    <option value="Session Expired">Session Expired</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* USER AUDIT LOGS TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">USER NAME</th>
                    <th className="py-3.5 px-4">ROLE</th>
                    <th className="py-3.5 px-4">DATE</th>
                    <th className="py-3.5 px-4">FIRST LOGIN TIME (IST)</th>
                    <th className="py-3.5 px-4">LATEST LOGOUT TIME (IST)</th>
                    <th className="py-3.5 px-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {isLoading && auditRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#6B3BF6] mb-2" />
                        <p className="font-bold text-sm text-slate-700">Loading audit records from database...</p>
                      </td>
                    </tr>
                  ) : auditRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm text-slate-700">No audit records found</p>
                        <p className="text-xs mt-1">Try adjusting the date, role, or status filter</p>
                      </td>
                    </tr>
                  ) : (
                    auditRecords.map((rec) => {
                      const avatarChar = String(rec.userName || rec.userEmail || 'U').charAt(0).toUpperCase()
                      return (
                        <tr
                          key={rec.id || rec._id}
                          onClick={() => setSelectedRecord(rec)}
                          className="hover:bg-purple-50/40 transition-colors cursor-pointer"
                        >
                          {/* USER NAME */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6B3BF6] font-extrabold flex items-center justify-center text-xs shrink-0 border border-purple-200 shadow-2xs">
                                {avatarChar}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 text-xs">{rec.userName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{rec.userEmail}</div>
                              </div>
                            </div>
                          </td>

                          {/* ROLE */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {getRoleBadge(rec.role)}
                          </td>

                          {/* DATE */}
                          <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                            {formatDateDisplay(rec.date)}
                            <div className="text-[10px] text-slate-400 font-mono">{rec.date}</div>
                          </td>

                          {/* FIRST LOGIN TIME (IST) - Preserved */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs font-extrabold">
                              <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{rec.firstLoginFormattedIST || '—'}</span>
                            </span>
                          </td>

                          {/* LATEST LOGOUT TIME (IST) */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {rec.status === 'Active' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-xs font-extrabold">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Active Session</span>
                                {rec.latestLogoutFormattedIST && (
                                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                                    (Last: {rec.latestLogoutFormattedIST})
                                  </span>
                                )}
                              </span>
                            ) : rec.latestLogoutFormattedIST ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-mono text-xs font-extrabold">
                                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                                <span>{rec.latestLogoutFormattedIST}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono text-xs">—</span>
                            )}
                          </td>

                          {/* STATUS */}
                          <td className="py-4 px-4 whitespace-nowrap">
                            {getStatusBadge(rec.status)}
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
              totalPages={auditTotalPages}
              totalItems={auditTotal}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setCurrentPage(1)
              }}
              itemLabel="audit records"
            />
          </div>
        </div>
      )}

      {/* TAB 2: SYSTEM ACTION AUDIT TRAIL */}
      {activeTab === 'audit_trail' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="relative w-full lg:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user, action, client..."
                  value={auditSearchQuery}
                  onChange={(e) => {
                    setAuditSearchQuery(e.target.value)
                    setAuditCurrentPage(1)
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800 font-medium"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <select
                    value={auditRoleFilter}
                    onChange={(e) => {
                      setAuditRoleFilter(e.target.value)
                      setAuditCurrentPage(1)
                    }}
                    className="appearance-none pl-3.5 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
                  >
                    <option value="All Roles">All User Roles</option>
                    <option value="Team Lead">Team Lead</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Admin">Admin</option>
                    <option value="Super Admin">Super Admin & Dev</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative">
                  <select
                    value={auditCategoryFilter}
                    onChange={(e) => {
                      setAuditCategoryFilter(e.target.value)
                      setAuditCurrentPage(1)
                    }}
                    className="appearance-none pl-3.5 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
                  >
                    <option value="All Categories">All Categories</option>
                    <option value="Candidate Sourcing">Candidate Sourcing</option>
                    <option value="Submissions">Submissions</option>
                    <option value="Requirements">Requirements</option>
                    <option value="User Management">User Management</option>
                    <option value="Client Management">Client Management</option>
                    <option value="System & Access">System & Access</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">TIMESTAMP</th>
                    <th className="py-3.5 px-4">PERFORMED BY</th>
                    <th className="py-3.5 px-4">ROLE</th>
                    <th className="py-3.5 px-4">ACTION & DETAILS</th>
                    <th className="py-3.5 px-4">CATEGORY</th>
                    <th className="py-3.5 px-4">TARGET / CLIENT</th>
                    <th className="py-3.5 px-4">STATUS</th>
                    <th className="py-3.5 px-4 text-center">INSPECT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {paginatedActionLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-sm text-slate-700">No action logs found</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedActionLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-purple-50/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{log.timestamp}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{log.ipAddress}</div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-[#6B3BF6] font-extrabold flex items-center justify-center text-xs shrink-0 border border-purple-200">
                              {log.userAvatar}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 text-xs">{log.userName}</div>
                              <div className="text-[10px] text-slate-400 font-normal">{log.userEmail}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">{getRoleBadge(log.userRole)}</td>

                        <td className="py-4 px-4 max-w-sm">
                          <div className="font-extrabold text-slate-900 text-xs leading-snug">{log.action}</div>
                          {log.details && (
                            <div className="text-[11px] text-slate-500 font-normal truncate mt-0.5">{log.details}</div>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {log.category}
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          {log.clientName ? (
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                              <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                              <span>{log.clientName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-normal text-xs">{log.targetEntity || '—'}</span>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Success</span>
                          </span>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 cursor-pointer shadow-2xs flex items-center gap-1 mx-auto"
                          >
                            <Eye className="w-3 h-3 text-[#6B3BF6]" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationFooter
              currentPage={auditCurrentPage}
              totalPages={totalActionPages}
              totalItems={filteredActionLogs.length}
              pageSize={auditPageSize}
              onPageChange={setAuditCurrentPage}
              onPageSizeChange={(newSize) => {
                setAuditPageSize(newSize)
                setAuditCurrentPage(1)
              }}
              itemLabel="logs"
            />
          </div>
        </div>
      )}

      {/* INSPECT USER AUDIT RECORD MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 text-[#6B3BF6] font-black flex items-center justify-center text-base border border-purple-200">
                  {String(selectedRecord.userName || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{selectedRecord.userName}</h3>
                    {getRoleBadge(selectedRecord.role)}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">{selectedRecord.userEmail}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <span className="text-[10px] text-purple-700 font-bold block">Log Date (IST)</span>
                  <span className="text-xs font-mono font-extrabold text-slate-900">
                    {formatDateDisplay(selectedRecord.date)} ({selectedRecord.date})
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Current Session Status</span>
                  <div className="mt-1">{getStatusBadge(selectedRecord.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-[10px] text-emerald-700 font-bold block">First Login Time (Preserved)</span>
                  <span className="text-xs font-mono font-extrabold text-emerald-950">
                    {selectedRecord.firstLoginFormattedIST || '—'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Latest Logout Time</span>
                  <span className="text-xs font-mono font-extrabold text-slate-900">
                    {selectedRecord.latestLogoutFormattedIST || 'Active / No Logout'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Login Count Today</span>
                  <span className="text-xs font-mono font-extrabold text-purple-700">
                    {selectedRecord.loginCount || 1} Login(s)
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block">Network IP Address</span>
                  <span className="text-xs font-mono font-extrabold text-slate-900">
                    {selectedRecord.ipAddress || '127.0.0.1'}
                  </span>
                </div>
              </div>

              {selectedRecord.userAgent && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block flex items-center gap-1">
                    <Laptop className="w-3 h-3 text-slate-400" />
                    <span>Client / User Agent</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-600 block mt-0.5 truncate">
                    {selectedRecord.userAgent}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSPECT ACTION LOG MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#6B3BF6] font-extrabold flex items-center justify-center text-sm border border-purple-200">
                  {selectedLog.userAvatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900">{selectedLog.userName}</h3>
                    {getRoleBadge(selectedLog.userRole)}
                  </div>
                  <p className="text-xs text-slate-500 font-mono">
                    {selectedLog.userEmail} • IP {selectedLog.ipAddress}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Action Description
                </span>
                <p className="text-sm font-extrabold text-slate-900">{selectedLog.action}</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-medium">
                  <span>
                    Category: <strong>{selectedLog.category}</strong>
                  </span>
                  <span>
                    Time: <strong>{selectedLog.timestamp}</strong>
                  </span>
                </div>
              </div>

              {selectedLog.details && (
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Detailed Execution Payload
                  </span>
                  <div className="p-3.5 bg-slate-900 text-emerald-400 font-mono rounded-2xl text-[11px] leading-relaxed border border-slate-800">
                    {selectedLog.details}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
              >
                Close Audit Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-12 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
