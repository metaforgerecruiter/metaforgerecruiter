import React, { useState, useMemo, useEffect } from 'react'
import { Role, Recruiter } from '../../../types'
import { UnifiedTeamMember } from './types'
import { usersService } from '../../../services/workspace.service'
import { TeamsRecruitersHeader } from './TeamsRecruitersHeader'
import { TeamsRecruitersFilters } from './TeamsRecruitersFilters'
import { TeamsRecruitersList } from './TeamsRecruitersList'
import { AddMemberModal } from './AddMemberModal'
import { MemberDetailModal } from './MemberDetailModal'
import { CheckCircle2 } from 'lucide-react'

interface TeamsRecruitersPageProps {
  role?: Role
  /** Recruiter rows with backend-computed counts (submissions, interviews, assigned requirements). */
  recruiters?: Recruiter[]
}

export function TeamsRecruitersPage({ role = 'superadmin', recruiters = [] }: TeamsRecruitersPageProps) {
  const [users, setUsers] = useState<any[]>([])
  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    let active = true
    usersService
      .list()
      .then((data: any) => {
        if (active) setUsers(Array.isArray(data) ? data : data?.items || data?.data || [])
      })
      .catch(() => active && setUsers([]))
    return () => {
      active = false
    }
  }, [reloadKey])

  // Performance label from recorded numbers only.
  const statusFor = (requirements: number, submissions: number, placements: number): UnifiedTeamMember['performanceStatus'] =>
    placements > 0 ? 'Top Performer' : requirements > 0 && submissions === 0 ? 'Needs Attention' : 'On Track'

  const membersList = useMemo<UnifiedTeamMember[]>(() => {
    const active = users.filter(u => u && !u.deletedAt && u.active !== false)
    const recruiterRows = recruiters.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email || '',
      avatar: (r.name || '?').charAt(0).toUpperCase(),
      role: 'Recruiter',
      isTeamLead: false,
      teamLead: r.lead || 'Unassigned',
      clientNames: [(r as any).primaryClient].filter(Boolean) as string[],
      totalRequirements: r.requirementsCount || 0,
      totalSubmissions: r.submissions || 0,
      tatDays: 0,
      totalInterviews: r.interviews || 0,
      performanceStatus: statusFor(r.requirementsCount || 0, r.submissions || 0, r.placements || 0),
    }))
    const leadRows = active
      .filter(u => String(u.role || '').toLowerCase() === 'lead')
      .map(u => {
        const team = recruiters.filter(r => r.lead === u.name)
        const sum = (f: (r: Recruiter) => number) => team.reduce((n, r) => n + (f(r) || 0), 0)
        return {
          id: String(u.userId || u.id || u._id),
          name: u.name,
          email: u.email || '',
          avatar: (u.name || '?').charAt(0).toUpperCase(),
          role: 'Team Lead',
          isTeamLead: true,
          teamLead: `${u.name} (Self)`,
          clientNames: [...new Set(team.map(r => (r as any).primaryClient).filter(Boolean))] as string[],
          totalRequirements: sum(r => r.requirementsCount),
          totalSubmissions: sum(r => r.submissions),
          tatDays: 0,
          totalInterviews: sum(r => r.interviews),
          performanceStatus: statusFor(sum(r => r.requirementsCount), sum(r => r.submissions), sum(r => r.placements)),
          membersCount: team.length,
          teamMembers: team.map(r => r.name),
        }
      })
    return [...leadRows, ...recruiterRows]
  }, [users, recruiters])

  // Filter & Toggle State
  const [roleToggle, setRoleToggle] = useState<'all' | 'leads' | 'recruiters'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [teamLeadFilter, setTeamLeadFilter] = useState('All Team Leads')
  const [performanceFilter, setPerformanceFilter] = useState('All Performance')

  // Modals & Toast State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedMemberDetail, setSelectedMemberDetail] = useState<UnifiedTeamMember | null>(null)

  // Add Member Form State
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState('')
  const [newMemberPassword, setNewMemberPassword] = useState('')
  const [newIsTeamLead, setNewIsTeamLead] = useState(false)
  const [newAssignedLead, setNewAssignedLead] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Unique Team Leads list for dropdown filter
  const uniqueTeamLeads = useMemo(() => {
    const leadsSet = new Set<string>()
    membersList.forEach(m => {
      if (m.isTeamLead) leadsSet.add(m.name)
      else if (m.teamLead && m.teamLead !== 'Unassigned') {
        const cleanLead = m.teamLead.replace(/\s*\(Self\)$/, '')
        leadsSet.add(cleanLead)
      }
    })
    return Array.from(leadsSet)
  }, [membersList])

  // Filtered Members List
  const filteredMembers = useMemo(() => {
    return membersList.filter(m => {
      // Role Toggle Filter
      if (roleToggle === 'leads' && !m.isTeamLead) return false
      if (roleToggle === 'recruiters' && m.isTeamLead) return false

      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = m.name.toLowerCase().includes(q)
        const matchEmail = m.email.toLowerCase().includes(q)
        const matchRole = m.role.toLowerCase().includes(q)
        const matchLead = m.teamLead.toLowerCase().includes(q)
        const matchClient = m.clientNames.some(c => c.toLowerCase().includes(q))
        if (!matchName && !matchEmail && !matchRole && !matchLead && !matchClient) return false
      }

      // Team Lead Filter
      if (teamLeadFilter !== 'All Team Leads') {
        const cleanLeadFilter = teamLeadFilter.toLowerCase()
        const cleanMemberLead = m.teamLead.toLowerCase().replace(/\s*\(self\)$/, '')
        if (cleanMemberLead !== cleanLeadFilter && m.name.toLowerCase() !== cleanLeadFilter) {
          return false
        }
      }

      // Performance Filter
      if (performanceFilter !== 'All Performance' && m.performanceStatus !== performanceFilter) {
        return false
      }

      return true
    })
  }, [membersList, roleToggle, searchQuery, teamLeadFilter, performanceFilter])

  // Pagination State (5 items per page default)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)
  const totalPages = Math.ceil(filteredMembers.length / pageSize) || 1

  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredMembers.slice(start, start + pageSize)
  }, [filteredMembers, currentPage, pageSize])

  // Form Submit Handler
  // Creates the user account; the list reloads from the server.
  const handleCreateMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemberName.trim() || !newMemberEmail.trim() || !newMemberPassword) return
    try {
      await usersService.create({
        name: newMemberName.trim(),
        email: newMemberEmail.trim(),
        password: newMemberPassword,
        role: newIsTeamLead ? 'lead' : 'recruiter',
      })
      setReloadKey(k => k + 1)
      setIsAddModalOpen(false)
      showToast(`Added ${newIsTeamLead ? 'Team Lead' : 'Recruiter'}: ${newMemberName.trim()}`)
      setNewMemberName('')
      setNewMemberEmail('')
      setNewMemberPassword('')
      setNewIsTeamLead(false)
    } catch (err: any) {
      showToast(err?.message || 'Could not create the account')
    }
  }

  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-200">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
      <TeamsRecruitersHeader count={filteredMembers.length} setIsAddModalOpen={setIsAddModalOpen} />
      <TeamsRecruitersFilters
        roleToggle={roleToggle}
        setRoleToggle={setRoleToggle}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        teamLeadFilter={teamLeadFilter}
        setTeamLeadFilter={setTeamLeadFilter}
        performanceFilter={performanceFilter}
        setPerformanceFilter={setPerformanceFilter}
        uniqueTeamLeads={uniqueTeamLeads}
        setCurrentPage={setCurrentPage}
        membersList={membersList}
      />
      <TeamsRecruitersList
        paginatedMembers={paginatedMembers}
        filteredMembers={filteredMembers}
        role={role}
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        setPageSize={setPageSize}
        setCurrentPage={setCurrentPage}
        setSelectedMemberDetail={setSelectedMemberDetail}
      />
      <AddMemberModal
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        handleCreateMember={handleCreateMemberSubmit}
        newMemberName={newMemberName}
        setNewMemberName={setNewMemberName}
        newMemberEmail={newMemberEmail}
        setNewMemberEmail={setNewMemberEmail}
        newMemberRole={newMemberRole}
        setNewMemberRole={setNewMemberRole}
        newIsTeamLead={newIsTeamLead}
        setNewIsTeamLead={setNewIsTeamLead}
        newAssignedLead={newAssignedLead}
        setNewAssignedLead={setNewAssignedLead}
        newMemberPassword={newMemberPassword}
        setNewMemberPassword={setNewMemberPassword}
        uniqueTeamLeads={uniqueTeamLeads}
      />
      <MemberDetailModal
        selectedMemberDetail={selectedMemberDetail}
        setSelectedMemberDetail={setSelectedMemberDetail}
        role={role}
      />
    </div>
  )
}
