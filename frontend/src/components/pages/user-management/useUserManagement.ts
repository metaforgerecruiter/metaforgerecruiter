import { Role } from '../../../types'
import { useUserManagementState } from './useUserManagementState'
import { useUserAccessActions } from './useUserAccessActions'
import { useUserDeleteActions } from './useUserDeleteActions'
import { useUserFormActions } from './useUserFormActions'

export function useUserManagement(
  role: Role = 'superadmin',
  initialTab: 'users' | 'permissions' | 'role_definitions' = 'users',
) {
  const state = useUserManagementState(role, initialTab)
  const access = useUserAccessActions(state)
  const del = useUserDeleteActions(state)
  const forms = useUserFormActions(state)
  return { ...state, ...access, ...del, ...forms }
}

export type UserManagementVM = ReturnType<typeof useUserManagement>
