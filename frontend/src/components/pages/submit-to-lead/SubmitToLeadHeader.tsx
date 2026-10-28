import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { SubmitToLeadVm } from './useSubmitToLeadPage'

export function SubmitToLeadHeader({ vm }: { vm: SubmitToLeadVm }) {
  const { onBack, requirement } = vm
  const titleText = requirement?.title || '/Title'
  const clientEmailText = requirement?.clientEmail || requirement?.client || '—'

  return (
    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
      <button
        onClick={onBack}
        className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-full transition-all cursor-pointer flex items-center gap-1.5 border border-slate-200 text-xs font-bold shadow-2xs"
        title="Back"
      >
        <ArrowLeft className="w-4 h-4 text-slate-600" />
        <span>Back</span>
      </button>
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submission to Client</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit candidates for <strong className="text-slate-800">{titleText}</strong> at{' '}
          <strong className="text-slate-800">{clientEmailText}</strong>
        </p>
      </div>
    </div>
  )
}
