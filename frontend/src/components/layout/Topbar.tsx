import React, { useState } from 'react'
import { Bell } from 'lucide-react'
import { Role } from '../../types'
import { brand } from '../../theme'
import { NotificationPopover } from '../ui/NotificationPopover'
import { NotificationToast } from '../ui/NotificationToast'
import { useNotificationSystem } from '../../hooks/useNotificationSystem'

interface TopbarProps {
  title: string
  subtitle?: string
  role: Role
  onNewReqClick?: () => void
  onSearchChange?: (query: string) => void
  searchValue?: string
  onSignOut?: () => void
  showNewReq?: boolean
  isSidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

export function Topbar({
  title,
  subtitle,
}: TopbarProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false)

  const {
    notifications,
    unreadCount,
    newNotificationCount,
    loading,
    errorMsg,
    toasts,
    dismissToast,
    fetchNotifications,
    markFeedAsViewed,
    markAllAsRead,
    markRead,
    removeNotification,
  } = useNotificationSystem()

  const handleToggleNotif = () => {
    const nextState = !isNotifOpen
    setIsNotifOpen(nextState)
    if (nextState) {
      // User opened notifications: automatically mark all notifications as read in MongoDB and clear badge
      markFeedAsViewed()
      void markAllAsRead()
    }
  }

  return (
    <>
      {/* Temporary 5-Second Right-Side Toast Popups */}
      <NotificationToast toasts={toasts} onDismiss={dismissToast} />

      <header
        className="h-14 px-6 flex items-center justify-between flex-shrink-0 border-b"
        style={{ background: brand.surface, borderColor: brand.border }}
      >
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-base font-semibold" style={{ color: brand.text }}>{title}</h1>
            {subtitle && (
              <p className="text-xs mt-0.5" style={{ color: brand.textMuted }}>{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notifications UI Option Button */}
          <div className="relative">
            <button
              onClick={handleToggleNotif}
              className="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer border border-indigo-500/40"
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Notifications</span>
              {newNotificationCount > 0 && (
                <span className="bg-red-500 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none shadow-sm animate-pulse">
                  {newNotificationCount > 99 ? '99+' : newNotificationCount}
                </span>
              )}
            </button>

            <NotificationPopover
              isOpen={isNotifOpen}
              onClose={() => setIsNotifOpen(false)}
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loading}
              errorMsg={errorMsg}
              onRefresh={fetchNotifications}
              onMarkAllAsRead={markAllAsRead}
              onMarkRead={markRead}
              onDelete={removeNotification}
            />
          </div>
        </div>
      </header>
    </>
  )
}
