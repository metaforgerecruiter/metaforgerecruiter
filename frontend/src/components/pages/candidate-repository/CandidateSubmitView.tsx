import React from 'react'
import { SubmitToLeadPage } from '../SubmitToLeadPage'
import { CandidateRepoVm } from './useCandidateRepository'

export function CandidateSubmitView({ vm }: { vm: CandidateRepoVm }) {
  const {
    selectedCandidatesForSubmit,
    activeRequirement,
    role,
    setViewMode,
    setSelectedCandidatesForSubmit,
    showToast,
    onBackToDashboard,
    setActiveReqId,
  } = vm
  return (
    <div id="candidate-repo-next-page-section" className="space-y-6 w-full pb-24 font-sans text-slate-800 animate-in fade-in duration-200">
      {/* SubmitToLeadPage Component */}
      <div className="bg-slate-50/60 rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs">
        <SubmitToLeadPage
          selectedCandidates={selectedCandidatesForSubmit}
          requirement={activeRequirement}
          role={role}
          onBack={() => {
            setViewMode('list')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onSubmitSuccess={() => {
            setViewMode('list')
            setSelectedCandidatesForSubmit([])
            showToast((role || '').toLowerCase() === 'lead' ? 'Successfully submitted candidate to client!' : 'Successfully submitted candidate to lead & client loop!')
            if (onBackToDashboard) {
              onBackToDashboard()
            } else {
              setActiveReqId(null)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }}
        />
      </div>
    </div>
  )
}
