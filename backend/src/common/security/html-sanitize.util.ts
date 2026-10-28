/**
 * Sanitize untrusted HTML (e.g. client requirement emails) before API return or rendering.
 * Strips active content while preserving basic formatting for display.
 */
export function sanitizeEmailHtml(input: string | null | undefined): string {
  if (!input) return '';
  let html = String(input);

  // Remove dangerous elements (paired + self-closing)
  html = html.replace(
    /<\/?(?:script|iframe|object|embed|applet|link|meta|base|form|input|button|textarea|select|option|svg|math|frame|frameset|video|audio|source|track)(?:\s[^>]*)?>/gi,
    '',
  );
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  // Strip inline event handlers (onclick, onerror, …)
  html = html.replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Neutralize javascript: / vbscript: / data:text/html URLs
  html = html.replace(
    /(\s(?:href|src|xlink:href|action|formaction|poster)\s*=\s*)(["'])\s*(?:javascript|vbscript|data\s*:\s*text\s*\/\s*html)[^"']*\2/gi,
    '$1$2#$2',
  );

  // Block CSS expression() / -moz-binding
  html = html.replace(/expression\s*\(/gi, 'blocked(');
  html = html.replace(/-moz-binding\s*:/gi, 'blocked:');
  html = html.replace(/behavior\s*:/gi, 'blocked:');

  // Remove <base> that can hijack relative links (also covered above; belt-and-suspenders)
  html = html.replace(/<base\b[^>]*>/gi, '');

  return html;
}
