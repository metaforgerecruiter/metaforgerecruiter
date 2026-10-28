import { Role } from '../types'
import { NavSection } from './navigation.types'

export const ROLE_NAV: Record<Role, NavSection[]> = {
  superadmin: [
    {
      title: 'Overview',
      items: [
        { key: 'Requirements', label: 'Requirements' },
        { key: 'Candidates', label: 'Add Candidates' },
      ],
    },
    {
      title: 'Organization',
      items: [
        { key: 'Users', label: 'User Management' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { key: 'Clients', label: 'Clients' },
      ],
    },
    {
      title: 'Intelligence & System',
      items: [
        { key: 'Reports', label: 'Reports' },
        { key: 'Audit Logs', label: 'Audit Logs' },
      ],
    },
  ],
  admin: [
    {
      title: 'Overview',
      items: [
        { key: 'Requirements', label: 'Requirements' },
        { key: 'Candidates', label: 'Add Candidates' },
      ],
    },
    {
      title: 'Organization',
      items: [
        { key: 'Users', label: 'User Management' },
      ],
    },
    {
      title: 'Operations',
      items: [
        { key: 'Clients', label: 'Clients' },
      ],
    },
    {
      title: 'Tools & System',
      items: [
        { key: 'Reports', label: 'Reports' },
        { key: 'Audit Logs', label: 'Audit Logs' },
      ],
    },
  ],
  lead: [
    {
      title: 'Overview',
      items: [
        { key: 'Requirements', label: 'Requirements' },
        { key: 'Dashboard', label: 'My Workspace' },
        { key: 'Candidates', label: 'Add Candidates' },
        { key: 'Reports', label: 'Reports' },
      ],
    },
  ],
  recruiter: [
    {
      title: 'Main',
      items: [
        { key: 'Dashboard', label: 'My Work' },
        { key: 'Requirements', label: 'Requirements' },
        { key: 'Candidates', label: 'Add Candidate' },
        { key: 'Reports', label: 'Reports' },
      ],
    },
  ],
  devteam: [
    {
      title: 'Overview',
      items: [
        { key: 'Requirements', label: 'Requirements' },
        { key: 'Candidates', label: 'Add Candidates' },
      ],
    },
    {
      title: 'Organization',
      items: [
        { key: 'Users', label: 'User Management' },
      ],
    },

    {
      title: 'Operations',
      items: [
        { key: 'Clients', label: 'Clients' },
      ],
    },
    {
      title: 'Intelligence',
      items: [
        { key: 'Reports', label: 'Reports' },
        { key: 'History', label: 'History' },
      ],
    },
    {
      title: 'System',
      items: [
        { key: 'Audit Logs', label: 'Audit Logs' },
      ],
    },
  ],
  client: [
    {
      title: 'Overview',
      items: [
        { key: 'Requirements', label: 'My Requirements' },
        { key: 'Reports', label: 'Reports' },
      ],
    },
  ],
}
