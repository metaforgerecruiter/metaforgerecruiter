import React from 'react'
import { CandidateEditView } from './CandidateEditView'
import { CandidateListView } from './CandidateListView'
import { CandidateSubmitView } from './CandidateSubmitView'
import { CandidateRepositoryPageProps } from './types'
import { useCandidateRepository } from './useCandidateRepository'

export function CandidateRepositoryPage(props: CandidateRepositoryPageProps) {
  const vm = useCandidateRepository(props)
  if (vm.editingCandidate) {
    return <CandidateEditView vm={vm} />
  }
  if (vm.viewMode === 'submit_to_lead') {
    return <CandidateSubmitView vm={vm} />
  }
  return <CandidateListView vm={vm} />
}
