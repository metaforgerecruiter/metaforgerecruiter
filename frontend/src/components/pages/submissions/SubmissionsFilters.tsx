import React from 'react'
import { Search, ChevronDown, FileText, Filter, UserCheck, Users } from 'lucide-react'
import { SubmissionsVm } from './useSubmissionsPage'

export function SubmissionsFilters({ vm }: { vm: SubmissionsVm }) {
  const {
    role,
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    statusFilter,
    setStatusFilter,
    clientFilter,
    setClientFilter,
    scopeTab,
    setScopeTab,
    scopeSubmissions,
    clientOptions,
    clientCounts,
    filteredData,
  } = vm
  return (
    <>
      {/* 3. Scope Filter Toggle Controls Bar for Team Lead */}
      {role === 'lead' && (
        <div className="bg-[#F8FAFC] p-1.5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center gap-2 shadow-2xs">
          <button
            type="button"
            onClick={() => setScopeTab('my_submissions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              scopeTab === 'my_submissions'
                ? 'bg-[#6B3BF6] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-purple-50 hover:text-[#6B3BF6] border border-slate-200'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>My Individual Submissions (Team Lead)</span>
          </button>
          <button
            type="button"
            onClick={() => setScopeTab('team_members')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              scopeTab === 'team_members'
                ? 'bg-[#6B3BF6] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-purple-50 hover:text-[#6B3BF6] border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Team Members Submissions</span>
          </button>
          <button
            type="button"
            onClick={() => setScopeTab('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              scopeTab === 'all'
                ? 'bg-[#6B3BF6] text-white shadow-2xs'
                : 'bg-white text-slate-700 hover:bg-purple-50 hover:text-[#6B3BF6] border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>All Submissions (Lead + Team Members)</span>
          </button>
        </div>
      )}



      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center gap-3 justify-between">
          {/* Search Bar & Submissions Count Pill */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidate name, client, requirement..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-400 bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center bg-slate-200"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Submission Count Pill beside Search Bar */}
            <div className="px-3.5 py-2 rounded-xl bg-purple-50 text-[#6B3BF6] border border-purple-200 text-xs font-extrabold flex items-center gap-2 shrink-0 shadow-2xs animate-in fade-in duration-150">
              <FileText className="w-3.5 h-3.5 text-[#6B3BF6]" />
              <span>
                {filteredData.length} {clientFilter !== 'All' ? `Submissions (${clientFilter})` : 'Total Submissions'}
              </span>
            </div>
          </div>

          {/* Right Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Client Filter Dropdown */}
            <div className="relative w-full sm:w-48">
              <select
                value={clientFilter}
                onChange={e => setClientFilter(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-700 bg-white font-bold cursor-pointer"
              >
                <option value="All">All Clients ({scopeSubmissions.length})</option>
                {clientOptions.map(client => (
                  <option key={client} value={client}>
                    Client: {client} ({clientCounts[client] || 0})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Date filter dropdown */}
            <div className="relative w-full sm:w-44">
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-700 bg-white font-bold cursor-pointer"
              >
                <option value="All">All Submissions</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="This week">This week</option>
                <option value="This month">This month</option>
                <option value="Custom range">Custom range...</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Custom Range Date Pickers */}
            {dateFilter === 'Custom range' && (
              <div className="flex items-center gap-2 animate-in fade-in duration-150">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#6B3BF6]"
                />
                <span className="text-xs text-slate-400 font-bold">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-[#6B3BF6]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('')
                    setCustomEndDate('')
                    setDateFilter('All')
                  }}
                  className="px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Status Filter Dropdown */}
            <div className="relative w-full sm:w-48">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-700 bg-white font-bold cursor-pointer"
              >
                <option value="All">All Candidate Statuses</option>
                <option value="Submitted to Client">Submitted to Client</option>
                <option value="Interview Scheduled">Interview Scheduled</option>
                <option value="Selected">Selected in Interview</option>
                <option value="Placed">Placed</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

    </>
  )
}
