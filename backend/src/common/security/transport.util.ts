/**
 * Transport security: HTTPS everywhere in production (or when FORCE_HTTPS=true).
 * Relies on reverse-proxy X-Forwarded-Proto when TRUST_PROXY is enabled.
 */

export function isProductionEnv(): boolean {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

/** Enforce HTTPS redirects + Secure cookies. */
export function httpsRequired(): boolean {
  if (String(process.env.FORCE_HTTPS || '').toLowerCase() === 'true') return true;
  if (String(process.env.FORCE_HTTPS || '').toLowerCase() === 'false') return false;
  return isProductionEnv();
}

/** Cookie Secure flag — always when HTTPS is required, or COOKIE_SECURE=true. */
export function shouldUseSecureCookies(): boolean {
  if (String(process.env.COOKIE_SECURE || '').toLowerCase() === 'true') return true;
  if (String(process.env.COOKIE_SECURE || '').toLowerCase() === 'false') return false;
  return httpsRequired();
}

/**
 * Express trust-proxy setting.
 * Default: trust first hop in production (typical load balancer / ingress).
 */
export function trustProxySetting(): boolean | number | string {
  const raw = (process.env.TRUST_PROXY || '').trim().toLowerCase();
  if (raw === 'false' || raw === '0') return false;
  if (raw === 'true' || raw === '1') return 1;
  if (raw && !Number.isNaN(Number(raw))) return Number(raw);
  if (raw) return raw; // e.g. "loopback", subnet
  return httpsRequired() ? 1 : false;
}

export function isHttpsRequest(req: {
  secure?: boolean;
  protocol?: string;
  headers?: Record<string, string | string[] | undefined>;
}): boolean {
  if (req.secure === true) return true;
  if (String(req.protocol || '').toLowerCase() === 'https') return true;
  const proto = String(req.headers?.['x-forwarded-proto'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (proto === 'https') return true;
  const fwdSsl = String(req.headers?.['x-forwarded-ssl'] || '').toLowerCase();
  if (fwdSsl === 'on') return true;
  return false;
}

/** Host used for HTTPS redirect Location (strip port noise from forwarded host if needed). */
export function requestHost(req: {
  headers?: Record<string, string | string[] | undefined>;
  hostname?: string;
}): string {
  const xf = req.headers?.['x-forwarded-host'];
  if (xf) return String(Array.isArray(xf) ? xf[0] : xf).split(',')[0].trim();
  const host = req.headers?.host;
  if (host) return String(Array.isArray(host) ? host[0] : host).trim();
  return req.hostname || 'localhost';
}
