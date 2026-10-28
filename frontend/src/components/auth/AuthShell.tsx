'use client'

import React, { useRef } from 'react'
import { ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, LucideIcon } from 'lucide-react'
import { MetaforgeLogo } from '../common/MetaforgeLogo'
import { gsap, useGSAP } from '../../lib/animations'

export interface AuthShellProps {
  /** Small pill above the headline on the dark showcase panel */
  eyebrow?: string
  /** Showcase headline (accepts rich markup for gradient spans) */
  headline: React.ReactNode
  /** Supporting paragraph under the headline */
  description: string
  /** Reassurance checklist rendered under the description */
  bullets?: string[]
  /** Optional extra block rendered under the checklist (e.g. credential hints) */
  aside?: React.ReactNode
  /** Optional "back" affordance rendered top-left of the dark panel and on mobile */
  backLabel?: string
  onBack?: () => void
  /** Right-hand column content — normally a form card */
  children: React.ReactNode
  /** Widen the form column for multi-column forms */
  wide?: boolean
}

/**
 * Split-panel chrome shared by every public authentication page.
 * Mirrors the visual language of the existing AuthLayout / RoleLoginPage
 * (deep navy #0B1021 showcase + light slate form column) so the new pages
 * sit inside the same design system.
 */
export function AuthShell({
  eyebrow,
  headline,
  description,
  bullets = [],
  aside,
  backLabel,
  onBack,
  children,
  wide = false,
}: AuthShellProps) {
  const shellRef = useRef<HTMLDivElement | null>(null)

  useGSAP(
    () => {
      if (!shellRef.current) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const ctx = gsap.context(() => {
          gsap.from('[data-auth="panel"]', {
            x: -24,
            opacity: 0,
            duration: 0.55,
            ease: 'power2.out',
          })
          gsap.from('[data-auth="form"]', {
            y: 18,
            opacity: 0,
            duration: 0.5,
            delay: 0.12,
            ease: 'power2.out',
            clearProps: 'transform,opacity',
          })
        }, shellRef)
        return () => ctx.revert()
      })
      return () => mm.revert()
    },
    { scope: shellRef }
  )

  return (
    <div ref={shellRef} className="h-screen max-h-screen overflow-hidden flex bg-slate-50 font-sans">
      {/* Left panel — deep navy product showcase */}
      <div
        data-auth="panel"
        className="hidden lg:flex lg:w-[460px] xl:w-[500px] 2xl:w-[540px] flex-shrink-0 bg-[#0B1021] flex-col relative overflow-hidden text-white border-r border-slate-800/80"
      >
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Ambient glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[420px] h-[420px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col justify-between h-full px-8 xl:px-10 py-6 xl:py-8 overflow-y-auto">
          <div>
            {onBack && backLabel && (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 hover:text-white text-xs font-mono transition-all mb-4 border border-white/10 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
              </button>
            )}

            <div className="flex items-center gap-3 mb-5">
              <div>
                <MetaforgeLogo variant="light" size="md" />
                <p className="text-[9px] text-slate-400 font-mono tracking-widest mt-1 uppercase font-semibold">
                  Recruiter Intelligence Platform
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-2">
            {eyebrow && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[11px] font-mono font-medium mb-3 w-max shadow-xs">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>{eyebrow}</span>
              </div>
            )}

            <h1 className="text-2xl xl:text-3xl font-extrabold text-white leading-snug mb-3 tracking-tight">
              {headline}
            </h1>

            <p className="text-slate-300 text-xs xl:text-sm leading-relaxed max-w-md">{description}</p>

            {bullets.length > 0 && (
              <div className="mt-4 space-y-2">
                {bullets.map(item => (
                  <div key={item} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                    <div className="w-4 h-4 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-blue-400" />
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {aside && <div className="mt-4">{aside}</div>}
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono pt-3 border-t border-slate-800/60 mt-2">
            <span className="flex items-center gap-1.5 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Enterprise Secured
            </span>
            <span>v3.2.0 Console</span>
          </div>
        </div>
      </div>

      {/* Right panel — form column */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50 relative overflow-y-auto h-full">
        <div
          data-auth="form"
          className={`w-full my-auto ${wide ? 'max-w-lg xl:max-w-xl' : 'max-w-md xl:max-w-lg'}`}
        >
          {/* Mobile brand header */}
          <div className="flex items-center gap-3 mb-4 lg:hidden">
            <MetaforgeLogo variant="dark" size="md" />
            <div className="border-l border-slate-200 pl-3">
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">
                Recruiter Intelligence Platform
              </p>
            </div>
          </div>

          {onBack && backLabel && (
            <button
              type="button"
              onClick={onBack}
              className="lg:hidden inline-flex items-center gap-2 text-xs font-mono text-slate-600 hover:text-slate-900 mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> {backLabel}
            </button>
          )}

          {children}
        </div>
      </div>
    </div>
  )
}

/** White form card matching the existing RoleLoginPage card treatment. */
export function AuthCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-10 lg:p-12 shadow-2xl shadow-slate-900/5 ${className}`}
    >
      {children}
    </div>
  )
}

/** Rounded icon tile used at the top of the recovery / success cards. */
export function AuthIconTile({
  icon: Icon,
  tone = 'blue',
}: {
  icon: LucideIcon
  tone?: 'blue' | 'amber' | 'emerald' | 'indigo'
}) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    amber: 'bg-amber-50 border-amber-200 text-amber-600',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-600',
  }
  return (
    <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-6 ${tones[tone]}`}>
      <Icon className="w-7 h-7" />
    </div>
  )
}
