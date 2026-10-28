import React from 'react'
import { CreateJobDemandForm } from '../CreateJobDemandForm'
import { RequirementsVm } from './useRequirementsPage'

export function RequirementsCreate({ vm }: { vm: RequirementsVm }) {
  const {
    onUpdateRequirements,
    localRequirements,
    setLocalRequirements,
    setIsCreatingDemand,
    roleLabel,
  } = vm
  return (
    <CreateJobDemandForm
      userRole={roleLabel}
      mode="create"
      onCancel={() => setIsCreatingDemand(false)}
      onSubmit={newReq => {
        const updated = [newReq, ...localRequirements]
        setLocalRequirements(updated)
        if (onUpdateRequirements) {
          onUpdateRequirements(updated)
        }
        setIsCreatingDemand(false)
      }}
    />
  )
}
