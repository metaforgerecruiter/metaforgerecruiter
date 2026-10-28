import {
  KeyRound,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Send,
  RotateCcw,
  Key,
} from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'

export function ResetPasswordView({
    role, setViewMode, selectedUser, resetNewPass,
    setResetNewPass, setResetConfirmPass, showPassword, setShowPassword,
    forceChangePass, setForceChangePass, sendEmailNotify, setSendEmailNotify,
    showToast, handleResetPasswordSubmit
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
                <KeyRound className="w-6 h-6 text-rose-600" />
                <span>Reset User Security Password</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Issue a new password, invalidate active sessions, and send temporary credentials securely.
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
              form="reset-password-full-form"
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Reset & Send Credentials</span>
            </button>
          </div>
        </div>

        <form id="reset-password-full-form" onSubmit={handleResetPasswordSubmit} className="space-y-6 max-w-3xl">
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-md border border-slate-700 space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Target User Account
            </span>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-300 font-extrabold flex items-center justify-center text-lg border border-purple-500/30">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">{selectedUser.name}</h3>
                <p className="text-xs text-purple-300 font-bold">{selectedUser.email} • {selectedUser.employeeId}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Role: {selectedUser.role} • Last Changed: {selectedUser.lastPasswordChange}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-900 font-extrabold text-sm flex items-center gap-2">
                <Lock className="w-5 h-5 text-rose-600" />
                <span>Enter New Password Credentials</span>
              </span>

              <button
                type="button"
                onClick={() => {
                  const gen = 'Pass@' + Math.floor(10000 + Math.random() * 90000)
                  setResetNewPass(gen)
                  setResetConfirmPass(gen)
                  showToast('Generated strong password')
                }}
                className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] text-xs font-bold rounded-xl border border-purple-200 cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Auto-Generate Password</span>
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">New Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={resetNewPass}
                    onChange={e => setResetNewPass(e.target.value)}
                    placeholder="Enter new password..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:border-[#6B3BF6]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 font-medium">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-800">
                  <input
                    type="checkbox"
                    checked={forceChangePass}
                    onChange={e => setForceChangePass(e.target.checked)}
                    className="w-4 h-4 text-[#6B3BF6] rounded-md"
                  />
                  <span>Force user to change password upon next login session</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-slate-800">
                  <input
                    type="checkbox"
                    checked={sendEmailNotify}
                    onChange={e => setSendEmailNotify(e.target.checked)}
                    className="w-4 h-4 text-[#6B3BF6] rounded-md"
                  />
                  <span>Send temporary password to user email ({selectedUser.email})</span>
                </label>
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
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Reset & Issue New Credentials</span>
            </button>
          </div>
        </form>
      </div>
  )
}
