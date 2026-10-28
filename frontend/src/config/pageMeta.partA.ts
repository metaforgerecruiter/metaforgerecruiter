import { PageMeta } from './navigation.types'

export const PAGE_META_A: Record<string, PageMeta> = {
  Organization: {
    title: 'Organization',
    description: 'Company details, branches, departments, and teams.',
    actions: ['Edit Company', 'Add Branch', 'Add Department'],
    columns: ['Name', 'Type', 'Location', 'Headcount', 'Status'],
  },
  'My Team': {
    title: 'My Team',
    description: 'Overview of team members and working client account assignments.',
    actions: ['View Performance', 'Assign Requirements'],
    columns: ['Recruiter Name', 'Role', 'Working Client Accounts', 'Active Reqs', 'Submissions', 'Actions'],
  },
  Users: {
    title: 'User Management',
    description: 'Create, edit, disable users. Assign roles and teams.',
    actions: ['Create User', 'Reset Password', 'Assign Role'],
    columns: ['Name', 'Email', 'Role', 'Team', 'Status', 'Last Login'],
  },
  Roles: {
    title: 'Roles & Permissions',
    description: 'Module access, feature access, and approval workflows.',
    actions: ['Create Role', 'Edit Permissions'],
    columns: ['Role', 'Users', 'Modules', 'Last Updated'],
  },
  Clients: {
    title: 'Client Management',
    description: 'Clients, contacts, agreements, and active contracts.',
    actions: ['Add Client', 'View Agreements'],
    columns: ['Client', 'Contacts', 'Active Reqs', 'Contract Status', 'Revenue MTD'],
  },
  Candidates: {
    title: 'Candidate Database',
    description: 'Master repository with duplicate detection, resume parsing, and AI match scores.',
    actions: ['Upload Resume', 'Run Duplicate Check', 'AI Rank'],
    columns: ['Candidate', 'Skills', 'Experience', 'Match Score', 'Duplicates', 'Last Activity'],
  },
  Offers: {
    title: 'Offers & Placements',
    description: 'Offer negotiation, joining status, placements, and billing.',
    actions: ['Create Offer', 'Track Joining'],
    columns: ['Candidate', 'Client', 'Offer Amount', 'Status', 'Joining Date'],
  },
  'AI Center': {
    title: 'AI Center',
    description: 'JD intelligence, resume intelligence, duplicate detection, candidate ranking, and recommendations.',
    actions: ['Analyze JD', 'Parse Resumes', 'View Recommendations'],
    columns: ['AI Module', 'Runs Today', 'Accuracy', 'Time Saved'],
  },
  Integrations: {
    title: 'Integrations',
    description: 'Naukri, LinkedIn, Email, WhatsApp, SMS, Outlook, Google Calendar.',
    columns: ['Integration', 'Status', 'Last Sync'],
  },
  Settings: {
    title: 'System Settings',
    description: 'Email templates, SMS templates, and notification settings.',
    actions: ['Edit Templates', 'Notification Rules'],
    columns: ['Setting', 'Category', 'Last Modified'],
  },
  'Audit Logs': {
    title: 'Audit Logs',
    description: 'System-wide activity and compliance audit trail.',
    columns: ['Timestamp', 'User', 'Action', 'Module', 'IP'],
  },
}
