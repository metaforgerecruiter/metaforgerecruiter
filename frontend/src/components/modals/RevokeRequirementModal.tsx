import React, { useState } from 'react'
import { X, AlertTriangle, FileText, CheckCircle2, ShieldAlert } from 'lucide-react'
import { Requirement, Role } from '../../types'

interface RevokeRequirementModalProps {
  isOpen: boolean
  onClose: () => void
  requirement: Requirement | null
  userRole: Role
  currentUserName: string
  onSubmitRevoke: (reqId: string, reason: string, isDirectRevoke: boolean) => void
}

const PRESET_REASONS = [
  'Client Put Position On Hold / SLA Exceeded',
  'Candidate Salary Expectation Mismatch / Client Budget Frozen',
  'No Suitable Candidates Available in Internal DB & Job Portals',
  'Recruiter Workload Shift / Re-allocation',
  'Duplicate Requirement / Cancelled by Client',
  'Other (Specify below)',
]

export function RevokeRequirementModal({
  isOpen,
  onClose,
  requirement,
  userRole,
  currentUserName,
  onSubmitRevoke,
}: RevokeRequirementModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(PRESET_REASONS[0])
  const [customNotes, setCustomNotes] = useState<string>('')

  if (!isOpen || !requirement) return null

  const canDirectRevoke =
    userRole === 'superadmin' || userRole === 'admin' || userRole === 'devteam' || userRole === 'lead'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const fullReason =
      selectedReason === 'Other (Specify below)'
        ? customNotes.trim() || 'No additional details provided'
        : customNotes.trim()
        ? `${selectedReason} - ${customNotes.trim()}`
        : selectedReason

    onSubmitRevoke(requirement.id, fullReason, canDirectRevoke)
    onClose()
    setCustomNotes('')
    setSelectedReason(PRESET_REASONS[0])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                !canDirectRevoke
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-rose-50 text-rose-600 border-rose-200'
              }`}
            >
              {!canDirectRevoke ? <AlertTriangle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {!canDirectRevoke ? 'Request Requirement Revocation' : 'Revoke Requirement & Revert'}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Requirement ID: <span className="font-bold text-slate-800">{requirement.id}</span> ({requirement.client})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Info Banner */}
          <div
            className={`p-4 rounded-2xl border text-xs leading-relaxed ${
              !canDirectRevoke
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-rose-50/80 border-rose-200 text-rose-900'
            }`}
          >
            {!canDirectRevoke ? (
              <p>
                <strong className="font-extrabold">Approval Workflow Required:</strong> Submitting this revocation request will notify the <span className="font-extrabold">Admin / Super Admin</span> to grant approval. The requirement will stay assigned to <span className="font-bold">{requirement.owner || currentUserName}</span> until approved by Super Admin / Admin.
              </p>
            ) : (
              <p>
                <strong className="font-extrabold">Immediate Admin Revocation:</strong> Revoking will immediately detach <span className="font-bold">{requirement.owner || 'current owner'}</span> and revert this requirement back to <span className="font-extrabold uppercase">Unassigned</span> state.
              </p>
            )}
          </div>

          {/* Reason Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Reason for Revocation <span className="text-rose-500">*</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {PRESET_REASONS.map(reason => (
                <label
                  key={reason}
                  className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-semibold cursor-pointer transition-all ${
                    selectedReason === reason
                      ? 'border-[#6B3BF6] bg-purple-50/60 text-[#6B3BF6] shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="revokeReason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="w-4 h-4 text-[#6B3BF6] focus:ring-[#6B3BF6] border-slate-300 cursor-pointer"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Notes / Details */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Additional Details / Comments (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Provide specific notes regarding why this requirement should be revoked..."
              value={customNotes}
              onChange={e => setCustomNotes(e.target.value)}
              className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-[#6B3BF6] text-slate-800 placeholder:text-slate-400 font-sans transition-all"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 h-11 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-6 h-11 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer active:scale-98 flex items-center gap-2 ${
                !canDirectRevoke
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {!canDirectRevoke
                  ? 'Submit Revoke Request to Admin'
                  : 'Revoke & Revert to Unassigned'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
