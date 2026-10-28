import React from 'react'
import { RequirementDetailOverview } from '../RequirementDetailOverview'
import { SubmissionsVm } from './useSubmissionsPage'

export function SubmissionsDetail({ vm }: { vm: SubmissionsVm }) {
  const {
    role,
    onOpenSubmitCandidate,
    selectedReqDetail,
    setSelectedReqDetail,
    setIsEditingReq,
    setEditingReq,
  } = vm
  if (!selectedReqDetail) return null
  return (
      <RequirementDetailOverview
        requirement={selectedReqDetail}
        role={role}
        onBack={() => setSelectedReqDetail(null)}
        onAddCandidate={() => onOpenSubmitCandidate?.(selectedReqDetail.id)}
        onEditRequirement={() => {
          setEditingReq(selectedReqDetail)
          setIsEditingReq(true)
        }}
      />
  )
}
