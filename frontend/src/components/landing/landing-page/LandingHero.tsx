'use client'

import React, { useRef } from 'react'
import { Activity, ArrowRight, ShieldCheck, Sparkles, Building2 } from 'lucide-react'
import { RecruitmentIntelligenceVisualization } from './RecruitmentIntelligenceVisualization'
import { LandingVm } from './useLandingPage'
import { gsap, useGSAP } from '../../../lib/animations'

export function LandingHero({ vm }: { vm: LandingVm }) {
  const { onSignIn, onRequestAccess } = vm
  const heroRef = useRef<HTMLElement | null>(null)

  useGSAP(
    () => {
      if (!heroRef.current) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const ctx = gsap.context(() => {
          const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
          tl.from('[data-hero="eyebrow"]', { y: 16, opacity: 0, duration: 0.45 })
            .from('[data-hero="title"]', { y: 22, opacity: 0, duration: 0.55 }, '-=0.2')
            .from('[data-hero="desc"]', { y: 16, opacity: 0, duration: 0.45 }, '-=0.25')
            .from('[data-hero="cta"]', { y: 14, opacity: 0, duration: 0.4, stagger: 0.08 }, '-=0.2')
            .from('[data-hero="pill"]', { y: 12, opacity: 0, duration: 0.35, stagger: 0.05 }, '-=0.15')
            .from('[data-hero="viz"]', { x: 28, opacity: 0, duration: 0.65 }, '-=0.45')
        }, heroRef)
        return () => ctx.revert()
      })
      return () => mm.revert()
    },
    { scope: heroRef }
  )

  return (
    <section ref={heroRef} id="platform" className="relative bg-[#0B1021] text-white overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute -top-32 -left-24 w-[500px] h-[500px] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[560px] h-[560px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-20 lg:py-24">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] gap-12 lg:gap-14 items-center">
          <div>
            <div
              data-hero="eyebrow"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-mono font-bold mb-7 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              <span>MetaForge Enterprise Recruiter Intelligence Platform</span>
            </div>

            <h1
              data-hero="title"
              className="text-4xl sm:text-5xl xl:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight mb-6"
            >
              Recruitment Intelligence.
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                Built for High-Performance Teams.
              </span>
            </h1>

            <p
              data-hero="desc"
              className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mb-9 font-medium"
            >
              Manage requirements, candidates, submissions, interviews and recruiter performance from one
              intelligent recruitment platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-11">
              <button
                type="button"
                data-hero="cta"
                onClick={onSignIn}
                className="h-13 px-7 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                Sign In to MRAP <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                data-hero="cta"
                onClick={onRequestAccess}
                className="h-13 px-7 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                Request Workspace Access
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-7">
              {[
                { label: 'Governed Access Control', icon: ShieldCheck },
                { label: 'Centralized Operations', icon: Building2 },
                { label: 'AI Match Scoring', icon: Sparkles },
                { label: 'Complete Traceability', icon: Activity },
              ].map(item => (
                <div key={item.label} data-hero="pill" className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-[11px] font-bold text-slate-300 font-sans">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div data-hero="viz">
            <RecruitmentIntelligenceVisualization />
          </div>
        </div>
      </div>
    </section>
  )
}
