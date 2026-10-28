import type { RecruiterDetailAnalyticsPageProps } from './preamble'
import { useRecruiterDetailAnalyticsState } from './useRecruiterDetailAnalyticsState'

export function useRecruiterDetailAnalytics(props: RecruiterDetailAnalyticsPageProps) {
  return useRecruiterDetailAnalyticsState(props)
}

export type RecruiterDetailVm = ReturnType<typeof useRecruiterDetailAnalytics>
