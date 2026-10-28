import { useEffect, useMemo, useState } from 'react'
import {
  Search,
  CheckCircle2,
  XCircle,
  Sliders,
  Check,
  X,
} from 'lucide-react'
import { PaginationFooter } from '../../ui/PaginationFooter'
import type { UserManagementVM } from './useUserManagement'

export function PermissionsTab({
    searchQuery, setSearchQuery, roleFilter, setRoleFilter,
    filteredRecruiterUsers, openManageUserPermissionsModal
}: UserManagementVM) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const totalPages = Math.ceil(filteredRecruiterUsers.length / pageSize) || 1
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredRecruiterUsers.slice(start, start + pageSize)
  }, [filteredRecruiterUsers, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, roleFilter, pageSize, filteredRecruiterUsers.length])

  return (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* SEARCH & FILTER BAR */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search user name, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6]"
              />
            </div>

            <div className="w-full sm:w-56">
              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
              >
                <option value="All Roles">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Recruiter">Recruiter</option>
                <option value="Dev Team">Dev Team</option>
                <option value="Client Reviewer">Client Reviewer</option>
              </select>
            </div>
          </div>

          {/* PERMISSIONS MATRIX TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">USER & ROLE</th>
                    <th className="py-3.5 px-4 text-center">ADD CANDIDATES</th>
                    <th className="py-3.5 px-4 text-center">SUBMIT TO CLIENTS</th>
                    <th className="py-3.5 px-4 text-center">SCHEDULE INTERVIEWS</th>
                    <th className="py-3.5 px-4 text-center">EXPORT REPORTS</th>
                    <th className="py-3.5 px-4 text-center">TEAM ANALYTICS</th>
                    <th className="py-3.5 px-4 text-center">REASSIGN REQS</th>
                    <th className="py-3.5 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {paginatedUsers.map(user => (
                    <tr key={user.id} className="hover:bg-purple-50/30 transition-colors">
                      <td className="py-4 px-4 font-bold text-slate-900 max-w-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6B3BF6] font-extrabold flex items-center justify-center text-xs shrink-0 border border-purple-200">
                            {user.avatar}
                          </div>
                          <div>
                            <div className="text-slate-900 font-extrabold text-xs">{user.name}</div>
                            <div className="text-[11px] text-[#6B3BF6] font-bold mt-0.5">{user.roleName}</div>
                            <div className="text-[10px] text-slate-500 font-normal">{user.team}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {user.permissions.addCandidates ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" /> Disabled
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {user.permissions.submitToClients ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" /> Disabled
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {user.permissions.scheduleInterviews ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" /> Disabled
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {user.permissions.exportReportsCsv ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                            Off
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {user.permissions.viewTeamAnalytics ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                            Off
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        {user.permissions.reassignRequirements ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Enabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200">
                            Off
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => openManageUserPermissionsModal(user)}
                          className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] font-extrabold cursor-pointer inline-flex items-center gap-1 text-xs border border-purple-200 shadow-2xs transition-all active:scale-98"
                        >
                          <Sliders className="w-3.5 h-3.5 text-[#6B3BF6]" />
                          <span>Manage Permissions</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationFooter
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRecruiterUsers.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              itemLabel="users"
            />
          </div>
        </div>
  )
}
