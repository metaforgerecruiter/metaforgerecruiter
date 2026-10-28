import type { SubmitToLeadPageProps } from './preamble'
import { useSubmitToLeadPageState } from './useSubmitToLeadPageState'
import { useSubmitToLeadPageHandlers1 } from './useSubmitToLeadPageHandlers1'
import { useSubmitToLeadPageHandlers2 } from './useSubmitToLeadPageHandlers2'
import { useSubmitToLeadPageHandlers3 } from './useSubmitToLeadPageHandlers3'

export function useSubmitToLeadPage(props: SubmitToLeadPageProps) {
  const s = useSubmitToLeadPageState(props)
  const h1 = useSubmitToLeadPageHandlers1(s)
  const h2 = useSubmitToLeadPageHandlers2({ ...s, ...h1 } as any)
  const h3 = useSubmitToLeadPageHandlers3({ ...s, ...h1, ...h2 } as any)
  return { ...s, ...h1, ...h2, ...h3 }
}

export type SubmitToLeadVm = ReturnType<typeof useSubmitToLeadPage>
