import React from 'react'
import { Panel, DataTable } from '../wireframe/WireframeKit'
import { Admin, Lead, Recruiter } from '../../types'

export function DevTeamDashboardAdminPanel({
  admins = [],
  leads = [],
  recruiters = [],
}: {
  admins?: Admin[]
  leads?: Lead[]
  recruiters?: Recruiter[]
}) {
  const rows = [
    ...admins.map(a => [a.name, 'Admin', `${leads.length} Leads`, `${recruiters.length} Recruiters`, '—', '—', 'Active']),
    ...leads.map(l => [
      l.name,
      'Team Lead',
      (l.clientAccounts || []).join(', ') || '—',
      `${l.recruiters} Recruiters`,
      String(recruiters.filter(r => r.lead === l.name).reduce((n, r) => n + (r.requirementsCount || 0), 0)),
      String(l.submissions),
      'Active',
    ]),
  ]
  return (
    <Panel title="Platform Administrative Overview">
      {rows.length ? (
        <DataTable
          columns={['Admin / Lead', 'Role', 'Clients', 'Recruiters', 'Assigned Reqs', 'Submissions', 'Status']}
          rows={rows}
        />
      ) : (
        <p className="text-sm text-slate-500">No admins or leads yet.</p>
      )}
    </Panel>
  )
}
