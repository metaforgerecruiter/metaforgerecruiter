import React from 'react'
import { FileText, MapPin } from 'lucide-react'
import { filesService } from '../../../services/workspace.service'
import { CandidateRepoItem } from './types'
import { CandidateRepoVm } from './useCandidateRepository'

export function CandidateDetailLocationDocs({ vm, viewingCandidateDetail }: { vm: CandidateRepoVm; viewingCandidateDetail: CandidateRepoItem }) {
  const { showToast } = vm
  return (
    <>
              {/* Section 4: Location & Availability */}
              <div className="border border-slate-200/80 rounded-2xl p-4 space-y-3 bg-white">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#6B3BF6]" />
                  Location & Availability
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Current Location</span>
                    <span className="font-bold text-slate-900">{viewingCandidateDetail.currentLocation || '—'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Preferred Work Location</span>
                    <span className="font-bold text-slate-900">{viewingCandidateDetail.preferredLocation || '—'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Interview Availability</span>
                    <span className="font-semibold text-slate-800">{viewingCandidateDetail.interviewAvailability || '—'}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Reason for Job Change</span>
                    <span className="font-semibold text-slate-800">{viewingCandidateDetail.reasonForChange || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Section 5: Documents & Recruiter Notes */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#6B3BF6]" />
                  Resume & Recruiter Notes
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium mb-1">Attached Resume</span>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2.5 w-fit">
                      <FileText className="w-4 h-4 text-red-500" />
                      <span className="font-bold text-slate-800 text-xs">
                        {viewingCandidateDetail.resumeReference || 'No resume attached'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const fileId = viewingCandidateDetail.resumeFileId
                          if (!fileId) {
                            showToast('No resume file is stored for this candidate.')
                            return
                          }
                          showToast('Downloading resume...')
                          filesService.download(fileId).catch(() => showToast('Could not download the resume.'))
                        }}
                        className="ml-2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Download
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Recruiter Internal Notes</span>
                    <p className="text-slate-700 bg-white border border-slate-200 rounded-xl p-3 mt-1 leading-relaxed text-xs">
                      {viewingCandidateDetail.notes || '—'}
                    </p>
                  </div>
                </div>
              </div>
    </>
  )
}
