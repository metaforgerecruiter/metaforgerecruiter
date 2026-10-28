import React from 'react'
import { Requirement, Submission, Interview, Recruiter, Candidate, ActivityLogItem, Role } from '../../types'
import { upsertCandidate, UiCandidate } from '../../services/candidatePayload'
import { PAGE_META, getPageTitle } from '../../config/navigation'
import { Panel, DataTable, QuickActions } from '../wireframe/WireframeKit'
import { PageHeader } from '../layout/PageHeader'
import { RequirementsPage } from './RequirementsPage'
import { AddCandidatePage } from './AddCandidatePage'
import { CandidateRepositoryPage } from './CandidateRepositoryPage'
import { SubmissionsPage } from './SubmissionsPage'
import { MyProfilePage } from './MyProfilePage'
import { InterviewTrackingPage } from './InterviewTrackingPage'
import { ReportsPage } from './ReportsPage'
import { ClientsPage } from './ClientsPage'
import { UserManagementPage } from './UserManagementPage'
import { ActivityLogsPage } from './ActivityLogsPage'
import { MyTeamPage } from './MyTeamPage'
import { TeamsRecruitersPage } from './TeamsRecruitersPage'
import { HistoryPage } from './HistoryPage'
import { NotificationsPage } from './NotificationsPage'

export interface ModulePageRouteProps {
  pageKey: string
  role: Role
  requirements: Requirement[]
  submissions: Submission[]
  interviews: Interview[]
  recruiters: Recruiter[]
  selectedReqId: string | null
  activityLogs: ActivityLogItem[]
  currentUserName?: string
  currentUserEmail?: string
  candidatesList: Candidate[]
  candidateViewMode: 'add' | 'repository'
  onOpenSubmit?: (reqId?: string) => void
  onOpenFeedback?: (iv: Interview) => void
  onOpenCandidate?: (sub: Submission) => void
  onUpdateRequirements?: (requirements: Requirement[]) => void
  onSelectRequirement?: (reqId: string | null) => void
  onAddActivityLog?: (log: ActivityLogItem) => void
  onNavigateToDashboard?: () => void
  handleCandidateViewModeChange: (mode: 'add' | 'repository') => void
  setCandidatesList: React.Dispatch<React.SetStateAction<Candidate[]>>
  /** True when Add Candidate was opened from Repository (nested), not from sidebar */
  addOpenedFromRepository?: boolean
}

export function renderModulePage(props: ModulePageRouteProps) {
  const {
    pageKey,
    role,
    requirements,
    submissions,
    interviews,
    recruiters,
    selectedReqId,
    activityLogs,
    currentUserName,
    currentUserEmail,
    candidatesList,
    candidateViewMode,
    onOpenSubmit,
    onOpenFeedback,
    onUpdateRequirements,
    onSelectRequirement,
    onAddActivityLog,
    onNavigateToDashboard,
    handleCandidateViewModeChange,
    setCandidatesList,
    addOpenedFromRepository = false,
  } = props

  if (pageKey === 'Notifications') {
    return <NotificationsPage />
  }

  if (pageKey === 'My Profile' || pageKey === 'Profile') {
    return <MyProfilePage role={role as any} />
  }

  if (pageKey === 'Reports' || pageKey === 'Reports & Analytics') {
    return (
      <ReportsPage
        role={role}
        initialReportsTab="submissions"
        requirements={requirements}
        submissions={submissions}
        interviews={interviews}
        recruiters={recruiters}
        onOpenSubmit={onOpenSubmit}
        onOpenFeedback={onOpenFeedback}
        onUpdateRequirements={onUpdateRequirements}
      />
    )
  }

  if (pageKey === 'Roles' || pageKey === 'Roles & Permissions') {
    return <UserManagementPage role={role} initialTab="role_definitions" />
  }

  if (pageKey === 'Clients' || pageKey === 'Client Management') {
    return <ClientsPage role={role} requirements={requirements} />
  }

  if (pageKey === 'Users' || pageKey === 'User Management') {
    return <UserManagementPage role={role} initialTab="users" />
  }

  if (pageKey === 'Recruiters' || pageKey === 'Teams' || pageKey === 'Teams & Recruiters') {
    return <TeamsRecruitersPage role={role} recruiters={recruiters} />
  }

  if (pageKey === 'Activity Logs' || pageKey === 'Audit Logs') {
    return <ActivityLogsPage role={role} logs={activityLogs} />
  }

  if (pageKey === 'History' || pageKey === 'Recruiter History' || pageKey === 'Performance History') {
    if (role !== 'recruiter') {
      return (
        <ReportsPage
          role={role}
          initialReportsTab="reports"
          initialMainTab="history"
          requirements={requirements}
          submissions={submissions}
          interviews={interviews}
          recruiters={recruiters}
          onOpenSubmit={onOpenSubmit}
          onOpenFeedback={onOpenFeedback}
          onUpdateRequirements={onUpdateRequirements}
        />
      )
    }
    return <HistoryPage role={role} currentUserName={currentUserName} currentUserEmail={currentUserEmail} recruiters={recruiters} requirements={requirements} submissions={submissions} />
  }

  if (pageKey === 'My Team') {
    return <MyTeamPage requirements={requirements} recruiters={recruiters} />
  }

  if (pageKey === 'Requirements') {
    return (
      <RequirementsPage
        role={role}
        requirements={requirements}
        submissions={submissions}
        interviews={interviews}
        recruiters={recruiters}
        onOpenSubmit={onOpenSubmit}
        onUpdateRequirements={onUpdateRequirements}
        onAddActivityLog={onAddActivityLog}
      />
    )
  }

  if (pageKey === 'Candidates' || pageKey === 'Candidate Search') {
    if (candidateViewMode === 'repository') {
      return (
        <CandidateRepositoryPage
          candidates={candidatesList}
          requirements={requirements}
          selectedReqId={selectedReqId}
          role={role}
          onOpenAddForm={() => handleCandidateViewModeChange('add')}
          onCandidateUpdated={saved => {
            setCandidatesList(prev => upsertCandidate(prev as UiCandidate[], saved))
          }}
          onSelectRequirement={onSelectRequirement}
          onBackToDashboard={selectedReqId ? onNavigateToDashboard : undefined}
        />
      )
    }

    return (
      <AddCandidatePage
        requirements={requirements}
        selectedReqId={selectedReqId}
        showBack={addOpenedFromRepository}
        onOpenRepository={() => handleCandidateViewModeChange('repository')}
        onAddCandidate={saved => {
          setCandidatesList(prev => upsertCandidate(prev as UiCandidate[], saved as UiCandidate))
        }}
      />
    )
  }

  if (pageKey === 'Submissions' || pageKey === 'Submission to Client' || pageKey === 'Submissions to Client') {
    return (
      <ReportsPage
        role={role}
        initialReportsTab="submissions"
        requirements={requirements}
        submissions={submissions}
        interviews={interviews}
        recruiters={recruiters}
        onOpenSubmit={onOpenSubmit}
        onOpenFeedback={onOpenFeedback}
        onUpdateRequirements={onUpdateRequirements}
      />
    )
  }

  if (pageKey === 'Interviews' || pageKey === 'Interview Tracking') {
    return (
      <ReportsPage
        role={role}
        initialReportsTab="interviews"
        requirements={requirements}
        submissions={submissions}
        interviews={interviews}
        recruiters={recruiters}
        onOpenSubmit={onOpenSubmit}
        onOpenFeedback={onOpenFeedback}
        onUpdateRequirements={onUpdateRequirements}
      />
    )
  }

  const meta = PAGE_META[pageKey]

  if (!meta) {
    return (
      <div className="space-y-6 w-full pb-12 font-sans">
        <PageHeader title={getPageTitle(role, pageKey)} />
        <Panel title={pageKey}>
          <p className="text-sm text-slate-600">
            Module wireframe — content for {pageKey} will appear here.
          </p>
        </Panel>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full pb-12 font-sans">
      <PageHeader title={meta.title} subtitle={meta.description} />
      {meta.actions && <QuickActions actions={meta.actions} />}
      <Panel title={meta.title}>
        <p className="text-sm text-slate-500">No data to show yet.</p>
      </Panel>
    </div>
  )
}
