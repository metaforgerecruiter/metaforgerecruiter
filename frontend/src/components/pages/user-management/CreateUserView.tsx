import {
  ArrowLeft,
  UserPlus,
  Save,
} from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'
import { CreateUserPersonalSection } from './CreateUserPersonalSection'
import { CreateUserAssignmentSection } from './CreateUserAssignmentSection'
import { CreateUserSecuritySection } from './CreateUserSecuritySection'

export function CreateUserView(vm: UserManagementVM) {
  const { setViewMode, handleCreateUserSubmit } = vm
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
                <UserPlus className="w-6 h-6 text-[#6B3BF6]" />
                <span>Create New User Account</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Provision new employee accounts, assign organizational roles, and issue initial security credentials.
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
              form="create-user-full-form"
              type="submit"
              className="px-5 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Save & Provision User</span>
            </button>
          </div>
        </div>
        <form id="create-user-full-form" onSubmit={handleCreateUserSubmit} className="space-y-6">
          <CreateUserPersonalSection {...vm} />
          <CreateUserAssignmentSection {...vm} />
          <CreateUserSecuritySection {...vm} />
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
              <span>Save & Provision User Account</span>
            </button>
          </div>
        </form>
      </div>
  )
}
