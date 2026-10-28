'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { X, Mail, Loader2, AlertTriangle } from 'lucide-react'
import { workspaceService, OriginalRequirementEmail } from '../../services/workspace.service'
import { sanitizeEmailHtml } from '../../lib/sanitizeHtml'

interface OriginalRequirementModalProps {
  isOpen: boolean
  onClose: () => void
  requirementKey: string
  requirementLabel: string
}

function formatReceived(value: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  return isNaN(d.getTime()) ? value : d.toLocaleString()
}

export function OriginalRequirementModal({
  isOpen,
  onClose,
  requirementKey,
  requirementLabel,
}: OriginalRequirementModalProps) {
  const [mail, setMail] = useState<OriginalRequirementEmail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'formatted' | 'text'>('formatted')

  useEffect(() => {
    if (!isOpen || !requirementKey) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setMail(null)
    workspaceService
      .getOriginalEmail(requirementKey)
      .then(data => {
        if (cancelled) return
        setMail(data)
        setView(data.bodyHtml ? 'formatted' : 'text')
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || 'Failed to load the original requirement mail')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, requirementKey])

  // Defense in depth: API already sanitizes; re-sanitize before srcDoc.
  const safeHtml = useMemo(() => sanitizeEmailHtml(mail?.bodyHtml), [mail?.bodyHtml])

  if (!isOpen) return null

  const hasBoth = Boolean(mail?.bodyHtml && mail?.bodyText)
  const showHtml = Boolean(mail?.bodyHtml) && (view === 'formatted' || !mail?.bodyText)
  const plainText = mail?.bodyText || mail?.fallbackDescription || ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border bg-purple-50 text-[#6B3BF6] border-purple-200">
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Original Requirement</h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                Requirement ID: <span className="font-bold text-slate-800">{requirementLabel}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading original mail…</span>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-2xl border bg-rose-50 border-rose-200 text-xs text-rose-800">{error}</div>
          )}

          {mail && !loading && (
            <>
              {/* Mail headers */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 text-xs space-y-1.5">
                <div className="text-sm font-extrabold text-slate-900 break-words">{mail.subject || '(No subject)'}</div>
                <div className="text-slate-600">
                  <span className="font-bold text-slate-700">From: </span>
                  {mail.fromName ? `${mail.fromName} <${mail.from || '—'}>` : mail.from || '—'}
                </div>
                {mail.to.length > 0 && (
                  <div className="text-slate-600 break-words">
                    <span className="font-bold text-slate-700">To: </span>
                    {mail.to.join(', ')}
                  </div>
                )}
                {mail.cc.length > 0 && (
                  <div className="text-slate-600 break-words">
                    <span className="font-bold text-slate-700">Cc: </span>
                    {mail.cc.join(', ')}
                  </div>
                )}
                <div className="text-slate-600">
                  <span className="font-bold text-slate-700">Received: </span>
                  {formatReceived(mail.receivedAt)}
                </div>
              </div>

              {!mail.hasOriginal && (
                <div className="p-3.5 rounded-2xl border bg-amber-50 border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    The full mail was not stored for this requirement (it was extracted before original mails were
                    kept). Showing the extracted job description instead.
                  </span>
                </div>
              )}

              {hasBoth && (
                <div className="inline-flex rounded-xl border border-slate-200 p-0.5 bg-white text-xs font-bold">
                  {(['formatted', 'text'] as const).map(v => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                        view === v ? 'bg-[#6B3BF6] text-white' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {v === 'formatted' ? 'Formatted' : 'Plain text'}
                    </button>
                  ))}
                </div>
              )}

              {showHtml ? (
                // Empty sandbox + sanitized srcDoc: mail HTML cannot run scripts or touch app origin.
                <iframe
                  title="Original requirement mail"
                  sandbox=""
                  referrerPolicy="no-referrer"
                  srcDoc={safeHtml}
                  className="w-full h-[55vh] rounded-2xl border border-slate-200 bg-white"
                />
              ) : plainText ? (
                <pre className="whitespace-pre-wrap break-words font-sans text-[13px] leading-relaxed text-slate-800 rounded-2xl border border-slate-200 bg-white p-4">
                  {plainText}
                </pre>
              ) : (
                <div className="text-xs text-slate-500 py-8 text-center">No mail content available.</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
