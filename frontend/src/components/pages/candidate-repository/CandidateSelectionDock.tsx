import React from 'react'
import { Send, X } from 'lucide-react'
import { CandidateRepoVm } from './useCandidateRepository'
import { hasCapability } from '../../../store/session'

export function CandidateSelectionDock({ vm }: { vm: CandidateRepoVm }) {
  const {
    activeRequirement,
    selectedIds,
    viewMode,
    setSelectedIds,
    repoList,
    showToast,
    setSelectedCandidatesForSubmit,
    setViewMode,
    setIsChangeReqModalOpen,
    scrollToNextPageSection,
  } = vm

  return (
    <>
      {selectedIds.size > 0 && viewMode !== 'submit_to_lead' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl rounded-2xl p-3 px-6 flex items-center gap-6 backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-100">
              <strong className="text-emerald-400 font-extrabold">{selectedIds.size}</strong> candidate(s) selected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-all border border-slate-700 inline-flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5 text-slate-400" />
              <span>Clear</span>
            </button>
            <button
              onClick={() => {
                if (!hasCapability('submitToClients')) {
                  showToast('Permission Restricted: Super Admin has disabled client submissions for your account.')
                  return
                }
                const items = repoList.filter(i => selectedIds.has(i.id))
                if (!items.length) {
                  showToast('Select at least one candidate.')
                  return
                }
                if (!activeRequirement?.id) {
                  setIsChangeReqModalOpen(true)
                  showToast('Please select a requirement to forward candidate(s).')
                  return
                }
                setSelectedCandidatesForSubmit(items)
                setViewMode('submit_to_lead')
                scrollToNextPageSection()
              }}
              className="px-5 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-extrabold rounded-xl shadow-lg transition-all cursor-pointer active:scale-98 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Forward / Submit Candidate(s)</span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
