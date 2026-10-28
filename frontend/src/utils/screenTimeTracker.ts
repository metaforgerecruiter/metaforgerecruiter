/**
 * Screen Time & Application Usage Tracker Utility
 * Tracks active vs idle recruiter usage time, stores daily totals in localStorage,
 * and notifies subscribers via live window events.
 */

export interface ScreenTimeRecord {
  date: string // YYYY-MM-DD
  userName: string
  userRole: string
  activeSeconds: number
  idleSeconds: number
  sessionStartTimestamp: number
  lastActivityTimestamp: number
  status: 'Active' | 'Idle'
}

const STORAGE_PREFIX = 'metaforge_screentime_'
const IDLE_TIMEOUT_SECONDS = 60 // Pauses active time after 60s of inactivity

function getTodayKey(): string {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

const records = new Map<string, ScreenTimeRecord>()

export function getRecruiterScreenTime(userName: string): ScreenTimeRecord {
  const dateKey = getTodayKey()
  const storageKey = `${STORAGE_PREFIX}${userName}_${dateKey}`
  const existing = records.get(storageKey)
  if (existing) return existing

  const created: ScreenTimeRecord = {
    date: dateKey,
    userName,
    userRole: 'recruiter',
    activeSeconds: 0,
    idleSeconds: 0,
    sessionStartTimestamp: Date.now(),
    lastActivityTimestamp: Date.now(),
    status: 'Active',
  }
  records.set(storageKey, created)
  return created
}

export function saveRecruiterScreenTime(record: ScreenTimeRecord): void {
  const storageKey = `${STORAGE_PREFIX}${record.userName}_${record.date}`
  records.set(storageKey, record)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('metaforge_screentime_update', { detail: record }))
  }
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m 0s'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`
  }
  return `${mins}m ${secs}s`
}

export function formatDurationShort(seconds: number): string {
  if (seconds <= 0) return '0m'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)

  if (hrs > 0) {
    return `${hrs}h ${mins}m`
  }
  return `${mins}m`
}

/**
 * Checks role-based screen time privacy & visibility permissions:
 * - Recruiter: Can ONLY view their own screen time.
 * - Team Lead: Can view self + assigned team members' screen time.
 * - Admin / Super Admin / Dev Team: Can view everyone's screen time.
 */
export function canViewScreenTime(
  currentUserRole: string,
  currentUserName: string,
  targetRecruiterName: string,
  targetTeamLeadName?: string
): boolean {
  if (!currentUserName || !targetRecruiterName) return false

  const normUser = currentUserName.trim().toLowerCase()
  const normTarget = targetRecruiterName.trim().toLowerCase()

  // 1. Super Admin, Admin, Dev Team can view everyone's screen time
  if (currentUserRole === 'superadmin' || currentUserRole === 'admin' || currentUserRole === 'devteam') {
    return true
  }

  // 2. Self can always view their own screen time
  if (normUser === normTarget || normTarget.includes(normUser) || normUser.includes(normTarget)) {
    return true
  }

  // 3. Recruiter can ONLY view their own screen time
  if (currentUserRole === 'recruiter') {
    return false
  }

  // 4. Team Lead can view self AND assigned team members
  if (currentUserRole === 'lead') {
    if (targetTeamLeadName) {
      const normLead = targetTeamLeadName.trim().toLowerCase()
      if (normLead.includes(normUser) || normUser.includes(normLead)) {
        return true
      }
    }
  }

  return false
}

/**
 * Screen Time Manager Singleton Class
 */
class ScreenTimeManager {
  private currentUserName: string = 'Current Recruiter'
  private currentUserRole: string = 'recruiter'
  private isTracking: boolean = false
  private timerId: any = null
  private lastActivity: number = Date.now()

  public startTracking(userName: string = 'Current Recruiter', userRole: string = 'recruiter') {
    this.currentUserName = userName
    this.currentUserRole = userRole
    this.lastActivity = Date.now()

    if (this.isTracking) return
    this.isTracking = true

    // Activity listeners
    const resetActivity = () => {
      this.lastActivity = Date.now()
    }

    window.addEventListener('mousemove', resetActivity, { passive: true })
    window.addEventListener('keydown', resetActivity, { passive: true })
    window.addEventListener('click', resetActivity, { passive: true })
    window.addEventListener('scroll', resetActivity, { passive: true })
    window.addEventListener('touchstart', resetActivity, { passive: true })
    window.addEventListener('focus', resetActivity, { passive: true })

    // Timer loop every 1 sec
    this.timerId = setInterval(() => {
      if (!this.isTracking) return
      const now = Date.now()
      const isDocumentVisible = document.visibilityState === 'visible'
      const secondsSinceActivity = Math.floor((now - this.lastActivity) / 1000)

      const record = getRecruiterScreenTime(this.currentUserName)
      record.userRole = this.currentUserRole

      if (isDocumentVisible && secondsSinceActivity <= IDLE_TIMEOUT_SECONDS) {
        record.activeSeconds += 1
        record.status = 'Active'
      } else {
        record.idleSeconds += 1
        record.status = 'Idle'
      }

      record.lastActivityTimestamp = this.lastActivity
      saveRecruiterScreenTime(record)
    }, 1000)
  }

  public stopTracking() {
    this.isTracking = false
    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }
  }
}

export const screenTimeManager = new ScreenTimeManager()
