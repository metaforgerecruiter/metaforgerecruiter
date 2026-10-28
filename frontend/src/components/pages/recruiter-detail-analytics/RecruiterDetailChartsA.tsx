import React from 'react'
import { BarChart3, TrendingUp, Sparkles, Activity } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts'
import { RecruiterDetailVm } from './useRecruiterDetailAnalytics'

export function RecruiterDetailChartsA({ vm }: { vm: RecruiterDetailVm }) {
  const {
    recruiter,
  } = vm
  return (
    <>
      {/* 2.5 WORK PERFORMANCE & ANALYTICS CHARTS SECTION */}
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6B3BF6]/20 border border-[#6B3BF6]/40 flex items-center justify-center text-purple-300">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-sans tracking-tight">
                {recruiter.name} — Work Performance & Sourcing Analytics
              </h3>
              <p className="text-xs text-slate-300 font-normal">
                Weekly activity trends, candidate stage funnel, and client distribution metrics
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-[#6B3BF6]/20 border border-[#6B3BF6]/40 text-purple-200 px-3.5 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span>Live Recruiter Analytics</span>
          </span>
        </div>

        {/* Chart Row 1: Weekly Sourcing, Submissions & Interviews Activity Trend */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#6B3BF6]" />
                <span>Weekly Work Activity & Turnaround Velocity</span>
              </h4>
              <p className="text-xs text-slate-500">
                Candidates Sourced vs Submissions Sent vs Scheduled Interviews over the past 4 weeks
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-600 font-medium">Sourced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#6B3BF6]" />
                <span className="text-slate-600 font-medium">Submissions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600 font-medium">Interviews</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2 flex items-center justify-center text-xs text-slate-400 text-center px-6">
            Week-by-week activity is not recorded yet. Totals for this recruiter are shown in the cards above.
          </div>
        </div>

      </div>
    </>
  )
}
