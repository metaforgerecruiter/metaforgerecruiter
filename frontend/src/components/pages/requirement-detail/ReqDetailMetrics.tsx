import React from 'react'
import { RequirementDetailVm } from './useRequirementDetailOverview'

export function ReqDetailMetrics({ vm }: { vm: RequirementDetailVm }) {
  const {
    requirement,
    isUnassigned,
  } = vm
  return (
    <>
      {/* 4. METRICS ROW (7 STAT CARDS MATCHING SCREENSHOT) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* TOTAL CANDIDATES */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            TOTAL CANDIDATES
          </div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">
            {isUnassigned ? 0 : (requirement.submissions || 7)}
          </div>
        </div>

        {/* SUBMITTED */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            SUBMITTED
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {isUnassigned ? 0 : (requirement.submissions || 7)}
          </div>
        </div>

        {/* INTERVIEWING */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            INTERVIEWING
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {requirement.interviews || 0}
          </div>
        </div>

        {/* SELECTED */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            SELECTED
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {requirement.placed || 0}
          </div>
        </div>

        {/* REJECTED */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            REJECTED
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">
            {requirement.rejections || 0}
          </div>
        </div>

        {/* OFFER RELEASED */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            OFFER RELEASED
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">
            0
          </div>
        </div>

        {/* SLA REMAINING (DAYS) */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            SLA REMAINING (DAYS)
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {isUnassigned ? 10 : 0}
          </div>
        </div>
      </div>

      {/* SUGGESTIONS BOX (WHEN ASSIGNED) */}
      {!isUnassigned && (
        <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3.5 text-xs text-blue-900 space-y-1 shadow-2xs">
          <div className="font-bold text-blue-950">Suggestions</div>
          <div className="flex items-center gap-2 text-blue-800 font-medium">
            <span>• • {requirement.submissions || 7} candidate(s) idle in Submitted for over 7 days.</span>
          </div>
        </div>
      )}

      {isUnassigned && (
        <div className="text-xs font-semibold text-gray-500 pl-1">
          SLA 10d left
        </div>
      )}

    </>
  )
}
