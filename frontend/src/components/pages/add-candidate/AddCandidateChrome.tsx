import React from 'react'
import { Users, CheckCircle, ArrowLeft, AlertCircle, X } from 'lucide-react'

import { PageHeader } from '../../layout/PageHeader'
import { AddCandidateVm } from './useAddCandidatePage'

export function AddCandidateChrome({ vm }: { vm: AddCandidateVm }) {
  const {
    onOpenRepository,
    showSuccessToast,
    toastMsg,
    setToastMsg,
    showBack = false,
  } = vm

  const handleBack = () => {
    if (typeof onOpenRepository === 'function') {
      onOpenRepository()
    }
  }

  return (
    <>
      {/* SUCCESS TOAST ALERT */}
      {showSuccessToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-bounce">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>Candidate saved successfully to Repository!</span>
        </div>
      )}

      {/* ERROR / NOTIFICATION TOAST ALERT */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-rose-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-sm font-medium animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-white" />
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="ml-2 hover:bg-rose-700 p-1 rounded-lg cursor-pointer transition-colors"
            title="Dismiss"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        {showBack && (
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
            title="Return to candidate repository"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back</span>
          </button>
        )}

        <div className="flex-1">
          <PageHeader
            title="Candidate Search & Entry"
            subtitle="Drop a resume to auto-fill details with Metaforge AI, or enter manually. Single or bulk import supported — review before submitting."
            action={
              <button
                onClick={onOpenRepository}
                className="inline-flex items-center justify-center gap-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0"
              >
                <Users className="w-4 h-4" />
                Candidate Repository
              </button>
            }
          />
        </div>
      </div>
    </>
  )
}
