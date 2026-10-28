import React from 'react'
import { Interview, Recruiter, Role, Submission, Requirement, ActivityLogItem, Admin, Lead, Candidate } from '../../types'
import { RecruiterDashboard } from '../../components/dashboards/RecruiterDashboard'
import { DevTeamDashboard } from '../../components/dashboards/DevTeamDashboard'
import { ModulePage } from '../../components/pages/ModulePage'

interface AppShellContentProps {
  role: Role
  activeNav: string
  requirements: Requirement[]
  submissions: Submission[]
  interviews: Interview[]
  recruiters: Recruiter[]
  leads: Lead[]
  admins: Admin[]
  activityLogs: ActivityLogItem[]
  candidates?: Candidate[]
  currentUser: { name: string; email: string }
  selectedReqIdForSubmit: string | null
  persistRequirements: (next: Requirement[]) => void
  handleOpenSubmitForReq: (reqId?: string) => void
  handleOpenSubmitCandidateFromDashboard: (reqId?: string) => void
  handleOpenFeedbackForInterview: (iv: Interview) => void
  handleOpenCandidateDetail: (sub: Submission) => void
  handleAddActivityLog: (log: ActivityLogItem) => void
  setActiveNav: (nav: string) => void
  setSelectedReqIdForSubmit: (id: string | null) => void
}

export function AppShellContent(props: AppShellContentProps) {
  const {
    role,
    activeNav,
    requirements,
    submissions,
    interviews,
    recruiters,
    leads,
    admins,
    activityLogs,
    candidates,
    currentUser,
    selectedReqIdForSubmit,
    persistRequirements,
    handleOpenSubmitForReq,
    handleOpenSubmitCandidateFromDashboard,
    handleOpenFeedbackForInterview,
    handleOpenCandidateDetail,
    handleAddActivityLog,
    setActiveNav,
    setSelectedReqIdForSubmit,
  } = props

  const effectiveNav = (role === 'superadmin' || role === 'devteam' || role === 'admin') && activeNav === 'Dashboard' ? 'Requirements' : activeNav

  if (effectiveNav === 'Dashboard') {
    switch (role) {
      case 'devteam':
        return (
          <DevTeamDashboard
            admins={admins}
            leads={leads}
            recruiters={recruiters}
            requirements={requirements}
            interviews={interviews}
            onUpdateRequirements={persistRequirements}
            onOpenSubmit={handleOpenSubmitForReq}
          />
        )
      case 'lead':
      case 'recruiter':
      default:
        return (
          <RecruiterDashboard
            candidates={candidates}
            submissions={submissions}
            interviews={interviews}
            requirements={requirements}
            activityLogs={activityLogs}
            currentUserName={currentUser.name}
            currentUserEmail={currentUser.email}
            onOpenSubmitCandidate={handleOpenSubmitCandidateFromDashboard}
            onOpenCandidateRepo={handleOpenSubmitCandidateFromDashboard}
            onOpenFeedbackModal={handleOpenFeedbackForInterview}
            onOpenCandidateDetail={handleOpenCandidateDetail}
            onAddActivityLog={handleAddActivityLog}
            onUpdateRequirements={persistRequirements}
          />
        )
    }
  }

  return (
    <ModulePage
      pageKey={activeNav}
      role={role}
      requirements={requirements}
      submissions={submissions}
      interviews={interviews}
      recruiters={recruiters}
      selectedReqId={selectedReqIdForSubmit}
      onOpenSubmit={role !== 'client' ? handleOpenSubmitForReq : undefined}
      onOpenFeedback={handleOpenFeedbackForInterview}
      onOpenCandidate={handleOpenCandidateDetail}
      onUpdateRequirements={persistRequirements}
      onSelectRequirement={setSelectedReqIdForSubmit}
      activityLogs={activityLogs}
      onAddActivityLog={handleAddActivityLog}
      onNavigateToDashboard={() => setActiveNav('Dashboard')}
      currentUserName={currentUser.name}
      currentUserEmail={currentUser.email}
    />
  )
}
