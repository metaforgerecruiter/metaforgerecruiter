import { Lock, X, Clock } from 'lucide-react'
import { UnifiedTeamMember } from './types'
import { getRecruiterScreenTime, formatDuration, canViewScreenTime } from '../../../utils/screenTimeTracker'
import { getSessionUser } from '../../../store/session'
import { Role } from '../../../types'

interface Props {
  selectedMemberDetail: UnifiedTeamMember | null
  setSelectedMemberDetail: (m: UnifiedTeamMember | null) => void
  role: Role
}
export function MemberDetailModal(p: Props) {
  if (!p.selectedMemberDetail) return null
  const { selectedMemberDetail, setSelectedMemberDetail, role } = p
  return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#6B3BF6] text-white font-extrabold flex items-center justify-center text-sm">
                  {selectedMemberDetail.avatar}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <span>{selectedMemberDetail.name}</span>
                    {selectedMemberDetail.isTeamLead && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                        Team Lead
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-purple-700 font-semibold">{selectedMemberDetail.role}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedMemberDetail(null)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Reporting Team Lead</span>
                  <span className="font-extrabold text-slate-900 text-xs block mt-0.5">{selectedMemberDetail.teamLead}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Mapped Clients</span>
                  <span className="font-extrabold text-purple-800 text-xs block mt-0.5">{selectedMemberDetail.clientNames.join(', ')}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100">
                  <span className="text-[10px] font-bold text-blue-700 block uppercase">Allocated Reqs</span>
                  <span className="text-lg font-extrabold text-blue-900 tabular-nums">{selectedMemberDetail.totalRequirements}</span>
                </div>
                <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-100">
                  <span className="text-[10px] font-bold text-purple-700 block uppercase">Submissions</span>
                  <span className="text-lg font-extrabold text-purple-900 tabular-nums">{selectedMemberDetail.totalSubmissions}</span>
                </div>
                <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 block uppercase">Average TAT</span>
                  <span className="text-lg font-extrabold text-emerald-900 tabular-nums">{selectedMemberDetail.tatDays} Days</span>
                </div>
              </div>

              {/* SCREEN TIME RECORDED CARD (PRIVACY ENFORCED FOR LEADS/ADMINS ONLY) */}
              {role !== 'recruiter' && (() => {
                const currentUser = { name: getSessionUser()?.name || '' }
                const isAllowed = canViewScreenTime(role, currentUser.name, selectedMemberDetail.name, selectedMemberDetail.teamLead)
                if (!isAllowed) {
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between text-xs font-medium">
                      <div className="flex items-center gap-2 text-slate-500 font-bold">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span>Screen Time & Usage Metrics</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-600">
                        🔒 Restricted (Self & Team Lead Only)
                      </span>
                    </div>
                  )
                }
                const st = getRecruiterScreenTime(selectedMemberDetail.name)
                return (
                  <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#6B3BF6]" />
                      <span className="text-purple-950 font-extrabold">Active Screen Time Recorded:</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-black text-[#6B3BF6]">
                        {formatDuration(st.activeSeconds)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${st.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {st.status}
                      </span>
                    </div>
                  </div>
                )
              })()}

              {selectedMemberDetail.isTeamLead && selectedMemberDetail.teamMembers && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-extrabold text-slate-700 block mb-2">Direct Team Members ({selectedMemberDetail.teamMembers.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMemberDetail.teamMembers.map(m => (
                      <span key={m} className="px-2.5 py-1 rounded-xl bg-purple-50 text-[#6B3BF6] border border-purple-200 text-xs font-bold">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedMemberDetail(null)}
                className="px-4 py-2 bg-[#6B3BF6] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
  )
}
