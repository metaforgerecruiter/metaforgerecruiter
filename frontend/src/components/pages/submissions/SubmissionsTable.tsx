import React from 'react'
import { ExternalLink, Mail, Phone, Building2 } from 'lucide-react'
import { PaginationFooter } from '../../ui/PaginationFooter'
import { PageHeader } from '../../layout/PageHeader'
import { SubmissionCandidateDetailModal } from '../../modals/SubmissionCandidateDetailModal'
import { ScheduleInterviewModal } from '../../modals/ScheduleInterviewModal'
import { RequirementDetailOverview } from '../RequirementDetailOverview'
import { CreateJobDemandForm } from '../CreateJobDemandForm'
import { SubmissionsVm } from './useSubmissionsPage'
import { ScreenshotSubmission } from './preamble'

export function SubmissionsTable({ vm }: { vm: SubmissionsVm }) {
  const {
    submissions,
    setSelectedSub,
    reasons,
    currentPage,
    setCurrentPage,
    handleOpenReqOverview,
    filteredData,
    pageSize,
    setPageSize,
    totalPages,
    paginatedSubmissions,
    getStatusBadgeStyle,
  } = vm
  return (
    <>
      {/* 4. Submissions Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">CANDIDATE & ROLE</th>
                <th className="py-3.5 px-4">REQUIREMENT ID</th>
                <th className="py-3.5 px-4">CURRENT COMPANY & EXP</th>
                <th className="py-3.5 px-4">SUBMITTED BY & DATE</th>
                <th className="py-3.5 px-4">SUBMITTED TO (CLIENT)</th>
                <th className="py-3.5 px-4">STATUS</th>
                <th className="py-3.5 px-4">REASON FOR REJECTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {paginatedSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-sm">No candidate submissions found</p>
                    <p className="text-xs mt-1">Try adjusting your search query, client filter, or date range filter above</p>
                  </td>
                </tr>
              ) : (
                paginatedSubmissions.map((sub: ScreenshotSubmission) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-purple-50/30 transition-colors"
                  >
                    {/* 1. CANDIDATE & ROLE */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#5B51D8] font-extrabold flex items-center justify-center text-xs shrink-0 border border-[#C7D2FE]">
                          {sub.candidateName.charAt(0)}
                        </div>
                        <div>
                          <button
                            onClick={() => setSelectedSub(sub)}
                            className="font-extrabold text-slate-900 text-xs hover:text-[#6B3BF6] hover:underline text-left cursor-pointer transition-colors block"
                            title="Click to view candidate profile"
                          >
                            {sub.candidateName}
                          </button>
                          <div className="text-[11px] text-slate-600 font-semibold mt-0.5">
                            {sub.requirement}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-500">
                            {sub.email && (
                              <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span>{sub.email}</span>
                              </span>
                            )}
                            {sub.phone && (
                              <span className="inline-flex items-center gap-1 text-slate-600 font-medium">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>{sub.phone}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* 2. REQUIREMENT ID */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenReqOverview(sub.reqId || '', sub.requirement, sub.clientName || 'ITC Limited')}
                        className="px-2.5 py-1 rounded-md text-[11px] font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-mono flex items-center gap-1 cursor-pointer transition-all hover:underline shadow-2xs"
                        title="Click to view Requirement Overview"
                      >
                        <span>{sub.reqId || ''}</span>
                        <ExternalLink className="w-3 h-3 text-blue-600" />
                      </button>
                    </td>

                    {/* 3. CURRENT COMPANY & EXP */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800 text-xs">
                        {sub.currentCompany}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Experience: <span className="font-semibold text-slate-700">{sub.experience}</span>
                        {sub.noticePeriod && <span className="ml-1.5 text-slate-400">· NP: {sub.noticePeriod}</span>}
                      </div>
                      {sub.skills && (
                        <div className="flex flex-wrap gap-1 mt-1.5 max-w-[220px]">
                          {(Array.isArray(sub.skills) ? sub.skills : String(sub.skills).split(',')).slice(0, 3).map((sk, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 rounded bg-purple-50 text-[#6B3BF6] text-[9.5px] font-semibold border border-purple-100">
                              {typeof sk === 'string' ? sk.trim() : String(sk)}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* 4. SUBMITTED BY & DATE */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-slate-900 text-xs">{sub.submittedBy}</span>
                        {sub.submittedBy.toLowerCase().includes('harish') && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-extrabold border border-emerald-200">
                            Team Lead
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        {sub.submittedOn}
                      </div>
                    </td>

                    {/* 5. SUBMITTED TO (CLIENT NAME) */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#6B3BF6]" />
                        <span>{sub.clientName || 'ITC Limited'}</span>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                        <span>Client Submitted</span>
                      </div>
                    </td>

                    {/* 6. STATUS */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-0.5 rounded-full text-xs font-extrabold border inline-block ${getStatusBadgeStyle(
                          sub.status
                        )}`}
                      >
                        {sub.status}
                      </span>
                    </td>

                    {/* 7. REASON FOR REJECTION */}
                    <td className="py-4 px-4">
                      {reasons[sub.id] || sub.rejectionReason ? (
                        <span className="text-slate-700 font-medium text-xs block leading-relaxed max-w-xs">
                          {reasons[sub.id] || sub.rejectionReason}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal text-xs">—</span>
                      )}
                    </td>
                  </tr>

                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredData.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

    </>
  )
}
