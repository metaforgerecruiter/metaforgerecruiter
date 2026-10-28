import React from 'react'
import { Award, Briefcase, FileText, Calendar } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts'
import { RecruiterDetailVm } from './useRecruiterDetailAnalytics'

export function RecruiterDetailKpis({ vm }: { vm: RecruiterDetailVm }) {
  const {
    recruiter,
  } = vm
  return (
    <>
      {/* 2. TOP SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5B51D8] uppercase tracking-wider">
              Assigned Requirements
            </span>
            <Briefcase className="w-4 h-4 text-[#5B51D8]" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {recruiter.requirementsCount}
          </p>
          <div className="text-xs font-semibold flex items-center justify-between pt-1 border-t border-[#C7D2FE]/60">
            <span className="text-blue-700">Worked: {recruiter.workedReqs}</span>
            <span className="text-amber-700">Non-worked: {recruiter.nonWorkedReqs}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
              Total Submissions
            </span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {recruiter.submissionsCount}
          </p>
          <div className="text-xs font-semibold flex items-center justify-between pt-1 border-t border-purple-200/60">
            <span className="text-purple-700">Shortlisted: {recruiter.shortlistedCount}</span>
            <span className="text-slate-500">Pending: {recruiter.noSubmissionsCount}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
              Total Interviews
            </span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {recruiter.interviewsCount || '—'}
          </p>
          <div className="text-xs font-semibold text-blue-700 pt-1 border-t border-blue-200/60">
            Conversion Rate: {recruiter.conversionRate}
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Successful Hires
            </span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {recruiter.hiresCount}
          </p>
          <div className="text-xs font-semibold text-emerald-700 pt-1 border-t border-emerald-200/60">
            Weekly Target Progress: {recruiter.weeklyProgressPct}%
          </div>
        </div>
      </div>

    </>
  )
}
