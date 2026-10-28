import React from 'react'
import { RequirementDetailVm } from './useRequirementDetailOverview'

export function ReqDetailInterviewsOffers({ vm }: { vm: RequirementDetailVm }) {
  const {
    requirement,
    activeTab,
  } = vm
  return (
    <>
      {activeTab === 'Interviews' && (
        <div className="space-y-6">
          {/* Card 1: Spec table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Interview rounds (spec table)</h3>
              <p className="text-xs text-gray-400 font-normal mt-0.5">
                Rows from <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">interview_rounds</code>, dual-written from legacy interviews.
              </p>
            </div>
            <div className="text-xs text-gray-500 pt-2">
              No interview rounds yet — schedule from the pipeline.
            </div>
          </div>

          {/* Card 2: Legacy interviews */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-gray-900">Legacy interviews (API)</h3>
            <div className="text-xs text-gray-500 pt-1">
              No interviews scheduled yet for this requirement.
            </div>
          </div>
        </div>
      )}

      {/* OFFERS TAB (MATCHING SCREENSHOT 4) */}
      {activeTab === 'Offers' && (
        <div className="space-y-6">
          {/* Card 1: Offer management */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Offer management (spec table)</h3>
              <p className="text-xs text-gray-400 font-normal mt-0.5">
                Rows from <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">offer_management</code>, dual-written from legacy offer letters.
              </p>
            </div>
            <div className="text-xs text-gray-500 pt-2">
              No offer rows yet.
            </div>
          </div>

          {/* Card 2: Legacy offer letters summary */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900">Legacy offer letters summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3 font-bold">CANDIDATE</th>
                    <th className="py-2.5 px-3 font-bold">STATUS</th>
                    <th className="py-2.5 px-3 font-bold">COMPENSATION</th>
                    <th className="py-2.5 px-3 font-bold">JOINING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {vm.reqSubmissions.filter(sub => /offer|placed|joined/i.test(sub.status || '')).length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-3.5 px-3 text-gray-400">No offers for this requirement yet.</td>
                    </tr>
                  )}
                  {vm.reqSubmissions
                    .filter(sub => /offer|placed|joined/i.test(sub.status || ''))
                    .map(sub => (
                      <tr key={String(sub.id)}>
                        <td className="py-3.5 px-3 font-bold text-gray-900">{sub.candidateName}</td>
                        <td className="py-3.5 px-3 text-gray-600">{sub.status}</td>
                        <td className="py-3.5 px-3 text-gray-400">{sub.expectedSalary || '—'}</td>
                        <td className="py-3.5 px-3 text-gray-400">—</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
