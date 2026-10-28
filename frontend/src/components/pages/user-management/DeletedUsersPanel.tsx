import { useEffect, useMemo, useState } from 'react'
import { Search, XCircle, Lock, AlertCircle, Building2, RotateCcw, Trash2 } from 'lucide-react'
import { PaginationFooter } from '../../ui/PaginationFooter'
import type { UserManagementVM } from './useUserManagement'

export function DeletedUsersPanel({
    role, canModifyUsers, searchQuery, setSearchQuery,
    deletedUsers, handleRestoreUser, promptPermanentDeleteUser, handleRestoreAllDeleted,
    handleEmptyTrash
}: UserManagementVM) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const filteredDeleted = useMemo(
    () =>
      deletedUsers.filter(u =>
        searchQuery.trim()
          ? u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      ),
    [deletedUsers, searchQuery],
  )
  const totalPages = Math.ceil(filteredDeleted.length / pageSize) || 1
  const paginatedDeleted = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredDeleted.slice(start, start + pageSize)
  }, [filteredDeleted, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize, deletedUsers.length])

  return (
            <div className="space-y-6">
              {/* DELETED USERS HEADER & BULK ACTIONS BANNER */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-300 text-rose-700 flex items-center justify-center font-bold shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-rose-950 flex items-center gap-2">
                      <span>Deleted User Accounts & Trash Bin</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-200 text-rose-900 border border-rose-300">
                        {deletedUsers.length} {deletedUsers.length === 1 ? 'Account' : 'Accounts'}
                      </span>
                    </h3>
                    <p className="text-xs text-rose-800 font-medium mt-0.5">
                      Accidentally removed user accounts are safely stored here. Super Admins can restore accounts at any time or purge them permanently.
                    </p>
                  </div>
                </div>

                {canModifyUsers && deletedUsers.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleRestoreAllDeleted}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore All Users</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleEmptyTrash}
                      className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-98"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Empty Trash</span>
                    </button>
                  </div>
                )}
              </div>

              {/* SEARCH FILTER FOR DELETED USERS */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search deleted user name, email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="text-xs text-slate-500 font-semibold">
                  Showing{' '}
                  <strong className="text-slate-900">
                    {
                      deletedUsers.filter(
                        u =>
                          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length
                    }
                  </strong>{' '}
                  removed records
                </div>
              </div>

              {/* DELETED USERS TABLE OR EMPTY STATE */}
              {deletedUsers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto border border-rose-100">
                    <Trash2 className="w-8 h-8 text-rose-400" />
                  </div>
                  <h4 className="text-base font-extrabold text-slate-800">No Deleted User Accounts</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                    The trash bin is currently empty. Any user account deleted by administrators will appear here with an instant restore option.
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3.5 px-4">DELETED USER & EMAIL</th>
                          <th className="py-3.5 px-4">ROLE & POD</th>
                          <th className="py-3.5 px-4">ASSIGNED CLIENT</th>
                          <th className="py-3.5 px-4">REMOVAL TIMESTAMP</th>
                          <th className="py-3.5 px-4 text-right">RESTORE / PURGE ACTIONS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                        {paginatedDeleted.map(user => (
                            <tr key={user.id} className="hover:bg-rose-50/20 transition-colors">
                              <td className="py-4 px-4 font-bold text-slate-900">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 font-extrabold flex items-center justify-center text-sm shrink-0 border border-rose-200">
                                    {user.name.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="text-slate-900 font-extrabold text-xs flex items-center gap-1.5">
                                      <span>{user.name}</span>
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                        {user.employeeId}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-600 font-semibold mt-0.5">{user.email}</div>
                                    <div className="text-[10px] text-slate-400 font-normal mt-0.5">{user.phone}</div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <div className="space-y-1">
                                  <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 inline-block">
                                    {user.role}
                                  </span>
                                  <div className="text-[11px] text-slate-900 font-bold">{user.team}</div>
                                </div>
                              </td>

                              <td className="py-4 px-4 whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  <Building2 className="w-3.5 h-3.5 text-slate-500 inline" />
                                  <span>{user.assignedClient || 'Accenture'}</span>
                                </div>
                              </td>

                              <td className="py-4 px-4">
                                <div className="space-y-1">
                                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-amber-700" />
                                    <span>Removed {user.deletedAt}</span>
                                  </span>
                                  <div className="text-[10px] text-slate-500 font-medium">
                                    Removed by: <strong className="text-slate-800">{user.deletedBy || 'Super Admin'}</strong>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-4 text-right whitespace-nowrap space-x-2">
                                {canModifyUsers ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleRestoreUser(user.id)}
                                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold cursor-pointer inline-flex items-center gap-1.5 text-xs border border-emerald-300 shadow-2xs transition-all active:scale-98"
                                      title="Restore User Account"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>Restore Account</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => promptPermanentDeleteUser(user)}
                                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold cursor-pointer inline-flex items-center gap-1.5 text-xs border border-rose-200 shadow-2xs transition-all active:scale-98"
                                      title="Delete Permanently"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Delete Permanently</span>
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
                    totalItems={filteredDeleted.length}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={setPageSize}
                    itemLabel="users"
                  />
                </div>
              )}
            </div>
  )
}
