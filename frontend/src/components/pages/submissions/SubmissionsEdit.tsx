import React from 'react'
import { CreateJobDemandForm } from '../CreateJobDemandForm'
import { SubmissionsVm } from './useSubmissionsPage'
import { workspaceService } from '../../../services/workspace.service'
import { apiErrorMessage } from './preamble'

export function SubmissionsEdit({ vm }: { vm: SubmissionsVm }) {
  const {
    role,
    requirements,
    onUpdateRequirements,
    setSelectedReqDetail,
    setIsEditingReq,
    editingReq,
    setEditingReq,
    showToast,
  } = vm

  return (
    <CreateJobDemandForm
      userRole={role === 'superadmin' ? 'Super Admin View' : role === 'admin' ? 'Admin View' : 'Recruiter View'}
      mode="edit"
      initialData={editingReq}
      onCancel={() => {
        setIsEditingReq(false)
        setEditingReq(null)
      }}
      onSubmit={async updatedReq => {
        try {
          await workspaceService.updateRequirement(updatedReq.id, updatedReq)
          setSelectedReqDetail(updatedReq)
          if (onUpdateRequirements && requirements.length > 0) {
            const updatedList = requirements.map(r => (r.id === updatedReq.id ? updatedReq : r))
            onUpdateRequirements(updatedList)
          }
          setIsEditingReq(false)
          setEditingReq(null)
          showToast('Requirement details updated successfully!')
        } catch (err) {
          showToast(apiErrorMessage(err) || 'Failed to update requirement')
        }
      }}
    />
  )
}
