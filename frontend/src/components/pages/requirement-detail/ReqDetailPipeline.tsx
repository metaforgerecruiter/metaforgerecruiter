import React, { useState } from 'react'
import { Users, Check, X, AlertTriangle } from 'lucide-react'
import { RequirementDetailVm } from './useRequirementDetailOverview'
import { PipelineCandidateItem } from './useRequirementDetailOverviewState'

export function ReqDetailPipeline({ vm }: { vm: RequirementDetailVm }) {
  const {
    requirement,
    activeTab,
    setIsScheduleModalOpen,
    setSchedulingCandidateRow,
    pipelineCandidates,
    rejectionModalData,
    setRejectionModalData,
    handleUpdatePipelineStage,
    handleConfirmRejection,
    handleUpdateOfferLetterStatus,
  } = vm

  const renderL1Cell = (row: PipelineCandidateItem) => {
    if (row.l1Status === 'active') {
      return (
        <select
          defaultValue=""
          onChange={e => {
            if (e.target.value) {
              handleUpdatePipelineStage(row.id, 'L1', e.target.value)
            }
          }}
          className="px-1 py-0.5 bg-white border border-blue-300 rounded-md text-[10px] font-bold text-blue-700 hover:border-blue-500 focus:outline-none cursor-pointer shadow-2xs w-full max-w-[80px]"
        >
          <option value="" disabled>
            L1...
          </option>
          <option value="select">Select (L2)</option>
          <option value="move_to_final">Move Final</option>
          <option value="reject">Reject</option>
        </select>
      )
    }
    if (row.l1Status === 'selected') {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
          <Check className="w-2.5 h-2.5 text-emerald-600" />
          Selected
        </span>
      )
    }
    if (row.l1Status === 'rejected') {
      return (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold"
          title={row.rejectionReason}
        >
          <X className="w-2.5 h-2.5 text-rose-600" />
          Rejected
        </span>
      )
    }
    return <span className="text-gray-400">—</span>
  }

  const renderL2Cell = (row: PipelineCandidateItem) => {
    if (row.l2Status === 'active') {
      return (
        <select
          defaultValue=""
          onChange={e => {
            if (e.target.value) {
              handleUpdatePipelineStage(row.id, 'L2', e.target.value)
            }
          }}
          className="px-1 py-0.5 bg-white border border-blue-300 rounded-md text-[10px] font-bold text-blue-700 hover:border-blue-500 focus:outline-none cursor-pointer shadow-2xs w-full max-w-[80px]"
        >
          <option value="" disabled>
            L2...
          </option>
          <option value="select">Select (Final)</option>
          <option value="reject">Reject</option>
        </select>
      )
    }
    if (row.l2Status === 'selected') {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
          <Check className="w-2.5 h-2.5 text-emerald-600" />
          Selected
        </span>
      )
    }
    if (row.l2Status === 'skipped') {
      return (
        <span
          className="px-1.5 py-0.5 bg-gray-100 text-gray-500 border border-gray-200 rounded-md text-[10px] font-medium"
          title="Direct L1 → FINAL (L2 Skipped)"
        >
          Skipped
        </span>
      )
    }
    if (row.l2Status === 'rejected') {
      return (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold"
          title={row.rejectionReason}
        >
          <X className="w-2.5 h-2.5 text-rose-600" />
          Rejected
        </span>
      )
    }
    return <span className="text-gray-400">—</span>
  }

  const renderFinalCell = (row: PipelineCandidateItem) => {
    if (row.finalStatus === 'active') {
      return (
        <select
          defaultValue=""
          onChange={e => {
            if (e.target.value) {
              handleUpdatePipelineStage(row.id, 'FINAL', e.target.value)
            }
          }}
          className="px-1 py-0.5 bg-white border border-purple-300 rounded-md text-[10px] font-bold text-purple-700 hover:border-purple-500 focus:outline-none cursor-pointer shadow-2xs w-full max-w-[80px]"
        >
          <option value="" disabled>
            Final...
          </option>
          <option value="completed">Completed</option>
          <option value="reject">Reject</option>
        </select>
      )
    }
    if (row.finalStatus === 'completed') {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-bold">
          <Check className="w-2.5 h-2.5 text-emerald-600" />
          Completed
        </span>
      )
    }
    if (row.finalStatus === 'rejected') {
      return (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold"
          title={row.rejectionReason}
        >
          <X className="w-2.5 h-2.5 text-rose-600" />
          Rejected
        </span>
      )
    }
    return <span className="text-gray-400">—</span>
  }

  const renderOfferLetterCell = (row: PipelineCandidateItem) => {
    if (row.offerLetterStatus || row.finalStatus === 'completed') {
      const currentVal = row.offerLetterStatus || 'ready_to_release'
      return (
        <select
          value={currentVal}
          onChange={e => {
            const val = e.target.value as 'ready_to_release' | 'released'
            handleUpdateOfferLetterStatus(row.id, val)
          }}
          className={`px-1 py-0.5 border rounded-md text-[10px] font-bold focus:outline-none cursor-pointer shadow-2xs w-full max-w-[95px] ${
            currentVal === 'released'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:border-emerald-500'
              : 'bg-blue-50 text-blue-700 border-blue-300 hover:border-blue-500'
          }`}
        >
          <option value="ready_to_release">Ready to release</option>
          <option value="released">Released</option>
        </select>
      )
    }
    return <span className="text-gray-400">—</span>
  }

  const renderSubmissionStatus = (row: PipelineCandidateItem) => {
    if (row.status === 'COMPLETED') {
      return (
        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold">
          COMPLETED
        </span>
      )
    }
    if (row.status === 'REJECTED') {
      return (
        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-bold">
          REJECTED
        </span>
      )
    }
    if (row.status === 'L2 In Progress') {
      return (
        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-semibold">
          L2 Active
        </span>
      )
    }
    if (row.status === 'Final Round') {
      return (
        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-[10px] font-semibold">
          Final Round
        </span>
      )
    }
    return (
      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-semibold">
        {row.status}
      </span>
    )
  }

  return (
    <>
      {activeTab === 'Pipeline' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Candidate Pipeline</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Table view for high-volume tracking across all stages.
              </p>
            </div>
            <div className="bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>{pipelineCandidates.length} candidates</span>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="py-2.5 px-2 font-bold">CANDIDATE</th>
                  <th className="py-2.5 px-2 font-bold">EXPERIENCE</th>
                  <th className="py-2.5 px-2 font-bold">COMPANY</th>
                  <th className="py-2.5 px-2 font-bold">NOTICE</th>
                  <th className="py-2.5 px-2 font-bold">SUBMISSION STATUS</th>
                  <th className="py-2.5 px-1 font-bold text-center">L1</th>
                  <th className="py-2.5 px-1 font-bold text-center">L2</th>
                  <th className="py-2.5 px-1 font-bold text-center">FINAL</th>
                  <th className="py-2.5 px-1 font-bold text-center">OFFER LETTER</th>
                  <th className="py-2.5 px-2 font-bold">LAST ACTIVITY</th>
                  <th className="py-2.5 px-2 font-bold text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {pipelineCandidates.map((row) => (
                  <tr key={row.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-2.5 px-2 font-bold text-gray-900">
                      <div className="truncate max-w-[130px]" title={row.name}>{row.name}</div>
                      {row.status === 'REJECTED' && row.rejectionReason && (
                        <div className="text-[9px] text-rose-600 font-normal mt-0.5 flex items-center gap-0.5 max-w-[150px] truncate" title={row.rejectionReason}>
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-500 shrink-0" />
                          <span>Reason: {row.rejectionReason}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-gray-700">{row.exp}</td>
                    <td className="py-2.5 px-2 text-gray-600">{row.company}</td>
                    <td className="py-2.5 px-2 text-gray-600 max-w-[140px] truncate" title={row.notice}>{row.notice}</td>
                    <td className="py-2.5 px-2">
                      {renderSubmissionStatus(row)}
                    </td>
                    <td className="py-2.5 px-1 text-center">
                      {renderL1Cell(row)}
                    </td>
                    <td className="py-2.5 px-1 text-center">
                      {renderL2Cell(row)}
                    </td>
                    <td className="py-2.5 px-1 text-center">
                      {renderFinalCell(row)}
                    </td>
                    <td className="py-2.5 px-1 text-center">
                      {renderOfferLetterCell(row)}
                    </td>
                    <td className="py-2.5 px-2 text-gray-600 text-[10px]">{row.activity}</td>
                    <td className="py-2.5 px-2 text-center">
                      {row.action === 'Schedule Interview' ? (
                        <button
                          onClick={() => {
                            setSchedulingCandidateRow({
                              name: row.name,
                              email: String(vm.reqSubmissions.find(sub => String(sub.id) === String(row.id))?.email || ''),
                              requirementId: requirement.id,
                              position: requirement.title,
                              client: requirement.client,
                            })
                            setIsScheduleModalOpen(true)
                          }}
                          className="px-2.5 py-1 bg-[#6B3BF6] hover:bg-[#5833E0] text-white rounded-lg text-[10px] font-bold cursor-pointer shadow-2xs transition-all active:scale-98 whitespace-nowrap"
                        >
                          Schedule Interview
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModalData && (
        <RejectionReasonModal
          candidateName={rejectionModalData.candidateName}
          stage={rejectionModalData.stage}
          onClose={() => setRejectionModalData(null)}
          onConfirm={(reason) => handleConfirmRejection(reason)}
        />
      )}
    </>
  )
}

function RejectionReasonModal({
  candidateName,
  stage,
  onClose,
  onConfirm,
}: {
  candidateName: string
  stage: 'L1' | 'L2' | 'FINAL'
  onClose: () => void
  onConfirm: (reason: string) => void
}) {
  const [reason, setReason] = useState('')
  const [selectedQuickReason, setSelectedQuickReason] = useState('')

  const quickReasons = [
    'Technical evaluation score below threshold',
    'Communication skills insufficient',
    'Notice period exceeds budget limit',
    'Salary expectation exceeds max CTC',
    'Domain knowledge gap in required modules',
    'Client interview feedback negative',
  ]

  const handleSelectQuickReason = (r: string) => {
    setSelectedQuickReason(r)
    setReason(r)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return
    onConfirm(reason.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-md w-full p-6 space-y-4 font-sans animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Reject Candidate ({stage} Stage)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Candidate: <strong className="text-gray-800">{candidateName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Select or Enter Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {quickReasons.map((qr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectQuickReason(qr)}
                  className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                    selectedQuickReason === qr
                      ? 'bg-rose-50 text-rose-700 border-rose-300 ring-1 ring-rose-300'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {qr}
                </button>
              ))}
            </div>

            <textarea
              value={reason}
              onChange={e => {
                setReason(e.target.value)
                setSelectedQuickReason('')
              }}
              rows={3}
              placeholder="Provide specific feedback or reason for candidate rejection..."
              required
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-gray-800 placeholder-gray-400"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!reason.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              Confirm Rejection
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
