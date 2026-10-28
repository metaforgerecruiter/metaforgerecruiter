import React from 'react'
import { CandidateDetailModal } from './CandidateDetailModal'
import { CandidateListHeader } from './CandidateListHeader'
import { CandidateSelectionDock } from './CandidateSelectionDock'
import { CandidateTable } from './CandidateTable'
import { RequirementSelectModal } from './RequirementSelectModal'
import { SubmissionHistoryModal } from './SubmissionHistoryModal'
import { CandidateRepoVm } from './useCandidateRepository'

export function CandidateListView({ vm }: { vm: CandidateRepoVm }) {
  const { toastMsg } = vm
  return (
    <div id="candidate-repo-top" className="space-y-6 w-full pb-24 font-sans text-slate-800">
      <CandidateListHeader vm={vm} />
      <CandidateTable vm={vm} />
      <CandidateSelectionDock vm={vm} />
      <CandidateDetailModal vm={vm} />
      <RequirementSelectModal vm={vm} />
      <SubmissionHistoryModal vm={vm} />
      {toastMsg && (
        <div className="fixed bottom-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
