import React from 'react'
import { UserPlus, ShieldCheck, Shield, User, X } from 'lucide-react'

interface Props {
  isAddModalOpen: boolean
  setIsAddModalOpen: (v: boolean) => void
  handleCreateMember: (e: React.FormEvent) => void
  newMemberName: string
  setNewMemberName: (v: string) => void
  newMemberEmail: string
  setNewMemberEmail: (v: string) => void
  newMemberRole: string
  setNewMemberRole: (v: string) => void
  newIsTeamLead: boolean
  setNewIsTeamLead: (v: boolean) => void
  newAssignedLead: string
  setNewAssignedLead: (v: string) => void
  newMemberPassword: string
  setNewMemberPassword: (v: string) => void
  uniqueTeamLeads: string[]
}
export function AddMemberModal(p: Props) {
  if (!p.isAddModalOpen) return null
  const { setIsAddModalOpen, handleCreateMember, newMemberName, setNewMemberName, newMemberEmail, setNewMemberEmail, newMemberRole, setNewMemberRole, newIsTeamLead, setNewIsTeamLead, newAssignedLead, setNewAssignedLead, newMemberPassword, setNewMemberPassword, uniqueTeamLeads } = p
  const handleCreateMemberSubmit = handleCreateMember
  return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                <UserPlus className="w-5 h-5 text-[#6B3BF6]" />
                <span>Add New Team Member / Lead</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMemberSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Member Role Category *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewIsTeamLead(false)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      !newIsTeamLead ? 'bg-[#6B3BF6] text-white border-[#5833E0]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>Recruiter</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewIsTeamLead(true)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      newIsTeamLead ? 'bg-[#6B3BF6] text-white border-[#5833E0]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Team Lead</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newMemberName}
                  onChange={e => setNewMemberName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={newMemberEmail}
                  onChange={e => setNewMemberEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Designated Role Title</label>
                  <input
                    type="text"
                    value={newMemberRole}
                    onChange={e => setNewMemberRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6]"
                  />
                </div>

                {!newIsTeamLead && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">Assigned Team Lead</label>
                    <select
                      value={newAssignedLead}
                      onChange={e => setNewAssignedLead(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      {uniqueTeamLeads.map(l => (
                        <option key={l} value={l}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Temporary Password *</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newMemberPassword}
                  onChange={e => setNewMemberPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer active:scale-98"
                >
                  Save Member Profile
                </button>
              </div>
            </form>
          </div>
        </div>
  )
}
