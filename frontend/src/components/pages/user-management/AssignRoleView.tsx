import {
  ShieldCheck,
  ArrowLeft,
  Save,
  Shield,
  Building,
  Building2,
} from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'

export function AssignRoleView({
    role, setViewMode, selectedUser, targetRole,
    setTargetRole, targetClient, setTargetClient, reassignReason,
    setReassignReason, handleAssignRoleSubmit
}: UserManagementVM) {
  if (!selectedUser) return null
  return (
      <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('list')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-slate-200"
              title="Back to User Management"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-[#6B3BF6]" />
                <span>Reassign User Role & Security Scope</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Update user access permissions, assign leadership scope, and record compliance audit reason.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              form="assign-role-full-form"
              type="submit"
              className="px-5 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Update & Apply New Role</span>
            </button>
          </div>
        </div>

        <form id="assign-role-full-form" onSubmit={handleAssignRoleSubmit} className="space-y-6 max-w-4xl">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] text-[#5B51D8] font-extrabold flex items-center justify-center text-lg border border-[#C7D2FE]">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{selectedUser.name}</h3>
                <p className="text-xs text-[#6B3BF6] font-bold">{selectedUser.email} • {selectedUser.team}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Current Role: <strong className="text-slate-900">{selectedUser.role}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <span className="text-slate-900 font-extrabold text-sm block border-b border-slate-100 pb-3">
              Select Target Role Level
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {[
                { name: 'Super Admin', desc: 'Unrestricted system-wide governance, billing & user management.' },
                { name: 'Admin', desc: 'Full operational control over requirements, teams & reports.' },
                { name: 'Team Lead', desc: 'Supervises recruiter team, submission targets & interviews.' },
                { name: 'Recruiter', desc: 'Sourcing, candidate submissions & interview tracking.' },
              ].map(r => (
                <label
                  key={r.name}
                  onClick={() => setTargetRole(r.name as any)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    targetRole === r.name
                      ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="radio"
                    name="roleSelection"
                    checked={targetRole === r.name}
                    onChange={() => setTargetRole(r.name as any)}
                    className="mt-1 text-[#6B3BF6] focus:ring-[#6B3BF6]"
                  />
                  <div>
                    <h4 className="font-extrabold text-slate-900">{r.name}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="pt-3">
              <label className="block text-slate-700 font-bold text-xs mb-1.5">Reason for Role Reassignment (Audit Log)</label>
              <textarea
                rows={2}
                placeholder="Specify reason for promotion/reassignment..."
                value={reassignReason}
                onChange={e => setReassignReason(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
              />
            </div>
          </div>

          {/* CLIENT ACCOUNT ASSIGNMENT */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <span className="text-slate-900 font-extrabold text-sm block border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#6B3BF6]" />
              <span>Adjust Client Account Assignment</span>
            </span>

            <div className="space-y-2">
              <label className="block text-slate-700 font-bold text-xs">
                Assigned Client Account for {selectedUser.name}
              </label>
              <select
                value={targetClient}
                onChange={e => setTargetClient(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
              >
                <option value="Accenture">Accenture</option>
                <option value="Deloitte">Deloitte</option>
                <option value="MetaForge">MetaForge IT Solutions</option>
                <option value="Google">Google</option>
                <option value="Microsoft">Microsoft</option>
                <option value="TCS">Tata Consultancy Services (TCS)</option>
                <option value="Infosys">Infosys</option>
                <option value="Wipro">Wipro</option>
                <option value="All Clients">All Clients (Executive Oversight)</option>
              </select>
              <p className="text-[10px] text-slate-500 font-medium">
                Adjusting this client assignment links all requirements, candidate submissions, and delivery SLAs for this {targetRole} to the selected client account.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Update & Apply New Role</span>
            </button>
          </div>
        </form>
      </div>
  )
}
