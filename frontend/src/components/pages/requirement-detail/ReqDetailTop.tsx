import React, { useState } from 'react'
import { ArrowLeft, Pencil, Briefcase, Calendar, Eye, User, UserPlus, RotateCcw, Mail } from 'lucide-react'
import { RequirementDetailVm } from './useRequirementDetailOverview'
import { OriginalRequirementModal } from '../../modals/OriginalRequirementModal'

export function ReqDetailTop({ vm }: { vm: RequirementDetailVm }) {
  const {
    requirement,
    onBack,
    onOpenAssignModal,
    onEditRequirement,
    onAddCandidate,
    onRevokeRequirement,
    setIsAddCandidateModalOpen,
    isRecruiter,
    isUnassigned,
    showToast,
  } = vm
  const [isOriginalOpen, setIsOriginalOpen] = useState(false)
  const isHold = requirement.status === 'Hold' || requirement.status === 'On Hold'
  // A pending revoke request puts the requirement On Hold; revoking must stay possible so it can be completed.
  const revokeBlocked = isHold && !requirement.revokeRequested
  return (
    <>
      {/* 1. TOP BAR WITH BACK BUTTON AND ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-2xs cursor-pointer w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
          <span>Back</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenAssignModal && (
            <button
              disabled={isHold}
              onClick={isHold ? undefined : onOpenAssignModal}
              title={
                isHold
                  ? 'Requirement is On Hold - assignment disabled'
                  : isRecruiter
                    ? (isUnassigned ? 'Self Assign' : 'Reassign')
                    : (isUnassigned ? 'Assign Recruiter' : 'Reassign')
              }
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border rounded-xl text-xs font-bold transition-all shadow-2xs ${
                isHold
                  ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-50'
                  : 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 cursor-pointer'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {isRecruiter
                  ? (isUnassigned ? 'Self Assign' : 'Reassign')
                  : (isUnassigned ? 'Assign Recruiter' : 'Reassign')}
              </span>
            </button>
          )}

          {onRevokeRequirement && !isUnassigned && (
            <button
              disabled={revokeBlocked}
              onClick={revokeBlocked ? undefined : onRevokeRequirement}
              title={revokeBlocked ? 'Requirement is On Hold - revoke disabled' : 'Revoke Requirement'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border rounded-xl text-xs font-bold transition-all shadow-2xs ${
                revokeBlocked
                  ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-50'
                  : 'border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 cursor-pointer'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Revoke Requirement</span>
            </button>
          )}

          {!isUnassigned && (
            <button
              disabled={isHold}
              onClick={() => {
                if (isHold) {
                  showToast('Cannot add candidate: Requirement is On Hold')
                  return
                }
                if (onAddCandidate) onAddCandidate()
                setIsAddCandidateModalOpen(true)
              }}
              title={isHold ? 'Requirement is On Hold - candidate submissions disabled' : 'Add Candidate'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border rounded-xl text-xs font-bold transition-all shadow-2xs ${
                isHold
                  ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-50'
                  : 'border-[#6B3BF6]/30 text-[#6B3BF6] bg-purple-50 hover:bg-purple-100 cursor-pointer'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#6B3BF6]" />
              <span>Add Candidate</span>
            </button>
          )}

          <button
            onClick={() => setIsOriginalOpen(true)}
            title="View the original requirement mail"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border rounded-xl text-xs font-semibold transition-all shadow-2xs border-gray-200/90 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-gray-500" />
            <span>Original Requirement</span>
          </button>

          <button
            disabled={isHold}
            onClick={() => {
              if (isHold) {
                showToast('Cannot edit requirement: Requirement is On Hold')
                return
              }
              if (onEditRequirement) onEditRequirement()
              else vm.setIsInternalEditing(true)
            }}
            title={isHold ? 'Requirement is On Hold - editing disabled' : 'Edit Requirement'}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 border rounded-xl text-xs font-semibold transition-all shadow-2xs ${
              isHold
                ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed opacity-50'
                : 'border-gray-200/90 text-gray-700 bg-white hover:bg-gray-50 cursor-pointer'
            }`}
          >
            <Pencil className="w-3.5 h-3.5 text-gray-500" />
            <span>Edit Requirement</span>
          </button>
        </div>
      </div>

      {/* 2. HEADER BANNER WITH REQUIREMENT ID, PRIORITY, TITLE & SUBTEXT */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-2">
        {/* Top Badges Line */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-gray-800">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span>{requirement.id}</span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${
              requirement.priority === 'High'
                ? 'bg-red-50 text-red-700 border-red-200'
                : requirement.priority === 'Medium'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
            }`}
          >
            {requirement.priority}
          </span>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
              isUnassigned
                ? 'bg-gray-100 text-gray-600 border-gray-300'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            {isUnassigned ? 'Unassigned' : (requirement.assignmentStatus || 'Submitted')}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
          {requirement.title}
        </h1>

        {/* Metadata sub-row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 font-medium pt-1">
          <span>{requirement.clientEmail ? requirement.clientEmail.split('@')[0] : 'harish'}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>SLA remaining: <strong>{isUnassigned ? '10 days' : '0 days'}</strong></span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 bg-purple-50 text-[#6B3BF6] px-2.5 py-0.5 rounded-full border border-purple-200 font-extrabold">
            <User className="w-3.5 h-3.5 text-[#6B3BF6]" />
            <span>Assigned Recruiter: <strong>{requirement.owner || 'Unassigned'}</strong></span>
            {!isRecruiter && !isUnassigned && onOpenAssignModal && (
              <button
                onClick={onOpenAssignModal}
                className="text-blue-600 font-bold hover:underline cursor-pointer ml-1 text-[11px]"
              >
                Reassign
              </button>
            )}
          </span>
        </div>
      </div>

      {/* 3. VIEW ONLY WARNING BANNER (IF UNASSIGNED) */}
      {isUnassigned && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-center gap-2.5 shadow-2xs">
          <Eye className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <strong className="font-bold mr-1.5">View only</strong>
            <span>This requirement is not assigned. Candidates cannot be added or submitted until it is assigned.</span>
          </div>
        </div>
      )}

      <OriginalRequirementModal
        isOpen={isOriginalOpen}
        onClose={() => setIsOriginalOpen(false)}
        requirementKey={requirement._id || requirement.id}
        requirementLabel={requirement.id}
      />
    </>
  )
}
