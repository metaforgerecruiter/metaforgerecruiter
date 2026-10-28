import React from 'react'
import { AddCandidateVm } from './useAddCandidatePage'

export function AddCandidateSkills({ vm }: { vm: AddCandidateVm }) {
  const {
    skills,
    setSkills,
    technologies,
    setTechnologies,
  } = vm
  return (
    <>
        {/* SECTION 3: SKILLS & TECHNOLOGIES CARD (MATCHING SCREENSHOT 2) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Skills & technologies
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Use comma-separated values. Skills and technologies are stored in
              separate fields.
            </p>
          </div>

          <div className="space-y-4 pt-1">
            {/* Skills */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Skills
                </label>
                <span className="text-[10px] text-slate-400">
                  e.g. Communication, Problem solving, Team management
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. Communication, Problem solving, Stakeholder management"
                value={skills}
                onChange={e => setSkills(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Technologies */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Technologies
                </label>
                <span className="text-[10px] text-slate-400">
                  Designation / job title only — e.g. SAP Basis Consultant
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. SAP Basis Consultant, Java Developer"
                value={technologies}
                onChange={e => setTechnologies(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>
          </div>
        </div>
    </>
  )
}
