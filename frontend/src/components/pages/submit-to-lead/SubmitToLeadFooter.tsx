import React from 'react'
import { Send, ShieldAlert } from 'lucide-react'
import { SubmitToLeadVm } from './useSubmitToLeadPage'
import { hasCapability } from '../../../store/session'

export function SubmitToLeadFooter({ vm }: { vm: SubmitToLeadVm }) {
  const {
    requirement,
    clientName,
    confirmForwardChecked,
    setConfirmForwardChecked,
    toastMsg,
    currentReqId,
    hasDuplicateSubmission,
    firstDuplicate,
    handleSubmitFinal,
    selectedCandidates,
    validCandidatesToSubmit,
    allCandidatesAreDuplicates,
    duplicateCheckResults,
  } = vm

  const canSubmit = hasCapability('submitToClients')
  const count = Array.isArray(selectedCandidates) ? selectedCandidates.length : 0
  const validCount = Array.isArray(validCandidatesToSubmit) ? validCandidatesToSubmit.length : (allCandidatesAreDuplicates ? 0 : count)
  const blockedCount = Array.isArray(duplicateCheckResults) ? (duplicateCheckResults.length - validCount) : 0
  const isSubmitDisabled = !confirmForwardChecked || allCandidatesAreDuplicates || validCount === 0 || !canSubmit

  return (
    <div className="space-y-6 pt-2">
      {/* DUPLICATE SUBMISSION BANNER IN PAGE */}
      {hasDuplicateSubmission && firstDuplicate && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-rose-900 text-xs uppercase tracking-wide bg-rose-600 text-white px-2 py-0.5 rounded-md">
                Duplicate Submission
              </span>
              <span className="text-xs font-bold text-rose-800">Already submitted for this requirement</span>
            </div>
          </div>
          <p className="text-xs text-rose-950 font-medium leading-relaxed">
            Candidate <strong>{firstDuplicate.candidateName}</strong> has already been submitted for this requirement (<strong>{currentReqId}</strong>) by another vendor/recruiter.
          </p>
          <div className="text-[11px] text-rose-900 bg-rose-100/80 p-2.5 rounded-xl border border-rose-200/80 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
            <span>Submitted By: <strong>{firstDuplicate.existingSubmission?.recruiter || 'External Vendor'}</strong></span>
            <span>Date: <strong>{firstDuplicate.existingSubmission?.date}</strong></span>
            <span>Status: <strong>{firstDuplicate.existingSubmission?.stage}</strong></span>
            <span>Reason: <em>{firstDuplicate.matchReason}</em></span>
          </div>
        </div>
      )}

      {/* STICKY BOTTOM ACTION BAR MATCHING SCREENSHOT 3 & 4 */}
      <div className={`sticky bottom-4 z-30 border backdrop-blur-md py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-between gap-4 ${
        hasDuplicateSubmission
          ? 'bg-rose-50/95 border-rose-300'
          : 'bg-white/95 border-slate-200/90'
      }`}>
        <span className="text-xs font-bold text-slate-700">
          {allCandidatesAreDuplicates ? (
            <span className="text-rose-700 font-extrabold">All selected candidate(s) are already submitted. Submission is blocked.</span>
          ) : blockedCount > 0 ? (
            <span>
              Submit <strong className="text-slate-900">{validCount}</strong> valid candidate(s) to the client email ({blockedCount} duplicate candidate blocked).
            </span>
          ) : (
            <span>Submit the selected {count} candidate(s) to the client email on this page.</span>
          )}
          {!canSubmit ? (
            <span className="block text-[11px] text-rose-700 font-bold mt-0.5">
              ⛔ Access Restricted: Super Admin has disabled client submissions for your account.
            </span>
          ) : !confirmForwardChecked && !allCandidatesAreDuplicates && (
            <span className="block text-[11px] text-amber-700 font-normal mt-0.5">
              ⚠ Mandatory confirmation checkbox must be checked above before submitting.
            </span>
          )}
        </span>

        <button
          onClick={handleSubmitFinal}
          disabled={isSubmitDisabled}
          title={
            !canSubmit
              ? 'Access Restricted: Super Admin has disabled client submissions for your account'
              : !confirmForwardChecked
              ? 'Check the confirmation checkbox above to enable submission'
              : allCandidatesAreDuplicates
              ? 'Candidate is already submitted'
              : 'Submit to Client'
          }
          className={`px-6 py-2.5 font-extrabold text-xs rounded-xl transition-all flex items-center gap-2 shrink-0 ${
            isSubmitDisabled
              ? 'bg-slate-200 text-slate-400 border border-slate-300 shadow-none cursor-not-allowed opacity-60'
              : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-lg cursor-pointer active:scale-98'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Submit to Client</span>
        </button>
      </div>

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed bottom-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
