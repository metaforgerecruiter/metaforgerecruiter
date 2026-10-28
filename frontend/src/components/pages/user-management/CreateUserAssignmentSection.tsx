import {
  ShieldCheck,
  Shield,
} from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'

export function CreateUserAssignmentSection({
    newUserRole, setNewUserRole, newUserTeam, setNewUserTeam,
    newUserSupervisor, setNewUserSupervisor, newUserClient, setNewUserClient
}: UserManagementVM) {
  return (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-extrabold text-sm">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span>2. Role Governance & Team Assignment</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Assign System Role *</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-purple-50/70 border border-purple-200 rounded-xl text-xs font-bold text-[#6B3BF6] focus:outline-none cursor-pointer"
                >
                  <option value="Recruiter">Recruiter (Sourcing & Pipeline Access)</option>
                  <option value="Team Lead">Team Lead (Team Supervision Access)</option>
                  <option value="Admin">Admin (Full Operational Control)</option>
                  <option value="Super Admin">Super Admin (System Governance)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Assigned Client Account *</label>
                <select
                  value={newUserClient}
                  onChange={e => setNewUserClient(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 focus:outline-none cursor-pointer"
                >
                  <option value="Accenture">Accenture</option>
                  <option value="Deloitte">Deloitte</option>
                  <option value="MetaForge">MetaForge IT Solutions</option>
                  <option value="Google">Google</option>
                  <option value="Microsoft">Microsoft</option>
                  <option value="TCS">TCS</option>
                  <option value="Infosys">Infosys</option>
                  <option value="Wipro">Wipro</option>
                  <option value="All Clients">All Clients</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Assigned Hiring Team</label>
                <select
                  value={newUserTeam}
                  onChange={e => setNewUserTeam(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="Engineering Team">Engineering Team</option>
                  <option value="Automotive Team">Automotive Team</option>
                  <option value="ERP & SAP Team">ERP & SAP Team</option>
                  <option value="Executive Operations">Executive Operations</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Direct Reporting Supervisor</label>
                <input
                  type="text"
                  value={newUserSupervisor}
                  onChange={e => setNewUserSupervisor(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>
            </div>
          </div>
  )
}
