import React from 'react'
import { RequirementsPageProps } from './preamble'
import { useRequirementsPage } from './useRequirementsPage'
import { RequirementsCreate } from './RequirementsCreate'
import { RequirementsEdit } from './RequirementsEdit'
import { RequirementsDetail } from './RequirementsDetail'
import { RequirementsCards } from './RequirementsCards'
import { RequirementsSearch } from './RequirementsSearch'
import { RequirementsTable } from './RequirementsTable'
import { RequirementsModals } from './RequirementsModals'

export function RequirementsPage(props: RequirementsPageProps) {
  const vm = useRequirementsPage(props)
  if (vm.isCreatingDemand && vm.role !== 'admin') return <RequirementsCreate vm={vm} />
  if (vm.isEditingDemand && vm.editingReq) return <RequirementsEdit vm={vm} />
  if (vm.selectedReqForDetail) return <RequirementsDetail vm={vm} />
  return (
    <div className="space-y-5 w-full pb-10">
      <RequirementsCards vm={vm} />
      <RequirementsSearch vm={vm} />
      <RequirementsTable vm={vm} />
      <RequirementsModals vm={vm} />
    </div>
  )
}
