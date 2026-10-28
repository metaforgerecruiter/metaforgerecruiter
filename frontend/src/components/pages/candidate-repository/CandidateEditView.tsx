import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { CandidateEditFields } from './CandidateEditFields'
import { CandidateRepoVm } from './useCandidateRepository'

export function CandidateEditView({ vm }: { vm: CandidateRepoVm }) {
  const { editingCandidate, setEditingCandidate, handleEditSubmit, toastMsg } = vm
  if (!editingCandidate) return null
  return (
    <div className="space-y-6 w-full pb-20 font-sans text-slate-800 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setEditingCandidate(null)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-slate-200"
            title="Back to Repository"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Edit Candidate Profile</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              ID: {editingCandidate.candidateId} • Created by {editingCandidate.createdBy} on {editingCandidate.createdDate}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleEditSubmit} className="space-y-6 max-w-5xl">
        <CandidateEditFields vm={vm} />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setEditingCandidate(null)}
            className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#6B3BF6] hover:bg-[#5833E0] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-98"
          >
            Save Changes
          </button>
        </div>
      </form>
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
