import DOMPurify from 'dompurify'

/** CSP embedded into email preview documents (iframe srcDoc). */
const EMAIL_DOC_CSP =
  "default-src 'none'; script-src 'none'; object-src 'none'; base-uri 'none'; style-src 'unsafe-inline' data:; img-src https: http: data: cid:;"

/**
 * Sanitize untrusted HTML (requirement emails, etc.) before iframe srcDoc / HTML render.
 * Client-only DOMPurify; SSR uses a conservative strip until hydrate.
 */
export function sanitizeEmailHtml(dirty: string | null | undefined): string {
  if (!dirty) return ''

  let clean: string
  if (typeof window === 'undefined') {
    clean = String(dirty)
      .replace(/<\/?(?:script|iframe|object|embed|form|svg|math)(?:\s[^>]*)?>/gi, '')
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
  } else {
    clean = DOMPurify.sanitize(dirty, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'base', 'link', 'meta', 'svg', 'math'],
      FORBID_ATTR: ['srcdoc', 'xlink:href'],
      ALLOW_UNKNOWN_PROTOCOLS: false,
      SAFE_FOR_TEMPLATES: true,
    })
  }

  // Nested CSP meta so scripts cannot run inside the preview document.
  const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${EMAIL_DOC_CSP}" />`
  if (/<head[\s>]/i.test(clean)) {
    return clean.replace(/<head([^>]*)>/i, `<head$1>${cspMeta}`)
  }
  return `<!DOCTYPE html><html><head>${cspMeta}</head><body>${clean}</body></html>`
}
