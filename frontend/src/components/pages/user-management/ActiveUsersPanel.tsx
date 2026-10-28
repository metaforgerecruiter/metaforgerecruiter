import { useMemo, useState, useEffect } from 'react'
import { Users, UserPlus, KeyRound, ShieldCheck, Search, XCircle, Lock, Building2, Sliders } from 'lucide-react'
import { PaginationFooter } from '../../ui/PaginationFooter'
import type { UserManagementVM } from './useUserManagement'

export function ActiveUsersPanel({
    role, canModifyUsers, users, setViewMode,
    searchQuery, setSearchQuery, filteredUsers, openAdjustClientModal,
    openResetPasswordPage, openAssignRolePage, openManageUserPermissionsModal, promptDeleteUser
}: UserManagementVM) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredUsers.slice(start, start + pageSize)
  }, [filteredUsers, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize, filteredUsers.length])

  return (
            <>
              {/* KPI CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Total Active Accounts
                    </span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">{users.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6B3BF6]">
                    <Users className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Recruiter Accounts
                    </span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                      {users.filter(u => u.role === 'Recruiter').length}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6B3BF6]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      2FA Security Enforced
                    </span>
                    <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
                      {users.filter(u => u.twoFactorEnabled).length} Accounts
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6B3BF6]">
                    <Lock className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* SEARCH & FILTER BAR */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search user name, email, employee ID..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6]"
                  />
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  {canModifyUsers && (
                    <button
                      onClick={() => setViewMode('create_user')}
                      className="px-4 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98 whitespace-nowrap"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ Create User</span>
                    </button>
                  )}
                </div>
              </div>

              {/* USERS TABLE */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        <th className="py-3.5 px-4">USER & EMAIL</th>
                        <th className="py-3.5 px-4">ROLE & TEAM</th>
                        <th className="py-3.5 px-4">ASSIGNED CLIENT</th>
                        <th className="py-3.5 px-4 text-right">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                      {paginatedUsers.map(user => (
                        <tr key={user.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="py-4 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#5B51D8] font-extrabold flex items-center justify-center text-sm shrink-0 border border-[#C7D2FE]">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <div className="text-slate-900 font-extrabold text-xs flex items-center gap-1.5">
                                  <span>{user.name}</span>
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                    {user.employeeId}
                                  </span>
                                </div>
                                <div className="text-[11px] text-blue-700 font-semibold mt-0.5">{user.email}</div>
                                <div className="text-[10px] text-slate-500 font-normal mt-0.5">{user.phone}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-purple-100 text-[#6B3BF6] border border-purple-200 inline-block">
                                {user.role}
                              </span>
                              <div className="text-[11px] text-slate-900 font-bold">{user.team}</div>
                              <div className="text-[10px] text-slate-500">Supervisor: {user.supervisor}</div>
                            </div>
                          </td>

                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 inline" />
                              <span>{user.assignedClient || 'Accenture'}</span>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-right whitespace-nowrap space-x-2">
                            {canModifyUsers ? (
                              <>
                                <button
                                  onClick={() => openAdjustClientModal(user)}
                                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold cursor-pointer inline-flex items-center gap-1 text-xs border border-blue-200 shadow-2xs transition-all active:scale-98"
                                  title="Adjust Assigned Client Account"
                                >
                                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Adjust Client</span>
                                </button>

                                <button
                                  onClick={() => openManageUserPermissionsModal(user)}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold cursor-pointer inline-flex items-center gap-1 text-xs border border-indigo-200 shadow-2xs transition-all active:scale-98"
                                  title="Manage Individual User Permissions"
                                >
                                  <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Manage Permissions</span>
                                </button>

                                <button
                                  onClick={() => openAssignRolePage(user)}
                                  className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] font-extrabold cursor-pointer inline-flex items-center gap-1 text-xs border border-purple-200 shadow-2xs transition-all active:scale-98"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 text-[#6B3BF6]" />
                                  <span>Edit Role</span>
                                </button>

                                <button
                                  onClick={() => openResetPasswordPage(user)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold cursor-pointer inline-flex items-center gap-1 text-xs border border-rose-200 shadow-2xs transition-all active:scale-98"
                                >
                                  <KeyRound className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Reset Password</span>
                                </button>

                                <button
                                  onClick={() => promptDeleteUser(user)}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 font-extrabold cursor-pointer inline-flex items-center gap-1 text-xs border border-slate-200 hover:border-rose-200 shadow-2xs transition-all active:scale-98"
                                  title="Delete user account"
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Delete</span>
                                </button>
                              </>
                            ) : (
                              <span className="px-2.5 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold border border-slate-200 inline-flex items-center gap-1 cursor-not-allowed">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>View Only</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <PaginationFooter
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredUsers.length}
                  pageSize={pageSize}
                  onPageChange={setCurrentPage}
                  onPageSizeChange={setPageSize}
                  itemLabel="users"
                />
              </div>
            </>
  )
}
