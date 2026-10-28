import type { LandingPageProps } from './preamble'
import { useLandingPageState } from './useLandingPageState'

export function useLandingPage(props: LandingPageProps) {
  return useLandingPageState(props)
}

export type LandingVm = ReturnType<typeof useLandingPage>
