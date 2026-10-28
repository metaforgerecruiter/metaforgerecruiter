import React from 'react'
import { AddCandidateVm } from './useAddCandidatePage'

export function AddCandidateExperience({ vm }: { vm: AddCandidateVm }) {
  const {
    totalExperience,
    setTotalExperience,
    relevantExperience,
    setRelevantExperience,
    currentCtc,
    setCurrentCtc,
    expectedCtc,
    setExpectedCtc,
    noticePeriod,
    setNoticePeriod,
  } = vm
  return (
    <>
        {/* SECTION 4: EXPERIENCE & CTC CARD (MATCHING SCREENSHOT 2) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Experience & CTC</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Capture experience and compensation details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Total Experience */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Total years of experience
                </label>
                <span className="text-[10px] text-slate-400">
                  Years, months, combined, or decimal (e.g. 3.5 Years → 3 Years 5 Months)
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. 3 Years / 8 Months / 4 Years 6 Months / 3.5 Years"
                value={totalExperience}
                onChange={e => setTotalExperience(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Relevant Experience */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Relevant Experience
                </label>
                <span className="text-[10px] text-slate-400">
                  Years, months, combined, or decimal (e.g. 2.8 Years → 2 Years 8 Months)
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. 2 Years / 6 Months / 3 Years 8 Months / 2.8 Years"
                value={relevantExperience}
                onChange={e => setRelevantExperience(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Current CTC */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current CTC
              </label>
              <input
                type="text"
                placeholder="e.g. 12 LPA"
                value={currentCtc}
                onChange={e => setCurrentCtc(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Expected CTC */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected CTC
              </label>
              <input
                type="text"
                placeholder="e.g. 16 LPA"
                value={expectedCtc}
                onChange={e => setExpectedCtc(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Notice Period */}
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notice Period
              </label>
              <input
                type="text"
                placeholder="e.g. 30 days"
                value={noticePeriod}
                onChange={e => setNoticePeriod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>
          </div>
        </div>
    </>
  )
}
