import React from 'react'
import { Users, ChevronDown, Search } from 'lucide-react'
import { RequirementDetailVm } from './useRequirementDetailOverview'

export function ReqDetailOverviewB({ vm }: { vm: RequirementDetailVm }) {
  const {
    requirement,
    assignTabFilter,
    setAssignTabFilter,
    assignSearchQuery,
    setAssignSearchQuery,
    isRecruiter,
    activeTab,
  } = vm
  return (
    <>
      {activeTab === 'Overview' && (
          <>
          {/* ASSIGNMENT HISTORY CARD (ONLY VISIBLE TO LEADS, ADMIN, SUPERADMIN - HIDDEN FOR RECRUITER) */}
          {!isRecruiter && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Assignment history</h3>
                  <p className="text-xs text-gray-500 font-normal mt-0.5">
                    Track who was assigned to this requirement and when. Updates when you Reassign or Revoke.
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>4 active</span>
                </span>
              </div>

              {/* Filter Pills & Search Input Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <button
                    onClick={() => setAssignTabFilter('all')}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                      assignTabFilter === 'all'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>All</span>
                    <span className="px-1.5 py-0.2 bg-blue-200/60 text-blue-800 rounded-full text-[10px] font-extrabold">4</span>
                  </button>

                  <button
                    onClick={() => setAssignTabFilter('active')}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                      assignTabFilter === 'active'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Active</span>
                    <span className="px-1.5 py-0.2 bg-blue-200/60 text-blue-800 rounded-full text-[10px] font-extrabold">4</span>
                  </button>

                  <button
                    onClick={() => setAssignTabFilter('revoked')}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                      assignTabFilter === 'revoked'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Revoked</span>
                    <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold">0</span>
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search recruiter or assigner..."
                    value={assignSearchQuery}
                    onChange={e => setAssignSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800"
                  />
                </div>
              </div>

              {/* Assignment list: the requirement's lead and recruiters as recorded */}
              <div className="space-y-3 pt-2">
                {(() => {
                  const people = [
                    ...(requirement.assignedLead ? [{ name: requirement.assignedLead, label: 'Team Lead' }] : []),
                    ...String(requirement.owner || '')
                      .split(',')
                      .map(n => n.trim())
                      .filter(n => n && n !== 'Unassigned')
                      .map(n => ({ name: n, label: 'Recruiter' })),
                  ].filter(p => !assignSearchQuery.trim() || p.name.toLowerCase().includes(assignSearchQuery.trim().toLowerCase()))
                  if (!people.length) {
                    return <p className="text-xs text-gray-400">Not assigned yet.</p>
                  }
                  return people.map(p => (
                    <div
                      key={`${p.label}-${p.name}`}
                      className="border border-slate-200/80 rounded-2xl p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                          {p.name
                            .split(/\s+/)
                            .map(w => w.charAt(0))
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-gray-900 text-xs">{p.name}</div>
                          <div className="text-[11px] text-gray-400 font-normal">{p.label}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-extrabold uppercase">
                        ACTIVE
                      </span>
                    </div>
                  ))
                })()}
              </div>
            </div>
          )}
          </>
      )}
    </>
  )
}
