import React from 'react'
import { FileText, UserCheck, Send, Building } from 'lucide-react'
import { PaginationFooter } from '../../ui/PaginationFooter'
import { PageHeader } from '../../layout/PageHeader'
import { SubmissionCandidateDetailModal } from '../../modals/SubmissionCandidateDetailModal'
import { ScheduleInterviewModal } from '../../modals/ScheduleInterviewModal'
import { RequirementDetailOverview } from '../RequirementDetailOverview'
import { CreateJobDemandForm } from '../CreateJobDemandForm'
import { SubmissionsVm } from './useSubmissionsPage'

export function SubmissionsHeaderKpis({ vm }: { vm: SubmissionsVm }) {
  const {
    submissions,
    dateFilter,
    clientFilter,
    clientOptions,
    filteredData,
  } = vm
  return (
    <>
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Total Submissions</h1>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-[#6B3BF6] border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
              <FileText className="w-3.5 h-3.5 text-[#6B3BF6]" />
              <span>
                {filteredData.length} {dateFilter === 'Today' ? 'Candidates Submitted Today' : dateFilter === 'Yesterday' ? 'Candidates Submitted Yesterday' : dateFilter === 'This week' ? 'Candidates Submitted This Week' : dateFilter === 'This month' ? 'Candidates Submitted This Month' : 'Candidates Submitted'}
              </span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track candidate profiles submitted to client organizations by your recruitment desk.
          </p>
        </div>


      </div>

      {/* 2. Enhanced KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {dateFilter === 'Today' ? 'Submitted to Client Today' : dateFilter === 'Yesterday' ? 'Submitted to Client Yesterday' : dateFilter === 'This week' ? 'Submitted to Client This Week' : dateFilter === 'This month' ? 'Submitted to Client This Month' : 'Total Client Submissions'}
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {filteredData.length}
            </p>
            <span className="text-[10px] text-purple-600 font-semibold mt-0.5 block">
              {clientFilter !== 'All' ? `Filtered by ${clientFilter}` : `Across ${clientOptions.length} Clients`}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6B3BF6] shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Client Partners
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {new Set(filteredData.map(d => d.clientName || 'Accenture')).size}
            </p>
            <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
              Active Client Organizations
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Building className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Submitted to Client
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {filteredData.filter(d => d.status.toLowerCase().includes('client')).length}
            </p>
            <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 block">
              Client Stage Submissions
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Send className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Interviews & Selections
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {filteredData.filter(d => d.status.toLowerCase().includes('interview') || d.status.toLowerCase().includes('select')).length}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold mt-0.5 block">
              Active Interviews & Placements
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

    </>
  )
}
