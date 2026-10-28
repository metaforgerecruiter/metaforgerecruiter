import React from 'react'
import { Building, Search, Send, X } from 'lucide-react'
import { getCandidateSubmissionsHistory } from './history'
import { CandidateRepoVm } from './useCandidateRepository'

export function SubmissionHistoryModal({ vm }: { vm: CandidateRepoVm }) {
  const {
    selectedSubmissionHistoryCandidate,
    submissionModalSearchQuery,
    setSelectedSubmissionHistoryCandidate,
    setSubmissionModalSearchQuery,
  } = vm
  return (
    <>
      {selectedSubmissionHistoryCandidate && (() => {
        const subHistory = getCandidateSubmissionsHistory(selectedSubmissionHistoryCandidate)
        const filteredRecords = subHistory.records.filter(r => {
          if (!submissionModalSearchQuery.trim()) return true
          const q = submissionModalSearchQuery.toLowerCase()
          return (
            r.client.toLowerCase().includes(q) ||
            r.requirementTitle.toLowerCase().includes(q) ||
            r.reqId.toLowerCase().includes(q) ||
            r.submittedBy.toLowerCase().includes(q) ||
            r.status.toLowerCase().includes(q)
          )
        })

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 font-sans max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-purple-100 text-[#6B3BF6] font-black text-sm flex items-center justify-center border border-purple-200 shadow-2xs">
                    <Send className="w-5 h-5 text-[#6B3BF6]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <span>Submission History for {selectedSubmissionHistoryCandidate.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-[#6B3BF6] border border-purple-200">
                        {subHistory.count} Total Submission{subHistory.count > 1 ? 's' : ''}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      ID: {selectedSubmissionHistoryCandidate.candidateId} • {selectedSubmissionHistoryCandidate.technology}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedSubmissionHistoryCandidate(null)
                    setSubmissionModalSearchQuery('')
                  }}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Submissions KPI Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">Total Submissions</span>
                  <span className="text-xl font-black text-purple-950 font-mono">{subHistory.count}</span>
                </div>
                <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Submitted Clients</span>
                  <span className="text-xs font-bold text-emerald-950 block mt-1 truncate">
                    {subHistory.companies.length > 0 ? subHistory.companies.join(', ') : 'None'}
                  </span>
                </div>
              </div>

              {/* Search Control within Modal */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter submissions by client, requirement, recruiter, or status..."
                  value={submissionModalSearchQuery}
                  onChange={e => setSubmissionModalSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800 font-medium"
                />
              </div>

              {/* Submissions List Table */}
              <div className="bg-slate-50/60 rounded-2xl border border-slate-200/80 overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/70 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3.5">CLIENT ACCOUNT</th>
                      <th className="py-3 px-3.5">REQUIREMENT</th>
                      <th className="py-3 px-3.5">SUBMITTED BY</th>
                      <th className="py-3 px-3.5">SUBMITTED DATE</th>
                      <th className="py-3 px-3.5 text-center">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-slate-800 font-medium">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-bold text-xs">
                          No submission records match the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map(rec => (
                        <tr key={rec.id} className="hover:bg-white transition-colors">
                          <td className="py-3 px-3.5 whitespace-nowrap">
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white border border-purple-200 text-purple-900 inline-flex items-center gap-1.5 shadow-2xs">
                              <Building className="w-3 h-3 text-[#6B3BF6]" />
                              <span>{rec.client}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900 leading-snug">{rec.requirementTitle}</div>
                            <div className="text-[10px] text-[#6B3BF6] font-mono">{rec.reqId}</div>
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-700 font-semibold">
                            {rec.submittedBy}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                            {rec.submittedDate}
                          </td>
                          <td className="py-3 px-3.5 whitespace-nowrap text-center">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedSubmissionHistoryCandidate(null)
                    setSubmissionModalSearchQuery('')
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
                >
                  Close History Details
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </>
  )
}
