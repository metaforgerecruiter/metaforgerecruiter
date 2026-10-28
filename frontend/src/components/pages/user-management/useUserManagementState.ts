import { useState, useMemo, useEffect } from 'react'
import { Role } from '../../../types'
import type {
  UserAccountData,
  DeletedUserData,
  RecruiterUserPermissionData,
  EnterpriseRoleData,
} from './types'
import { usersService, rolesService } from '../../../services/workspace.service'
import { apiErrorMessage, mapApiRoles, mapApiUsers } from './userApi'

export function useUserManagementState(
  role: Role = 'superadmin',
  initialTab: 'users' | 'permissions' | 'role_definitions' = 'users',
) {
  const canModifyUsers = role === 'superadmin' || role === 'devteam'
  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'role_definitions'>(initialTab)

  const [users, setUsers] = useState<UserAccountData[]>([])
  const [roles, setRoles] = useState<EnterpriseRoleData[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [recruiterUsers, setRecruiterUsers] = useState<RecruiterUserPermissionData[]>([])

  const [viewMode, setViewMode] = useState<'list' | 'create_user' | 'reset_password' | 'assign_role' | 'create_role' | 'configure_permissions'>('list')
  const [selectedUser, setSelectedUser] = useState<UserAccountData | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')

  // Create User Form State
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPhone, setNewUserPhone] = useState('')
  const [newUserEmpId, setNewUserEmpId] = useState('')
  const [newUserRole, setNewUserRole] = useState<'Super Admin' | 'Admin' | 'Team Lead' | 'Recruiter' | 'Dev Team'>('Recruiter')
  const [newUserTeam, setNewUserTeam] = useState('Engineering Team')
  const [newUserSupervisor, setNewUserSupervisor] = useState('')
  const [newUserClient, setNewUserClient] = useState('Accenture')
  const [tempPassword, setTempPassword] = useState('')

  // Reset Password State
  const [resetNewPass, setResetNewPass] = useState('')
  const [resetConfirmPass, setResetConfirmPass] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [forceChangePass, setForceChangePass] = useState(true)
  const [sendEmailNotify, setSendEmailNotify] = useState(true)

  // Assign Role & Adjust Client State
  const [targetRole, setTargetRole] = useState<'Super Admin' | 'Admin' | 'Team Lead' | 'Recruiter' | 'Client Reviewer' | 'Dev Team'>('Recruiter')
  const [targetClient, setTargetClient] = useState<string>('Accenture')
  const [reassignReason, setReassignReason] = useState('')
  const [adjustClientUser, setAdjustClientUser] = useState<UserAccountData | null>(null)

  // Manage Recruiter Individual Permission Modal State
  const [selectedUserForManage, setSelectedUserForManage] = useState<RecruiterUserPermissionData | null>(null)
  const [tempUserPermissions, setTempUserPermissions] = useState<RecruiterUserPermissionData['permissions']>({
    addCandidates: true,
    submitToClients: true,
    scheduleInterviews: true,
    exportReportsCsv: false,
    viewTeamAnalytics: false,
    deleteRecords: false,
    reassignRequirements: false,
  })
  const [tempUserRoleName, setTempUserRoleName] = useState('')

  // Create Role Form State
  const [newRoleName, setNewRoleName] = useState('')
  const [newRoleDescription, setNewRoleDescription] = useState('')
  const [newRoleTemplate, setNewRoleTemplate] = useState('recruiter')
  const [newPermissions, setNewPermissions] = useState<Record<string, boolean>>({
    cand_search: true, cand_add: true, sub_create: true, sub_move_stage: true,
    int_schedule: true, int_join_links: true, int_feedback: true,
  })

  useEffect(() => {
    const templates: Record<string, string[]> = {
      recruiter: ['cand_search', 'cand_add', 'sub_create', 'sub_move_stage', 'int_schedule', 'int_join_links', 'int_feedback'],
      lead: ['req_view_all', 'req_assign', 'cand_search', 'cand_add', 'cand_export', 'sub_create', 'sub_view_all', 'sub_reassign', 'sub_move_stage', 'int_schedule', 'int_join_links', 'int_feedback', 'rep_view_recruiter'],
      admin: ['req_view_all', 'req_create', 'req_edit', 'req_assign', 'cand_search', 'cand_add', 'cand_export', 'sub_create', 'sub_view_all', 'sub_reassign', 'sub_move_stage', 'int_schedule', 'int_join_links', 'int_feedback', 'int_cancel', 'rep_view_exec', 'rep_view_recruiter', 'user_manage'],
    }
    const keys = templates[newRoleTemplate] || templates.recruiter
    const nextPerms: Record<string, boolean> = {}
    keys.forEach(k => { nextPerms[k] = true })
    setNewPermissions(nextPerms)
  }, [newRoleTemplate])

  // Full-Page Configure Role Permissions State
  const [editingRole, setEditingRole] = useState<EnterpriseRoleData | null>(null)
  const [tempRolePermissions, setTempRolePermissions] = useState<Record<string, boolean>>({})

  const [deletedUsers, setDeletedUsers] = useState<DeletedUserData[]>([])
  const [userSubTab, setUserSubTab] = useState<'active' | 'deleted'>('active')

  // Two-Step Delete Verification State
  const [userToDeleteConfirm, setUserToDeleteConfirm] = useState<UserAccountData | null>(null)
  const [deleteConfirmCheck, setDeleteConfirmCheck] = useState(false)
  const [userToPermanentDeleteConfirm, setUserToPermanentDeleteConfirm] = useState<DeletedUserData | null>(null)
  const [permanentDeleteCheck, setPermanentDeleteCheck] = useState(false)

  const [undoToast, setUndoToast] = useState<{ msg: string; userToRestore: UserAccountData } | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setUndoToast(null)
    setTimeout(() => setToastMsg(null), 5000)
  }

  const reloadUsers = async () => {
    const rows = await usersService.list()
    const mapped = mapApiUsers(rows)
    setUsers(mapped.users)
    setRecruiterUsers(mapped.recruiters)
  }

  const reloadRoles = async () => {
    const payload = await rolesService.permissions()
    setRoles(mapApiRoles(payload))
  }

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  useEffect(() => {
    let cancelled = false
    reloadUsers().catch(err => {
      if (!cancelled) showToast(apiErrorMessage(err))
    })
    reloadRoles().catch(err => {
      if (!cancelled) showToast(apiErrorMessage(err))
    })
    return () => {
      cancelled = true
    }
  }, [])

  const showToastWithUndo = (msg: string, userToRestore: UserAccountData) => {
    setUndoToast({ msg, userToRestore })
    setToastMsg(null)
    setTimeout(() => setUndoToast(null), 7000)
  }

  // Filtered Users for Tab 1
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'All Roles' && u.role !== roleFilter && u.roleCode !== roleFilter.toLowerCase()) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.employeeId.toLowerCase().includes(q) ||
          u.team.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [users, searchQuery, roleFilter])

  // Filtered Recruiter Matrix Users for Tab 2
  const filteredRecruiterUsers = useMemo(() => {
    return recruiterUsers.filter(u => {
      if (searchQuery.trim() && !u.name.toLowerCase().includes(searchQuery.toLowerCase()) && !u.email.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (roleFilter !== 'All Roles' && u.roleName !== roleFilter && u.roleCode !== roleFilter.toLowerCase()) {
        return false
      }
      return true
    })
  }, [recruiterUsers, searchQuery, roleFilter])

  return {
    role, canModifyUsers,
    activeTab, setActiveTab,
    users, setUsers, roles, setRoles, recruiterUsers, setRecruiterUsers, isSaving, setIsSaving,
    reloadUsers, reloadRoles,
    viewMode, setViewMode, selectedUser, setSelectedUser,
    searchQuery, setSearchQuery, roleFilter, setRoleFilter,
    newUserName, setNewUserName, newUserEmail, setNewUserEmail, newUserPhone, setNewUserPhone,
    newUserEmpId, setNewUserEmpId, newUserRole, setNewUserRole, newUserTeam, setNewUserTeam,
    newUserSupervisor, setNewUserSupervisor, newUserClient, setNewUserClient, tempPassword, setTempPassword,
    resetNewPass, setResetNewPass, resetConfirmPass, setResetConfirmPass, showPassword, setShowPassword,
    forceChangePass, setForceChangePass, sendEmailNotify, setSendEmailNotify,
    targetRole, setTargetRole, targetClient, setTargetClient, reassignReason, setReassignReason,
    adjustClientUser, setAdjustClientUser,
    selectedUserForManage, setSelectedUserForManage, tempUserPermissions, setTempUserPermissions, tempUserRoleName, setTempUserRoleName,
    newRoleName, setNewRoleName, newRoleDescription, setNewRoleDescription, newRoleTemplate, setNewRoleTemplate, newPermissions, setNewPermissions,
    editingRole, setEditingRole, tempRolePermissions, setTempRolePermissions,
    deletedUsers, setDeletedUsers, userSubTab, setUserSubTab,
    userToDeleteConfirm, setUserToDeleteConfirm, deleteConfirmCheck, setDeleteConfirmCheck,
    userToPermanentDeleteConfirm, setUserToPermanentDeleteConfirm, permanentDeleteCheck, setPermanentDeleteCheck,
    undoToast, setUndoToast, toastMsg, setToastMsg,
    showToast, showToastWithUndo, filteredUsers, filteredRecruiterUsers,
  }
}

export type UserManagementState = ReturnType<typeof useUserManagementState>
