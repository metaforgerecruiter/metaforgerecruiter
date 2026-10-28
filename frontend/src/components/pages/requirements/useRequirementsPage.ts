import type { RequirementsPageProps } from './preamble'
import { useRequirementsPageState } from './useRequirementsPageState'
import { useRequirementsPageHandlers1 } from './useRequirementsPageHandlers1'
import { useRequirementsPageHandlers2 } from './useRequirementsPageHandlers2'
import { useRequirementsPageHandlers3 } from './useRequirementsPageHandlers3'

export function useRequirementsPage(props: RequirementsPageProps) {
  const s = useRequirementsPageState(props)
  const h1 = useRequirementsPageHandlers1(s)
  const h2 = useRequirementsPageHandlers2(s)
  const h3 = useRequirementsPageHandlers3(s)
  return { ...s, ...h1, ...h2, ...h3 }
}

export type RequirementsVm = ReturnType<typeof useRequirementsPage>
