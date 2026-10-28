import React from 'react'
import { Briefcase, Filter, MessageSquare, Plus, Edit2 } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts'
import { RecruiterDetailVm } from './useRecruiterDetailAnalytics'

export function RecruiterDetailTable({ vm }: { vm: RecruiterDetailVm }) {
  const {
    recruiter,
    activeTab,
    setActiveTab,
    dateFilter,
    setDateFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleOpenReasonModal,
  } = vm
  return (
    <>
      {/* 3. WORKED VS NON-WORKED REQUIREMENTS FULL LIST TABLE WITH NON-SUBMISSION REASON NOTES */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4.5 h-4.5 text-[#6B3BF6]" />
              <span>Assigned Requirements Breakdown ({recruiter.requirementsList.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Detailed list of requirements worked vs non-worked by {recruiter.name} with non-submission reasons
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Filter Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value as any)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer shadow-2xs"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateFilter === 'custom' && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs shadow-2xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
                  />
                  <span className="text-slate-400 font-bold">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('')
                      setEndDate('')
                      setDateFilter('this_month')
                    }}
                    className="px-2 py-0.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>

            {/* Worked / Non-Worked Tabs (Worked is active by default) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('requirements')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'requirements' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Worked ({recruiter.workedReqs})
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'submissions' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Non-Worked ({recruiter.nonWorkedReqs})
              </button>
            </div>
          </div>
        </div>

        <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">REQUIREMENT TITLE & ID</th>
                <th className="py-3.5 px-4">CLIENT</th>
                <th className="py-3.5 px-4">WORKED STATUS</th>
                <th className="py-3.5 px-4">NON-SUBMISSION REASON / NOTE</th>
                <th className="py-3.5 px-4 text-center">SUBMISSIONS</th>
                <th className="py-3.5 px-4 text-center">INTERVIEWS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {recruiter.requirementsList
                .filter(r => {
                  if (activeTab === 'requirements') return r.status === 'Worked'
                  if (activeTab === 'submissions') return r.status === 'Non-Worked'
                  return true
                })
                .map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{r.title}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{r.id}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{r.client}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                          r.status === 'Worked'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {r.status === 'Worked' ? '✓ Worked' : '⚠️ Non-Worked'}
                      </span>
                    </td>

                    {/* Non-submission Reason / Note Space */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {r.reasonNote ? (
                        <div className="flex items-start gap-1.5 bg-amber-50/80 border border-amber-200/80 p-2 rounded-xl text-[11px] text-amber-900">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="flex-1 font-medium leading-tight">{r.reasonNote}</span>
                          <button
                            onClick={() => handleOpenReasonModal(r)}
                            className="text-amber-700 hover:text-amber-900 font-bold p-0.5 rounded cursor-pointer"
                            title="Edit Reason Note"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenReasonModal(r)}
                          className="px-3 py-1.5 bg-[#6B3BF6]/10 text-[#6B3BF6] hover:bg-[#6B3BF6]/20 font-bold rounded-xl text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Reason Note</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-purple-700">
                      {r.submissions}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {r.interviews}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

    </>
  )
}
