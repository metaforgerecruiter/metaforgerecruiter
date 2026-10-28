/**
 * Never log passwords, tokens, or other secrets.
 * Use before writing activity logs, console/Nest logs, or alert webhooks.
 */

const SENSITIVE_KEY =
  /^(password|passwd|pwd|passwordhash|password_hash|newpassword|oldpassword|currentpassword|token|accesstoken|refreshtoken|id_token|idtoken|authorization|auth|bearer|api[_-]?key|apikey|secret|client_secret|clientsecret|cookie|set-cookie|csrf|otp|otpcode|resettoken|privatekey|private_key)$/i;

const SENSITIVE_INLINE =
  /\b(password|passwd|pwd|token|access[_-]?token|refresh[_-]?token|authorization|bearer|api[_-]?key|client_secret|csrf[_-]?token|otp)\b\s*[:=]\s*["']?[^"'&\s,;]+["']?/gi;

const JWT_LIKE = /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;
const BEARER_LIKE = /\bBearer\s+[A-Za-z0-9._\-+=\/]+/gi;

export const REDACTED = '[REDACTED]';

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(String(key || '').replace(/[^a-zA-Z0-9_]/g, ''));
}

/** Deep-clone and strip secret fields from objects destined for logs. */
export function redactSecrets<T = any>(input: T, depth = 0): T {
  if (input == null || depth > 8) return input;
  if (typeof input === 'string') {
    return redactSecretString(input) as T;
  }
  if (typeof input !== 'object') return input;
  if (Array.isArray(input)) {
    return input.map((v) => redactSecrets(v, depth + 1)) as T;
  }
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(input as Record<string, any>)) {
    if (isSensitiveKey(k)) {
      out[k] = REDACTED;
      continue;
    }
    out[k] = redactSecrets(v, depth + 1);
  }
  return out as T;
}

export function redactSecretString(value: string): string {
  if (!value) return value;
  return value
    .replace(JWT_LIKE, REDACTED)
    .replace(BEARER_LIKE, `Bearer ${REDACTED}`)
    .replace(SENSITIVE_INLINE, (_m, key) => `${key}=${REDACTED}`);
}

/** Safe one-line summary for Nest Logger (never include raw request bodies). */
export function safeLogMessage(message: string, meta?: Record<string, unknown>): string {
  const base = redactSecretString(String(message || ''));
  if (!meta || !Object.keys(meta).length) return base;
  try {
    return `${base} ${JSON.stringify(redactSecrets(meta))}`;
  } catch {
    return base;
  }
}
