/**
 * Secrets must come from environment / vault — never hardcoded fallbacks.
 * Call assertJwtSecretConfigured() at boot; use resolveJwtSecret() for signing.
 */

const WEAK_JWT_SECRETS = new Set(
  [
    '',
    'change-me-in-production',
    'replace-with-a-long-random-string',
    'super-secret-jwt-key-2026',
    'secret',
    'jwt-secret',
    'jwt_secret',
    'password',
    '123456',
  ].map((s) => s.toLowerCase()),
);

/** Minimum entropy for JWT HMAC secrets (bytes / chars). */
export const JWT_SECRET_MIN_LENGTH = 32;

export function isProductionEnv(): boolean {
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production';
}

/**
 * Demo plaintext passwords (seed / login bootstrap) — never in production.
 * Non-prod requires explicit ALLOW_DEMO_LOGIN=true.
 */
export function allowDemoCredentials(): boolean {
  if (isProductionEnv()) return false;
  return String(process.env.ALLOW_DEMO_LOGIN || '').toLowerCase() === 'true';
}

export function isWeakJwtSecret(secret: string | undefined | null): boolean {
  if (!secret) return true;
  const trimmed = secret.trim();
  if (trimmed.length < JWT_SECRET_MIN_LENGTH) return true;
  if (WEAK_JWT_SECRETS.has(trimmed.toLowerCase())) return true;
  // Reject trivial repeated chars
  if (/^(.)\1+$/.test(trimmed)) return true;
  return false;
}

/**
 * Resolve JWT_SECRET from env/vault only. Throws if missing or weak.
 * No in-code default secret — fail closed.
 */
export function resolveJwtSecret(fromConfig?: string | null): string {
  const secret = (fromConfig ?? process.env.JWT_SECRET ?? '').trim();
  if (isWeakJwtSecret(secret)) {
    throw new Error(
      `JWT_SECRET is missing or too weak (min ${JWT_SECRET_MIN_LENGTH} chars, not a known placeholder). ` +
        'Set a strong value via environment or secrets vault. Never commit secrets to source.',
    );
  }
  return secret;
}

export function assertJwtSecretConfigured(): void {
  resolveJwtSecret(process.env.JWT_SECRET);
}

/**
 * Shared password for local demo seed/login when ALLOW_DEMO_LOGIN=true.
 * Prefer SEED_DEMO_PASSWORD / DEMO_PASSWORD from env; no production use.
 */
export function resolveDemoPassword(roleHint?: string): string | null {
  if (!allowDemoCredentials()) return null;
  const roleKey = roleHint
    ? `DEMO_PASSWORD_${roleHint.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`
    : '';
  const fromRole = roleKey ? (process.env[roleKey] || '').trim() : '';
  const shared = (process.env.SEED_DEMO_PASSWORD || process.env.DEMO_PASSWORD || '').trim();
  return fromRole || shared || null;
}
