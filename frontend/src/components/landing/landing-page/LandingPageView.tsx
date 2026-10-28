import React from 'react'
import { LandingPageProps } from './preamble'
import { useLandingPage } from './useLandingPage'
import { LandingNav } from './LandingNav'
import { LandingHero } from './LandingHero'
import { LandingAi } from './LandingAi'
import { LandingWorkflow } from './LandingWorkflow'
import { LandingCapabilities } from './LandingCapabilities'
import { LandingGovernance } from './LandingGovernance'
import { LandingCtaFooter } from './LandingCtaFooter'

export function LandingPage(props: LandingPageProps) {
  const vm = useLandingPage(props)
  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden text-slate-800">
      <LandingNav vm={vm} />
      <LandingHero vm={vm} />
      <LandingAi vm={vm} />
      <LandingWorkflow vm={vm} />
      <LandingCapabilities vm={vm} />
      <LandingGovernance vm={vm} />
      <LandingCtaFooter vm={vm} />
    </div>
  )
}
