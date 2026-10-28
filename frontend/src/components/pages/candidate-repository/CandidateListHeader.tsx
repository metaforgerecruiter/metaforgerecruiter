import React from 'react'
import { ArrowLeft, Search, UserPlus, Calendar } from 'lucide-react'
import { CandidateRepoVm } from './useCandidateRepository'
import { hasCapability } from '../../../store/session'

export function CandidateListHeader({ vm }: { vm: CandidateRepoVm }) {
  const {
    onBackToDashboard,
    onOpenAddForm,
    role,
    searchQuery,
    setSearchQuery,
    submittedPeriod,
    setSubmittedPeriod,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    totalExpFilter,
    setTotalExpFilter,
  } = vm
  return (
    <>
      {/* 1. HEADER TITLE — Back only for nested flows (e.g. Dashboard → Repository) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-2 px-4 py-1.5 border border-slate-200/80 rounded-full text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Back</span>
            </button>
          )}

          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Candidate Repository</h1>
            <p className="text-xs text-slate-500 mt-1">
              All candidates from internal database and requirement-linked submissions
            </p>
          </div>
        </div>

        {hasCapability('addCandidates') && (
          <div>
            <button
              type="button"
              onClick={onOpenAddForm}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Candidate</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. FILTER & SEARCH CONTROL CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col gap-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, phone, skills, technology, company,"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-slate-200/90 rounded-xl focus:outline-none focus:border-[#4F46E5] text-slate-800 placeholder:text-slate-400 shadow-2xs transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Submitted period
              </label>
              <select
                value={submittedPeriod}
                onChange={e => setSubmittedPeriod(e.target.value)}
                className="h-9 px-3 text-xs bg-white border border-slate-200/90 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-[#4F46E5] cursor-pointer shadow-2xs"
              >
                <option value="All time">All time</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="This week">This week</option>
                <option value="This month">This month</option>
                <option value="Custom range">Custom range...</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Total experience
              </label>
              <select
                value={totalExpFilter}
                onChange={e => setTotalExpFilter(e.target.value)}
                className="h-9 px-3 text-xs bg-white border border-slate-200/90 rounded-xl font-medium text-slate-700 focus:outline-none focus:border-[#4F46E5] cursor-pointer shadow-2xs"
              >
                <option value="All experience">All experience</option>
                <option value="0–2 years">0-2 Years</option>
                <option value="2–5 years">3-5 Years</option>
                <option value="5–8 years">5-8 Years</option>
                <option value="8–10 years">8-10 Years</option>
                <option value="10+ years">10+ Years</option>
              </select>
            </div>
          </div>
        </div>

        {submittedPeriod === 'Custom range' && (
          <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100 animate-in fade-in duration-150 w-full text-xs">
            <span className="font-bold text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Date Range:</span>
            </span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 bg-white font-medium"
            />
            <span className="text-slate-400 font-bold">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 bg-white font-medium"
            />
            <button
              type="button"
              onClick={() => {
                setCustomStartDate('')
                setCustomEndDate('')
                setSubmittedPeriod('All time')
              }}
              className="px-3 py-1.5 font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Clear Date Filter
            </button>
          </div>
        )}
      </div>
    </>
  )
}
