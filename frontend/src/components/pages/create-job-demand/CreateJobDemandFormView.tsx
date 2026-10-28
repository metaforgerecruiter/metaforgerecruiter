import React from 'react'
import { CreateJobDemandFormProps } from './preamble'
import { useCreateJobDemandForm } from './useCreateJobDemandForm'
import { CreateJobHeader } from './CreateJobHeader'
import { CreateJobExtract } from './CreateJobExtract'
import { CreateJobBasic } from './CreateJobBasic'
import { CreateJobClient } from './CreateJobClient'
import { CreateJobInfo } from './CreateJobInfo'
import { CreateJobPosition } from './CreateJobPosition'
import { CreateJobMandatory } from './CreateJobMandatory'
import { CreateJobCoreSkills } from './CreateJobCoreSkills'
import { CreateJobActions } from './CreateJobActions'
import { CreateJobToast } from './CreateJobToast'

export function CreateJobDemandForm(props: CreateJobDemandFormProps) {
  const vm = useCreateJobDemandForm(props)
  return (
    <div className="w-full space-y-6 pb-24 font-sans text-slate-800">
      <CreateJobHeader vm={vm} />
      <form onSubmit={vm.handleSubmit} className="space-y-6">
        <CreateJobExtract vm={vm} />
        <CreateJobBasic vm={vm} />
        <CreateJobClient vm={vm} />
        <CreateJobInfo vm={vm} />
        <CreateJobPosition vm={vm} />
        <CreateJobMandatory vm={vm} />
        <CreateJobCoreSkills vm={vm} />
        <CreateJobActions vm={vm} />
      </form>
      <CreateJobToast vm={vm} />
    </div>
  )
}
