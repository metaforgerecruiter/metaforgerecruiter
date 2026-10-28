import { usersService } from '../../../services/workspace.service'
import { apiErrorMessage } from './userApi'
import type { UserAccountData, DeletedUserData } from './types'
import type { UserManagementState } from './useUserManagementState'

export function useUserDeleteActions(s: UserManagementState) {
  const {
    canModifyUsers, users, setUsers, setRecruiterUsers,
    deletedUsers, setDeletedUsers, userToDeleteConfirm, setUserToDeleteConfirm,
    deleteConfirmCheck, setDeleteConfirmCheck, setUserToPermanentDeleteConfirm, setPermanentDeleteCheck,
    setUndoToast, showToast, showToastWithUndo, reloadUsers, isSaving, setIsSaving,
  } = s
  const role = s.role

  const promptDeleteUser = (user: UserAccountData) => {
    if (!canModifyUsers) {
      showToast('Access Restricted: Only Super Admin and Dev Team can delete user accounts.')
      return
    }
    setUserToDeleteConfirm(user)
    setDeleteConfirmCheck(false)
  }

  // Handle Delete User (Soft Delete in DB and move to Trash Bin with Undo)
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!canModifyUsers) {
      showToast('Access Restricted: Only Super Admin and Dev Team can delete user accounts.')
      return
    }
    const userToDelete = users.find(u => u.id === userId)
    if (!userToDelete) return

    setIsSaving(true)
    try {
      await usersService.remove(userId)
      await reloadUsers()

      const deletedRecord: DeletedUserData = {
        ...userToDelete,
        deletedAt: `${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, Today`,
        deletedBy: role === 'superadmin' ? 'Super Admin' : 'Admin User',
      }

      setDeletedUsers(prev => [deletedRecord, ...prev.filter(u => u.id !== userId)])
      showToastWithUndo(`User account for "${userName}" moved to Deleted Users / Trash Bin.`, userToDelete)
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  // Confirm Two-Step Delete Action
  const handleConfirmDeleteUser = async () => {
    if (!userToDeleteConfirm || !deleteConfirmCheck) return
    const targetUser = userToDeleteConfirm
    setUserToDeleteConfirm(null)
    setDeleteConfirmCheck(false)
    await handleDeleteUser(targetUser.id, targetUser.name)
  }

  // Handle Restore User in DB
  const handleRestoreUser = async (userId: string) => {
    const userToRestore = deletedUsers.find(u => u.id === userId)
    setIsSaving(true)
    try {
      await usersService.restore(userId)
      await reloadUsers()
      setDeletedUsers(prev => prev.filter(u => u.id !== userId))
      setUndoToast(null)
      showToast(`Successfully restored user account for "${userToRestore?.name || 'User'}"!`)
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  // Prompt Permanent Delete Modal
  const promptPermanentDeleteUser = (user: DeletedUserData) => {
    if (!canModifyUsers) {
      showToast('Access Restricted: Only Super Admin can permanently remove user records.')
      return
    }
    setUserToPermanentDeleteConfirm(user)
    setPermanentDeleteCheck(false)
  }

  // Handle Permanent Delete User from Database
  const handlePermanentDeleteUser = async (userId: string, userName: string) => {
    if (!canModifyUsers) {
      showToast('Access Restricted: Only Super Admin can permanently remove user records.')
      return
    }
    setIsSaving(true)
    try {
      await usersService.remove(`${userId}?permanent=true`)
      await reloadUsers()
      setDeletedUsers(prev => prev.filter(u => u.id !== userId))
      showToast(`User account "${userName}" permanently purged from system database.`)
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Bulk Actions for Deleted Users
  const handleRestoreAllDeleted = async () => {
    if (deletedUsers.length === 0) return
    setIsSaving(true)
    try {
      for (const d of deletedUsers) {
        await usersService.restore(d.id).catch(() => {})
      }
      await reloadUsers()
      setDeletedUsers([])
      showToast('Restored all deleted user accounts in database!')
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  const handleEmptyTrash = async () => {
    if (deletedUsers.length === 0) return
    const count = deletedUsers.length
    setIsSaving(true)
    try {
      for (const d of deletedUsers) {
        await usersService.remove(`${d.id}?permanent=true`).catch(() => {})
      }
      await reloadUsers()
      setDeletedUsers([])
      showToast(`Permanently cleared ${count} user accounts from database trash bin.`)
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return {
    promptDeleteUser,
    handleDeleteUser,
    handleConfirmDeleteUser,
    handleRestoreUser,
    promptPermanentDeleteUser,
    handlePermanentDeleteUser,
    handleRestoreAllDeleted,
    handleEmptyTrash,
  }
}
