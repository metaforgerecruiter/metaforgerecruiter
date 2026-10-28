import { useState, useEffect, useRef, useCallback } from 'react'
import { notificationsService } from '../services/workspace.service'
import { ToastItem } from '../components/ui/NotificationToast'

export interface NotificationItem {
  id: string
  title: string
  message: string
  time: string
  type: string
  read: boolean
  createdAt?: string
}

const LAST_VIEWED_KEY = 'metaforge_notif_last_viewed'

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

export function useNotificationSystem() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [newNotificationCount, setNewNotificationCount] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const seenIdsRef = useRef<Set<string>>(new Set())
  const isInitialLoadRef = useRef<boolean>(true)
  const lastViewedTimeRef = useRef<number>(
    typeof window !== 'undefined'
      ? parseInt(localStorage.getItem(LAST_VIEWED_KEY) || '0', 10) || 0
      : 0
  )

  const triggerToast = useCallback((item: { id: string; title: string; message: string; type: string; createdAt?: string }) => {
    const toastId = item.id
    setToasts(prev => {
      if (prev.some(t => t.id === toastId)) return prev
      return [...prev, { id: toastId, title: item.title, message: item.message, type: item.type, createdAt: item.createdAt }]
    })

    // Auto-dismiss toast popup after 5 seconds without altering permanent MongoDB storage status
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId))
    }, 5000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Call when user clicks/opens the Notifications feed
  const markFeedAsViewed = useCallback(() => {
    const now = Date.now()
    lastViewedTimeRef.current = now
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAST_VIEWED_KEY, String(now))
    }
    setNewNotificationCount(0)
  }, [])

  const fetchNotifications = useCallback(async (isTabReturn = false) => {
    try {
      setLoading(true)
      const res = await notificationsService.list()
      const rawItems = Array.isArray(res) ? res : res?.items || []

      const items: NotificationItem[] = rawItems.map((n: any) => ({
        id: n._id || n.id || String(Math.random()),
        title: n.title || 'Notification',
        message: n.message || n.body || '',
        time: formatTimeAgo(n.createdAt || n.updatedAt),
        type: n.type || 'system',
        read: Boolean(n.read || n.readAt),
        createdAt: n.createdAt,
      }))

      setNotifications(items)
      const totalUnread = typeof res?.unreadCount === 'number'
        ? res.unreadCount
        : items.filter(n => !n.read).length
      setUnreadCount(totalUnread)

      const lastViewed = lastViewedTimeRef.current

      // Calculate count of NEW unread notifications received after last view
      const newItemsAfterView = items.filter(n => {
        if (n.read) return false
        if (!n.createdAt) return lastViewed === 0
        const createdMs = new Date(n.createdAt).getTime()
        return isNaN(createdMs) || createdMs > lastViewed
      })

      setNewNotificationCount(newItemsAfterView.length)

      // Identify unread notifications not previously seen
      items.forEach(item => {
        if (!item.read) {
          if (!seenIdsRef.current.has(item.id)) {
            seenIdsRef.current.add(item.id)

            // Trigger temporary 5-second popup toast for new notifications (not initial boot unless returning to tab)
            if (!isInitialLoadRef.current || isTabReturn) {
              triggerToast(item)
            }
          }
        } else {
          seenIdsRef.current.add(item.id)
        }
      })

      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to sync notifications')
    } finally {
      setLoading(false)
    }
  }, [triggerToast])

  // Polling & Visibility Listener
  useEffect(() => {
    fetchNotifications()

    const interval = setInterval(() => {
      fetchNotifications()
    }, 8000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // User returned to application tab: sync notifications and show any that arrived while away
        fetchNotifications(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchNotifications])

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
      setNewNotificationCount(0)
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to mark notifications read')
    }
  }

  const markRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) return
    try {
      await notificationsService.markRead(id)
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount(prev => Math.max(0, prev - 1))
      setNewNotificationCount(prev => Math.max(0, prev - 1))
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to mark notification read')
    }
  }

  const removeNotification = async (id: string, wasUnread: boolean) => {
    try {
      await notificationsService.remove(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1))
        setNewNotificationCount(prev => Math.max(0, prev - 1))
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to delete notification')
    }
  }

  return {
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
  }
}
