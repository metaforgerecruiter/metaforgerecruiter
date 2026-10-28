import React from 'react'
import { Pencil, Calendar, Eye, Search } from 'lucide-react'
import { RequirementDetailVm } from './useRequirementDetailOverview'

export function ReqDetailOverviewC({ vm }: { vm: RequirementDetailVm }) {
  const {
    requirement,
    historyTabFilter,
    setHistoryTabFilter,
    historySearchQuery,
    setHistorySearchQuery,
    historyPage,
    setHistoryPage,
    setIsScheduleModalOpen,
    setSchedulingCandidateRow,
    isRecruiter,
    filteredHistoryRows,
    showToast,
    activeTab,
  } = vm
  return (
    <>
      {activeTab === 'Overview' && (
        <>
          {/* REQUIREMENT HISTORY CARD (MATCHING USER SCREENSHOT) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Requirement History</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isRecruiter ? 'Your candidate submissions for this requirement, newest first.' : 'All recruiter submissions for this requirement, newest first.'}
              </p>
            </div>

            {/* Top Metric Cards (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50/80 border border-gray-200/80 rounded-xl p-4 space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">RECRUITERS WORKING</div>
                <div className="text-2xl font-extrabold text-gray-900">{isRecruiter ? 1 : 4}</div>
              </div>

              <div className="bg-slate-50/80 border border-gray-200/80 rounded-xl p-4 space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">RESUMES SUBMITTED</div>
                <div className="text-2xl font-extrabold text-gray-900">{filteredHistoryRows.length}</div>
              </div>

              <div className="bg-slate-50/80 border border-gray-200/80 rounded-xl p-4 space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BY STATUS</div>
                <div className="text-xs font-bold text-gray-800 flex flex-wrap gap-x-2 gap-y-1 pt-1">
                  <span>Lead review: <strong className="text-slate-900">0</strong></span>
                  <span className="text-gray-300">|</span>
                  <span>Client: <strong className="text-slate-900">{filteredHistoryRows.filter(r => r.status === 'Submitted to Client').length}</strong></span>
                  <span className="text-gray-300">|</span>
                  <span>Interview: <strong className="text-slate-900">0</strong></span>
                  <span className="text-gray-300">|</span>
                  <span>Selected: <strong className="text-slate-900">0</strong></span>
                  <span className="text-gray-300">|</span>
                  <span>Rejected: <strong className="text-slate-900">0</strong></span>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                <button
                  onClick={() => setHistoryTabFilter('all')}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyTabFilter === 'all'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>All</span>
                  <span className="px-1.5 py-0.2 bg-blue-200/60 text-blue-800 rounded-full text-[10px] font-extrabold">{filteredHistoryRows.length}</span>
                </button>

                <button
                  onClick={() => setHistoryTabFilter('submitted_lead')}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyTabFilter === 'submitted_lead'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Submitted to Lead</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold">0</span>
                </button>

                <button
                  onClick={() => setHistoryTabFilter('submitted_client')}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyTabFilter === 'submitted_client'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Submitted to Client</span>
                  <span className="px-1.5 py-0.2 bg-blue-200/60 text-blue-800 rounded-full text-[10px] font-extrabold">{filteredHistoryRows.filter(r => r.status === 'Submitted to Client').length}</span>
                </button>

                <button
                  onClick={() => setHistoryTabFilter('interview')}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyTabFilter === 'interview'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Interview</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold">0</span>
                </button>

                <button
                  onClick={() => setHistoryTabFilter('selected')}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyTabFilter === 'selected'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Selected</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold">0</span>
                </button>

                <button
                  onClick={() => setHistoryTabFilter('rejected')}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyTabFilter === 'rejected'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Rejected</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold">0</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search candidate or submitter..."
                  value={historySearchQuery}
                  onChange={e => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800"
                />
              </div>
            </div>

            {/* Table Info Bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-1">
              <span>1-{filteredHistoryRows.length} of {filteredHistoryRows.length} submissions</span>
              <span>Page 1 of 1</span>
            </div>

            {/* History Table */}
            <div className="border border-gray-200/80 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">SUBMISSION</th>
                    <th className="py-3 px-4">CANDIDATE</th>
                    <th className="py-3 px-4">SUBMITTED BY</th>
                    <th className="py-3 px-4">SUBMITTED ON</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800 bg-white">
                  {filteredHistoryRows.map(row => (
                    <tr key={row.subId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-600">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px]">
                          {row.subId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                            {row.avatar}
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900">{row.name}</div>
                            <div className="text-[11px] text-gray-400 font-normal">{row.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-gray-900">{row.submittedBy}</div>
                        <div className="text-[11px] text-gray-400 font-normal">{row.submitterEmail}</div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600 font-medium whitespace-nowrap">
                        {row.submittedOn}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-[11px] font-bold">
                          {row.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {row.canSchedule ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSchedulingCandidateRow(row)
                                setIsScheduleModalOpen(true)
                              }}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer shadow-2xs flex items-center gap-1 transition-all"
                            >
                              <Calendar className="w-3 h-3 text-blue-600" />
                              <span>Schedule</span>
                            </button>
                            <button
                              onClick={() => showToast(`Editing submission for ${row.name}...`)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                              title="Edit submission"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium flex items-center justify-end gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>View only</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="flex items-center justify-between pt-2 text-xs text-gray-500 font-medium">
              <span>Showing submissions 1-5 on page {historyPage}</span>
              <div className="flex items-center gap-1.5 font-bold">
                <button
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage(1)}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  &lt; Previous
                </button>
                <button
                  onClick={() => setHistoryPage(1)}
                  className={`w-7 h-7 rounded-lg border text-xs cursor-pointer ${
                    historyPage === 1 ? 'border-blue-600 bg-blue-50 text-blue-700 font-extrabold' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  1
                </button>
                <button
                  onClick={() => setHistoryPage(2)}
                  className={`w-7 h-7 rounded-lg border text-xs cursor-pointer ${
                    historyPage === 2 ? 'border-blue-600 bg-blue-50 text-blue-700 font-extrabold' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  2
                </button>
                <button
                  disabled={historyPage === 2}
                  onClick={() => setHistoryPage(2)}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Next &gt;
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
