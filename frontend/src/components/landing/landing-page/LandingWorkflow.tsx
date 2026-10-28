import React from 'react'
import { NAV_LINKS, AI_CAPABILITIES, RECRUITMENT_WORKFLOW, ENTERPRISE_CAPABILITIES, GOVERNANCE_PILLARS } from './preamble'
import { SectionHeading } from './SectionHeading'
import { RecruitmentIntelligenceVisualization } from './RecruitmentIntelligenceVisualization'
import { MetaforgeLogo } from '../../common/MetaforgeLogo'
import { LandingVm } from './useLandingPage'

export function LandingWorkflow({ vm }: { vm: LandingVm }) {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* End-to-End Recruitment Workflow                                   */}
      {/* ---------------------------------------------------------------- */}
      <section id="workflow" className="py-16 sm:py-20 lg:py-24 bg-slate-900 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
              Lifecycle Governance
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
              End-to-end recruitment lifecycle workflow
            </h2>
            <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
              Every requirement moves through structured, traceable stages from initial intake to final candidate placement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RECRUITMENT_WORKFLOW.map(stage => (
              <div
                key={stage.title}
                className="bg-slate-800/60 border border-slate-700/70 rounded-3xl p-5 hover:border-blue-500/50 hover:bg-slate-800/90 transition-all duration-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                    <stage.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-extrabold text-blue-400">{stage.step}</span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">{stage.title}</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </>
  )
}
