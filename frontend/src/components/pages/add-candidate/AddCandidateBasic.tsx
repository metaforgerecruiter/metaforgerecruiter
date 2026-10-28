import React from 'react'
import { ShieldAlert } from 'lucide-react'
import { AddCandidateBasicFields } from './AddCandidateBasicFields'
import { AddCandidateVm } from './useAddCandidatePage'

export function AddCandidateBasic({ vm }: { vm: AddCandidateVm }) {
  const {
    candidateName,
    contactNumber,
    email,
    targetReqId,
    dupCheckResult,
  } = vm
  return (
    <>
        {/* SECTION 2: BASIC INFO CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Basic Info</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Candidate contact details and personal information for talent pool registration.
              </p>
            </div>
          </div>

          {/* DUPLICATE SUBMISSION ALERT BANNER */}
          {dupCheckResult.isDuplicate && (dupCheckResult as any).existingSubmission && (
            <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-rose-900 text-xs uppercase tracking-wide bg-rose-600 text-white px-2 py-0.5 rounded-md">
                    Duplicate Submission
                  </span>
                  <span className="text-xs font-bold text-rose-800">Submission Blocked</span>
                </div>
              </div>
              <p className="text-xs text-rose-950 font-medium leading-relaxed">
                Candidate <strong>{candidateName || 'Entered Candidate'}</strong> ({email || contactNumber}) has already been submitted for target requirement <strong>{targetReqId}</strong>.
              </p>
              <div className="text-[11px] text-rose-900 bg-rose-100/80 p-2.5 rounded-xl border border-rose-200/80 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
                <span>Submitted By: <strong>{(dupCheckResult as any).existingSubmission.recruiter || 'External Recruiter'}</strong></span>
                <span>Date: <strong>{(dupCheckResult as any).existingSubmission.date}</strong></span>
                <span>Status: <strong>{(dupCheckResult as any).existingSubmission.stage}</strong></span>
                <span>Reason: <em>{(dupCheckResult as any).matchReason}</em></span>
              </div>
            </div>
          )}

          {/* DUPLICATE CANDIDATE IN REPOSITORY ALERT BANNER */}
          {dupCheckResult.isDuplicate && (dupCheckResult as any).existingCandidate && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-amber-900 text-xs uppercase tracking-wide bg-amber-600 text-white px-2 py-0.5 rounded-md">
                      Duplicate Candidate
                    </span>
                    <span className="text-xs font-bold text-amber-800">Already in Repository</span>
                  </div>
                </div>
                {vm.onOpenRepository && (
                  <button
                    type="button"
                    onClick={vm.onOpenRepository}
                    className="text-xs font-bold text-[#6B3BF6] hover:text-[#5833E0] hover:underline cursor-pointer"
                  >
                    View in Repository &rarr;
                  </button>
                )}
              </div>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                Candidate <strong>{(dupCheckResult as any).existingCandidate?.name || candidateName || 'This Candidate'}</strong> already exists in the Candidate Repository with this <strong>{(dupCheckResult as any).duplicateField || 'contact info'}</strong>.
              </p>
              <div className="text-[11px] text-amber-900 bg-amber-100/80 p-2.5 rounded-xl border border-amber-200/80 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
                <span>Candidate ID: <strong>{(dupCheckResult as any).existingCandidate?.candidateId || 'Registered'}</strong></span>
                <span>Status: <strong>{(dupCheckResult as any).existingCandidate?.status || 'Active'}</strong></span>
                <span>Email: <strong>{(dupCheckResult as any).existingCandidate?.email || email || 'N/A'}</strong></span>
                <span>Phone: <strong>{(dupCheckResult as any).existingCandidate?.phone || contactNumber || 'N/A'}</strong></span>
              </div>
            </div>
          )}

          <AddCandidateBasicFields vm={vm} />
        </div>
    </>
  )
}
