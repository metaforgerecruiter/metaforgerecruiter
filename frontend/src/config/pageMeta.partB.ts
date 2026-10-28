import { PageMeta } from './navigation.types'

export const PAGE_META_B: Record<string, PageMeta> = {
  Recruiters: {
    title: 'Recruiters',
    description: 'Manage recruiter accounts and assignments.',
    actions: ['Assign Recruiter'],
    columns: ['Recruiter', 'Lead', 'Active Reqs', 'Submissions', 'Status'],
  },
  Teams: {
    title: 'Teams',
    description: 'Team structure and lead assignments.',
    columns: ['Team', 'Lead', 'Recruiters', 'Open Positions'],
  },
  'Email Center': {
    title: 'Email Center',
    description: 'Bulk and transactional email communication.',
    actions: ['Compose Email', 'Use Template'],
    columns: ['Subject', 'Recipients', 'Status', 'Sent At'],
  },
  'Activity Logs': {
    title: 'Activity Logs',
    description: 'Daily operational activity across your region.',
    columns: ['Time', 'User', 'Activity', 'Details'],
  },
  Performance: {
    title: 'Recruiter Performance',
    description: 'Individual productivity metrics and rankings.',
    columns: ['Recruiter', 'Submissions', 'Interviews', 'Placements', 'Conversion'],
  },
  Targets: {
    title: 'Target Tracking',
    description: 'Daily and weekly hiring targets vs actuals.',
    columns: ['Metric', 'Target', 'Actual', 'Variance'],
  },
  'Candidate Search': {
    title: 'Candidate Search',
    description: 'Search internal database and external sources.',
    actions: ['Advanced Search', 'Save Filter'],
    columns: ['Candidate', 'Skills', 'Location', 'Availability', 'Match'],
  },
  'AI Match': {
    title: 'AI Candidate Match',
    description: 'AI-suggested candidates for active requirements.',
    actions: ['Refresh Suggestions'],
    columns: ['Requirement', 'Candidate', 'Match Score', 'Reason'],
  },
  Pipeline: {
    title: 'Candidate Pipeline',
    description: 'Track candidates through sourcing to submission.',
    columns: ['Candidate', 'Stage', 'Requirement', 'Last Action', 'Owner'],
  },
  'Follow-ups': {
    title: 'Follow-up Tracker',
    description: 'Pending calls, follow-ups, and call notes.',
    actions: ['Add Follow-up', 'Log Call'],
    columns: ['Candidate', 'Type', 'Due', 'Priority', 'Status'],
  },
  Analytics: {
    title: 'Hiring Progress Analytics',
    description: 'Positions filled, open, and pipeline conversion for your account.',
    columns: ['Requirement', 'Open', 'Filled', 'In Interview', 'Offers'],
  },
  Invoices: {
    title: 'Invoices',
    description: 'Billing and payment status.',
    columns: ['Invoice #', 'Period', 'Amount', 'Status', 'Due Date'],
  },
  Contacts: {
    title: 'Company Contacts',
    description: 'Your hiring managers and TalentFlow account team.',
    columns: ['Name', 'Role', 'Email', 'Phone'],
  },
  Notifications: {
    title: 'Notifications',
    description: 'Alerts, SLA breaches, and system updates.',
    columns: ['Type', 'Message', 'Time', 'Read'],
  },
  'AI Assistant': {
    title: 'AI Assistant',
    description: 'Ask questions about requirements, candidates, and pipeline.',
    actions: ['New Conversation'],
    columns: ['Query', 'Response Preview', 'Time'],
  },
  'My Profile': {
    title: 'My Profile',
    description: 'Manage your recruiter profile and login details',
  },
  Calendar: {
    title: 'Calendar',
    description: 'Interviews, follow-ups, and team events.',
    columns: ['Event', 'Date', 'Time', 'Type'],
  },
  Documents: {
    title: 'Documents',
    description: 'Resumes, JDs, offer letters, and agreements.',
    columns: ['Document', 'Type', 'Uploaded', 'Owner'],
  },
}
