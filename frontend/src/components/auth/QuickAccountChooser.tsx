import React, { useState } from 'react'
import { Check, Copy, ExternalLink, KeyRound, LogIn, ShieldAlert, Sparkles, UserCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { Role } from '../../types'
import { DEMO_ACCOUNTS, DemoAccount, ENABLE_DEV_ACCOUNTS_UI } from '../../config/demoAccounts'
import { quickDevLogin } from '../../data/authService'

interface QuickAccountChooserProps {
  variant?: 'full' | 'banner' | 'compact'
  onSelectRole?: (role: Role) => void
  onFillCredentials?: (email: string, pass: string) => void
  className?: string
}

export function QuickAccountChooser({
  variant = 'full',
  onSelectRole,
  onFillCredentials,
  className = '',
}: QuickAccountChooserProps) {
  const [loggingInId, setLoggingInId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  if (!ENABLE_DEV_ACCOUNTS_UI) {
    return null
  }

  const handle1ClickLogin = async (account: DemoAccount) => {
    setErrorMsg(null)
    setLoggingInId(account.id)
    try {
      const result = await quickDevLogin(account)
      if (result.ok) {
        if (onSelectRole) {
          onSelectRole(result.account.role)
        }
      } else {
        setErrorMsg(result.message)
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoggingInId(null)
    }
  }

  const handleCopy = (account: DemoAccount, e: React.MouseEvent) => {
    e.stopPropagation()
    const text = `Email: ${account.email}\nPassword: ${account.password}`
    navigator.clipboard?.writeText(text)
    setCopiedId(account.id)
    setTimeout(() => setCopiedId(null), 1800)
  }

  // Banner variant for SignUp page
  if (variant === 'banner') {
    return (
      <div className={`rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 via-indigo-50/90 to-purple-50/90 p-3.5 sm:p-4 shadow-sm mb-6 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[10px] font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3 h-3" /> Dev Quick Login
            </span>
            <span className="text-xs font-bold text-slate-800">
              Select an account to log in directly:
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            (Remove prior to production deploy)
          </span>
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-600 font-semibold mb-2 bg-rose-50 border border-rose-200 p-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {DEMO_ACCOUNTS.map((acc) => {
            const isLoading = loggingInId === acc.id
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => handle1ClickLogin(acc)}
                disabled={Boolean(loggingInId)}
                className={`flex flex-col p-2.5 rounded-xl bg-white border text-left transition-all cursor-pointer ${
                  acc.theme.cardBorder
                } hover:shadow-md ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-sm">{acc.avatar}</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${acc.theme.badgeBg} ${acc.theme.badgeText}`}>
                    #{acc.roleNumber}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-900 leading-tight truncate">
                  {acc.roleLabel}
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                  {isLoading ? 'Signing in…' : acc.name}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // Full interactive card list for SignIn page
  return (
    <div className={`mb-6 rounded-2xl border-2 border-dashed border-indigo-200/90 bg-slate-50/70 p-4 transition-all ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-[11px] font-mono font-bold tracking-wide uppercase shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> Dev Quick Login
          </span>
          <span className="text-xs font-bold text-slate-800">
            Choose User Account ({DEMO_ACCOUNTS.length} available)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px] font-mono text-slate-400">
            UI removable for production
          </span>
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Toggle demo accounts list"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3.5 space-y-2.5">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Click <strong className="text-indigo-600 font-semibold">1-Click Sign In</strong> to log straight into that workspace role, or <strong className="text-slate-700">Fill Form</strong> to auto-populate email and password.
          </p>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const isLoading = loggingInId === acc.id
              const isCopied = copiedId === acc.id

              return (
                <div
                  key={acc.id}
                  className={`rounded-xl border p-3 transition-all ${acc.theme.cardBg} ${acc.theme.cardBorder} hover:shadow-sm`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Left: Role info */}
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-white shadow-xs border border-slate-200/80 flex items-center justify-center shrink-0 text-base">
                        {acc.avatar}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${acc.theme.badgeBg} ${acc.theme.badgeBorder} ${acc.theme.badgeText}`}>
                            {acc.roleNumber}. {acc.roleLabel}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {acc.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 mt-1 flex-wrap">
                          <span className="truncate max-w-[200px] sm:max-w-none text-slate-600">{acc.email}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-400">pass: <span className="text-slate-600 font-bold">{acc.password}</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={(e) => handleCopy(acc, e)}
                        title="Copy email & password to clipboard"
                        className="px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-[10px] text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px]">Copy</span>
                          </>
                        )}
                      </button>

                      {onFillCredentials && (
                        <button
                          type="button"
                          onClick={() => onFillCredentials(acc.email, acc.password)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Fill Form
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handle1ClickLogin(acc)}
                        disabled={Boolean(loggingInId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                          acc.theme.btnBg
                        } ${isLoading ? 'opacity-60 pointer-events-none' : ''}`}
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>{isLoading ? 'Signing In…' : '1-Click Sign In'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
