const { extractOne } = require('./extract-one')

extractOne({
  src: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/SubmissionsPage.tsx',
  destDir: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/submissions',
  fnName: 'SubmissionsPage',
  fnLine: 226,
  handlerStart: 277,
  logicEnd: 496,
  propsType: 'SubmissionsPageProps',
  hookName: 'useSubmissionsPage',
  vmType: 'SubmissionsVm',
  viewImports: [
    "import { PaginationFooter } from '../../ui/PaginationFooter'",
    "import { PageHeader } from '../../layout/PageHeader'",
    "import { SubmissionCandidateDetailModal } from '../../modals/SubmissionCandidateDetailModal'",
    "import { ScheduleInterviewModal } from '../../modals/ScheduleInterviewModal'",
    "import { RequirementDetailOverview } from '../RequirementDetailOverview'",
    "import { CreateJobDemandForm } from '../CreateJobDemandForm'",
  ],
  views: [
    { name: 'SubmissionsEdit', from: 498, to: 518, mode: 'block' },
    { name: 'SubmissionsDetail', from: 522, to: 533, mode: 'block' },
    { name: 'SubmissionsHeaderKpis', from: 538, to: 628, mode: 'block' },
    { name: 'SubmissionsFilters', from: 629, to: 790, mode: 'block' },
    { name: 'SubmissionsTable', from: 791, to: 924, mode: 'block' },
    { name: 'SubmissionsModals', from: 925, to: 972, mode: 'block' },
  ],
  composer: `  if (vm.isEditingReq && vm.editingReq) return <SubmissionsEdit vm={vm} />
  if (vm.selectedReqDetail) return <SubmissionsDetail vm={vm} />
  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800">
      <SubmissionsHeaderKpis vm={vm} />
      <SubmissionsFilters vm={vm} />
      <SubmissionsTable vm={vm} />
      <SubmissionsModals vm={vm} />
    </div>
  )`,
})

extractOne({
  src: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/SubmitToLeadPage.tsx',
  destDir: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/submit-to-lead',
  fnName: 'SubmitToLeadPage',
  fnLine: 48,
  handlerStart: 289,
  logicEnd: 642,
  propsType: 'SubmitToLeadPageProps',
  hookName: 'useSubmitToLeadPage',
  vmType: 'SubmitToLeadVm',
  stateImports: [
    "import { getForwardRequestByReq } from '../../../data/forwardRequestsStore'",
  ],
  handlerImports: [
    "import { createOrUpdateForwardRequest, approveForwardRequest, rejectForwardRequest } from '../../../data/forwardRequestsStore'",
    "import { checkDuplicateSubmission } from '../../../data/submissionsStore'",
  ],
  views: [
    { name: 'SubmitToLeadHeader', from: 645, to: 661, mode: 'block' },
    { name: 'SubmitToLeadDestination', from: 662, to: 833, mode: 'block' },
    { name: 'SubmitToLeadReview', from: 834, to: 875, mode: 'block' },
    { name: 'SubmitToLeadCandidates', from: 876, to: 914, mode: 'block' },
    { name: 'SubmitToLeadTracker', from: 915, to: 1141, mode: 'block' },
    { name: 'SubmitToLeadFooter', from: 1142, to: 1232, mode: 'block' },
  ],
  composer: `  return (
    <div className="space-y-6 w-full pb-24 font-sans text-slate-800 animate-in fade-in duration-200">
      <SubmitToLeadHeader vm={vm} />
      <SubmitToLeadDestination vm={vm} />
      <SubmitToLeadReview vm={vm} />
      <SubmitToLeadCandidates vm={vm} />
      <SubmitToLeadTracker vm={vm} />
      <SubmitToLeadFooter vm={vm} />
    </div>
  )`,
})

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
    { name: 'RequirementsListA', from: 741, to: 1000, mode: 'block' },
    { name: 'RequirementsListB', from: 1001, to: 1248, mode: 'block' },
  ],
  composer: `  if (vm.isCreatingDemand && vm.role !== 'admin') return <RequirementsCreate vm={vm} />
  if (vm.isEditingDemand && vm.editingReq) return <RequirementsEdit vm={vm} />
  if (vm.selectedReqForDetail) return <RequirementsDetail vm={vm} />
  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800">
      <RequirementsListA vm={vm} />
      <RequirementsListB vm={vm} />
    </div>
  )`,
})

console.log('batch 1 done')
