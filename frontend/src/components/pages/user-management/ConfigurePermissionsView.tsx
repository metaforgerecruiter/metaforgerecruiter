import { DEFAULT_MODULE_PERMISSIONS } from './permissions.data'
import {
  ShieldCheck,
  ArrowLeft,
  Save,
  Shield,
} from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'

export function ConfigurePermissionsView({
    role, users, setViewMode, editingRole,
    tempRolePermissions, setTempRolePermissions, handleSaveRolePermissions
}: UserManagementVM) {
  if (!editingRole) return null
  return (
      <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('list')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-slate-200"
              title="Back to User Management"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Configure Permissions Matrix
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-[#6B3BF6] border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
                  <Shield className="w-3.5 h-3.5 text-[#6B3BF6]" />
                  <span>{editingRole.name}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Enable or restrict module-level capabilities for all users assigned to the <strong>{editingRole.name}</strong> role.
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
              onClick={handleSaveRolePermissions}
              className="px-5 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Save Role Matrix</span>
            </button>
          </div>
        </div>

        {/* ROLE HEADER CARD */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono uppercase bg-purple-500/20 border border-purple-400/30 text-purple-300">
                Code: {editingRole.code}
              </span>
              {editingRole.isSystem && (
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 border border-amber-400/30 text-amber-300">
                  System Guarded
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white">{editingRole.name} Role</h2>
            <p className="text-xs text-slate-300 max-w-2xl">{editingRole.description}</p>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 shrink-0 text-center sm:text-right">
            <div className="text-xs text-slate-400 font-medium">Assigned Users</div>
            <div className="text-xl font-extrabold text-purple-400">{editingRole.userCount} Accounts</div>
          </div>
        </div>

        {/* PERMISSIONS MATRIX PER MODULE */}
        <div className="space-y-6">
          {DEFAULT_MODULE_PERMISSIONS.map(group => (
            <div key={group.module} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#6B3BF6]" />
                  <span>{group.module}</span>
                </h3>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...tempRolePermissions }
                      group.permissions.forEach(p => (updated[p.key] = true))
                      setTempRolePermissions(updated)
                    }}
                    className="text-purple-600 hover:text-purple-800 font-bold hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => {
                      const updated = { ...tempRolePermissions }
                      group.permissions.forEach(p => (updated[p.key] = false))
                      setTempRolePermissions(updated)
                    }}
                    className="text-slate-500 hover:text-slate-700 font-bold hover:underline cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {group.permissions.map(p => {
                  const isChecked = !!tempRolePermissions[p.key]
                  return (
                    <label
                      key={p.key}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-purple-50/50 border-purple-200 text-purple-950 font-bold'
                          : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs font-semibold">{p.label}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => {
                          setTempRolePermissions({
                            ...tempRolePermissions,
                            [p.key]: e.target.checked,
                          })
                        }}
                        className="w-4 h-4 text-[#6B3BF6] rounded-md cursor-pointer focus:ring-[#6B3BF6]"
                      />
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
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
            onClick={handleSaveRolePermissions}
            className="px-6 py-2.5 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Save className="w-4 h-4" />
            <span>Save Role Permissions Matrix</span>
          </button>
        </div>
      </div>
  )
}
