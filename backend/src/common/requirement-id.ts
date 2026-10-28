/**
 * Requirement ID presentation.
 * Stored ID (reqCode): YYYY-MM-DD-NNN, never contains the client's reference.
 * Display ID: "YYYY-MM-DD-NNN (client requirement/request ID)" when the client gave one.
 */
export function displayRequirementId(reqCode: string, clientRef?: string | null): string {
  const code = String(reqCode || '').trim();
  const ref = String(clientRef || '').trim();
  if (!ref || code.endsWith(`(${ref})`)) return code;
  return `${code} (${ref})`;
}

/** Accept either the stored ID or the display ID (with the bracketed client reference). */
export function reqCodeCandidates(id: string): string[] {
  const raw = String(id || '').trim();
  const base = raw.replace(/\s*\([^()]*\)\s*$/, '').trim();
  return base && base !== raw ? [raw, base] : [raw];
}
