import React from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { NAV_LINKS, AI_CAPABILITIES, RECRUITMENT_WORKFLOW, ENTERPRISE_CAPABILITIES, GOVERNANCE_PILLARS } from './preamble'
import { SectionHeading } from './SectionHeading'
import { RecruitmentIntelligenceVisualization } from './RecruitmentIntelligenceVisualization'
import { MetaforgeLogo } from '../../common/MetaforgeLogo'
import { LandingVm } from './useLandingPage'

export function LandingCtaFooter({ vm }: { vm: LandingVm }) {
  const {
    onSignIn,
    onRequestAccess,
  } = vm
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Final CTA Section                                                */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white border-t border-slate-200/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="relative rounded-3xl bg-[#0B1021] overflow-hidden px-7 sm:px-12 lg:px-16 py-12 sm:py-16 text-center shadow-2xl border border-slate-800">
            <div className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Accelerate your enterprise recruitment operations
              </h2>
              <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed max-w-2xl mx-auto">
                Sign in to access your role-scoped recruitment workspace or request access to get provisioned by your administrator.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-3">
                <button
                  type="button"
                  onClick={onSignIn}
                  className="h-13 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold shadow-lg shadow-blue-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Sign In to MRAP <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onRequestAccess}
                  className="h-13 px-8 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-bold transition-all cursor-pointer"
                >
                  Request Workspace Access
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Footer                                                            */}
      {/* ---------------------------------------------------------------- */}
      <footer className="bg-white border-t border-slate-200/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MetaforgeLogo variant="dark" size="sm" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
              Recruiter Intelligence Platform
            </span>
          </div>
          <div className="flex items-center gap-5 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Enterprise Governed
            </span>
            <span>v3.2.0</span>
            <span>© 2026 MetaForge</span>
          </div>
        </div>
      </footer>
    </>
  )
}
