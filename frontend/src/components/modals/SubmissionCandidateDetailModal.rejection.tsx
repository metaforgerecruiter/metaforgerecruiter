import React from 'react'
import { PRESET_REJECTION_REASONS } from './SubmissionCandidateDetailModal.data'

export function SubmissionCandidateRejectionForm({
  savedSuccessMsg,
  selectedOption,
  setSelectedOption,
  reasonInput,
  setReasonInput,
  onSaveReason,
}: {
  savedSuccessMsg: boolean
  selectedOption: string
  setSelectedOption: (value: string) => void
  reasonInput: string
  setReasonInput: (value: string) => void
  onSaveReason: () => void
}) {
  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Reason for Rejection
          </h4>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Select a reason from the dropdown or choose custom to type a specific reason.
          </p>
        </div>
        {savedSuccessMsg && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            ✓ Reason saved
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
            Select Rejection Reason
          </label>
          <select
            value={selectedOption}
            onChange={e => {
              const val = e.target.value
              setSelectedOption(val)
              if (val !== 'CUSTOM' && val !== '') {
                setReasonInput(val)
              } else if (val === 'CUSTOM') {
                if (PRESET_REJECTION_REASONS.includes(reasonInput)) {
                  setReasonInput('')
                }
              }
            }}
            className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-900 font-bold cursor-pointer shadow-2xs"
          >
            <option value="">-- Select Reason --</option>
            {PRESET_REJECTION_REASONS.map(reason => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
            <option value="CUSTOM">Custom / Type Reason...</option>
          </select>
        </div>

        {(selectedOption === 'CUSTOM' || (selectedOption !== '' && !PRESET_REJECTION_REASONS.includes(selectedOption))) && (
          <div>
            <label className="block text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1">
              Type Custom Reason
            </label>
            <textarea
              rows={2}
              value={reasonInput}
              onChange={e => setReasonInput(e.target.value)}
              placeholder="Type custom reason for rejection here..."
              className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-900 leading-relaxed resize-y shadow-2xs font-medium"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500 font-semibold">
            Current Reason: <strong className="text-slate-800">{reasonInput || 'None specified'}</strong>
          </span>
          <button
            type="button"
            onClick={onSaveReason}
            className="px-4 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-98"
          >
            Save Reason
          </button>
        </div>
      </div>
    </div>
  )
}
