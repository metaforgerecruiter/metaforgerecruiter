import type { SubmissionsPageProps } from './preamble'
import { useSubmissionsPageState } from './useSubmissionsPageState'
import { useSubmissionsPageHandlers1 } from './useSubmissionsPageHandlers1'
import { useSubmissionsPageHandlers2 } from './useSubmissionsPageHandlers2'

export function useSubmissionsPage(props: SubmissionsPageProps) {
  const s = useSubmissionsPageState(props)
  const h1 = useSubmissionsPageHandlers1(s)
  const h2 = useSubmissionsPageHandlers2({ ...s, ...h1 } as any)
  return { ...s, ...h1, ...h2 }
}

export type SubmissionsVm = ReturnType<typeof useSubmissionsPage>
