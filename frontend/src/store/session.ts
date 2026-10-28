export interface SessionUser {
  id: string
  email: string
  name: string
  role: string
  title?: string
  permissions?: string[] | Record<string, boolean>
  capabilities?: Record<string, boolean>
}

export type CapabilityKey =
  | 'addCandidates'
  | 'submitToClients'
  | 'scheduleInterviews'
  | 'exportReportsCsv'
  | 'viewTeamAnalytics'
  | 'reassignRequirements'
  | 'deleteRecords'

/** Legacy keys — cleared on boot so XSS cannot recover old JWTs from localStorage. */
const LEGACY_TOKEN_KEY = 'metaforge_access_token'
const LEGACY_USER_KEY = 'metaforge_session_user'

/** In-memory only. Auth proof lives in HttpOnly cookies set by the API. */
let sessionUser: SessionUser | null = null

function purgeLegacyTokenStorage(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    localStorage.removeItem(LEGACY_USER_KEY)
    sessionStorage.removeItem(LEGACY_TOKEN_KEY)
    sessionStorage.removeItem(LEGACY_USER_KEY)
  } catch {
    // ignore quota / private-mode errors
  }
}

if (typeof window !== 'undefined') {
  purgeLegacyTokenStorage()
}

export function hasCapability(key: CapabilityKey, user?: SessionUser | null): boolean {
  const current = user !== undefined ? user : getSessionUser()
  if (!current) return false
  const roleCode = String(current.role || '').toLowerCase()

  // Super Admin & Dev Team have unrestricted access
  if (roleCode === 'superadmin' || roleCode === 'devteam') {
    return true
  }

  // Check explicit capability override set by Super Admin
  if (current.capabilities && typeof current.capabilities === 'object' && current.capabilities[key] !== undefined) {
    return Boolean(current.capabilities[key])
  }

  // Fallback defaults by role if no override was explicitly saved by Super Admin
  const isSuperOrAdmin = roleCode === 'superadmin' || roleCode === 'admin'
  const isLead = roleCode === 'lead' || roleCode === 'team lead'

  switch (key) {
    case 'addCandidates':
    case 'submitToClients':
    case 'scheduleInterviews':
      return roleCode !== 'client'
    case 'exportReportsCsv':
    case 'viewTeamAnalytics':
    case 'reassignRequirements':
      return isSuperOrAdmin || isLead
    case 'deleteRecords':
      return isSuperOrAdmin
    default:
      return false
  }
}

/**
 * @deprecated Access tokens are HttpOnly cookies only — JS must not read them.
 * Kept as a no-op null getter so any leftover callers do not break.
 */
export function getAccessToken(): string | null {
  return null
}

/**
 * @deprecated No-op. Tokens are set via Set-Cookie from the API, not from JS.
 */
export function setAccessToken(_token: string | null): void {
  purgeLegacyTokenStorage()
}

export function getSessionUser(): SessionUser | null {
  return sessionUser
}

export function setSessionUser(user: SessionUser | null): void {
  sessionUser = user
  // Never persist auth identity next to a JWT in localStorage.
  purgeLegacyTokenStorage()
}

export function clearSession(): void {
  sessionUser = null
  purgeLegacyTokenStorage()
}
