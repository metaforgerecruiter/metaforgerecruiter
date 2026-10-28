export interface UserAccountData {
  id: string
  name: string
  email: string
  phone: string
  employeeId: string
  role: 'Super Admin' | 'Admin' | 'Team Lead' | 'Recruiter' | 'Client Reviewer' | 'Dev Team'
  roleCode: string
  team: string
  supervisor: string
  assignedClient?: string
  status: 'Active' | 'Locked' | 'Pending Invite'
  twoFactorEnabled: boolean
  lastLogin: string
  lastPasswordChange: string
}

export interface DeletedUserData extends UserAccountData {
  deletedAt: string
  deletedBy?: string
}

export interface RecruiterUserPermissionData {
  id: string
  name: string
  email: string
  roleName: string
  roleCode: string
  team: string
  avatar: string
  assignedClient?: string
  status: 'Active' | 'Inactive'
  permissions: {
    addCandidates: boolean
    submitToClients: boolean
    scheduleInterviews: boolean
    exportReportsCsv: boolean
    viewTeamAnalytics: boolean
    deleteRecords: boolean
    reassignRequirements: boolean
  }
}

export interface PermissionGroup {
  module: string
  permissions: {
    key: string
    label: string
    enabled: boolean
  }[]
}

export interface EnterpriseRoleData {
  id: string
  name: string
  code: string
  description: string
  userCount: number
  isSystem: boolean
  lastUpdated: string
  permissions: Record<string, boolean>
}
