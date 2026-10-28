import { AlertCircle, Trash2, X } from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'

export function DeleteConfirmModal({
    role, userToDeleteConfirm, setUserToDeleteConfirm, deleteConfirmCheck,
    setDeleteConfirmCheck, handleConfirmDeleteUser
}: UserManagementVM) {
  if (!userToDeleteConfirm) return null
  return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150 font-sans">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 shadow-2xs">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span>Delete User Verification</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                      Confirmation Required
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Security confirmation required before moving account to Trash Bin.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserToDeleteConfirm(null)
                  setDeleteConfirmCheck(false)
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* USER SUMMARY CARD */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EEF2FF] text-[#5B51D8] font-extrabold flex items-center justify-center text-sm shrink-0 border border-[#C7D2FE]">
                  {userToDeleteConfirm.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-extrabold text-slate-900">{userToDeleteConfirm.name}</div>
                  <div className="text-[11px] text-blue-700 font-semibold">{userToDeleteConfirm.email}</div>
                  <div className="text-[10px] text-slate-500 font-medium">{userToDeleteConfirm.role} • {userToDeleteConfirm.team}</div>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-xs font-extrabold bg-purple-100 text-[#6B3BF6] border border-purple-200 shrink-0">
                {userToDeleteConfirm.employeeId}
              </span>
            </div>

            {/* WARNING NOTICE */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-1">
              <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Account Deactivation Warning</span>
              </div>
              <p className="text-amber-800 text-[11px] font-medium leading-relaxed">
                Moving this user account to the Trash Bin will revoke their portal login access immediately. You can restore this account anytime from the <strong>Deleted Users / Trash Bin</strong> tab.
              </p>
            </div>

            {/* MANDATORY VERIFICATION CHECKBOX */}
            <div className="space-y-2">
              <label
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                  deleteConfirmCheck
                    ? 'bg-rose-50/90 border-rose-300 ring-2 ring-rose-500/20 text-rose-950 font-bold'
                    : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={deleteConfirmCheck}
                  onChange={e => setDeleteConfirmCheck(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-rose-600 rounded cursor-pointer focus:ring-rose-500 shrink-0"
                />
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-slate-900 block">
                    Yes, I am sure I want to delete this user account
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal block leading-tight">
                    I confirm that I want to move <strong>{userToDeleteConfirm.name}</strong> ({userToDeleteConfirm.email}) to the Deleted Users / Trash Bin.
                  </span>
                </div>
              </label>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
              <button
                type="button"
                onClick={() => {
                  setUserToDeleteConfirm(null)
                  setDeleteConfirmCheck(false)
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!deleteConfirmCheck}
                onClick={handleConfirmDeleteUser}
                className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                  deleteConfirmCheck
                    ? 'bg-rose-600 hover:bg-rose-700 text-white active:scale-98'
                    : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm & Move to Trash Bin</span>
              </button>
            </div>
          </div>
        </div>
  )
}
