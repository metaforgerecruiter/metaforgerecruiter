import React from 'react'
import { AddCandidatePageProps } from './preamble'
import { useAddCandidatePage } from './useAddCandidatePage'
import { AddCandidateChrome } from './AddCandidateChrome'
import { AddCandidateParser } from './AddCandidateParser'
import { AddCandidateBasic } from './AddCandidateBasic'
import { AddCandidateSkills } from './AddCandidateSkills'
import { AddCandidateExperience } from './AddCandidateExperience'
import { AddCandidateLocation } from './AddCandidateLocation'
import { AddCandidateActions } from './AddCandidateActions'
import { AddCandidateDrafts } from './AddCandidateDrafts'

export function AddCandidatePage(props: AddCandidatePageProps) {
  const vm = useAddCandidatePage(props)
  return (
    <div className="space-y-6 w-full pb-16 font-sans">
      <AddCandidateChrome vm={vm} />
      <AddCandidateParser vm={vm} />
      {vm.importMode !== 'drafts' && (
        <form onSubmit={vm.handleSubmit} className="space-y-6">
          <AddCandidateBasic vm={vm} />
          <AddCandidateSkills vm={vm} />
          <AddCandidateExperience vm={vm} />
          <AddCandidateLocation vm={vm} />
          <AddCandidateActions vm={vm} />
        </form>
      )}
      <AddCandidateDrafts vm={vm} />
    </div>
  )
}
