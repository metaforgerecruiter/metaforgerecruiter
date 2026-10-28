import React from 'react'
import { X } from 'lucide-react'
import { CandidateDetailContact } from './CandidateDetailContact'
import { CandidateDetailDupHistory } from './CandidateDetailDupHistory'
import { CandidateDetailFooter } from './CandidateDetailFooter'
import { CandidateDetailLocationDocs } from './CandidateDetailLocationDocs'
import { CandidateDetailProfile } from './CandidateDetailProfile'
import { CandidateRepoVm } from './useCandidateRepository'

export function CandidateDetailModal({ vm }: { vm: CandidateRepoVm }) {
  const { viewingCandidateDetail, setViewingCandidateDetail } = vm
  if (!viewingCandidateDetail) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-slate-100 font-sans flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#6B3BF6]/10 text-[#6B3BF6] flex items-center justify-center font-extrabold text-lg border border-[#6B3BF6]/20">
                  {viewingCandidateDetail.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      {viewingCandidateDetail.name}
                    </h2>
                    {viewingCandidateDetail.status && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {viewingCandidateDetail.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Candidate ID: <strong className="font-mono text-slate-700">{viewingCandidateDetail.candidateId}</strong> • Created by {viewingCandidateDetail.createdBy} on {viewingCandidateDetail.createdDate}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setViewingCandidateDetail(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
        <div className="p-6 overflow-y-auto space-y-4 max-h-[calc(90vh-140px)]">
          <CandidateDetailDupHistory vm={vm} viewingCandidateDetail={viewingCandidateDetail} />
          <CandidateDetailContact vm={vm} viewingCandidateDetail={viewingCandidateDetail} />
          <CandidateDetailProfile viewingCandidateDetail={viewingCandidateDetail} />
          <CandidateDetailLocationDocs vm={vm} viewingCandidateDetail={viewingCandidateDetail} />
        </div>
        <CandidateDetailFooter vm={vm} viewingCandidateDetail={viewingCandidateDetail} />
      </div>
    </div>
  )
}
