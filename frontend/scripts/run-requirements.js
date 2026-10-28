const { extractOne } = require('./extract-one')
extractOne({
  src: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/RequirementsPage.tsx',
  destDir: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/requirements',
  fnName: 'RequirementsPage',
  fnLine: 45,
  handlerStart: 157,
  logicEnd: 560,
  propsType: 'RequirementsPageProps',
  hookName: 'useRequirementsPage',
  vmType: 'RequirementsVm',
  viewImports: [
    "import { RequirementDetailOverview } from '../RequirementDetailOverview'",
    "import { CreateJobDemandForm } from '../CreateJobDemandForm'",
    "import { PaginationFooter } from '../../ui/PaginationFooter'",
  ],
  views: [
    { name: 'RequirementsCreate', from: 562, to: 576, mode: 'block' },
    { name: 'RequirementsEdit', from: 580, to: 597, mode: 'block' },
    { name: 'RequirementsDetail', from: 601, to: 737, mode: 'block' },
    { name: 'RequirementsCards', from: 741, to: 824, mode: 'block' },
    { name: 'RequirementsSearch', from: 825, to: 924, mode: 'block' },
    { name: 'RequirementsTable', from: 925, to: 1107, mode: 'block' },
    { name: 'RequirementsModals', from: 1108, to: 1248, mode: 'block' },
  ],
  composer: `  if (vm.isCreatingDemand && vm.role !== 'admin') return <RequirementsCreate vm={vm} />
  if (vm.isEditingDemand && vm.editingReq) return <RequirementsEdit vm={vm} />
  if (vm.selectedReqForDetail) return <RequirementsDetail vm={vm} />
  return (
    <div className="space-y-5 w-full pb-10">
      <RequirementsCards vm={vm} />
      <RequirementsSearch vm={vm} />
      <RequirementsTable vm={vm} />
      <RequirementsModals vm={vm} />
    </div>
  )`,
})
