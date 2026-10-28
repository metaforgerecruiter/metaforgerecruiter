import React from 'react'
import { NAV_LINKS, AI_CAPABILITIES, RECRUITMENT_WORKFLOW, ENTERPRISE_CAPABILITIES, GOVERNANCE_PILLARS } from './preamble'
import { SectionHeading } from './SectionHeading'
import { RecruitmentIntelligenceVisualization } from './RecruitmentIntelligenceVisualization'
import { MetaforgeLogo } from '../../common/MetaforgeLogo'
import { LandingVm } from './useLandingPage'

export function LandingCapabilities({ vm }: { vm: LandingVm }) {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Enterprise Capabilities Grid                                      */}
      {/* ---------------------------------------------------------------- */}
      <section id="capabilities" className="py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="Enterprise Capabilities"
            title="Comprehensive module suite for enterprise hiring teams"
            subtitle="Built for structured recruitment operations across multi-client accounts, team pods, and dedicated recruiters."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ENTERPRISE_CAPABILITIES.map(cap => (
              <div
                key={cap.title}
                className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-purple-300 transition-all duration-200 space-y-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6B3BF6] border border-purple-200/80 flex items-center justify-center shrink-0">
                    <cap.icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">{cap.title}</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
