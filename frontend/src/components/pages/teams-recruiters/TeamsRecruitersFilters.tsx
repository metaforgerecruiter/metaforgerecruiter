import { Users, ShieldCheck, Search, Shield, User } from 'lucide-react'

interface Props {
  roleToggle: 'all' | 'leads' | 'recruiters'
  setRoleToggle: (v: 'all' | 'leads' | 'recruiters') => void
  searchQuery: string
  setSearchQuery: (v: string) => void
  teamLeadFilter: string
  setTeamLeadFilter: (v: string) => void
  performanceFilter: string
  setPerformanceFilter: (v: string) => void
  uniqueTeamLeads: string[]
  setCurrentPage: (n: number) => void
  membersList: { isTeamLead: boolean }[]
}
export function TeamsRecruitersFilters(p: Props) {
  const { roleToggle, setRoleToggle, searchQuery, setSearchQuery, teamLeadFilter, setTeamLeadFilter, performanceFilter, setPerformanceFilter, uniqueTeamLeads, setCurrentPage, membersList } = p
  return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        {/* ROW 1: SIMPLE ROLE TOGGLE PILLS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => {
                setRoleToggle('all')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                roleToggle === 'all'
                  ? 'bg-[#6B3BF6] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>All Team Members ({membersList.length})</span>
            </button>

            <button
              onClick={() => {
                setRoleToggle('leads')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                roleToggle === 'leads'
                  ? 'bg-[#6B3BF6] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Team Leads ({membersList.filter(m => m.isTeamLead).length})</span>
            </button>

            <button
              onClick={() => {
                setRoleToggle('recruiters')
                setCurrentPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                roleToggle === 'recruiters'
                  ? 'bg-[#6B3BF6] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Recruiters ({membersList.filter(m => !m.isTeamLead).length})</span>
            </button>
          </div>
        </div>

        {/* ROW 2: SEARCH & DROPDOWN FILTERS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member, lead, role, client..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-xs font-medium"
            />
          </div>

          <div>
            <select
              value={teamLeadFilter}
              onChange={e => setTeamLeadFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All Team Leads">All Team Leads ({uniqueTeamLeads.length})</option>
              {uniqueTeamLeads.map(lead => (
                <option key={lead} value={lead}>
                  Team Lead: {lead}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={performanceFilter}
              onChange={e => setPerformanceFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All Performance">All Performance Statuses</option>
              <option value="Top Performer">Top Performer 🏆</option>
              <option value="On Track">On Track ⚡</option>
              <option value="Needs Attention">Needs Attention ⚠️</option>
            </select>
          </div>
        </div>
      </div>
  )
}
