import {
  Trash2,
  X,
} from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'

export function PermanentDeleteModal({
    userToPermanentDeleteConfirm, setUserToPermanentDeleteConfirm, permanentDeleteCheck, setPermanentDeleteCheck,
    handlePermanentDeleteUser
}: UserManagementVM) {
  if (!userToPermanentDeleteConfirm) return null
  return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 border border-rose-700 shadow-2xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span>Permanent Purge Warning</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">
                      Irreversible
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    This user account will be permanently erased from system records.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserToPermanentDeleteConfirm(null)
                  setPermanentDeleteCheck(false)
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-extrabold text-slate-900">{userToPermanentDeleteConfirm.name}</div>
                <div className="text-[11px] text-rose-700 font-semibold">{userToPermanentDeleteConfirm.email}</div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-rose-200 text-rose-900 border border-rose-300 shrink-0">
                {userToPermanentDeleteConfirm.employeeId}
              </span>
            </div>

            <label className="p-3.5 rounded-2xl border bg-rose-50/50 border-rose-200 cursor-pointer flex items-start gap-3">
              <input
                type="checkbox"
                checked={permanentDeleteCheck}
                onChange={e => setPermanentDeleteCheck(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-rose-600 rounded cursor-pointer focus:ring-rose-500 shrink-0"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-extrabold text-rose-950 block">
                  I understand this action CANNOT be undone
                </span>
                <span className="text-[11px] text-rose-800 font-medium block">
                  Permanently purge user {userToPermanentDeleteConfirm.name} from database.
                </span>
              </div>
            </label>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
              <button
                type="button"
                onClick={() => {
                  setUserToPermanentDeleteConfirm(null)
                  setPermanentDeleteCheck(false)
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!permanentDeleteCheck}
                onClick={() => {
                  if (!userToPermanentDeleteConfirm || !permanentDeleteCheck) return
                  const u = userToPermanentDeleteConfirm
                  setUserToPermanentDeleteConfirm(null)
                  setPermanentDeleteCheck(false)
                  handlePermanentDeleteUser(u.id, u.name)
                }}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  permanentDeleteCheck
                    ? 'bg-rose-700 hover:bg-rose-800 text-white active:scale-98'
                    : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Purge Account</span>
              </button>
            </div>
          </div>
        </div>
  )
}
