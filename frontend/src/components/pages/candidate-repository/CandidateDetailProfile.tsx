import React from 'react'
import { Briefcase, DollarSign } from 'lucide-react'
import { CandidateRepoItem } from './types'

export function CandidateDetailProfile({ viewingCandidateDetail }: { viewingCandidateDetail: CandidateRepoItem }) {
  return (
    <>
              {/* Section 2: Professional Profile & Education */}
              <div className="border border-slate-200/80 rounded-2xl p-4 space-y-3 bg-white">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#6B3BF6]" />
                  Professional Profile & Education
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Primary Technology / Role</span>
                    <span className="font-extrabold text-slate-900 text-sm">{viewingCandidateDetail.technology}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Current Company</span>
                    <span className="font-bold text-slate-800">{viewingCandidateDetail.currentCompany || 'Not specified'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Total Experience</span>
                    <span className="font-bold text-slate-900">{viewingCandidateDetail.totalExperience}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Relevant Experience</span>
                    <span className="font-bold text-slate-900">{viewingCandidateDetail.relevantExperience || viewingCandidateDetail.totalExperience}</span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px] font-medium">Qualification & Education</span>
                    <span className="font-semibold text-slate-800">{viewingCandidateDetail.qualification || '—'}</span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px] font-medium mb-1">Key Skills & Competencies</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(viewingCandidateDetail.skills || '—').split(',').map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-purple-50 text-[#6B3BF6] border border-purple-200/60 rounded-lg text-[11px] font-bold">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Compensation & Notice Period */}
              <div className="border border-slate-200/80 rounded-2xl p-4 space-y-3 bg-white">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-[#6B3BF6]" />
                  Compensation & Notice Period
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Current CTC</span>
                    <span className="font-extrabold text-slate-900">{viewingCandidateDetail.currentCtc || '—'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Expected CTC</span>
                    <span className="font-extrabold text-emerald-700">{viewingCandidateDetail.expectedCtc || '—'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Notice Period</span>
                    <span className="font-extrabold text-amber-700">{viewingCandidateDetail.noticePeriod || '—'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Offer In Hand</span>
                    <span className="font-bold text-slate-800">{viewingCandidateDetail.offerInHand || 'No'}</span>
                  </div>
                </div>
              </div>
    </>
  )
}
