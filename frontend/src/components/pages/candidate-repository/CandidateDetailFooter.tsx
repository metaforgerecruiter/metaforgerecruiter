import React from 'react'
import { Send, ShieldAlert } from 'lucide-react'
import { checkDuplicateSubmission } from '../../../data/submissionsStore'
import { CandidateRepoItem } from './types'
import { CandidateRepoVm } from './useCandidateRepository'

export function CandidateDetailFooter({ vm, viewingCandidateDetail }: { vm: CandidateRepoVm; viewingCandidateDetail: CandidateRepoItem }) {
  const {
    setViewingCandidateDetail,
    handleOpenEdit,
    isLeadRole,
    activeRequirement,
    handleSubmitSingleToLead,
    role,
  } = vm
  return (
    <>
            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setViewingCandidateDetail(null)}
                className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(viewingCandidateDetail)}
                  className="px-5 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Edit Profile
                </button>
                {!isLeadRole && activeRequirement && (() => {
                  const modalDup = checkDuplicateSubmission(activeRequirement.id, {
                    email: viewingCandidateDetail.email,
                    phone: viewingCandidateDetail.phone,
                    candidateId: viewingCandidateDetail.candidateId,
                    name: viewingCandidateDetail.name,
                  })
                  if (modalDup.isDuplicate) {
                    return (
                      <button
                        type="button"
                        disabled
                        className="px-6 py-2.5 bg-rose-200 text-rose-800 text-xs font-extrabold rounded-xl border border-rose-300 cursor-not-allowed flex items-center gap-2"
                        title={`Already submitted by ${modalDup.existingSubmission?.recruiter || 'another recruiter'}`}
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-700" />
                        <span>Duplicate Submission - Cannot Submit</span>
                      </button>
                    )
                  }
                  return (
                    <button
                      type="button"
                      onClick={() => handleSubmitSingleToLead(viewingCandidateDetail)}
                      className="px-6 py-2.5 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-extrabold rounded-xl transition-all shadow-sm cursor-pointer active:scale-98 flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{(role || '').toLowerCase() === 'lead' ? 'Submit to Client' : 'Submit to Lead'}</span>
                    </button>
                  )
                })()}
              </div>
            </div>
    </>
  )
}
