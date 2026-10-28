import type { CreateJobDemandFormProps } from './preamble'
import { useCreateJobDemandFormState } from './useCreateJobDemandFormState'
import { useCreateJobDemandFormHandlers } from './useCreateJobDemandFormHandlers'

export function useCreateJobDemandForm(props: CreateJobDemandFormProps) {
  const s = useCreateJobDemandFormState(props)
  const h1 = useCreateJobDemandFormHandlers(s)
  return { ...s, ...h1 }
}

export type CreateJobDemandVm = ReturnType<typeof useCreateJobDemandForm>
