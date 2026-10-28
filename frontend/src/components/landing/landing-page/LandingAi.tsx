import React from 'react'
import { NAV_LINKS, AI_CAPABILITIES, RECRUITMENT_WORKFLOW, ENTERPRISE_CAPABILITIES, GOVERNANCE_PILLARS } from './preamble'
import { SectionHeading } from './SectionHeading'
import { RecruitmentIntelligenceVisualization } from './RecruitmentIntelligenceVisualization'
import { MetaforgeLogo } from '../../common/MetaforgeLogo'
import { LandingVm } from './useLandingPage'

export function LandingAi({ vm }: { vm: LandingVm }) {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* AI Intelligence Section                                          */}
      {/* ---------------------------------------------------------------- */}
      <section id="ai-intelligence" className="py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="AI Intelligence Engine"
            title="Embedded recruitment AI for faster, higher-quality sourcing"
            subtitle="Eliminate manual screening bottlenecks with automated JD parsing, resume extraction, semantic match scoring, and duplicate detection."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {AI_CAPABILITIES.map(item => (
              <div
                key={item.title}
                className="group bg-slate-50/80 border border-slate-200/90 rounded-3xl p-6 shadow-2xs hover:shadow-xl hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-white transition-all duration-200"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-2xs"
                  style={{ background: `${item.tone}1A`, color: item.tone }}
                >
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
