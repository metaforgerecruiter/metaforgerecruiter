import {
  Shield,
  Sliders,
  Plus,
} from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'

export function RoleDefinitionsTab({
    canModifyUsers, roles, setViewMode, setEditingRole,
    setTempRolePermissions
}: UserManagementVM) {
  return (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#6B3BF6]" />
              <span>Enterprise System Role Definitions</span>
            </h2>

            {canModifyUsers && (
              <button
                onClick={() => setViewMode('create_role')}
                className="px-4 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>+ Create New Role</span>
              </button>
            )}
          </div>

          {/* ROLE CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map(r => (
              <div
                key={r.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-8 h-8 rounded-xl bg-purple-50 text-[#6B3BF6] flex items-center justify-center font-extrabold border border-purple-100">
                        <Shield className="w-4 h-4" />
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900">{r.name}</h3>
                    </div>

                    {r.isSystem ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                        System Guarded
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
                        Custom Role
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    {r.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-500">
                    Active Users: <strong className="text-slate-900 font-extrabold">{r.userCount} Accounts</strong>
                  </div>

                  {canModifyUsers ? (
                    <button
                      onClick={() => {
                        setEditingRole(r)
                        setTempRolePermissions({ ...r.permissions })
                        setViewMode('configure_permissions')
                      }}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] text-xs font-extrabold rounded-xl border border-purple-200 flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Configure Permissions</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-bold rounded-xl border border-slate-200">
                      View Only
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
  )
}
