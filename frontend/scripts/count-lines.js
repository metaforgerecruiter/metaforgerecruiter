const fs = require('fs')
const files = [
  'pages/AddCandidatePage.tsx',
  'pages/SubmissionsPage.tsx',
  'pages/SubmitToLeadPage.tsx',
  'pages/RequirementsPage.tsx',
  'pages/RequirementDetailOverview.tsx',
  'pages/ClientsPage.tsx',
  'pages/ClientDeliveryGapAnalysisPage.tsx',
  'pages/CreateJobDemandForm.tsx',
  'pages/RecruiterDetailAnalyticsPage.tsx',
  'dashboards/RecruiterDashboard.tsx',
  'landing/LandingPage.tsx',
]
const root = 'f:/Recruiter-Appplication-V2/frontend/src/components/'
for (const f of files) {
  const n = fs.readFileSync(root + f, 'utf8').split(/\n/).length
  console.log(n + '\t' + f)
}
