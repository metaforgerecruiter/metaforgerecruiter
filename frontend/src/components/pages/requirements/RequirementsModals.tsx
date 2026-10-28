import React from 'react'
import { CheckCircle2, Search, X } from 'lucide-react'
import { RevokeRequirementModal } from '../../modals/RevokeRequirementModal'
import { RequirementsVm } from './useRequirementsPage'

export function RequirementsModals({ vm }: { vm: RequirementsVm }) {
  const {
    role,
    recruiters,
    isAssignModalOpen,
    setIsAssignModalOpen,
    toastMessage,
    setToastMessage,
    isAssignMyselfChecked,
    setIsAssignMyselfChecked,
    selectedRecruiterNames,
    recruiterSearchQuery,
    setRecruiterSearchQuery,
    currentUserName,
    recruiterList,
    filteredRecruiterList,
    totalSelectedRecruitersCount,
    toggleRecruiterSelection,
    isRevokeModalOpen,
    setIsRevokeModalOpen,
    selectedReqForRevoke,
    handleConfirmModalAssignment,
    handleConfirmRevoke,
    selectedReqForDetail,
  } = vm
  const isUnassigned =
    !selectedReqForDetail ||
    selectedReqForDetail.assignmentStatus === 'Unassigned' ||
    !selectedReqForDetail.owner ||
    selectedReqForDetail.owner === 'Unassigned'
  const isRecruiterSelfOnly = role === 'recruiter' && isUnassigned
  return (
    <>
      {/* ASSIGN TO RECRUITERS / REASSIGN MODAL (MATCHING ATTACHED SCREENSHOT) */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden border border-slate-100 font-sans">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {isRecruiterSelfOnly ? 'Self Assign' : isUnassigned ? 'Assign Recruiter' : 'Reassign'}
                </h3>
                <p className="text-xs text-slate-500 font-normal mt-1">
                  {isRecruiterSelfOnly
                    ? 'Assign this requirement to yourself.'
                    : 'Select yourself and/or other recruiters for this requirement in one step.'}
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Assign myself card */}
              <label className={`border rounded-2xl p-4 flex items-start gap-3.5 cursor-pointer transition-all block ${
                isAssignMyselfChecked
                  ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-200'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}>
                <input
                  type="checkbox"
                  checked={isAssignMyselfChecked}
                  onChange={e => setIsAssignMyselfChecked(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <div>
                  <div className={`text-sm font-bold leading-snug ${isAssignMyselfChecked ? 'text-blue-900' : 'text-slate-800'}`}>
                    {isRecruiterSelfOnly ? 'Assign myself' : 'Keep / assign myself'} ({currentUserName})
                  </div>
                  <div className={`text-xs leading-normal mt-0.5 font-normal ${isAssignMyselfChecked ? 'text-blue-600/90' : 'text-slate-500'}`}>
                    {isRecruiterSelfOnly
                      ? 'Assign this requirement to your recruiter workload.'
                      : 'Include yourself along with any recruiters selected below.'}
                  </div>
                </div>
              </label>

              {!isRecruiterSelfOnly && (
                <>
                  {/* Search recruiter input */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      ASSIGN TO RECRUITER
                    </div>
                    <input
                      type="text"
                      placeholder="Search recruiter by name or email"
                      value={recruiterSearchQuery}
                      onChange={e => setRecruiterSearchQuery(e.target.value)}
                      className="w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800 placeholder:text-slate-400 shadow-2xs transition-all"
                    />
                  </div>

                  {/* Showing counter */}
                  <div className="text-xs text-slate-500 font-medium px-0.5">
                    Showing {filteredRecruiterList.length} of {recruiterList.length} recruiters
                  </div>

                  {/* Recruiter cards scrollable list */}
                  <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1.5 custom-scrollbar">
                    {filteredRecruiterList.map(rec => {
                      const isChecked = selectedRecruiterNames.has(rec.name)
                      return (
                        <label
                          key={rec.id}
                          className={`border rounded-2xl p-3.5 flex items-center gap-3.5 cursor-pointer transition-all ${
                            isChecked
                              ? 'border-blue-300 bg-blue-50/50'
                              : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRecruiterSelection(rec.name)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                          />
                          <div>
                            <div className="text-sm font-bold text-slate-900 leading-snug">
                              {rec.name}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 font-normal">
                              {rec.email}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-5 h-11 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmModalAssignment}
                disabled={isRecruiterSelfOnly ? !isAssignMyselfChecked : totalSelectedRecruitersCount === 0}
                className="px-6 h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
              >
                {isRecruiterSelfOnly ? 'Self Assign Requirement' : `Assign ${totalSelectedRecruitersCount} recruiter(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE REQUIREMENT MODAL */}
      <RevokeRequirementModal
        isOpen={isRevokeModalOpen}
        onClose={() => setIsRevokeModalOpen(false)}
        requirement={selectedReqForRevoke}
        userRole={role as any}
        currentUserName={currentUserName}
        onSubmitRevoke={handleConfirmRevoke}
      />

      {/* SUCCESS TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}
