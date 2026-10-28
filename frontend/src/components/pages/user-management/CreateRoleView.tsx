import {
  ArrowLeft,
  Save,
  Shield,
  Plus,
} from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'

export function CreateRoleView({
    role, roles, setViewMode, newRoleName,
    setNewRoleName, newRoleDescription, setNewRoleDescription, newRoleTemplate,
    setNewRoleTemplate, handleCreateRoleSubmit
}: UserManagementVM) {
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
                <Plus className="w-6 h-6 text-[#6B3BF6]" />
                <span>Create New System Role</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Define custom operational roles, set baseline security templates, and grant module permissions.
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
              form="create-role-full-form"
              type="submit"
              className="px-5 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Save & Create Role</span>
            </button>
          </div>
        </div>

        <form id="create-role-full-form" onSubmit={handleCreateRoleSubmit} className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#6B3BF6]" />
              <span>1. Role Identity & Description</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Role Title / Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sourcing Specialist Lead"
                  value={newRoleName}
                  onChange={e => setNewRoleName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Base Permission Template</label>
                <select
                  value={newRoleTemplate}
                  onChange={e => setNewRoleTemplate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="recruiter">Recruiter Template (Standard Pipeline Access)</option>
                  <option value="lead">Team Lead Template (Supervisory Scope)</option>
                  <option value="admin">Admin Template (Operations & Compliance)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Description & Operational Scope</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of duties and permissions granted to this role..."
                  value={newRoleDescription}
                  onChange={e => setNewRoleDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>
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
              <span>Create System Role</span>
            </button>
          </div>
        </form>
      </div>
  )
}
