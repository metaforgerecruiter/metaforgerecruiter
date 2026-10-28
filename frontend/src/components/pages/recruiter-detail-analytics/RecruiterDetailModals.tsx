import React from 'react'
import { X } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts'
import { RecruiterDetailVm } from './useRecruiterDetailAnalytics'

export function RecruiterDetailModals({ vm }: { vm: RecruiterDetailVm }) {
  const {
    selectedReqForReason,
    setSelectedReqForReason,
    reasonText,
    setReasonText,
    toastMsg,
    handleSaveReasonNote,
    PRESET_REASONS,
  } = vm
  return (
    <>
      {/* 5. ADD NON-SUBMISSION REASON NOTE MODAL */}
      {selectedReqForReason && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Non-Submission Reason Note</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedReqForReason.id} • {selectedReqForReason.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedReqForReason(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Quick Presets (1-Click Selection)</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_REASONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReasonText(preset)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-purple-100 hover:text-[#6B3BF6] text-slate-700 text-[11px] font-medium rounded-lg border border-slate-200 transition-all text-left cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Custom Reason / Notes *</label>
                <textarea
                  rows={3}
                  placeholder="Explain why candidates have not been submitted for this requirement yet..."
                  value={reasonText}
                  onChange={e => setReasonText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#6B3BF6] focus:bg-white transition-all text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReqForReason(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReasonNote}
                className="px-5 py-2 text-xs font-bold bg-[#6B3BF6] text-white rounded-xl hover:bg-[#5833E0] shadow-xs cursor-pointer active:scale-98"
              >
                Save Reason Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed bottom-12 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </>
  )
}
