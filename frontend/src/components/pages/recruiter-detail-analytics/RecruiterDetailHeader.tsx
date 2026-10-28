import React from 'react'
import { ArrowLeft, Download } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts'
import { RecruiterDetailVm } from './useRecruiterDetailAnalytics'

export function RecruiterDetailHeader({ vm }: { vm: RecruiterDetailVm }) {
  const {
    recruiter,
    onBack,
    userRole,
    showToast,
  } = vm
  return (
    <>
      {/* 1. TOP NAVIGATION & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="space-y-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Recruiter Reports</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#6B3BF6]/10 text-[#6B3BF6] font-extrabold flex items-center justify-center text-lg border border-[#6B3BF6]/20 shrink-0">
              {recruiter.avatar || recruiter.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {recruiter.name}
                </h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                    recruiter.status === 'On Track'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : recruiter.status === 'Warning'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  ● {recruiter.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Role: <strong className="text-slate-700">{recruiter.role}</strong> • Team: <strong className="text-slate-700">{recruiter.team}</strong> • Recruiter Performance Analytics Page
              </p>
            </div>
          </div>
        </div>

        {userRole !== 'recruiter' && userRole !== 'lead' && userRole !== 'admin' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => showToast(`Exporting ${recruiter.name} Detailed Performance Report...`)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Export Recruiter CSV</span>
            </button>
          </div>
        )}
      </div>

    </>
  )
}
