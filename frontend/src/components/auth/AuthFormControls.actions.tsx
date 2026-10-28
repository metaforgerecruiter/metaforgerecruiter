import React from 'react'
import { ArrowRight } from 'lucide-react'

/** Inline banner for form-level errors / notices. */
export function AuthAlert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'info' | 'success'
  children: React.ReactNode
}) {
  const tones = {
    error: 'bg-rose-50 border-rose-200 text-rose-700',
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  }
  const dots = { error: 'bg-rose-500', info: 'bg-blue-500', success: 'bg-emerald-500' }

  return (
    <div role="alert" className={`p-4 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${tones[tone]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${dots[tone]}`} />
      <span className="leading-relaxed">{children}</span>
    </div>
  )
}

interface SubmitButtonProps {
  children: React.ReactNode
  loading?: boolean
  loadingLabel?: string
  disabled?: boolean
  withArrow?: boolean
  onClick?: () => void
  type?: 'submit' | 'button'
}

export function SubmitButton({
  children,
  loading,
  loadingLabel,
  disabled,
  withArrow = true,
  onClick,
  type = 'submit',
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className="w-full h-12 sm:h-13 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          {loadingLabel || 'Please wait…'}
        </>
      ) : (
        <>
          {children}
          {withArrow && <ArrowRight className="w-4 h-4" />}
        </>
      )}
    </button>
  )
}

export function SecondaryButton({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-12 sm:h-13 px-5 border border-slate-300 bg-white text-slate-700 rounded-xl text-xs font-mono font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer ${className}`}
    >
      {children}
    </button>
  )
}
