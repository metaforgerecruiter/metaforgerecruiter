import { Users, UserPlus, User } from 'lucide-react'

interface Props { count: number; setIsAddModalOpen: (v: boolean) => void }
export function TeamsRecruitersHeader({ count, setIsAddModalOpen }: Props) {
  const filteredMembers = { length: count }
  return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Teams & Recruiters</h1>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-[#6B3BF6] border border-purple-200 inline-flex items-center gap-1.5 shadow-2xs">
              <Users className="w-3.5 h-3.5 text-[#6B3BF6]" />
              <span>{filteredMembers.length} Team Members</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete list of recruiters and team leads with assigned lead details and client performance.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Add Team Member</span>
        </button>
      </div>
  )
}
