import {
  Users,
  User,
  Trash2,
} from 'lucide-react'
import type { UserManagementVM } from './useUserManagement'
import { DeletedUsersPanel } from './DeletedUsersPanel'
import { ActiveUsersPanel } from './ActiveUsersPanel'

export function UsersTab(vm: UserManagementVM) {
  const { userSubTab, setUserSubTab, users, deletedUsers } = vm
  return (
    <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setUserSubTab('active')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
                  userSubTab === 'active'
                    ? 'bg-[#6B3BF6] text-white border-[#6B3BF6] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Active Accounts ({users.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setUserSubTab('deleted')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 border ${
                  userSubTab === 'deleted'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Deleted Users / Trash Bin</span>
                {deletedUsers.length > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      userSubTab === 'deleted' ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
                    }`}
                  >
                    {deletedUsers.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          {userSubTab === 'deleted' ? (
            <DeletedUsersPanel {...vm} />
          ) : (
            <ActiveUsersPanel {...vm} />
          )}
        </div>
  )
}
