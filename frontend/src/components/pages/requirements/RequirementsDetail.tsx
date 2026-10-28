import React from 'react'
import { Search, X } from 'lucide-react'
import { RequirementDetailOverview } from '../RequirementDetailOverview'
import { CreateJobDemandForm } from '../CreateJobDemandForm'
import { PaginationFooter } from '../../ui/PaginationFooter'
import { RequirementsVm } from './useRequirementsPage'

export function RequirementsDetail({ vm }: { vm: RequirementsVm }) {
  const {
    role,
    recruiters,
    onOpenSubmit,
    selectedReqForDetail,
    setSelectedReqForDetail,
    setSelectedReqIds,
    isAssignModalOpen,
    setIsAssignModalOpen,
    isAssignMyselfChecked,
    setIsAssignMyselfChecked,
    selectedRecruiterNames,
    setSelectedRecruiterNames,
    recruiterSearchQuery,
    setRecruiterSearchQuery,
    currentUserName,
    recruiterList,
    filteredRecruiterList,
    totalSelectedRecruitersCount,
    toggleRecruiterSelection,
    setIsEditingDemand,
    setEditingReq,
    handleConfirmModalAssignment,
    handleOpenRevoke,
    showToast,
  } = vm
  if (!selectedReqForDetail) return null
  const isHold = selectedReqForDetail.status === 'Hold' || selectedReqForDetail.status === 'On Hold'
  const isUnassigned =
    selectedReqForDetail.assignmentStatus === 'Unassigned' ||
    !selectedReqForDetail.owner ||
    selectedReqForDetail.owner === 'Unassigned'
  const isRecruiterSelfOnly = role === 'recruiter' && isUnassigned
  return (
      <>
        <RequirementDetailOverview
          requirement={selectedReqForDetail}
          role={role}
          onBack={() => setSelectedReqForDetail(null)}
          onAddCandidate={() => {
            if (isHold) {
              showToast(`Cannot add candidate: Requirement ${selectedReqForDetail.id} is On Hold`)
              return
            }
            onOpenSubmit?.(selectedReqForDetail.id)
          }}
          onEditRequirement={() => {
            if (isHold) {
              showToast(`Cannot edit requirement: Requirement ${selectedReqForDetail.id} is On Hold`)
              return
            }
            setEditingReq(selectedReqForDetail)
            setIsEditingDemand(true)
          }}
          onOpenAssignModal={() => {
            if (isHold) {
              showToast(`Cannot assign recruiters: Requirement ${selectedReqForDetail.id} is On Hold`)
              return
            }
            setSelectedReqIds(new Set([selectedReqForDetail.id]))
            const isLeadOrAdmin = ['lead', 'admin', 'superadmin', 'devteam'].includes(String(role || '').toLowerCase())
            setIsAssignMyselfChecked(!isLeadOrAdmin)
            setSelectedRecruiterNames(new Set())
            setRecruiterSearchQuery('')
            setIsAssignModalOpen(true)
          }}
          onRevokeRequirement={() => {
            if (isHold && !selectedReqForDetail.revokeRequested) {
              showToast(`Cannot revoke requirement: Requirement ${selectedReqForDetail.id} is On Hold`)
              return
            }
            handleOpenRevoke(selectedReqForDetail)
          }}
        />

        {/* REASSIGN MODAL OVERLAY */}
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
      </>
  )
}
