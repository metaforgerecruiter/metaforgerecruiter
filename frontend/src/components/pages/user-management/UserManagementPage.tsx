import { Role } from '../../../types'
import { useUserManagement } from './useUserManagement'
import { ConfigurePermissionsView } from './ConfigurePermissionsView'
import { CreateRoleView } from './CreateRoleView'
import { CreateUserView } from './CreateUserView'
import { ResetPasswordView } from './ResetPasswordView'
import { AssignRoleView } from './AssignRoleView'
import { UserManagementList } from './UserManagementList'

interface UserManagementPageProps {
  role?: Role
  initialTab?: 'users' | 'permissions' | 'role_definitions'
}

export function UserManagementPage({ role = 'superadmin', initialTab = 'users' }: UserManagementPageProps) {
  const vm = useUserManagement(role, initialTab)
  let view = <UserManagementList {...vm} />
  if (vm.viewMode === 'configure_permissions' && vm.editingRole) {
    view = <ConfigurePermissionsView {...vm} />
  } else if (vm.viewMode === 'create_role') {
    view = <CreateRoleView {...vm} />
  } else if (vm.viewMode === 'create_user') {
    view = <CreateUserView {...vm} />
  } else if (vm.viewMode === 'reset_password' && vm.selectedUser) {
    view = <ResetPasswordView {...vm} />
  } else if (vm.viewMode === 'assign_role' && vm.selectedUser) {
    view = <AssignRoleView {...vm} />
  }
  return (
    <>
      {view}
      {vm.toastMsg && !vm.undoToast && vm.viewMode !== 'list' && (
        <div className="fixed bottom-12 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium">
          {vm.toastMsg}
        </div>
      )}
    </>
  )
}
