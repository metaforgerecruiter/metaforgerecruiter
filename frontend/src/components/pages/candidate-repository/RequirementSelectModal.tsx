import React from 'react'
import { X } from 'lucide-react'
import { CandidateRepoVm } from './useCandidateRepository'

export function RequirementSelectModal({ vm }: { vm: CandidateRepoVm }) {
  const {
    isChangeReqModalOpen,
    pendingCandidateForSubmit,
    setIsChangeReqModalOpen,
    setPendingCandidateForSubmit,
    requirements,
    tempModalReqId,
    setTempModalReqId,
    handleConfirmReqSelection,
  } = vm
  return (
    <>
      {isChangeReqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[520px] overflow-hidden border border-slate-100 font-sans">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Select Requirement</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {pendingCandidateForSubmit
                    ? `Please select a requirement to submit candidate "${pendingCandidateForSubmit.name}"`
                    : 'Choose an active requirement to link with candidate repository'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsChangeReqModalOpen(false)
                  setPendingCandidateForSubmit(null)
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  ACTIVE REQUIREMENTS ({requirements.length})
                </label>
                <select
                  value={tempModalReqId}
                  onChange={e => setTempModalReqId(e.target.value)}
                  className="w-full h-11 px-3.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800 shadow-2xs cursor-pointer"
                >
                  <option value="" disabled>-- Select a requirement --</option>
                  {requirements.map(req => (
                    <option key={req.id} value={req.id}>
                      {req.id} — {req.title} ({req.client})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsChangeReqModalOpen(false)
                  setPendingCandidateForSubmit(null)
                }}
                className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!tempModalReqId}
                onClick={() => handleConfirmReqSelection(tempModalReqId)}
                className="px-5 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                Confirm Requirement
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
