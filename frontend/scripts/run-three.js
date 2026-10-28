const fs = require('fs')
const { extractOne } = require('./extract-one')

extractOne({
  src: 'f:/Recruiter-Appplication-V2/frontend/src/components/landing/LandingPage.tsx',
  destDir: 'f:/Recruiter-Appplication-V2/frontend/src/components/landing/landing-page',
  fnName: 'LandingPage',
  fnLine: 122,
  handlerStart: 125,
  logicEnd: 125,
  propsType: 'LandingPageProps',
  hookName: 'useLandingPage',
  vmType: 'LandingVm',
  viewImports: [
    "import { NAV_LINKS, AI_CAPABILITIES, RECRUITMENT_WORKFLOW, ENTERPRISE_CAPABILITIES, GOVERNANCE_PILLARS } from './preamble'",
    "import { SectionHeading } from './SectionHeading'",
    "import { RecruitmentIntelligenceVisualization } from './RecruitmentIntelligenceVisualization'",
    "import { MetaforgeLogo } from '../../common/MetaforgeLogo'",
  ],
  views: [
    { name: 'LandingNav', from: 127, to: 204, mode: 'block' },
    { name: 'LandingHero', from: 206, to: 280, mode: 'block' },
    { name: 'LandingAi', from: 281, to: 311, mode: 'block' },
    { name: 'LandingWorkflow', from: 312, to: 358, mode: 'block' },
    { name: 'LandingCapabilities', from: 359, to: 388, mode: 'block' },
    { name: 'LandingGovernance', from: 389, to: 446, mode: 'block' },
    { name: 'LandingCtaFooter', from: 447, to: 504, mode: 'block' },
  ],
  composer: `  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden text-slate-800">
      <LandingNav vm={vm} />
      <LandingHero vm={vm} />
      <LandingAi vm={vm} />
      <LandingWorkflow vm={vm} />
      <LandingCapabilities vm={vm} />
      <LandingGovernance vm={vm} />
      <LandingCtaFooter vm={vm} />
    </div>
  )`,
})

const orig = fs.readFileSync('f:/Recruiter-Appplication-V2/frontend/scripts/orig/LandingPage.tsx', 'utf8').split(/\n/)
function deepen(s) {
  return s.replace(/from '((?:\.\.\/)+)/g, (_, dots) => `from '${dots}../`).replace(/from '\\.\\//g, "from '../")
}
const dir = 'f:/Recruiter-Appplication-V2/frontend/src/components/landing/landing-page'
fs.writeFileSync(dir + '/SectionHeading.tsx', `import React from 'react'\n\n` + orig.slice(512, 523).join('\n') + '\nexport { SectionHeading }\n')
fs.writeFileSync(dir + '/RecruitmentIntelligenceVisualization.tsx', `import React from 'react'\nimport { Sparkles } from 'lucide-react'\n\n` + orig.slice(525).join('\n') + '\nexport { RecruitmentIntelligenceVisualization }\n')

extractOne({
  src: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/CreateJobDemandForm.tsx',
  destDir: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/create-job-demand',
  fnName: 'CreateJobDemandForm',
  fnLine: 13,
  handlerStart: 115,
  logicEnd: 196,
  propsType: 'CreateJobDemandFormProps',
  hookName: 'useCreateJobDemandForm',
  vmType: 'CreateJobDemandVm',
  handlerImports: ["import { Requirement } from '../../../types'"],
  views: [
    { name: 'CreateJobHeader', from: 199, to: 225, mode: 'block' },
    { name: 'CreateJobExtract', from: 228, to: 275, mode: 'block' },
    { name: 'CreateJobBasic', from: 277, to: 323, mode: 'block' },
    { name: 'CreateJobClient', from: 324, to: 367, mode: 'block' },
    { name: 'CreateJobInfo', from: 368, to: 467, mode: 'block' },
    { name: 'CreateJobPosition', from: 468, to: 621, mode: 'block' },
    { name: 'CreateJobMandatory', from: 622, to: 664, mode: 'block' },
    { name: 'CreateJobCoreSkills', from: 665, to: 707, mode: 'block' },
    { name: 'CreateJobActions', from: 708, to: 724, mode: 'block' },
    { name: 'CreateJobToast', from: 727, to: 732, mode: 'block' },
  ],
  composer: `  return (
    <div className="w-full space-y-6 pb-24 font-sans text-slate-800">
      <CreateJobHeader vm={vm} />
      <form onSubmit={vm.handleSubmit} className="space-y-6">
        <CreateJobExtract vm={vm} />
        <CreateJobBasic vm={vm} />
        <CreateJobClient vm={vm} />
        <CreateJobInfo vm={vm} />
        <CreateJobPosition vm={vm} />
        <CreateJobMandatory vm={vm} />
        <CreateJobCoreSkills vm={vm} />
        <CreateJobActions vm={vm} />
      </form>
      <CreateJobToast vm={vm} />
    </div>
  )`,
})

extractOne({
  src: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/RecruiterDetailAnalyticsPage.tsx',
  destDir: 'f:/Recruiter-Appplication-V2/frontend/src/components/pages/recruiter-detail-analytics',
  fnName: 'RecruiterDetailAnalyticsPage',
  fnLine: 83,
  handlerStart: 128,
  logicEnd: 128,
  propsType: 'RecruiterDetailAnalyticsPageProps',
  hookName: 'useRecruiterDetailAnalytics',
  vmType: 'RecruiterDetailVm',
  reexportTypes: ['RecruiterDetailData'],
  viewImports: [
    "import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts'",
  ],
  views: [
    { name: 'RecruiterDetailHeader', from: 130, to: 181, mode: 'block' },
    { name: 'RecruiterDetailKpis', from: 182, to: 250, mode: 'block' },
    { name: 'RecruiterDetailChartsA', from: 251, to: 363, mode: 'block' },
    { name: 'RecruiterDetailChartsB', from: 364, to: 473, mode: 'block' },
    { name: 'RecruiterDetailTable', from: 474, to: 629, mode: 'block' },
    { name: 'RecruiterDetailModals', from: 630, to: 704, mode: 'block' },
  ],
  composer: `  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-150">
      <RecruiterDetailHeader vm={vm} />
      <RecruiterDetailKpis vm={vm} />
      <RecruiterDetailChartsA vm={vm} />
      <RecruiterDetailChartsB vm={vm} />
      <RecruiterDetailTable vm={vm} />
      <RecruiterDetailModals vm={vm} />
    </div>
  )`,
})
