import React from 'react'
import { RequirementDetailOverviewProps } from './preamble'
import { useRequirementDetailOverview } from './useRequirementDetailOverview'
import { CreateJobDemandForm } from '../CreateJobDemandForm'
import { ReqDetailTop } from './ReqDetailTop'
import { ReqDetailMetrics } from './ReqDetailMetrics'
import { ReqDetailProgressTabs } from './ReqDetailProgressTabs'
import { ReqDetailOverviewA } from './ReqDetailOverviewA'
import { ReqDetailOverviewB } from './ReqDetailOverviewB'
import { ReqDetailOverviewC } from './ReqDetailOverviewC'
import { ReqDetailPipeline } from './ReqDetailPipeline'
import { ReqDetailInterviewsOffers } from './ReqDetailInterviewsOffers'
import { ReqDetailActivity } from './ReqDetailActivity'
import { ReqDetailModals } from './ReqDetailModals'

export function RequirementDetailOverview(props: RequirementDetailOverviewProps) {
  const vm = useRequirementDetailOverview(props)

  if (vm.isInternalEditing) {
    return (
      <CreateJobDemandForm
        userRole={
          vm.role === 'superadmin'
            ? 'Super Admin View'
            : vm.role === 'admin'
            ? 'Admin View'
            : 'Recruiter View'
        }
        mode="edit"
        initialData={vm.requirement}
        onCancel={() => vm.setIsInternalEditing(false)}
        onSubmit={vm.handleSaveRequirement}
      />
    )
  }

  return (
    <div className="space-y-6 w-full pb-16 font-sans text-gray-800">
      <ReqDetailTop vm={vm} />
      <ReqDetailMetrics vm={vm} />
      <ReqDetailProgressTabs vm={vm} />
      <ReqDetailOverviewA vm={vm} />
      <ReqDetailOverviewB vm={vm} />
      <ReqDetailOverviewC vm={vm} />
      <ReqDetailPipeline vm={vm} />
      <ReqDetailInterviewsOffers vm={vm} />
      <ReqDetailActivity vm={vm} />
      <ReqDetailModals vm={vm} />
    </div>
  )
}
