import React from 'react'
import { UserCheck, Search, ChevronDown, Filter, UserPlus, Calendar, RefreshCw } from 'lucide-react'
import { RequirementDetailOverview } from '../RequirementDetailOverview'
import { CreateJobDemandForm } from '../CreateJobDemandForm'
import { PaginationFooter } from '../../ui/PaginationFooter'
import { RequirementsVm } from './useRequirementsPage'

export function RequirementsSearch({ vm }: { vm: RequirementsVm }) {
  const {
    role,
    recruiters,
    globalSearch,
    setGlobalSearch,
    statusDropdown,
    setStatusDropdown,
    clientDropdown,
    setClientDropdown,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    selectedReqIds,
    setSelectedReqIds,
    setIsAssignModalOpen,
    setIsAssignMyselfChecked,
    setSelectedRecruiterNames,
    setRecruiterSearchQuery,
    availableClients,
    currentUserName,
    handleSelfAssign,
    filteredRequirements,
    isSyncingMail,
    mailSyncStatus,
    handleSyncEmails,
  } = vm
  return (
    <>
      {/* UNIFIED SINGLE SEARCH BAR & FILTERS */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Requirement ID, Client name, Role, Location, Owner or Recruiter..."
              value={globalSearch}
              onChange={e => {
                const val = e.target.value
                setGlobalSearch(val)
                if (val.trim() && statusDropdown === 'Unassigned') {
                  setStatusDropdown('All')
                }
              }}
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-800 placeholder-gray-400 bg-gray-50/50 transition-all"
            />
            {globalSearch && (
              <button
                onClick={() => setGlobalSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold rounded-full w-4 h-4 flex items-center justify-center bg-gray-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Client Filter Dropdown */}
          <div className="relative shrink-0 w-full sm:w-48">
            <select
              value={clientDropdown}
              onChange={e => setClientDropdown(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 bg-gray-50/50 font-medium cursor-pointer"
            >
              <option value="All">All Clients ({availableClients.length})</option>
              {availableClients.map(clientName => (
                <option key={clientName} value={clientName}>
                  🏢 {clientName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative shrink-0 w-full sm:w-44">
            <select
              value={statusDropdown}
              onChange={e => setStatusDropdown(e.target.value)}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 bg-gray-50/50 font-semibold cursor-pointer"
            >
              <option value="Unassigned">Unassigned</option>
              <option value="Assigned">Assigned</option>
              <option value="All">All Requirements</option>
              <option value="Closed">Closed</option>
              <option value="Custom">Custom</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Date Filter Dropdown */}
          <div className="relative shrink-0 w-full sm:w-44">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={e => {
                const val = e.target.value
                setDateFilter(val)
                if (val !== 'Custom range') {
                  setCustomStartDate('')
                  setCustomEndDate('')
                }
              }}
              className="w-full appearance-none pl-9 pr-8 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 bg-gray-50/50 font-semibold cursor-pointer"
            >
              <option value="All">All Dates</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="This week">This week</option>
              <option value="This month">This month</option>
              <option value="Custom range">Custom range...</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Custom Date Range Picker when Custom Range is active */}
        {dateFilter === 'Custom range' && (
          <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-gray-100 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Select Date Range:</span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-semibold">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 bg-gray-50 font-medium cursor-pointer shadow-2xs"
                title="Start Date"
                aria-label="Start date"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-semibold">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 bg-gray-50 font-medium cursor-pointer shadow-2xs"
                title="End Date"
                aria-label="End date"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setCustomStartDate('')
                setCustomEndDate('')
                setDateFilter('All')
              }}
              className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0"
            >
              Clear Date Filter
            </button>
          </div>
        )}
      </div>

      {/* REQUIREMENTS COUNT & ASSIGNMENT ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="text-sm font-semibold text-gray-700">
            {filteredRequirements.length} requirement(s)
          </span>

          {isSyncingMail && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
              <span>Syncing Outlook...</span>
            </span>
          )}

          {mailSyncStatus?.lastSyncedAt && !isSyncingMail && (
            <span
              className="text-[11px] text-gray-400 font-medium cursor-help hidden sm:inline"
              title={`Last Outlook extraction check: ${new Date(mailSyncStatus.lastSyncedAt).toLocaleString()}`}
            >
              • Outlook checked {new Date(mailSyncStatus.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          {dateFilter !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              <Calendar className="w-3 h-3 text-blue-600" />
              <span>{dateFilter === 'Custom range' ? `${customStartDate || 'Start'} to ${customEndDate || 'End'}` : dateFilter}</span>
              <button
                type="button"
                onClick={() => {
                  setDateFilter('All')
                  setCustomStartDate('')
                  setCustomEndDate('')
                }}
                className="hover:text-blue-900 cursor-pointer text-xs ml-0.5 font-bold"
                title="Remove date filter"
              >
                ✕
              </button>
            </span>
          )}
        </div>

        {selectedReqIds.size > 0 && (
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-2 rounded-xl shadow-md border border-blue-700/50 flex flex-wrap items-center gap-2.5 animate-in fade-in duration-200">
            <span className="bg-blue-600/80 text-white font-bold px-2.5 py-0.5 rounded text-xs border border-blue-400/40">
              {selectedReqIds.size} Selected
            </span>

            {/* Self Assign Button */}
            <button
              onClick={handleSelfAssign}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title={`Assign to ${currentUserName}`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Self Assign ({currentUserName})</span>
            </button>

            {/* Assign to Someone Button — Hidden for recruiters */}
            {role !== 'recruiter' && (
              <button
                onClick={() => {
                  const isLeadOrAdmin = ['lead', 'admin', 'superadmin', 'devteam'].includes(String(role || '').toLowerCase())
                  setIsAssignMyselfChecked(!isLeadOrAdmin)
                  setSelectedRecruiterNames(new Set())
                  setRecruiterSearchQuery('')
                  setIsAssignModalOpen(true)
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign to Someone...</span>
              </button>
            )}

            <button
              onClick={() => setSelectedReqIds(new Set())}
              className="text-xs text-blue-300 hover:text-white px-2 py-1 font-medium transition-colors cursor-pointer ml-auto"
            >
              Deselect
            </button>
          </div>
        )}
      </div>
    </>
  )
}
