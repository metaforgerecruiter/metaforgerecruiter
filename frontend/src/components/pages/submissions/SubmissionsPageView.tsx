import React from 'react'
import { SubmissionsPageProps } from './preamble'
import { useSubmissionsPage } from './useSubmissionsPage'
import { SubmissionsEdit } from './SubmissionsEdit'
import { SubmissionsDetail } from './SubmissionsDetail'
import { SubmissionsHeaderKpis } from './SubmissionsHeaderKpis'
import { SubmissionsFilters } from './SubmissionsFilters'
import { SubmissionsTable } from './SubmissionsTable'
import { SubmissionsModals } from './SubmissionsModals'

export function SubmissionsPage(props: SubmissionsPageProps) {
  const vm = useSubmissionsPage(props)
  if (vm.isEditingReq && vm.editingReq) return <SubmissionsEdit vm={vm} />
  if (vm.selectedReqDetail) return <SubmissionsDetail vm={vm} />
  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800">
      <SubmissionsHeaderKpis vm={vm} />
      <SubmissionsFilters vm={vm} />
      <SubmissionsTable vm={vm} />
      <SubmissionsModals vm={vm} />
    </div>
  )
}
