import { usersService } from '../../../services/workspace.service'
import { apiErrorMessage, capabilityPayload } from './userApi'
import type { UserAccountData, RecruiterUserPermissionData } from './types'
import type { UserManagementState } from './useUserManagementState'

export function useUserAccessActions(s: UserManagementState) {
  const {
    canModifyUsers, recruiterUsers,
    setViewMode, setSelectedUser, setResetNewPass, setResetConfirmPass,
    setTargetRole, setTargetClient, setReassignReason, setAdjustClientUser,
    selectedUserForManage, setSelectedUserForManage, tempUserPermissions, setTempUserPermissions,
    tempUserRoleName, setTempUserRoleName, showToast, isSaving, setIsSaving, reloadUsers,
  } = s

  const openAdjustClientModal = (user: UserAccountData) => {
    if (!canModifyUsers) {
      showToast('Access Restricted: Only Super Admin and Dev Team can adjust client assignments.')
      return
    }
    setAdjustClientUser(user)
    setTargetClient(user.assignedClient || 'Accenture')
  }

  // Open Reset Password Page
  const openResetPasswordPage = (user: UserAccountData) => {
    if (!canModifyUsers) {
      showToast('Access Restricted: Only Super Admin and Dev Team can reset user passwords.')
      return
    }
    setSelectedUser(user)
    setResetNewPass('Pass@' + Math.floor(1000 + Math.random() * 9000))
    setResetConfirmPass('')
    setViewMode('reset_password')
  }

  // Open Assign Role Page
  const openAssignRolePage = (user: UserAccountData) => {
    if (!canModifyUsers) {
      showToast('Access Restricted: Only Super Admin and Dev Team can edit or reassign user roles.')
      return
    }
    setSelectedUser(user)
    setTargetRole(user.role)
    setTargetClient(user.assignedClient || 'Accenture')
    setReassignReason('')
    setViewMode('assign_role')
  }

  // Open Manage Individual Permissions Modal for a user
  const openManageUserPermissionsModal = (user: UserAccountData | RecruiterUserPermissionData) => {
    if (!canModifyUsers) {
      showToast('Access Restricted: Only Super Admin can modify individual user permission capabilities.')
      return
    }
    const existing = recruiterUsers.find(r => r.email === user.email || r.name === user.name)
    if (existing) {
      setSelectedUserForManage(existing)
      setTempUserPermissions({ ...existing.permissions })
      setTempUserRoleName(existing.roleName)
    } else {
      const blank: RecruiterUserPermissionData = {
        id: user.id,
        name: user.name,
        email: user.email,
        roleName: (user as UserAccountData).role || 'Recruiter',
        roleCode: (user as UserAccountData).roleCode || 'recruiter',
        team: (user as UserAccountData).team || '',
        avatar: user.name.charAt(0),
        status: 'Active',
        permissions: {
          addCandidates: false,
          submitToClients: false,
          scheduleInterviews: false,
          exportReportsCsv: false,
          viewTeamAnalytics: false,
          deleteRecords: false,
          reassignRequirements: false,
        },
      }
      setSelectedUserForManage(blank)
      setTempUserPermissions(blank.permissions)
      setTempUserRoleName(blank.roleName)
    }
  }

  // Save Recruiter Individual Permissions
  const handleSaveUserPermissions = async () => {
    if (isSaving || !selectedUserForManage) return
    setIsSaving(true)
    try {
      await usersService.update(selectedUserForManage.id, {
        capabilities: capabilityPayload(tempUserPermissions),
      })
      await reloadUsers()
      showToast(`Permissions updated for ${selectedUserForManage.name}`)
      setSelectedUserForManage(null)
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return {
    openAdjustClientModal,
    openResetPasswordPage,
    openAssignRolePage,
    openManageUserPermissionsModal,
    handleSaveUserPermissions,
  }
}
