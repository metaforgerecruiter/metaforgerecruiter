import { clearSession } from '../store/session'

/**
 * Prefer same-origin `/api/v1` so HttpOnly auth cookies are scoped to the
 * frontend host and sent automatically (Next.js rewrites proxy to the API).
 */
function getApiBase(): string {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return '/api/v1'
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
  }

  return 'http://localhost:3001/api/v1'
}

const API_BASE = getApiBase()

export class ApiError extends Error {
  status: number
  body: unknown

  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

/** Read double-submit CSRF cookie set at login (not HttpOnly). */
function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/)
  return match ? decodeURIComponent(match[1]) : null
}

function isMutatingMethod(method?: string): boolean {
  const m = String(method || 'GET').toUpperCase()
  return m !== 'GET' && m !== 'HEAD' && m !== 'OPTIONS'
}

let csrfBootstrap: Promise<void> | null = null

/** In-memory fallback if Set-Cookie is delayed; must still match the csrf_token cookie. */
let csrfMemory: string | null = null

/** Ensure a readable csrf_token cookie exists (handles sessions created before CSRF). */
async function ensureCsrfCookie(): Promise<string | null> {
  const existing = getCsrfToken() || csrfMemory
  if (existing) return existing
  if (!csrfBootstrap) {
    csrfBootstrap = fetch(`${API_BASE}/auth/csrf`, { method: 'GET', credentials: 'include' })
      .then(async (res) => {
        try {
          const data = await res.json()
          if (data?.csrfToken) csrfMemory = String(data.csrfToken)
        } catch {
          /* ignore */
        }
      })
      .catch(() => undefined)
      .finally(() => {
        csrfBootstrap = null
      })
  }
  await csrfBootstrap
  return getCsrfToken() || csrfMemory
}

async function request<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  // Double-submit CSRF: cookie (readable) + matching header on mutating calls.
  if (isMutatingMethod(init.method)) {
    const csrf = (await ensureCsrfCookie()) || getCsrfToken()
    if (csrf) headers.set('X-CSRF-Token', csrf)
  }

  // Auth is HttpOnly cookie only — do not attach Bearer tokens from JS storage.
  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: 'include',
    })
  } catch (err: any) {
    const rawMsg = err instanceof Error ? err.message : String(err)
    if (rawMsg.includes('Failed to fetch') || err?.name === 'TypeError') {
      throw new ApiError('Unable to connect to backend server. Please ensure backend is running on port 3001.', 0)
    }
    throw err
  }

  if (res.status === 401) {
    clearSession()
  }
  const text = await res.text()
  let data: any = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }
  if (
    !res.ok &&
    !retried &&
    res.status === 403 &&
    isMutatingMethod(init.method) &&
    String(data?.message || '').toLowerCase().includes('csrf')
  ) {
    // Backend may have just minted csrf_token via Set-Cookie — refresh header and retry once.
    csrfBootstrap = null
    await ensureCsrfCookie()
    return request<T>(path, init, true)
  }
  if (!res.ok) {
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message
    throw new ApiError(message || res.statusText || 'Request failed', res.status, data)
  }
  return data as T
}

async function getBlob(path: string): Promise<Blob> {
  const headers = new Headers()

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    credentials: 'include',
  })
  if (res.status === 401) {
    clearSession()
  }
  if (!res.ok) {
    const text = await res.text()
    let data: any = null
    try {
      data = text ? JSON.parse(text) : null
    } catch {
      data = text
    }
    const message = Array.isArray(data?.message) ? data.message.join(', ') : data?.message
    throw new ApiError(message || res.statusText || 'Download failed', res.status, data)
  }
  return res.blob()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, form: FormData) => request<T>(path, { method: 'POST', body: form }),
  getBlob: (path: string) => getBlob(path),
}
