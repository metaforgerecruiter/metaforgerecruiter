import React from 'react'
import { CreateJobDemandForm } from '../CreateJobDemandForm'
import { RequirementsVm } from './useRequirementsPage'
import { workspaceService } from '../../../services/workspace.service'
import { apiErrorMessage } from '../../../services/candidatePayload'

export function RequirementsEdit({ vm }: { vm: RequirementsVm }) {
  const {
    onUpdateRequirements,
    localRequirements,
    setLocalRequirements,
    setSelectedReqForDetail,
    showToast,
    setIsEditingDemand,
    editingReq,
    setEditingReq,
    roleLabel,
  } = vm

  return (
    <CreateJobDemandForm
      userRole={roleLabel}
      mode="edit"
      initialData={editingReq || undefined}
      onCancel={() => setIsEditingDemand(false)}
      onSubmit={async updatedReq => {
        try {
          await workspaceService.updateRequirement(updatedReq.id, updatedReq)
          const updatedList = localRequirements.map(r =>
            r.id === updatedReq.id ? updatedReq : r
          )
          setLocalRequirements(updatedList)
          onUpdateRequirements?.(updatedList)
          setSelectedReqForDetail(updatedReq)
          setIsEditingDemand(false)
          setEditingReq(null)
          showToast('Requirement details updated successfully!')
        } catch (err) {
          showToast(apiErrorMessage(err) || 'Failed to update requirement')
        }
      }}
    />
  )
}
