import React from 'react'
import { Building, Eye, Send, ShieldAlert } from 'lucide-react'
import { checkDuplicateSubmission } from '../../../data/submissionsStore'
import { getCandidateSubmissionsHistory } from './history'
import { CandidateRepoItem } from './types'
import { CandidateRepoVm } from './useCandidateRepository'

export function CandidateDetailDupHistory({ vm, viewingCandidateDetail }: { vm: CandidateRepoVm; viewingCandidateDetail: CandidateRepoItem }) {
  const {
    activeReqId,
    activeRequirement,
    setSelectedSubmissionHistoryCandidate,
    setSubmissionModalSearchQuery,
  } = vm
  return (
    <>
              {/* Duplicate Submission Warning Alert Box */}
              {activeReqId && viewingCandidateDetail && (() => {
                const modalDupCheck = checkDuplicateSubmission(activeReqId, {
                  email: viewingCandidateDetail.email,
                  phone: viewingCandidateDetail.phone,
                  candidateId: viewingCandidateDetail.candidateId,
                  name: viewingCandidateDetail.name,
                })
                if (!modalDupCheck.isDuplicate) return null
                return (
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
                      Candidate <strong>{viewingCandidateDetail.name}</strong> has already been submitted for target requirement <strong>{activeRequirement?.title || activeReqId} ({activeReqId})</strong> by another recruiter/vendor.
                    </p>
                    <div className="text-[11px] text-rose-900 bg-rose-100/80 p-2.5 rounded-xl border border-rose-200/80 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
                      <span>Submitted By: <strong>{modalDupCheck.existingSubmission?.recruiter || 'External Recruiter'}</strong></span>
                      <span>Date: <strong>{modalDupCheck.existingSubmission?.date}</strong></span>
                      <span>Status: <strong>{modalDupCheck.existingSubmission?.stage}</strong></span>
                      <span>Match Reason: <em>{modalDupCheck.matchReason}</em></span>
                    </div>
                  </div>
                )
              })()}
              {/* Submission History Section */}
              {(() => {
                const subHistory = getCandidateSubmissionsHistory(viewingCandidateDetail)
                return (
                  <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-[#6B3BF6]" />
                        Submission History & Client Submissions
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-[#6B3BF6] text-white">
                          {subHistory.count > 0 ? `Submitted ${subHistory.count} time${subHistory.count > 1 ? 's' : ''}` : 'No Submissions Yet'}
                        </span>
                        {subHistory.count > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSubmissionHistoryCandidate(viewingCandidateDetail)
                              setSubmissionModalSearchQuery('')
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-purple-100 text-[#6B3BF6] border border-purple-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#6B3BF6]" />
                            <span>Inspect Full Details</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px] font-medium mb-1">Companies Submitted To:</span>
                        {subHistory.companies.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {subHistory.companies.map((comp, idx) => (
                              <span key={idx} className="px-3 py-1 bg-white border border-purple-200 text-purple-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-2xs">
                                <Building className="w-3 h-3 text-[#6B3BF6]" />
                                {comp}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-slate-500 italic text-xs">Candidate has not been submitted for any client requirement yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })()}
    </>
  )
}
