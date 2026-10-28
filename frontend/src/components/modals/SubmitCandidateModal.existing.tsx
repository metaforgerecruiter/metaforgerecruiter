import React from 'react'
import { Check, Search, Send, ShieldAlert, Sparkles } from 'lucide-react'
import { Requirement } from '../../types'
import { checkDuplicateSubmission } from '../../data/submissionsStore'
import { CandidateRepoItem } from './SubmitCandidateModal.data'

export function SubmitCandidateExistingPath({
  searchQuery,
  setSearchQuery,
  filteredCandidates,
  selectedCandidate,
  setSelectedCandidate,
  targetReqId,
  targetReq,
  existingDupResult,
  onClose,
  onSubmitExisting,
}: {
  searchQuery: string
  setSearchQuery: (value: string) => void
  filteredCandidates: CandidateRepoItem[]
  selectedCandidate: CandidateRepoItem | null
  setSelectedCandidate: (c: CandidateRepoItem) => void
  targetReqId: string
  targetReq: Requirement | undefined
  existingDupResult: ReturnType<typeof checkDuplicateSubmission>
  onClose: () => void
  onSubmitExisting: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmitExisting} className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search candidate repository by name, technology, or skills..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800 font-medium"
        />
      </div>

      <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
        {filteredCandidates.map(c => {
          const isSelected = selectedCandidate?.id === c.id
          const dupInfo = checkDuplicateSubmission(targetReqId, {
            email: c.email,
            phone: c.phone,
            candidateId: c.candidateId,
            name: c.name,
          })
          return (
            <div
              key={c.id}
              onClick={() => setSelectedCandidate(c)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? dupInfo.isDuplicate
                    ? 'border-rose-400 bg-rose-50/70 shadow-2xs'
                    : 'border-[#6B3BF6] bg-purple-50/50 shadow-2xs'
                  : dupInfo.isDuplicate
                  ? 'border-rose-200/90 bg-rose-50/30 hover:bg-rose-50/60'
                  : 'border-slate-200/80 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-slate-900 text-xs truncate">{c.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">ID: {c.candidateId}</span>
                  {dupInfo.isDuplicate && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200">
                      <ShieldAlert className="w-3 h-3 text-rose-600" />
                      <span>Duplicate Submission</span>
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-slate-700 truncate">{c.technology}</div>
                <div className="text-[11px] text-slate-500 font-medium truncate">
                  {c.totalExperience} • {c.currentCompany}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {isSelected ? (
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center ${dupInfo.isDuplicate ? 'bg-rose-600 text-white' : 'bg-[#6B3BF6] text-white'}`}>
                    <Check className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className={`px-3 py-1 text-[11px] font-bold rounded-lg ${dupInfo.isDuplicate ? 'bg-rose-100 text-rose-700 hover:bg-rose-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    Select
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {existingDupResult.isDuplicate && existingDupResult.existingSubmission && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-rose-900 text-xs uppercase tracking-wide bg-rose-600 text-white px-2 py-0.5 rounded-md">
                Duplicate Submission
              </span>
              <span className="text-xs font-bold text-rose-800">Submission Blocked</span>
            </div>
          </div>
          <p className="text-xs text-rose-950 font-medium leading-relaxed">
            Candidate <strong>{selectedCandidate?.name}</strong> has already been submitted for requirement <strong>{targetReq?.title} ({targetReq?.id})</strong> by another recruiter/vendor.
          </p>
          <div className="text-[11px] text-rose-900 bg-rose-100/80 p-2.5 rounded-xl border border-rose-200/80 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
            <span>Submitted By: <strong>{existingDupResult.existingSubmission.recruiter || 'External Recruiter'}</strong></span>
            <span>Date: <strong>{existingDupResult.existingSubmission.date}</strong></span>
            <span>Status: <strong>{existingDupResult.existingSubmission.stage}</strong></span>
            <span>Match Info: <em>{existingDupResult.matchReason}</em></span>
          </div>
        </div>
      )}

      {selectedCandidate && !existingDupResult.isDuplicate && (
        <div className="bg-[#EFF6FF] border border-[#C7D2FE] rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-[#1E3A8A] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Ready to Submit to Client</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              94% Skill Match
            </span>
          </div>
          <p className="text-xs text-[#1E3A8A]/80">
            Candidate <strong>{selectedCandidate.name}</strong> will be submitted for <strong>{targetReq?.id} — {targetReq?.title}</strong> ({targetReq?.client}).
          </p>
        </div>
      )}

      <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!selectedCandidate || existingDupResult.isDuplicate}
          className={`px-6 py-2.5 text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 ${
            existingDupResult.isDuplicate
              ? 'bg-rose-300 text-rose-800 cursor-not-allowed border border-rose-300 shadow-none'
              : 'bg-[#6B3BF6] hover:bg-[#5833E0] disabled:opacity-50 text-white cursor-pointer active:scale-98'
          }`}
        >
          {existingDupResult.isDuplicate ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Duplicate Submission - Cannot Submit</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Submit to Client</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
