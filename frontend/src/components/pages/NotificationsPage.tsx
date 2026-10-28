import React, { useState, useEffect, useMemo } from 'react'
import {
  Bell,
  CheckCircle2,
  Clock,
  Calendar,
  UserCheck,
  AlertCircle,
  X,
  Check,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Inbox,
  CheckCheck,
  Tag,
  FileText,
} from 'lucide-react'
import { notificationsService } from '../../services/workspace.service'
import { brand } from '../../theme'
import { PaginationFooter } from '../ui/PaginationFooter'
import { isAuditLogNotification, isRequirementNotification } from '../ui/NotificationPopover'

interface StoredNotification {
  id: string
  title: string
  message: string
  type: string
  entityType?: string
  entityId?: string
  read: boolean
  readAt?: string | null
  createdAt?: string
  updatedAt?: string
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return 'Just now'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return 'Just now'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<StoredNotification[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [activeToggle, setActiveToggle] = useState<'all' | 'requirements' | 'audit_logs'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const fetchNotifications = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await notificationsService.list()
      const rawItems = Array.isArray(res) ? res : res?.items || []
      const items: StoredNotification[] = rawItems.map((n: any) => ({
        id: n._id || n.id || String(Math.random()),
        title: n.title || 'Notification',
        message: n.message || n.body || '',
        type: n.type || 'system',
        entityType: n.entityType || 'system',
        entityId: n.entityId || null,
        read: Boolean(n.read || n.readAt),
        readAt: n.readAt || null,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }))
      setNotifications(items)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to fetch stored notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() })))
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to mark all read')
    }
  }

  const handleMarkRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return
    try {
      await notificationsService.markRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n))
      )
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to mark read')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await notificationsService.remove(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete notification')
    }
  }

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])
  const readCount = useMemo(() => notifications.filter(n => n.read).length, [notifications])
  const reqCount = useMemo(() => notifications.filter(n => isRequirementNotification(n as any)).length, [notifications])
  const auditCount = useMemo(() => notifications.filter(n => isAuditLogNotification(n as any)).length, [notifications])

  const filteredNotifications = useMemo(() => {
    return notifications.filter(item => {
      // Toggle filter
      if (activeToggle === 'requirements' && !isRequirementNotification(item as any)) return false
      if (activeToggle === 'audit_logs' && !isAuditLogNotification(item as any)) return false

      // Status filter
      if (statusFilter === 'unread' && item.read) return false
      if (statusFilter === 'read' && !item.read) return false

      // Category filter
      if (categoryFilter !== 'all') {
        const cat = item.type.toLowerCase()
        if (categoryFilter === 'attendance') {
          if (!cat.includes('attendance') && !cat.includes('missing_login')) return false
        } else if (!cat.includes(categoryFilter.toLowerCase())) {
          return false
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const term = searchQuery.toLowerCase().trim()
        const titleMatch = item.title.toLowerCase().includes(term)
        const messageMatch = item.message.toLowerCase().includes(term)
        return titleMatch || messageMatch
      }

      return true
    })
  }, [notifications, activeToggle, statusFilter, categoryFilter, searchQuery])

  const totalPages = Math.ceil(filteredNotifications.length / pageSize) || 1
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredNotifications.slice(start, start + pageSize)
  }, [filteredNotifications, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, categoryFilter, pageSize])

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner Header */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-sans">Notification Center</h2>
              {unreadCount > 0 && (
                <span className="bg-blue-600 text-white text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-body">
              All stored notifications, activity webhooks, and recruitment event updates in MongoDB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotifications}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-2 transition-colors border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-lg"
            >
              <CheckCheck className="w-4 h-4" /> Mark All as Read
            </button>
          )}
        </div>
      </div>

      {/* Toggle: All Notifications | Requirements | Audit Logs */}
      <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 gap-2 max-w-lg">
        <button
          type="button"
          onClick={() => setActiveToggle('all')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeToggle === 'all'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>All</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
            {notifications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveToggle('requirements')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeToggle === 'requirements'
              ? 'bg-[#6B3BF6] text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Requirements</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeToggle === 'requirements' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {reqCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveToggle('audit_logs')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
            activeToggle === 'audit_logs'
              ? 'bg-[#6B3BF6] text-white shadow-md shadow-purple-500/20'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Audit Logs</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeToggle === 'audit_logs' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {auditCount}
          </span>
        </button>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium font-sans">Total Notifications</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 font-mono">{notifications.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Inbox className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium font-sans">Unread Messages</p>
            <p className="text-2xl font-bold text-blue-600 mt-1 font-mono">{unreadCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Bell className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium font-sans">Read & Archived</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1 font-mono">{readCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search notification title or content..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-body"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setStatusFilter('unread')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === 'unread' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setStatusFilter('read')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                statusFilter === 'read' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Read ({readCount})
            </button>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-600 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-transparent focus:outline-none text-slate-800 font-semibold cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="attendance">Attendance & Login Alerts</option>
              <option value="requirement">Requirements</option>
              <option value="submission">Submissions</option>
              <option value="interview">Interviews</option>
              <option value="offer">Offers & Placements</option>
              <option value="candidate">Candidates</option>
            </select>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Notifications Data Feed List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading && notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-mono flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
            Loading notifications from MongoDB database...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-mono flex flex-col items-center gap-2">
            <Inbox className="w-8 h-8 text-slate-300" />
            No notifications match your current filter
          </div>
        ) : (
          <>
          <div className="divide-y divide-slate-100">
            {paginatedNotifications.map(n => (
              <div
                key={n.id}
                className={`p-4 transition-all flex items-start gap-4 hover:bg-slate-50/80 ${
                  n.read ? 'bg-white' : 'bg-blue-50/30'
                }`}
              >
                {/* Category Icon */}
                <div className="mt-0.5 flex-shrink-0">
                  {n.type.includes('attendance') || n.type.includes('missing_login') ? (
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
                      <Clock className="w-4 h-4" />
                    </div>
                  ) : n.type.includes('interview') ? (
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
                      <Calendar className="w-4 h-4" />
                    </div>
                  ) : n.type.includes('submission') || n.type.includes('lead') ? (
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  ) : n.type.includes('offer') || n.type.includes('placement') || n.type.includes('placed') ? (
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {isAuditLogNotification(n as any) ? (
                        <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-200 font-mono">
                          AUDIT LOG
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#6B3BF6] text-[10px] font-extrabold border border-purple-200 font-mono">
                          REQUIREMENT
                        </span>
                      )}
                      <h3 className="text-sm font-bold text-slate-900 font-sans">{n.title}</h3>
                      {!n.read ? (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-mono font-bold rounded-full border border-blue-200">
                          UNREAD
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-mono font-medium rounded-full">
                          READ
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1" title={formatTime(n.createdAt)}>
                        <Clock className="w-3 h-3 text-slate-400" /> {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-body leading-relaxed mb-2">{n.message}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <Tag className="w-3 h-3 text-slate-400" />
                      <span>ID: {n.id}</span>
                      {n.entityType && (
                        <span className="capitalize text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {n.entityType}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <button
                          onClick={() => handleMarkRead(n.id, false)}
                          className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium flex items-center gap-1 transition-colors"
                        >
                          <Check className="w-3 h-3" /> Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="px-2.5 py-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Delete notification permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredNotifications.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="notifications"
          />
          </>
        )}
      </div>
    </div>
  )
}
