import { Role } from '../types'
import { api, ApiError } from '../lib/api'
import { setSessionUser, SessionUser } from '../store/session'
import { titleForRole } from './roleMeta'

export interface ResolvedAccount {
  role: Role
  email: string
  name: string
  password: string
  title: string
}

export const SIGN_IN_ROLES: Role[] = ['superadmin', 'admin', 'lead', 'recruiter', 'devteam', 'client']

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

import { DEMO_ACCOUNTS, DemoAccount } from '../config/demoAccounts'

export type AuthResult =
  | { ok: true; account: ResolvedAccount }
  | { ok: false; field: 'email' | 'password' | 'general'; message: string }

export async function authenticate(email: string, password: string, expectedRole?: Role): Promise<AuthResult> {
  const trimmed = email.trim()
  if (!trimmed) return { ok: false, field: 'email', message: 'Work email address is required' }
  if (!isValidEmail(trimmed)) return { ok: false, field: 'email', message: 'Enter a valid work email address' }
  if (!password) return { ok: false, field: 'password', message: 'Password is required' }

  try {
    const payload: { email: string; password: string; role?: Role } = { email: trimmed, password }
    if (expectedRole) payload.role = expectedRole
    // Access/refresh JWTs are set as HttpOnly cookies by the API — never stored in JS.
    const res = await api.post<{
      user: SessionUser & { role: Role }
    }>('/auth/login', payload)
    const role = res.user.role
    const account: ResolvedAccount = {
      role,
      email: res.user.email,
      name: res.user.name,
      password: '',
      title: res.user.title || titleForRole(role),
    }
    setSessionUser({ ...res.user, title: account.title })
    if (expectedRole && role !== expectedRole) {
      return { ok: false, field: 'general', message: `You are not authorized for the ${expectedRole} portal. Account role is ${role}.` }
    }
    return { ok: true, account }
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      return {
        ok: false,
        field: 'general',
        message: err.message || 'Invalid email or password. Check your credentials and try again.',
      }
    }

    return {
      ok: false,
      field: 'general',
      message: 'Unable to reach the API. Confirm the backend is running on /api/v1.',
    }
  }
}

export async function quickDevLogin(account: DemoAccount): Promise<AuthResult> {
  return authenticate(account.email, account.password, account.role)
}

export async function restoreSession(): Promise<SessionUser | null> {
  try {
    const user = await api.get<SessionUser>('/auth/me')
    const hydrated = { ...user, title: user.title || titleForRole(user.role as Role) }
    setSessionUser(hydrated)
    return hydrated
  } catch {
    return null
  }
}

export async function logoutRemote(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } catch {
    // ignore
  }
}

export async function requestAccess(body: Record<string, unknown>): Promise<void> {
  await api.post('/auth/register-request', body)
}

export async function requestPasswordReset(email: string): Promise<{ otpCode?: string; message?: string }> {
  return api.post('/auth/forgot-password', { email })
}

export async function verifyOtp(email: string, otpCode: string): Promise<{ resetToken: string }> {
  return api.post('/auth/verify-otp', { email, otpCode })
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await api.post('/auth/reset-password', { token, newPassword })
}

export interface PasswordRule {
  id: string
  label: string
  test: (value: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'At least 8 characters', test: v => v.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A–Z)', test: v => /[A-Z]/.test(v) },
  { id: 'lower', label: 'One lowercase letter (a–z)', test: v => /[a-z]/.test(v) },
  { id: 'number', label: 'One number (0–9)', test: v => /[0-9]/.test(v) },
  { id: 'symbol', label: 'One special character (!@#$…)', test: v => /[^A-Za-z0-9]/.test(v) },
]

export function passedRules(value: string): number {
  return PASSWORD_RULES.filter(r => r.test(value)).length
}

export function isStrongPassword(value: string): boolean {
  return passedRules(value) === PASSWORD_RULES.length
}

export function passwordStrength(value: string): { score: number; label: string; color: string } {
  const score = passedRules(value)
  if (!value) return { score: 0, label: 'Empty', color: '#CBD5E1' }
  if (score <= 2) return { score, label: 'Weak', color: '#DC2626' }
  if (score === 3) return { score, label: 'Fair', color: '#D97706' }
  if (score === 4) return { score, label: 'Good', color: '#2563EB' }
  return { score, label: 'Strong', color: '#059669' }
}

export async function requestLoginOtp(email: string, expectedRole?: Role): Promise<{ message: string }> {
  const trimmed = email.trim()
  if (!trimmed) throw new Error('Work email address is required')
  if (!isValidEmail(trimmed)) throw new Error('Enter a valid work email address')

  try {
    const payload: { email: string; role?: Role } = { email: trimmed }
    if (expectedRole) payload.role = expectedRole
    return await api.post<{ message: string }>('/auth/request-login-otp', payload)
  } catch (err) {
    if (err instanceof ApiError) {
      throw new Error(err.message || 'Failed to send OTP code.')
    }
    throw new Error('Unable to connect to the login service. Check that the backend server is running.')
  }
}

export async function verifyLoginOtp(email: string, code: string, expectedRole?: Role): Promise<AuthResult> {
  const trimmedEmail = email.trim()
  const trimmedCode = code.trim()

  if (!trimmedEmail) return { ok: false, field: 'email', message: 'Work email address is required' }
  if (!trimmedCode || trimmedCode.length !== 4) {
    return { ok: false, field: 'general', message: 'Enter all 4 digits of your verification code' }
  }

  try {
    const payload: { email: string; code: string; role?: Role } = { email: trimmedEmail, code: trimmedCode }
    if (expectedRole) payload.role = expectedRole
    const res = await api.post<{
      user: SessionUser & { role: Role }
    }>('/auth/verify-login-otp', payload)

    // Tokens arrive only as HttpOnly cookies from Set-Cookie.
    const role = res.user.role
    const account: ResolvedAccount = {
      role,
      email: res.user.email,
      name: res.user.name,
      password: '',
      title: res.user.title || titleForRole(role),
    }
    setSessionUser({ ...res.user, title: account.title })
    return { ok: true, account }
  } catch (err) {
    if (err instanceof ApiError) {
      return {
        ok: false,
        field: 'general',
        message: err.message || 'Verification failed. Please try again.',
      }
    }
    return {
      ok: false,
      field: 'general',
      message: 'Unable to reach the API. Confirm the backend is running.',
    }
  }
}

export function generateVerificationCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export const VERIFICATION_CODE_LENGTH = 4

