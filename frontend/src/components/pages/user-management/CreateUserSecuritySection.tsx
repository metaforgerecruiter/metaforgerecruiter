import {
  KeyRound,
  RotateCcw,
  Key,
} from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'

export function CreateUserSecuritySection({
    tempPassword, setTempPassword
}: UserManagementVM) {
  return (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-extrabold text-sm">
              <KeyRound className="w-5 h-5 text-emerald-600" />
              <span>3. Initial Temporary Password & Security Options</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Initial Temporary Password</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setTempPassword('Pass@' + Math.floor(10000 + Math.random() * 90000))}
                    className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-[#6B3BF6] rounded-md" />
                  <span>Force password reset on first login</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input type="checkbox" defaultChecked className="w-4 h-4 text-[#6B3BF6] rounded-md" />
                  <span>Send welcome email with login credentials</span>
                </label>
              </div>
            </div>
          </div>
  )
}
