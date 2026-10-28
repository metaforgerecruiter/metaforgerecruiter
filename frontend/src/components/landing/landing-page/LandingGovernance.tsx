import React from 'react'
import { ShieldCheck } from 'lucide-react'
import { NAV_LINKS, AI_CAPABILITIES, RECRUITMENT_WORKFLOW, ENTERPRISE_CAPABILITIES, GOVERNANCE_PILLARS } from './preamble'
import { SectionHeading } from './SectionHeading'
import { RecruitmentIntelligenceVisualization } from './RecruitmentIntelligenceVisualization'
import { MetaforgeLogo } from '../../common/MetaforgeLogo'
import { LandingVm } from './useLandingPage'

export function LandingGovernance({ vm }: { vm: LandingVm }) {
  return (
    <>
      {/* ---------------------------------------------------------------- */}
      {/* Governance & Trust Positioning                                    */}
      {/* ---------------------------------------------------------------- */}
      <section id="governance" className="py-16 sm:py-20 lg:py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
                Governance & Intelligence
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                Controlled recruitment operations designed for accountability
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed mb-8">
                MetaForge Recruiter Application Platform provides centralized visibility and role-governed execution across every tier of your hiring organization.
              </p>

              <div className="grid sm:grid-cols-2 gap-5">
                {GOVERNANCE_PILLARS.map(p => (
                  <div key={p.title} className="space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                      <p.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900">{p.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-3xl bg-[#0B1021] border border-slate-800 p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-extrabold text-white">Role Governance Matrix</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">● Active Governance</span>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { role: 'Super Admin', access: 'Full System Administration, User Management & System Audit Logs' },
                  { role: 'Admin', access: 'Regional Operations, Clients, Teams & Recruiter Oversight' },
                  { role: 'Team Lead', access: 'Pod Allocations, Submission Quality Review & SLA Tracking' },
                  { role: 'Recruiter', access: 'Candidate Sourcing, Resume Uploads & Requirements Execution' },
                  { role: 'Client Portal', access: 'Isolated View of Assigned Requirements & Submissions' },
                ].map(r => (
                  <div key={r.role} className="p-3 bg-white/[0.04] border border-white/5 rounded-2xl space-y-1">
                    <span className="font-extrabold text-blue-300 text-xs">{r.role}</span>
                    <p className="text-[11px] text-slate-400 font-medium">{r.access}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  )
}
