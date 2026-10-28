import React from 'react'
import { ArrowRight, Bookmark, ShieldAlert } from 'lucide-react'
import { AddCandidateVm } from './useAddCandidatePage'

export function AddCandidateActions({ vm }: { vm: AddCandidateVm }) {
  const {
    dupCheckResult,
    handleSaveDraftForLater,
  } = vm
  return (
    <>
        {/* BOTTOM ACTION BAR (MATCHING SCREENSHOT 3) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-500">
            Fill only what you know, then review and submit, or save for later to work on it anytime.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraftForLater}
              className="w-full sm:w-auto bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/90 font-bold text-xs px-5 py-2.5 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              title="Save current candidate details to work on later"
            >
              <Bookmark className="w-4 h-4 text-amber-600" />
              <span>Save for Later</span>
            </button>
            <button
              type="submit"
              disabled={dupCheckResult.isDuplicate}
              className={`w-full sm:w-auto font-semibold text-xs px-6 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 ${
                dupCheckResult.isDuplicate
                  ? 'bg-rose-300 text-rose-900 cursor-not-allowed border border-rose-300 shadow-none'
                  : 'bg-[#6B3BF6] hover:bg-[#5833E0] text-white cursor-pointer active:scale-98'
              }`}
            >
              {dupCheckResult.isDuplicate ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                  <span>
                    {(dupCheckResult as any).type === 'repository' || (dupCheckResult as any).existingCandidate
                      ? 'Duplicate Candidate - Already in Repository'
                      : 'Duplicate Submission - Cannot Submit'}
                  </span>
                </>
              ) : (
                <>
                  <span>Review & continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
    </>
  )
}
