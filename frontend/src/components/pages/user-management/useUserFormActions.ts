import React from 'react'
import { usersService, rolesService } from '../../../services/workspace.service'
import { apiErrorMessage, enabledPermissionKeys, roleCodeForLabel } from './userApi'
import type { UserManagementState } from './useUserManagementState'

export function useUserFormActions(s: UserManagementState) {
  const {
    canModifyUsers, setViewMode,
    selectedUser, setSelectedUser, newUserName, setNewUserName,
    newUserEmail, setNewUserEmail, newUserPhone, setNewUserPhone,
    newUserEmpId, setNewUserEmpId, newUserRole, tempPassword,
    resetNewPass, resetConfirmPass, targetRole,
    newRoleName, setNewRoleName, newRoleDescription,
    setNewRoleDescription, newPermissions, editingRole, setEditingRole,
    tempRolePermissions, showToast, isSaving, setIsSaving, reloadUsers, reloadRoles,
  } = s

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return
    if (!canModifyUsers) {
      showToast('Access Restricted: Admin has view-only permissions.')
      setViewMode('list')
      return
    }
    if (!newUserName.trim()) {
      showToast('Name is required')
      return
    }
    if (!newUserEmail.trim()) {
      showToast('Email is required')
      return
    }
    if (!tempPassword || tempPassword.length < 8) {
      showToast('Password must be at least 8 characters long')
      return
    }

    setIsSaving(true)
    try {
      await usersService.create({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: tempPassword,
        role: roleCodeForLabel(newUserRole),
        ...(newUserPhone.trim() ? { phone: newUserPhone.trim() } : {}),
      })
      await reloadUsers()
      setViewMode('list')
      showToast(`Created user account for ${newUserName.trim()}`)
      setNewUserName('')
      setNewUserEmail('')
      setNewUserPhone('')
      setNewUserEmpId('')
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Reset Password Submit
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return
    if (!selectedUser || !resetNewPass) return
    if (resetNewPass.length < 8) {
      showToast('Password must be at least 8 characters long')
      return
    }
    if (resetConfirmPass && resetNewPass !== resetConfirmPass) {
      showToast('Passwords do not match')
      return
    }

    setIsSaving(true)
    try {
      await usersService.update(selectedUser.id, { password: resetNewPass })
      await reloadUsers()
      setViewMode('list')
      showToast(`Password updated for ${selectedUser.name}`)
      setSelectedUser(null)
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Assign Role & Adjust Client Submit
  const handleAssignRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving || !selectedUser) return

    setIsSaving(true)
    try {
      await usersService.update(selectedUser.id, { role: roleCodeForLabel(targetRole) })
      await reloadUsers()
      setViewMode('list')
      showToast(`Updated role to "${targetRole}" for ${selectedUser.name}`)
      setSelectedUser(null)
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Create Role Form Submit
  const handleCreateRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSaving) return
    if (!newRoleName.trim()) {
      showToast('Role name is required')
      return
    }

    const roleCode = newRoleName.trim().toLowerCase().replace(/\s+/g, '_')
    setIsSaving(true)
    try {
      await rolesService.updatePermissions({
        roleCode,
        permissions: enabledPermissionKeys(newPermissions),
      })
      await reloadRoles()
      setViewMode('list')
      showToast(`Saved role "${newRoleName.trim()}"`)
      setNewRoleName('')
      setNewRoleDescription('')
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveRolePermissions = async () => {
    if (isSaving || !editingRole) return
    const roleCode = editingRole.code || editingRole.id
    setIsSaving(true)
    try {
      await rolesService.updatePermissions({
        roleCode,
        permissions: enabledPermissionKeys(tempRolePermissions),
      })
      await reloadRoles()
      setViewMode('list')
      showToast(`Role permissions updated for ${editingRole.name}`)
      setEditingRole(null)
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return {
    handleCreateUserSubmit,
    handleResetPasswordSubmit,
    handleAssignRoleSubmit,
    handleCreateRoleSubmit,
    handleSaveRolePermissions,
  }
}
