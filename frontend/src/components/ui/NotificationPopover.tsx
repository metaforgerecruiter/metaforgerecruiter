import React, { useState, useMemo } from 'react'
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
  FileText,
  ShieldCheck,
  LogIn,
  LogOut,
  CheckCheck,
} from 'lucide-react'
import { NotificationItem } from '../../hooks/useNotificationSystem'

interface NotificationPopoverProps {
  isOpen: boolean
  onClose: () => void
  notifications: NotificationItem[]
  unreadCount: number
  loading: boolean
  errorMsg: string | null
  onRefresh: () => void
  onMarkAllAsRead: () => void
  onMarkRead: (id: string, read: boolean) => void
  onDelete: (id: string, wasUnread: boolean) => void
}

/**
 * Determines whether a notification is related to login/logout time,
 * attendance, or session status (Audit Log).
 */
export function isAuditLogNotification(n: NotificationItem): boolean {
  const type = (n.type || '').toLowerCase()
  const title = (n.title || '').toLowerCase()
  const msg = (n.message || '').toLowerCase()

  if (
    type.includes('attendance') ||
    type.includes('missing_login') ||
    type.includes('login') ||
    type.includes('logout') ||
    type.includes('audit')
  ) {
    return true
  }

  if (
    msg.includes('not logged in still') ||
    msg.includes('logged in by 09:45') ||
    msg.includes('logged in') ||
    msg.includes('logout') ||
    msg.includes('session expired') ||
    msg.includes('attendance') ||
    title.includes('missing login') ||
    title.includes('attendance') ||
    title.includes('not logged in')
  ) {
    return true
  }

  return false
}

/**
 * Determines whether a notification belongs to requirements
 * (e.g. requirements assigned, submissions, interviews, candidate activities).
 */
export function isRequirementNotification(n: NotificationItem): boolean {
  if (isAuditLogNotification(n)) return false
  return true
}

export function NotificationPopover({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  loading,
  errorMsg,
  onRefresh,
  onMarkAllAsRead,
  onMarkRead,
  onDelete,
}: NotificationPopoverProps) {
  // Toggle: 'requirements' | 'audit_logs' | 'all'
  const [activeToggle, setActiveToggle] = useState<'all' | 'requirements' | 'audit_logs'>('all')

  // Calculate counts for each toggle
  const reqCount = useMemo(
    () => notifications.filter(isRequirementNotification).length,
    [notifications]
  )
  const auditCount = useMemo(
    () => notifications.filter(isAuditLogNotification).length,
    [notifications]
  )
  const allCount = notifications.length

  // Filtered list based on active toggle
  const displayedNotifications = useMemo(() => {
    if (activeToggle === 'requirements') {
      return notifications.filter(isRequirementNotification)
    }
    if (activeToggle === 'audit_logs') {
      return notifications.filter(isAuditLogNotification)
    }
    return notifications
  }, [notifications, activeToggle])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl border border-slate-200 max-w-xl sm:max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header (Referenced Picture Layout) */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#6B3BF6] font-extrabold flex items-center justify-center text-sm border border-purple-200 shadow-2xs">
              <Bell className="w-5 h-5 text-[#6B3BF6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">Notifications</h3>
                {unreadCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-mono font-extrabold border border-red-200">
                    {unreadCount} UNREAD
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold border border-emerald-200">
                    ALL CAUGHT UP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time activity alerts, requirement updates & audit login tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onRefresh}
              title="Refresh notifications"
              className="p-2 hover:bg-purple-50 text-slate-400 hover:text-[#6B3BF6] rounded-xl transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              title="Close modal"
              className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="px-4 py-2.5 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-center justify-between">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Toggle Switch: All | Requirements | Audit Logs */}
        <div className="flex items-center p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 gap-1.5">
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
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                activeToggle === 'all' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200/60 text-slate-600'
              }`}
            >
              {allCount}
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
                activeToggle === 'requirements' ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'
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
                activeToggle === 'audit_logs' ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'
              }`}
            >
              {auditCount}
            </span>
          </button>
        </div>

        {/* Scrollable Notification List */}
        <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1 divide-y divide-slate-100">
          {loading && notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-mono flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#6B3BF6]" />
              <span>Loading notifications...</span>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-mono flex flex-col items-center gap-2 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-6">
              <AlertCircle className="w-6 h-6 text-slate-300" />
              <span className="font-bold text-slate-600">
                {activeToggle === 'requirements'
                  ? 'No requirement notifications found'
                  : activeToggle === 'audit_logs'
                  ? 'No login/logout audit notifications found'
                  : 'No notifications available'}
              </span>
              <span className="text-[11px] text-slate-400">
                New events will automatically appear here in real time.
              </span>
            </div>
          ) : (
            displayedNotifications.map((n) => {
              const isAudit = isAuditLogNotification(n)
              return (
                <div
                  key={n.id}
                  onClick={() => onMarkRead(n.id, n.read)}
                  className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer group ${
                    isAudit
                      ? n.read
                        ? 'bg-rose-50/20 border-rose-100/70 hover:bg-rose-50/40'
                        : 'bg-rose-50/50 border-rose-200 hover:bg-rose-50/80 shadow-2xs'
                      : n.read
                      ? 'bg-white border-slate-200 hover:bg-slate-50/80'
                      : 'bg-purple-50/40 border-purple-200 hover:bg-purple-50/70 shadow-2xs'
                  }`}
                >
                  {/* Category Indicator Icon */}
                  <div className="mt-0.5 shrink-0">
                    {isAudit ? (
                      <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200">
                        <Clock className="w-4 h-4" />
                      </div>
                    ) : n.type === 'interview' || n.type === 'interview_scheduled' ? (
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200">
                        <Calendar className="w-4 h-4" />
                      </div>
                    ) : n.type === 'submission' ||
                      n.type === 'submission_approved' ||
                      n.type === 'lead_approval_requested' ? (
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center border border-indigo-200">
                        <UserCheck className="w-4 h-4" />
                      </div>
                    ) : n.type === 'placement' ||
                      n.type === 'offer_released' ||
                      n.type === 'candidate_placed' ? (
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6B3BF6] flex items-center justify-center border border-purple-200">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isAudit ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-extrabold border border-rose-200 font-mono">
                            AUDIT LOG
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-[#6B3BF6] text-[10px] font-extrabold border border-purple-200 font-mono">
                            REQUIREMENT
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {n.time}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete(n.id, !n.read)
                          }}
                          title="Delete notification"
                          className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 font-medium leading-relaxed">{n.message}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Modal Footer (Referenced Picture Layout) */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] border border-purple-200 text-xs font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All as Read</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs active:scale-98"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  )
}
