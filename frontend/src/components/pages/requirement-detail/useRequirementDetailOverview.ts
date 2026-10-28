import type { RequirementDetailOverviewProps } from './preamble'
import { useRequirementDetailOverviewState } from './useRequirementDetailOverviewState'
import { useRequirementDetailOverviewHandlers } from './useRequirementDetailOverviewHandlers'

export function useRequirementDetailOverview(props: RequirementDetailOverviewProps) {
  const s = useRequirementDetailOverviewState(props)
  const h1 = useRequirementDetailOverviewHandlers(s)
  return { ...s, ...h1 }
}

export type RequirementDetailVm = ReturnType<typeof useRequirementDetailOverview>
