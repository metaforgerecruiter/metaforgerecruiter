import React from 'react'
import { RecruiterDetailAnalyticsPageProps } from './preamble'
import { useRecruiterDetailAnalytics } from './useRecruiterDetailAnalytics'
import { RecruiterDetailHeader } from './RecruiterDetailHeader'
import { RecruiterDetailKpis } from './RecruiterDetailKpis'
import { RecruiterDetailChartsA } from './RecruiterDetailChartsA'
import { RecruiterDetailChartsB } from './RecruiterDetailChartsB'
import { RecruiterDetailTable } from './RecruiterDetailTable'
import { RecruiterDetailModals } from './RecruiterDetailModals'

export function RecruiterDetailAnalyticsPage(props: RecruiterDetailAnalyticsPageProps) {
  const vm = useRecruiterDetailAnalytics(props)
  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-150">
      <RecruiterDetailHeader vm={vm} />
      <RecruiterDetailKpis vm={vm} />
      <RecruiterDetailChartsA vm={vm} />
      <RecruiterDetailChartsB vm={vm} />
      <RecruiterDetailTable vm={vm} />
      <RecruiterDetailModals vm={vm} />
    </div>
  )
}
