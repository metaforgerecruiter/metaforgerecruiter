import { ApiError } from '../../../lib/api'
import type { EnterpriseRoleData, RecruiterUserPermissionData, UserAccountData } from './types'

const ROLE_LABEL: Record<string, UserAccountData['role']> = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  lead: 'Team Lead',
  recruiter: 'Recruiter',
  client: 'Client Reviewer',
  devteam: 'Dev Team',
}

const ROLE_CODE: Record<string, string> = {
  'Super Admin': 'superadmin',
  Admin: 'admin',
  'Team Lead': 'lead',
  Recruiter: 'recruiter',
  'Client Reviewer': 'client',
  'Dev Team': 'devteam',
}

const CAPABILITY_KEYS = [
  'addCandidates',
  'submitToClients',
  'scheduleInterviews',
  'exportReportsCsv',
  'viewTeamAnalytics',
  'deleteRecords',
  'reassignRequirements',
] as const

export function roleCodeForLabel(label: string): string {
  return ROLE_CODE[label] || label.trim().toLowerCase().replace(/\s+/g, '_')
}

export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Your session expired. Sign in again.'
    return err.message || 'Could not save changes'
  }
  if (err instanceof Error && err.message) return err.message
  return 'Unable to reach the API. Confirm you are signed in and the backend is running.'
}

function capabilitiesOf(user: any): RecruiterUserPermissionData['permissions'] {
  const caps = user?.capabilities && typeof user.capabilities === 'object' ? user.capabilities : {}
  const role = String(user?.role || '').toLowerCase()
  const isSuperOrAdmin = role === 'superadmin' || role === 'admin'
  const isLead = role === 'lead' || role === 'team lead'

  return {
    addCandidates: caps.addCandidates !== undefined ? !!caps.addCandidates : role !== 'client',
    submitToClients: caps.submitToClients !== undefined ? !!caps.submitToClients : role !== 'client',
    scheduleInterviews: caps.scheduleInterviews !== undefined ? !!caps.scheduleInterviews : role !== 'client',
    exportReportsCsv: caps.exportReportsCsv !== undefined ? !!caps.exportReportsCsv : (isSuperOrAdmin || isLead),
    viewTeamAnalytics: caps.viewTeamAnalytics !== undefined ? !!caps.viewTeamAnalytics : (isSuperOrAdmin || isLead),
    deleteRecords: caps.deleteRecords !== undefined ? !!caps.deleteRecords : isSuperOrAdmin,
    reassignRequirements: caps.reassignRequirements !== undefined ? !!caps.reassignRequirements : (isSuperOrAdmin || isLead),
  }
}

export function mapApiUser(user: any): UserAccountData {
  const roleCode = String(user?.role || 'recruiter').toLowerCase()
  return {
    id: user?.userId || user?.id || '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    employeeId: user?.userId || '',
    role: ROLE_LABEL[roleCode] || 'Recruiter',
    roleCode,
    team: user?.team || '',
    supervisor: user?.supervisor || '',
    status: user?.active === false ? 'Locked' : 'Active',
    twoFactorEnabled: false,
    lastLogin: user?.lastLoginAt ? String(user.lastLoginAt) : '',
    lastPasswordChange: '',
  }
}

export function mapApiUsers(payload: any): { users: UserAccountData[]; recruiters: RecruiterUserPermissionData[] } {
  const list = Array.isArray(payload) ? payload : payload?.items || payload?.users || []
  const users = list.map(mapApiUser)
  const recruiters = list
    .map((user: any): RecruiterUserPermissionData => {
      const mapped = mapApiUser(user)
      return {
        id: mapped.id,
        name: mapped.name,
        email: mapped.email,
        roleName: mapped.role,
        roleCode: mapped.roleCode,
        team: mapped.team,
        avatar: mapped.name.charAt(0).toUpperCase() || 'U',
        status: mapped.status === 'Active' ? 'Active' : 'Inactive',
        permissions: capabilitiesOf(user),
      }
    })
  return { users, recruiters }
}

export function mapApiRoles(payload: any): EnterpriseRoleData[] {
  const list = Array.isArray(payload) ? payload : payload?.roles || payload?.items || []
  return list.map((role: any, index: number) => {
    const permissions: Record<string, boolean> = {}
    if (Array.isArray(role?.permissions)) {
      role.permissions.forEach((key: string) => {
        permissions[key] = true
      })
    } else if (role?.permissions && typeof role.permissions === 'object') {
      Object.assign(permissions, role.permissions)
    }
    return {
      id: role?.roleCode || String(index),
      name: role?.roleName || role?.roleCode || 'Role',
      code: role?.roleCode || '',
      description: role?.roleName || '',
      userCount: 0,
      isSystem: !!ROLE_LABEL[String(role?.roleCode || '').toLowerCase()],
      lastUpdated: '',
      permissions,
    }
  })
}

export function enabledPermissionKeys(permissions: Record<string, boolean>): string[] {
  return Object.entries(permissions)
    .filter(([, enabled]) => enabled)
    .map(([key]) => key)
}

export function capabilityPayload(permissions: RecruiterUserPermissionData['permissions']): Record<string, boolean> {
  const body: Record<string, boolean> = {}
  for (const key of CAPABILITY_KEYS) body[key] = !!permissions[key]
  return body
}
