import { ShieldCheck, Shield, Lock, ChevronRight, Clock } from 'lucide-react'
import { UnifiedTeamMember } from './types'
import { PaginationFooter } from '../../ui/PaginationFooter'
import { getRecruiterScreenTime, formatDurationShort, canViewScreenTime } from '../../../utils/screenTimeTracker'
import { getSessionUser } from '../../../store/session'
import { Role } from '../../../types'

interface Props {
  paginatedMembers: UnifiedTeamMember[]
  filteredMembers: UnifiedTeamMember[]
  role: Role
  currentPage: number
  totalPages: number
  pageSize: number
  setCurrentPage: (n: number) => void
  setPageSize?: (n: number) => void
  setSelectedMemberDetail: (m: UnifiedTeamMember) => void
}
export function TeamsRecruitersList(p: Props) {
  const { paginatedMembers, filteredMembers, role, currentPage, totalPages, pageSize, setCurrentPage, setPageSize, setSelectedMemberDetail } = p
  return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">TEAM MEMBER & ASSIGNED TEAM LEAD</th>
                <th className="py-3.5 px-4">ROLE TITLE</th>
                <th className="py-3.5 px-4">MAPPED CLIENTS</th>
                <th className="py-3.5 px-4 text-center">REQUIREMENTS</th>
                <th className="py-3.5 px-4 text-center">SUBMISSIONS</th>
                {role !== 'recruiter' && (
                  <th className="py-3.5 px-4 text-center">SCREEN TIME</th>
                )}
                <th className="py-3.5 px-4 text-center">STATUS</th>
                <th className="py-3.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {paginatedMembers.map(member => (
                <tr
                  key={member.id}
                  onClick={() => setSelectedMemberDetail(member)}
                  className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                >
                  {/* MEMBER NAME & TEAM LEAD BESIDE NAME */}
                  <td className="py-4 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6B3BF6] to-[#5833E0] text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-xs group-hover:text-[#6B3BF6] transition-colors">
                            {member.name}
                          </span>

                          {/* TEAM LEAD MENTIONED BESIDE NAME */}
                          {member.isTeamLead ? (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-blue-600" />
                              <span>Team Lead (Self)</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-purple-50 text-[#6B3BF6] border border-purple-200 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-[#6B3BF6]" />
                              <span>Lead: {member.teamLead}</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{member.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* ROLE TITLE */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="font-extrabold text-slate-800 text-xs">{member.role}</div>
                  </td>

                  {/* MAPPED CLIENTS */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                      {member.clientNames.join(', ')}
                    </span>
                  </td>

                  {/* REQUIREMENTS */}
                  <td className="py-4 px-4 whitespace-nowrap text-center">
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200 tabular-nums">
                      {member.totalRequirements} Reqs
                    </span>
                  </td>

                  {/* SUBMISSIONS */}
                  <td className="py-4 px-4 whitespace-nowrap text-center">
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-purple-900 border border-purple-200 tabular-nums">
                      {member.totalSubmissions} Subs
                    </span>
                  </td>

                  {/* SCREEN TIME (RECORDED) */}
                  {role !== 'recruiter' && (
                    <td className="py-4 px-4 whitespace-nowrap text-center">
                      {(() => {
                        const currentUser = { name: getSessionUser()?.name || '' }
                        const isAllowed = canViewScreenTime(role, currentUser.name, member.name, member.teamLead)
                        if (!isAllowed) {
                          return (
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-[11px] font-bold"
                              title="Screen time privacy: Only visible to self, team lead, and admin"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Private</span>
                            </span>
                          )
                        }
                        const st = getRecruiterScreenTime(member.name)
                        return (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-50 text-[#6B3BF6] border border-purple-200 text-xs font-black">
                            <Clock className="w-3 h-3 text-[#6B3BF6]" />
                            <span>{formatDurationShort(st.activeSeconds)}</span>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                          </span>
                        )
                      })()}
                    </td>
                  )}

                  {/* PERFORMANCE STATUS */}
                  <td className="py-4 px-4 whitespace-nowrap text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                        member.performanceStatus === 'Top Performer'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : member.performanceStatus === 'On Track'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}
                    >
                      {member.performanceStatus}
                    </span>
                  </td>

                  {/* ACTION */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedMemberDetail(member)
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-100 text-[#6B3BF6] font-extrabold text-xs cursor-pointer inline-flex items-center gap-1 transition-all"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
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
          pageSize={pageSize}
          totalItems={filteredMembers.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>
  )
}
