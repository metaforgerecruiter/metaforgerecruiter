import { randomBytes } from 'crypto';
import { Response } from 'express';
import { shouldUseSecureCookies } from './transport.util';

export const CSRF_COOKIE_NAME = 'csrf_token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const secureCookies = shouldUseSecureCookies();

/** HttpOnly session cookies — SameSite=strict blocks cross-site cookie sends. */
export const AUTH_COOKIE_BASE = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: secureCookies,
  path: '/',
};

export const ACCESS_COOKIE = {
  ...AUTH_COOKIE_BASE,
  maxAge: 8 * 60 * 60 * 1000,
};

export const REFRESH_COOKIE = {
  ...AUTH_COOKIE_BASE,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/** Readable by JS for double-submit CSRF header. */
export const CSRF_COOKIE = {
  httpOnly: false,
  sameSite: 'strict' as const,
  secure: secureCookies,
  path: '/',
  maxAge: 8 * 60 * 60 * 1000,
};

export function readCookie(
  req: { headers?: { cookie?: string }; cookies?: Record<string, string> },
  name: string,
): string | null {
  if (req?.cookies?.[name]) return req.cookies[name];
  const header = req?.headers?.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function issueCsrfCookie(res: Response): string {
  const token = randomBytes(32).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, token, CSRF_COOKIE);
  return token;
}

export function clearAuthCookies(res: Response): void {
  const clearBase = { path: '/', sameSite: 'strict' as const, secure: shouldUseSecureCookies() };
  res.clearCookie('access_token', clearBase);
  res.clearCookie('refresh_token', clearBase);
  res.clearCookie(CSRF_COOKIE_NAME, clearBase);
}

export function parseAllowedOrigins(): Set<string> {
  return new Set(
    (process.env.CORS_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean),
  );
}

/** Paths that may mutate before a CSRF cookie exists (login / public auth). */
export function isCsrfExemptPath(path: string): boolean {
  const p = path.split('?')[0];
  const exempt = [
    '/health',
    '/health/db',
    '/api/v1/auth/login',
    '/api/v1/auth/request-login-otp',
    '/api/v1/auth/verify-login-otp',
    '/api/v1/auth/register-request',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/verify-otp',
    '/api/v1/auth/reset-password',
    // Refresh must work even when csrf cookie was never issued (pre-CSRF sessions).
    '/api/v1/auth/refresh',
  ];
  return exempt.some((e) => p === e || p.endsWith(e));
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isSafeMethod(method: string): boolean {
  return SAFE_METHODS.has(String(method || '').toUpperCase());
}

export function originAllowed(originOrUrl: string, allowed: Set<string>): boolean {
  try {
    const normalized = originOrUrl.includes('://')
      ? new URL(originOrUrl).origin.replace(/\/$/, '')
      : originOrUrl.replace(/\/$/, '');
    return allowed.has(normalized);
  } catch {
    return false;
  }
}
