import {
  ShieldCheck,
  Shield,
  Lock,
  RotateCcw,
  Users,
  Sliders,
} from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'
import { UsersTab } from './UsersTab'
import { PermissionsTab } from './PermissionsTab'
import { RoleDefinitionsTab } from './RoleDefinitionsTab'
import { ManagePermissionsModal } from './ManagePermissionsModal'
import { AdjustClientModal } from './AdjustClientModal'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { PermanentDeleteModal } from './PermanentDeleteModal'

export function UserManagementList(vm: UserManagementVM) {
  const { canModifyUsers, activeTab, setActiveTab, undoToast, toastMsg, handleRestoreUser } = vm
  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800">
      {!canModifyUsers && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-xs text-amber-900">Read-Only Mode (Admin Console Access)</p>
              <p className="text-[11px] text-amber-800 font-medium">
                Admin users have view-only access to user & access governance. Creating accounts, modifying role matrices, and individual permission overrides are reserved for <strong>Super Admin</strong>.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-200/60 text-amber-900 text-[10px] font-extrabold rounded-full border border-amber-300 shrink-0">
            View-Only
          </span>
        </div>
      )}

      {/* 1. TOP HEADER & TOP TAB NAVIGATION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User & Access Governance</h1>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-[#6B3BF6] border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#6B3BF6]" />
              <span>Super Admin Portal</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Provision accounts, manage security credentials, define enterprise roles, and configure granular permission matrices.
          </p>
        </div>
      </div>

      {/* TAB NAVIGATION BAR */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'users'
              ? 'bg-[#6B3BF6] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Accounts</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('role_definitions')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'role_definitions'
              ? 'bg-[#6B3BF6] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Roles & Permissions</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`px-4 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'permissions'
              ? 'bg-[#6B3BF6] text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>User Permission Overrides</span>
        </button>
      </div>
      {activeTab === 'users' && (
        <UsersTab {...vm} />
      )}
      {activeTab === 'permissions' && (
        <PermissionsTab {...vm} />
      )}
      {activeTab === 'role_definitions' && (
        <RoleDefinitionsTab {...vm} />
      )}
      <ManagePermissionsModal {...vm} />
      <AdjustClientModal {...vm} />
      <DeleteConfirmModal {...vm} />
      <PermanentDeleteModal {...vm} />
      {undoToast && (
        <div className="fixed bottom-12 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span>{undoToast.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => handleRestoreUser(undoToast.userToRestore.id)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95 shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Undo Delete</span>
          </button>
        </div>
      )}

      {toastMsg && !undoToast && (
        <div className="fixed bottom-12 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
