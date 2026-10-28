import React from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { NAV_LINKS, AI_CAPABILITIES, RECRUITMENT_WORKFLOW, ENTERPRISE_CAPABILITIES, GOVERNANCE_PILLARS } from './preamble'
import { SectionHeading } from './SectionHeading'
import { RecruitmentIntelligenceVisualization } from './RecruitmentIntelligenceVisualization'
import { MetaforgeLogo } from '../../common/MetaforgeLogo'
import { LandingVm } from './useLandingPage'

export function LandingNav({ vm }: { vm: LandingVm }) {
  const {
    onSignIn,
    onRequestAccess,
    menuOpen,
    setMenuOpen,
  } = vm
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Navigation Bar                                                    */}
      {/* ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-2xs">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 h-14 sm:h-15 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <MetaforgeLogo variant="dark" size="md" />
            <span className="hidden sm:block h-6 w-px bg-slate-200" />
            <span className="hidden sm:block text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold leading-tight">
              Recruiter Intelligence
              <br />
              Platform
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onRequestAccess}
              className="hidden sm:inline-flex h-10 items-center px-4 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer shadow-2xs"
            >
              Request Workspace Access
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex h-10 items-center gap-2 px-4 sm:px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-blue-600/25 hover:shadow-blue-600/35 transition-all active:scale-[0.98] cursor-pointer"
            >
              Sign In to MRAP <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen(o => !o)}
              className="lg:hidden w-10 h-10 rounded-xl border border-slate-300 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-slate-200/80 bg-white px-5 sm:px-8 py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onRequestAccess()
              }}
              className="w-full mt-2 h-11 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Request Workspace Access
            </button>
          </div>
        )}
      </header>
    </>
  )
}
