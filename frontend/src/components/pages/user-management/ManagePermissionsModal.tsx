import {
  Save,
  X,
} from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'

export function ManagePermissionsModal({
    selectedUserForManage, setSelectedUserForManage, tempUserPermissions, setTempUserPermissions,
    tempUserRoleName, setTempUserRoleName, handleSaveUserPermissions
}: UserManagementVM) {
  if (!selectedUserForManage) return null
  return (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#6B3BF6] font-extrabold flex items-center justify-center text-sm border border-purple-200">
                  {selectedUserForManage.avatar || selectedUserForManage.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Manage Permissions — {selectedUserForManage.name}
                  </h3>
                  <p className="text-xs text-purple-600 font-bold">
                    {selectedUserForManage.email} • {selectedUserForManage.team}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUserForManage(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Designated Role Title</label>
                <input
                  type="text"
                  value={tempUserRoleName}
                  onChange={e => setTempUserRoleName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>

              <div className="space-y-2">
                <span className="block text-slate-900 font-extrabold text-xs">
                  Granular User Capabilities
                </span>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {[
                    { key: 'addCandidates', label: 'Add Candidates & Resumes to Repository' },
                    { key: 'submitToClients', label: 'Submit Candidate Profiles Directly to Client Partners' },
                    { key: 'scheduleInterviews', label: 'Schedule Candidate Interviews & Video Slots' },
                    { key: 'exportReportsCsv', label: 'Export Analytics Reports to Excel / CSV' },
                    { key: 'viewTeamAnalytics', label: 'View Overall Hiring Team Performance Analytics' },
                    { key: 'reassignRequirements', label: 'Reassign Requirements & Candidates Between Recruiters' },
                    { key: 'deleteRecords', label: 'Delete Candidate Profiles & Submission Records' },
                  ].map(item => (
                    <label
                      key={item.key}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                        (tempUserPermissions as any)[item.key]
                          ? 'bg-purple-50/70 border-purple-200 text-purple-950 font-bold'
                          : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="font-semibold">{item.label}</span>
                      <input
                        type="checkbox"
                        checked={Boolean((tempUserPermissions as any)[item.key])}
                        onChange={e =>
                          setTempUserPermissions({
                            ...tempUserPermissions,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-[#6B3BF6] rounded-md cursor-pointer focus:ring-[#6B3BF6]"
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUserForManage(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveUserPermissions}
                className="px-5 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>Save Permissions</span>
              </button>
            </div>
          </div>
        </div>
  )
}
