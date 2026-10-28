import React from 'react'
import { SubmitToLeadRecipients } from './SubmitToLeadRecipients'
import { SubmitToLeadVm } from './useSubmitToLeadPage'
import { CLIENT_TRACKER_PRESETS } from './trackerPresets.data'

export function SubmitToLeadDestination({ vm }: { vm: SubmitToLeadVm }) {
  const {
    requirement,
    submitToLeadChecked,
    setSubmitToLeadChecked,
    forwardLoopChecked,
    setForwardLoopChecked,
    clientName,
    setClientName,
    handleClientChange,
  } = vm

  return (
    <div className="space-y-6">
      {/* 1. SUBMISSION DESTINATION CARD */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Submission destination</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose what to do — you can select one or both. Submit to Lead counts in metrics; forward to the loop does not add a second submission.
          </p>
        </div>

        {/* 2 SIDE-BY-SIDE DESTINATION OPTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Submit to Lead Box */}
          <label
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
              submitToLeadChecked
                ? 'bg-blue-50/80 border-blue-600 shadow-2xs'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={submitToLeadChecked}
              onChange={e => setSubmitToLeadChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0 focus:ring-blue-500"
            />
            <div>
              <span className="font-extrabold text-slate-900 text-xs block">Submit to Lead</span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">
                Send to lead review email. <strong>Counts as one submission.</strong>
              </span>
            </div>
          </label>

          {/* Forward to original requirement loop Box */}
          <label
            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
              forwardLoopChecked
                ? 'bg-amber-50/70 border-amber-400 shadow-2xs'
                : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
            }`}
          >
            <input
              type="checkbox"
              checked={forwardLoopChecked}
              onChange={e => setForwardLoopChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-amber-600 rounded cursor-pointer shrink-0 focus:ring-amber-500"
            />
            <div>
              <span className="font-extrabold text-slate-900 text-xs block">Forward to original requirement loop</span>
              <span className="text-slate-500 text-[11px] mt-0.5 block">
                Reply in the client/DL email thread. <strong>Not a separate submission.</strong>
              </span>
            </div>
          </label>
        </div>

        {/* CLIENT DROPDOWN & CLIENT NAME INPUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">Client</label>
            <select
              value={clientName || 'Other/Custom'}
              onChange={e => {
                const val = e.target.value
                if (handleClientChange) handleClientChange(val)
                else setClientName(val)
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs cursor-pointer"
            >
              {Object.keys(CLIENT_TRACKER_PRESETS).map(preset => (
                <option key={preset} value={preset}>{preset}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1">Client name</label>
            <input
              type="text"
              value={clientName || requirement?.client || ''}
              onChange={e => {
                const value = e.target.value
                if (CLIENT_TRACKER_PRESETS[value]) handleClientChange(value)
                else setClientName(value)
              }}
              placeholder="e.g. LTTS"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* RECIPIENTS & EMAIL THREAD SECTION */}
      <SubmitToLeadRecipients vm={vm} />
    </div>
  )
}
