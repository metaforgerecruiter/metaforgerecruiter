const { extractOne } = require('./extract-one')

extractOne({
  src: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/RequirementDetailOverview.tsx',
  destDir: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/requirement-detail',
  fnName: 'RequirementDetailOverview',
  fnLine: 33,
  handlerStart: 191,
  logicEnd: 191,
  propsType: 'RequirementDetailOverviewProps',
  hookName: 'useRequirementDetailOverview',
  vmType: 'RequirementDetailVm',
  views: [
    { name: 'ReqDetailTop', from: 193, to: 318, mode: 'block' },
    { name: 'ReqDetailMetrics', from: 319, to: 407, mode: 'block' },
    { name: 'ReqDetailProgressTabs', from: 408, to: 498, mode: 'block' },
    { name: 'ReqDetailOverviewA', from: 500, to: 657, mode: 'block' },
    { name: 'ReqDetailOverviewB', from: 658, to: 821, mode: 'block' },
    { name: 'ReqDetailOverviewC', from: 822, to: 1076, mode: 'block' },
    { name: 'ReqDetailPipeline', from: 1078, to: 1220, mode: 'block' },
    { name: 'ReqDetailInterviewsOffers', from: 1221, to: 1288, mode: 'block' },
    { name: 'ReqDetailActivity', from: 1290, to: 1485, mode: 'block' },
    { name: 'ReqDetailModals', from: 1486, to: 1520, mode: 'block' },
  ],
  composer: `  return (
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
  )`,
})

extractOne({
  src: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/ClientsPage.tsx',
  destDir: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/clients',
  fnName: 'ClientsPage',
  fnLine: 347,
  handlerStart: 441,
  logicEnd: 481,
  propsType: 'ClientsPageProps',
  hookName: 'useClientsPage',
  vmType: 'ClientsVm',
  reexportTypes: ['ClientRecord', 'ClientRequirementItem'],
  reexportValues: ['getRequirementsForClient', 'getClientStats'],
  viewImports: [
    "import { ClientDeliveryGapAnalysisPage } from '../ClientDeliveryGapAnalysisPage'",
    "import { PaginationFooter } from '../../ui/PaginationFooter'",
  ],
  views: [
    { name: 'ClientsGap', from: 483, to: 495, mode: 'block' },
    { name: 'ClientsAgreementA', from: 508, to: 640, mode: 'block' },
    { name: 'ClientsAgreementB', from: 641, to: 715, mode: 'block' },
    { name: 'ClientsAddA', from: 722, to: 867, mode: 'block' },
    { name: 'ClientsAddB', from: 868, to: 990, mode: 'block' },
    { name: 'ClientsListHeader', from: 998, to: 1131, mode: 'block' },
    { name: 'ClientsTable', from: 1132, to: 1315, mode: 'block' },
    { name: 'ClientsModals', from: 1316, to: 1498, mode: 'block' },
  ],
  composer: `  if (vm.selectedClientForGapAnalysis) return <ClientsGap vm={vm} />
  if (vm.viewMode === 'view_agreement' && vm.selectedClientForAgreement) {
    return (
      <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-200">
        <ClientsAgreementA vm={vm} />
        <ClientsAgreementB vm={vm} />
      </div>
    )
  }
  if (vm.viewMode === 'add') {
    return (
      <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-200">
        <ClientsAddA vm={vm} />
        <ClientsAddB vm={vm} />
      </div>
    )
  }
  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800">
      <ClientsListHeader vm={vm} />
      <ClientsTable vm={vm} />
      <ClientsModals vm={vm} />
    </div>
  )`,
})

extractOne({
  src: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/ClientDeliveryGapAnalysisPage.tsx',
  destDir: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/client-gap',
  fnName: 'ClientDeliveryGapAnalysisPage',
  fnLine: 251,
  handlerStart: 548,
  logicEnd: 548,
  propsType: 'ClientGapAnalysisProps',
  hookName: 'useClientDeliveryGap',
  vmType: 'ClientGapVm',
  reexportTypes: ['ClientGapAnalysisProps', 'ClientRequirementItem'],
  reexportValues: ['getClientGapAnalysisDataset'],
  viewImports: [
    "import { PaginationFooter } from '../../ui/PaginationFooter'",
    "import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts'",
  ],
  views: [
    { name: 'ClientGapHeader', from: 550, to: 618, mode: 'block' },
    { name: 'ClientGapFilters', from: 619, to: 744, mode: 'block' },
    { name: 'ClientGapNav', from: 745, to: 853, mode: 'block' },
    { name: 'ClientGapKpis', from: 854, to: 946, mode: 'block' },
    { name: 'ClientGapDomains', from: 947, to: 1038, mode: 'block' },
    { name: 'ClientGapCharts', from: 1039, to: 1172, mode: 'block' },
    { name: 'ClientGapSpoc', from: 1173, to: 1266, mode: 'block' },
    { name: 'ClientGapReqs', from: 1267, to: 1416, mode: 'block' },
  ],
  composer: `  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-150">
      <ClientGapHeader vm={vm} />
      <ClientGapFilters vm={vm} />
      <ClientGapNav vm={vm} />
      <ClientGapKpis vm={vm} />
      <ClientGapDomains vm={vm} />
      <ClientGapCharts vm={vm} />
      <ClientGapSpoc vm={vm} />
      <ClientGapReqs vm={vm} />
    </div>
  )`,
})

extractOne({
  src: 'f:/Recruiter-Appplication-V2/frontend/src/components/dashboards/RecruiterDashboard.tsx',
  destDir: 'f:/Recruiter-Appplication-V2/frontend/src/components/dashboards/recruiter-dashboard',
  fnName: 'RecruiterDashboard',
  fnLine: 75,
  handlerStart: 177,
  logicEnd: 260,
  propsType: 'Props',
  hookName: 'useRecruiterDashboard',
  vmType: 'RecruiterDashboardVm',
  viewImports: [
    "import { RequirementDetailOverview } from '../../pages/RequirementDetailOverview'",
    "import { CandidateRepositoryPage } from '../../pages/CandidateRepositoryPage'",
    "import { SubmissionsPage } from '../../pages/SubmissionsPage'",
    "import { InterviewTrackingPage } from '../../pages/InterviewTrackingPage'",
    "import { PaginationFooter } from '../../ui/PaginationFooter'",
    "import { PageHeader } from '../../layout/PageHeader'",
  ],
  views: [
    { name: 'RecruiterDashDetail', from: 262, to: 434, mode: 'block' },
    { name: 'RecruiterDashSubmissions', from: 437, to: 464, mode: 'block' },
    { name: 'RecruiterDashInterviews', from: 467, to: 493, mode: 'block' },
    { name: 'RecruiterDashRepo', from: 496, to: 512, mode: 'block' },
    { name: 'RecruiterDashKpis', from: 516, to: 614, mode: 'block' },
    { name: 'RecruiterDashReqs', from: 615, to: 746, mode: 'block' },
    { name: 'RecruiterDashRecent', from: 747, to: 901, mode: 'block' },
  ],
  composer: `  if (vm.selectedReqForDetail) return <RecruiterDashDetail vm={vm} />
  if (vm.inlineView === 'submissions') return <RecruiterDashSubmissions vm={vm} />
  if (vm.inlineView === 'interviews') return <RecruiterDashInterviews vm={vm} />
  if (vm.inlineReqId) return <RecruiterDashRepo vm={vm} />
  return (
    <div className="space-y-8 w-full pb-12 font-sans">
      <RecruiterDashKpis vm={vm} />
      <RecruiterDashReqs vm={vm} />
      <RecruiterDashRecent vm={vm} />
    </div>
  )`,
})
