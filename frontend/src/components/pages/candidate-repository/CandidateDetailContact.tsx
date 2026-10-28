import React from 'react'
import { Eye, EyeOff, Phone, User } from 'lucide-react'
import { maskEmail, maskPhone } from './masking'
import { CandidateRepoItem } from './types'
import { CandidateRepoVm } from './useCandidateRepository'

export function CandidateDetailContact({ vm, viewingCandidateDetail }: { vm: CandidateRepoVm; viewingCandidateDetail: CandidateRepoItem }) {
  const { toggleMask, unmaskedIds, unmaskedTimers, showToast } = vm
  return (
    <>
              {/* Section 1: Basic & Contact Details */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#6B3BF6]" />
                    Contact & Identification
                  </h3>
                  <button
                    type="button"
                    onClick={e => toggleMask(viewingCandidateDetail.id, e)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      unmaskedIds.has(viewingCandidateDetail.id)
                        ? 'bg-amber-50 border-amber-300 text-amber-700 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                    title={unmaskedIds.has(viewingCandidateDetail.id) ? 'Click to re-mask contact info immediately' : 'Click to reveal contact info for 20 seconds'}
                  >
                    {unmaskedIds.has(viewingCandidateDetail.id) ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                        <span>Re-mask ({unmaskedTimers[viewingCandidateDetail.id] ?? 20}s)</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Reveal Contact (20s)</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Full Name</span>
                    <span className="font-bold text-slate-900">{viewingCandidateDetail.name}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Email Address</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {unmaskedIds.has(viewingCandidateDetail.id)
                        ? viewingCandidateDetail.email
                        : maskEmail(viewingCandidateDetail.email)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Phone Number</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono font-semibold text-slate-800">
                        {unmaskedIds.has(viewingCandidateDetail.id)
                          ? viewingCandidateDetail.phone
                          : maskPhone(viewingCandidateDetail.phone)}
                      </span>
                      <a
                        href={`tel:${viewingCandidateDetail.phone.replace(/[^0-9+]/g, '')}`}
                        onClick={e => {
                          if (!unmaskedIds.has(viewingCandidateDetail.id)) {
                            toggleMask(viewingCandidateDetail.id, e)
                          }
                          showToast(`Initiating direct call to ${viewingCandidateDetail.name} (${viewingCandidateDetail.phone})...`)
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs active:scale-98"
                        title={`Call ${viewingCandidateDetail.name}`}
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call Candidate</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
    </>
  )
}
