import { PermissionGroup, EnterpriseRoleData } from './types'

export const DEFAULT_MODULE_PERMISSIONS: PermissionGroup[] = [
  {
    module: 'Requirements Management',
    permissions: [
      { key: 'req_view_all', label: 'View Organization Requirements', enabled: true },
      { key: 'req_create', label: 'Create New Job Requirements', enabled: true },
      { key: 'req_edit', label: 'Edit Job Details & Budgets', enabled: true },
      { key: 'req_assign', label: 'Assign Recruiters to Requirements', enabled: true },
      { key: 'req_delete', label: 'Delete Requirements', enabled: false },
    ],
  },
  {
    module: 'Candidates & Repository',
    permissions: [
      { key: 'cand_search', label: 'Search Candidate Repository', enabled: true },
      { key: 'cand_add', label: 'Add New Candidate Profiles', enabled: true },
      { key: 'cand_export', label: 'Export Resumes & Contact Details', enabled: true },
      { key: 'cand_delete', label: 'Remove Candidates', enabled: false },
    ],
  },
  {
    module: 'Submissions & Pipeline',
    permissions: [
      { key: 'sub_create', label: 'Submit Candidates to Client', enabled: true },
      { key: 'sub_view_all', label: 'View All Team Submissions', enabled: true },
      { key: 'sub_reassign', label: 'Reassign Candidates Between Recruiters', enabled: true },
      { key: 'sub_move_stage', label: 'Update Candidate Stage Status', enabled: true },
    ],
  },
  {
    module: 'Interviews & Scheduling',
    permissions: [
      { key: 'int_schedule', label: 'Schedule Candidate Interviews', enabled: true },
      { key: 'int_join_links', label: 'Access Meeting & Video Links', enabled: true },
      { key: 'int_feedback', label: 'Submit Interview Feedback', enabled: true },
      { key: 'int_cancel', label: 'Cancel & Reschedule Slots', enabled: true },
    ],
  },
  {
    module: 'Reports & Analytics',
    permissions: [
      { key: 'rep_view_exec', label: 'View Executive Level Analytics', enabled: true },
      { key: 'rep_view_recruiter', label: 'View Individual Recruiter Benchmarks', enabled: true },
      { key: 'rep_export_csv', label: 'Export Reports to Excel / CSV', enabled: true },
    ],
  },
  {
    module: 'System & User Management',
    permissions: [
      { key: 'user_manage', label: 'Manage User Accounts & Roles', enabled: false },
      { key: 'role_manage', label: 'Modify System Roles & Access Matrix', enabled: false },
      { key: 'activity_logs', label: 'Access Security Audit Trail', enabled: false },
    ],
  },
]

export const INITIAL_ROLES: EnterpriseRoleData[] = [
  {
    id: 'role-1',
    name: 'Super Admin',
    code: 'superadmin',
    description: 'Complete unrestricted access across all organizational modules, system settings, billing, and user governance.',
    userCount: 3,
    isSystem: true,
    lastUpdated: '—',
    permissions: {
      req_view_all: true, req_create: true, req_edit: true, req_assign: true, req_delete: true,
      cand_search: true, cand_add: true, cand_export: true, cand_delete: true,
      sub_create: true, sub_view_all: true, sub_reassign: true, sub_move_stage: true,
      int_schedule: true, int_join_links: true, int_feedback: true, int_cancel: true,
      rep_view_exec: true, rep_view_recruiter: true, rep_export_csv: true,
      user_manage: true, role_manage: true, activity_logs: true,
    },
  },
  {
    id: 'role-2',
    name: 'Admin',
    code: 'admin',
    description: 'Full operational control over hiring teams, requirement assignments, candidate flow, and performance reports.',
    userCount: 8,
    isSystem: true,
    lastUpdated: '—',
    permissions: {
      req_view_all: true, req_create: true, req_edit: true, req_assign: true, req_delete: false,
      cand_search: true, cand_add: true, cand_export: true, cand_delete: false,
      sub_create: true, sub_view_all: true, sub_reassign: true, sub_move_stage: true,
      int_schedule: true, int_join_links: true, int_feedback: true, int_cancel: true,
      rep_view_exec: true, rep_view_recruiter: true, rep_export_csv: false,
      user_manage: true, role_manage: false, activity_logs: false,
    },
  },
  {
    id: 'role-3',
    name: 'Team Lead',
    code: 'lead',
    description: 'Supervises assigned recruiter team, monitors daily submission targets, and manages interview scheduling.',
    userCount: 14,
    isSystem: true,
    lastUpdated: '—',
    permissions: {
      req_view_all: true, req_create: false, req_edit: false, req_assign: true, req_delete: false,
      cand_search: true, cand_add: true, cand_export: true, cand_delete: false,
      sub_create: true, sub_view_all: true, sub_reassign: true, sub_move_stage: true,
      int_schedule: true, int_join_links: true, int_feedback: true, int_cancel: true,
      rep_view_exec: false, rep_view_recruiter: true, rep_export_csv: false,
      user_manage: false, role_manage: false, activity_logs: false,
    },
  },
  {
    id: 'role-4',
    name: 'Recruiter',
    code: 'recruiter',
    description: 'Individual recruiter focused on sourcing candidates, submitting to requirements, and tracking scheduled slots.',
    userCount: 48,
    isSystem: true,
    lastUpdated: '—',
    permissions: {
      req_view_all: false, req_create: false, req_edit: false, req_assign: false, req_delete: false,
      cand_search: true, cand_add: true, cand_export: false, cand_delete: false,
      sub_create: true, sub_view_all: false, sub_reassign: false, sub_move_stage: true,
      int_schedule: true, int_join_links: true, int_feedback: true, int_cancel: false,
      rep_view_exec: false, rep_view_recruiter: false, rep_export_csv: false,
      user_manage: false, role_manage: false, activity_logs: false,
    },
  },
]
