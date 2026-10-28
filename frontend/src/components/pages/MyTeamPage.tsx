import React, { useEffect, useMemo, useState } from 'react'
import {
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Award,
  Crown,
  Plus,
  Mail,
  Sliders,
  ChevronRight,
  Sparkles,
  ArrowRight,
  PieChart,
  X,
  Save,
} from 'lucide-react'
import {
  RecruiterDetailAnalyticsPage,
  RecruiterDetailData,
} from './RecruiterDetailAnalyticsPage'
import { PaginationFooter } from '../ui/PaginationFooter'
import { Requirement, Recruiter } from '../../types'
import { getSessionUser } from '../../store/session'

export interface TeamMemberData {
  id: string
  name: string
  role: string
  isLead?: boolean
  email: string
  avatar: string
  assignedClients: {
    clientName: string
    activeReqCount: number
    submissionsCount: number
    status: 'High Priority' | 'Active' | 'On Track'
  }[]
  totalActiveReqs: number
  totalSubmissions: number
  interviewsCount: number
  hiresCount: number
  avgTatDays: number
  status: 'Active' | 'On Leave'
}

interface MyTeamPageProps {
  requirements?: Requirement[]
  recruiters?: Recruiter[]
}

// Requirements assigned to a recruiter (the requirement's owner lists its recruiters by name).
const assignedTo = (requirements: Requirement[], name: string) =>
  requirements.filter(r => (r.owner || '').split(',').map(n => n.trim()).includes(name))

export function MyTeamPage({ requirements = [], recruiters = [] }: MyTeamPageProps) {
  const session = getSessionUser()
  const isLead = String(session?.role || '').toLowerCase() === 'lead'
  const leadName = isLead ? session?.name || '' : ''

  // A lead sees their own recruiters; other roles see every recruiter.
  const teamMembers = useMemo<TeamMemberData[]>(() => {
    const team = isLead ? recruiters.filter(r => r.lead === leadName) : recruiters
    return team.map(r => {
      const reqs = assignedTo(requirements, r.name)
      const byClient = new Map<string, { activeReqCount: number; submissionsCount: number }>()
      for (const q of reqs) {
        const c = byClient.get(q.client) || { activeReqCount: 0, submissionsCount: 0 }
        c.activeReqCount += 1
        c.submissionsCount += q.submissions || 0
        byClient.set(q.client, c)
      }
      return {
        id: r.id,
        name: r.name,
        role: 'Recruiter',
        email: r.email || '',
        avatar: (r.name || '?').charAt(0).toUpperCase(),
        assignedClients: [...byClient.entries()].map(([clientName, c]) => ({ clientName, ...c, status: 'Active' as const })),
        totalActiveReqs: r.requirementsCount || reqs.length,
        totalSubmissions: r.submissions || 0,
        interviewsCount: r.interviews || 0,
        hiresCount: r.placements || 0,
        avgTatDays: 0,
        status: 'Active' as const,
      }
    })
  }, [requirements, recruiters, isLead, leadName])

  // Client workload across the team, from the members' assigned requirements.
  const clientWorkload = useMemo(() => {
    const map = new Map<string, { client: string; recruiters: Set<string>; activeReqs: number; subs: number }>()
    for (const m of teamMembers) {
      for (const c of m.assignedClients) {
        const row = map.get(c.clientName) || { client: c.clientName, recruiters: new Set<string>(), activeReqs: 0, subs: 0 }
        row.recruiters.add(m.name)
        row.activeReqs += c.activeReqCount
        row.subs += c.submissionsCount
        map.set(c.clientName, row)
      }
    }
    return [...map.values()]
      .map(r => ({ client: r.client, recruiterCount: r.recruiters.size, recruiters: [...r.recruiters], activeReqs: r.activeReqs, subs: r.subs }))
      .sort((a, b) => b.activeReqs - a.activeReqs)
  }, [teamMembers])

  const totals = useMemo(
    () => ({
      reqs: teamMembers.reduce((n, m) => n + m.totalActiveReqs, 0),
      subs: teamMembers.reduce((n, m) => n + m.totalSubmissions, 0),
      interviews: teamMembers.reduce((n, m) => n + m.interviewsCount, 0),
      hires: teamMembers.reduce((n, m) => n + m.hiresCount, 0),
    }),
    [teamMembers],
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('All Clients')
  const [selectedRecruiterForDetail, setSelectedRecruiterForDetail] = useState<RecruiterDetailData | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Filtered members list
  const filteredMembers = teamMembers.filter(member => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesName = member.name.toLowerCase().includes(q)
      const matchesEmail = member.email.toLowerCase().includes(q)
      const matchesClient = member.assignedClients.some(c => c.clientName.toLowerCase().includes(q))
      if (!matchesName && !matchesEmail && !matchesClient) return false
    }
    if (clientFilter !== 'All Clients') {
      const hasClient = member.assignedClients.some(c => c.clientName === clientFilter)
      if (!hasClient) return false
    }
    return true
  })

  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredMembers.slice(start, start + pageSize)
  }, [filteredMembers, currentPage, pageSize])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, clientFilter, pageSize])

  // Drill down to recruiter detail analytics page
  if (selectedRecruiterForDetail) {
    return (
      <RecruiterDetailAnalyticsPage
        recruiter={selectedRecruiterForDetail}
        onBack={() => setSelectedRecruiterForDetail(null)}
      />
    )
  }

  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-150">
      {/* 1. TOP HEADER & POD BADGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-[#6B3BF6]" />
              <span>My Team Overview</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Recruiter team member list, assigned client accounts, active requirement workloads, and sourcing throughput.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl flex items-center gap-2 text-xs font-extrabold text-[#6B3BF6]">
            <Crown className="w-4 h-4 text-amber-500" />
            <span>Team Lead: {leadName || '—'}</span>
          </div>
        </div>
      </div>

      {/* 2. POD OVERVIEW KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">Team Members</span>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{teamMembers.length}</p>
          <span className="text-[10px] text-purple-700 font-semibold">Recruiters</span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Assigned Clients</span>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{clientWorkload.length} Accounts</p>
          <span className="text-[10px] text-blue-700 font-semibold">{clientWorkload.slice(0, 3).map(c => c.client).join(', ') || '—'}</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Active Requirements</span>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{totals.reqs} Job Demands</p>
          <span className="text-[10px] text-amber-700 font-semibold">In Sourcing Phase</span>
        </div>

        <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-[#5B51D8] uppercase tracking-wider block">Total Submissions</span>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{totals.subs} Submissions</p>
          <span className="text-[10px] text-[#5B51D8] font-bold">Pod Overall Total</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Interview Pipeline</span>
          <p className="text-2xl font-extrabold text-slate-900 tabular-nums">{totals.interviews} Interviews</p>
          <span className="text-[10px] text-emerald-700 font-bold">{totals.hires} Placements</span>
        </div>
      </div>

      {/* 3. CLIENT WORKLOAD ALLOCATION OVERVIEW */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#6B3BF6]" />
            <h3 className="text-base font-bold text-slate-900">
              Client Account Workload Distribution Across Team
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Recruiter allocations per client account
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {clientWorkload.length === 0 && <p className="text-xs text-slate-400">No assigned requirements yet.</p>}
          {clientWorkload.map(c => (
            <div key={c.client} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900">{c.client}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-[#6B3BF6]">
                  {c.recruiterCount} Recruiters
                </span>
              </div>

              <div className="text-[11px] text-slate-600 font-medium">
                <strong className="text-slate-800">Assigned:</strong> {c.recruiters.join(', ')}
              </div>

              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Active Reqs: <strong className="text-blue-700">{c.activeReqs}</strong></span>
                <span>Submissions: <strong className="text-[#6B3BF6]">{c.subs}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. TEAM MEMBERS & ASSIGNED CLIENTS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#6B3BF6]" />
              <span>Team Members & Client Account Assignments</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing detailed breakdown of names, assigned roles, working client accounts, and output metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search recruiter name, client, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6]"
              />
            </div>

            <select
              value={clientFilter}
              onChange={e => setClientFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All Clients">All Clients</option>
              {clientWorkload.map(c => (
                <option key={c.client} value={c.client}>
                  {c.client}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">RECRUITER NAME & ROLE</th>
                <th className="py-3.5 px-4">WORKING CLIENT ACCOUNTS</th>
                <th className="py-3.5 px-4">ACTIVE REQS</th>
                <th className="py-3.5 px-4">TOTAL SUBMISSIONS</th>
                <th className="py-3.5 px-4">INTERVIEWS</th>
                <th className="py-3.5 px-4">AVG TAT</th>
                <th className="py-3.5 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedMembers.map((member, idx) => (
                <tr key={member.id} className="hover:bg-purple-50/40 transition-colors">
                  {/* Recruiter Name & Role */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-2xl bg-purple-100 text-[#6B3BF6] font-extrabold flex items-center justify-center text-xs shrink-0 border border-purple-200 shadow-2xs">
                        {member.avatar}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs">{member.name}</span>
                          {member.isLead && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <Crown className="w-3 h-3 text-amber-600" />
                              <span>Team Lead</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">{member.role}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{member.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Working Client Accounts */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {member.assignedClients.map(cli => (
                        <span
                          key={cli.clientName}
                          className="px-2.5 py-1 rounded-xl text-[10px] font-extrabold bg-blue-50 text-[#2563EB] border border-blue-200 flex items-center gap-1 shadow-2xs"
                        >
                          <Building2 className="w-3 h-3 text-[#2563EB]" />
                          <span>{cli.clientName}</span>
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-blue-100 text-blue-900 font-mono">
                            {cli.submissionsCount}
                          </span>
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Active Reqs */}
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-slate-900 tabular-nums">
                      {member.totalActiveReqs} Requirements
                    </span>
                  </td>

                  {/* Total Submissions */}
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-[#6B3BF6] underline hover:text-purple-900 tabular-nums cursor-pointer">
                      {member.totalSubmissions} Candidates
                    </span>
                  </td>

                  {/* Interviews */}
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-emerald-700 tabular-nums">
                      {member.interviewsCount} Scheduled
                    </span>
                  </td>

                  {/* Avg TAT */}
                  <td className="py-3.5 px-4 font-extrabold text-slate-800 tabular-nums">
                    —
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-2">
                    <button
                      onClick={() =>
                        setSelectedRecruiterForDetail((() => {
                          const reqs = assignedTo(requirements, member.name)
                          const worked = reqs.filter(q => (q.submissions || 0) > 0)
                          return {
                            id: member.id,
                            name: member.name,
                            role: member.role,
                            team: leadName ? `${leadName}'s team` : '—',
                            avatar: member.avatar,
                            requirementsCount: reqs.length,
                            workedReqs: worked.length,
                            nonWorkedReqs: reqs.length - worked.length,
                            submissionsCount: member.totalSubmissions,
                            shortlistedCount: 0,
                            noSubmissionsCount: reqs.length - worked.length,
                            interviewsCount: member.interviewsCount,
                            hiresCount: member.hiresCount,
                            conversionRate: member.totalSubmissions ? `${((member.hiresCount / member.totalSubmissions) * 100).toFixed(1)}%` : '0%',
                            dailyTaskStatus: '—',
                            weeklyProgress: '—',
                            weeklyProgressPct: 0,
                            teamLead: leadName || '—',
                            primaryClient: member.assignedClients[0]?.clientName || '—',
                            status: 'On Track' as const,
                            requirementsList: reqs.map(q => ({
                              id: q.id,
                              title: q.title,
                              client: q.client,
                              submissions: q.submissions || 0,
                              interviews: q.interviews || 0,
                              status: ((q.submissions || 0) > 0 ? 'Worked' : 'Non-Worked') as 'Worked' | 'Non-Worked',
                              positions: q.openings,
                            })),
                          }
                        })())
                      }
                      className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] text-xs font-extrabold rounded-xl border border-purple-200 shadow-2xs transition-all inline-flex items-center gap-1.5 cursor-pointer active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#6B3BF6]" />
                      <span>View Analytics</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PaginationFooter
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredMembers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="members"
          />
        </div>
      </div>

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed bottom-12 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
