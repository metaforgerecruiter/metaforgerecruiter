const fs = require('fs')
const files = {
  AddCandidatePage: [36, 317],
  SubmissionsPage: [226, 497],
  SubmitToLeadPage: [48, 643],
  RequirementsPage: [45, 561],
  RequirementDetailOverview: [33, 200],
  ClientsPage: [347, 482],
  ClientDeliveryGapAnalysisPage: [251, 400],
  CreateJobDemandForm: [13, 200],
  RecruiterDetailAnalyticsPage: [83, 200],
  RecruiterDashboard: [75, 261],
  LandingPage: [122, 125],
}
const root = 'f:/Recruiter-Appplication-V2/frontend/src/components/'
const map = {
  AddCandidatePage: 'pages/AddCandidatePage.tsx',
  SubmissionsPage: 'pages/SubmissionsPage.tsx',
  SubmitToLeadPage: 'pages/SubmitToLeadPage.tsx',
  RequirementsPage: 'pages/RequirementsPage.tsx',
  RequirementDetailOverview: 'pages/RequirementDetailOverview.tsx',
  ClientsPage: 'pages/ClientsPage.tsx',
  ClientDeliveryGapAnalysisPage: 'pages/ClientDeliveryGapAnalysisPage.tsx',
  CreateJobDemandForm: 'pages/CreateJobDemandForm.tsx',
  RecruiterDetailAnalyticsPage: 'pages/RecruiterDetailAnalyticsPage.tsx',
  RecruiterDashboard: 'dashboards/RecruiterDashboard.tsx',
  LandingPage: 'landing/LandingPage.tsx',
}
for (const [k, [a,b]] of Object.entries(files)) {
  const n = fs.readFileSync(root + map[k], 'utf8').split(/\n/).length
  console.log(k, 'total', n, 'logic~', b-a, 'jsx~', n-b)
}
