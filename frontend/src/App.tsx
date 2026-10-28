'use client'

import React, { useEffect, useState } from 'react'
import { AuthScreen, Interview, InterviewStatus, Recruiter, Role, Submission, Requirement, ActivityLogItem, Candidate, Lead, Admin } from './types'
import { brand } from './theme'
import { logoutRemote, restoreSession } from './data/authService'
import { clearSession, getSessionUser } from './store/session'
import { titleForRole } from './data/roleMeta'
import { workspaceService } from './services/workspace.service'
import { saveSubmissionsStore } from './data/submissionsStore'

import { Sidebar } from './components/layout/Sidebar'
import { Topbar } from './components/layout/Topbar'
import { PageContainer } from './components/layout/PageContainer'

import { RecruiterDashboard } from './components/dashboards/RecruiterDashboard'
import { DevTeamDashboard } from './components/dashboards/DevTeamDashboard'
import { ModulePage } from './components/pages/ModulePage'

import { LandingPage } from './components/landing/LandingPage'
import { SignInPage } from './components/auth/SignInPage'
import { SignUpPage } from './components/auth/SignUpRequestPage'
import { PasswordRecoveryFlow } from './components/auth/PasswordRecoveryFlow'
import { DevRoleSwitcher } from './components/common/DevRoleSwitcher'

import { NewRequirementModal } from './components/modals/NewRequirementModal'
import { SubmitCandidateModal } from './components/modals/SubmitCandidateModal'
import { InterviewFeedbackModal } from './components/modals/InterviewFeedbackModal'
import { CandidateDetailModal } from './components/modals/CandidateDetailModal'

const emptyUser = { email: '', name: '', password: '', title: '' }
const NAV_STORAGE_KEY = 'mrap_active_nav'

function getSavedNav(): string | null {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem(NAV_STORAGE_KEY)
    } catch {
      return null
    }
  }
  return null
}

function saveNav(nav: string): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(NAV_STORAGE_KEY, nav)
    } catch {
      // ignore
    }
  }
}

function clearSavedNav(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(NAV_STORAGE_KEY)
    } catch {
      // ignore
    }
  }
}

export default function App() {
  // Keep SSR and the first client render identical — never read localStorage here.
  const [role, setRole] = useState<Role>('recruiter')
  const [screen, setScreen] = useState<AuthScreen>('landing')
  const [bootstrapped, setBootstrapped] = useState(false)
  const [loginRole, setLoginRole] = useState<Role>('recruiter')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [activeNav, setActiveNav] = useState<string>('Dashboard')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [admins, setAdmins] = useState<Admin[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [currentUser, setCurrentUser] = useState(emptyUser)

  const handleAddActivityLog = (newLog: ActivityLogItem) => {
    setActivityLogs(prev => [newLog, ...prev])
    void workspaceService.addActivityLog(newLog).catch(() => undefined)
  }

  const persistRequirements = (next: Requirement[]) => {
    setRequirements(next)
    void workspaceService.updateRequirements(next).catch(() => undefined)
  }

  const [isNewReqOpen, setIsNewReqOpen] = useState(false)
  const [isSubmitCandidateOpen, setIsSubmitCandidateOpen] = useState(false)
  const [selectedReqIdForSubmit, setSelectedReqIdForSubmit] = useState<string | null>(null)
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false)
  const [selectedInterviewForFeedback, setSelectedInterviewForFeedback] = useState<Interview | null>(null)
  const [isCandidateDetailOpen, setIsCandidateDetailOpen] = useState(false)
  const [selectedSubmissionForDetail, setSelectedSubmissionForDetail] = useState<Submission | null>(null)

  const loadWorkspace = async () => {
    const payload = await workspaceService.load()
    setRequirements(payload.requirements || [])
    setSubmissions(payload.submissions || [])
    saveSubmissionsStore(payload.submissions || [])
    setInterviews(payload.interviews || [])
    setRecruiters(payload.recruiters || [])
    setLeads(payload.leads || [])
    setAdmins(payload.admins || [])
    setActivityLogs(payload.activityLogs || [])
    setCandidates(payload.candidates || [])
  }

  useEffect(() => {
    let cancelled = false
    restoreSession()
      .then(async user => {
        if (cancelled) return
        if (!user) {
          setBootstrapped(true)
          return
        }
        const r = user.role as Role
        setRole(r)
        setCurrentUser({
          email: user.email,
          name: user.name,
          password: '',
          title: user.title || titleForRole(r),
        })
        const saved = getSavedNav()
        const normalizedSaved = (saved === 'Submissions' || saved === 'Interviews' || saved === 'Submission to Client') ? 'Reports' : saved
        const defaultNav = (r === 'superadmin' || r === 'devteam' || r === 'admin' || r === 'lead') ? 'Requirements' : 'Dashboard'
        const targetNav = normalizedSaved || defaultNav
        setActiveNav(targetNav)
        saveNav(targetNav)
        setScreen('app')
        try {
          await loadWorkspace()
        } catch {
          // Empty workspace until API recovers
        }
        if (!cancelled) setBootstrapped(true)
      })
      .catch(() => {
        if (!cancelled) setBootstrapped(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const handleLogout = () => {
    void logoutRemote()
    clearSession()
    clearSavedNav()
    setScreen('landing')
    setActiveNav('Requirements')
    setRequirements([])
    setSubmissions([])
    setInterviews([])
    setRecruiters([])
    setLeads([])
    setAdmins([])
    setActivityLogs([])
    setCandidates([])
    setCurrentUser(emptyUser)
  }

  const handleAuthenticated = (r: Role) => {
    setRole(r)
    const session = getSessionUser()
    setCurrentUser({
      email: session?.email || '',
      name: session?.name || '',
      password: '',
      title: session?.title || titleForRole(r),
    })
    const saved = getSavedNav()
    const normalizedSaved = (saved === 'Submissions' || saved === 'Interviews' || saved === 'Submission to Client') ? 'Reports' : saved
    const defaultNav = (r === 'superadmin' || r === 'devteam' || r === 'admin' || r === 'lead') ? 'Requirements' : 'Dashboard'
    const targetNav = normalizedSaved || defaultNav
    setActiveNav(targetNav)
    saveNav(targetNav)
    setScreen('app')
    void loadWorkspace().catch(() => undefined)
  }

  const handleNavSelect = (nav: string) => {
    if (nav !== 'Candidates' && nav !== 'Candidate Search') {
      setSelectedReqIdForSubmit(null)
    }
    setActiveNav(nav)
    saveNav(nav)
    if (nav === 'Requirements') {
      void loadWorkspace().catch(() => undefined)
    }
  }

  const handleOpenSubmitCandidateFromDashboard = (reqId?: string) => {
    setSelectedReqIdForSubmit(reqId || null)
    if (role !== 'recruiter') {
      setActiveNav('Candidates')
      saveNav('Candidates')
    }
  }

  const handleAddRequirement = (newReq: Requirement) => {
    const nowIso = new Date().toISOString()
    const enrichedReq: Requirement = {
      ...newReq,
      emailArrivedTime: newReq.emailArrivedTime || new Date().toLocaleString(),
      createdAt: (newReq as any).createdAt || nowIso,
      updatedAt: (newReq as any).updatedAt || nowIso,
    }
    setRequirements([enrichedReq, ...requirements])
    void workspaceService.createRequirement(enrichedReq)
      .then((created: any) => {
        if (created) {
          setRequirements(prev =>
            prev.map(r => r.id === enrichedReq.id ? { ...r, ...created, id: created.reqCode || created.id || r.id, _id: created._id || (r as any)._id } : r)
          )
        }
      })
      .catch(() => undefined)
  }

  const handleSubmitCandidate = (newSub: Submission) => {
    const nowIso = new Date().toISOString()
    const enrichedSub: Submission = {
      ...newSub,
      date: newSub.date || 'Today',
      submittedAt: (newSub as any).submittedAt || nowIso,
      updatedAt: (newSub as any).updatedAt || nowIso,
      createdAt: (newSub as any).createdAt || nowIso,
    }
    setSubmissions([enrichedSub, ...submissions])
    saveSubmissionsStore([enrichedSub, ...submissions])
    void workspaceService.createSubmission(enrichedSub).then((created: any) => {
      if (created) {
        setSubmissions(prev => {
          const next = prev.map(s => s.id === enrichedSub.id ? { ...s, ...created, id: created.submissionId || created.id || s.id, _id: created._id || (s as any)._id } : s)
          saveSubmissionsStore(next)
          return next
        })
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('submissions_updated'))
      }
    }).catch(() => undefined)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('submissions_updated'))
    }
    setRequirements(prev =>
      prev.map(r => (r.id === newSub.req ? { ...r, submissions: r.submissions + 1 } : r))
    )
    setRecruiters(prev =>
      prev.map(rec =>
        rec.name === newSub.recruiter
          ? { ...rec, submissions: rec.submissions + 1, today: rec.today + 1 }
          : rec
      )
    )
    handleAddActivityLog({
      id: `LOG-${Date.now()}`,
      timestamp: 'Just now',
      userName: newSub.recruiter || currentUser.name,
      userEmail: currentUser.email,
      userRole: role,
      userAvatar: (newSub.recruiter || currentUser.name).charAt(0).toUpperCase(),
      action: `Submitted candidate ${newSub.candidate} for ${newSub.req}`,
      category: 'Submissions',
      targetEntity: `Candidate ${newSub.candidate}`,
      targetId: newSub.id,
      clientName: newSub.client,
      ipAddress: '127.0.0.1',
      status: 'Success',
      details: `Submitted candidate profile to client ${newSub.client}`,
    })
  }

  const handleSaveInterviewFeedback = (interviewId: string, status: InterviewStatus, notes: string) => {
    setInterviews(prev => prev.map(iv => (iv.id === interviewId ? { ...iv, status, notes } : iv)))
    void workspaceService.saveInterviewFeedback(interviewId, status, notes).catch(() => undefined)
    const targetIv = interviews.find(i => i.id === interviewId)
    handleAddActivityLog({
      id: `LOG-${Date.now()}`,
      timestamp: 'Just now',
      userName: currentUser.name,
      userEmail: currentUser.email,
      userRole: role,
      userAvatar: currentUser.name.charAt(0).toUpperCase(),
      action: `Recorded interview feedback (${status}) for ${targetIv?.candidate || 'Candidate'}`,
      category: 'Interviews',
      targetEntity: `Interview ${interviewId}`,
      targetId: interviewId,
      clientName: targetIv?.client || 'Client',
      ipAddress: '127.0.0.1',
      status: 'Success',
      details: notes || `Interview status updated to ${status}`,
    })
  }

  const handleOpenSubmitForReq = (reqId?: string) => {
    setSelectedReqIdForSubmit(reqId || null)
    setActiveNav('Candidates')
  }

  const handleOpenFeedbackForInterview = (iv: Interview) => {
    setSelectedInterviewForFeedback(iv)
    setIsFeedbackModalOpen(true)
  }

  const handleOpenCandidateDetail = (sub: Submission) => {
    setSelectedSubmissionForDetail(sub)
    setIsCandidateDetailOpen(true)
  }

  if (!bootstrapped) {
    return (
      <div
        className="flex h-screen items-center justify-center font-body"
        style={{ background: brand.background }}
        aria-busy="true"
      >
        <div className="text-sm text-slate-500">Loading workspace…</div>
      </div>
    )
  }

  if (screen === 'landing') {
    return (
      <LandingPage
        onSignIn={() => setScreen('signin')}
        onRequestAccess={() => setScreen('signup')}
      />
    )
  }

  if (screen === 'signin') {
    return (
      <SignInPage
        onLogin={handleAuthenticated}
        onForgot={email => {
          setRecoveryEmail(email || '')
          setScreen('password-recovery')
        }}
        onSignup={() => setScreen('signup')}
        onBack={() => setScreen('landing')}
      />
    )
  }

  if (screen === 'signup') {
    return <SignUpPage onBack={() => setScreen('signin')} onSubmitted={() => setScreen('signin')} onLogin={handleAuthenticated} />
  }

  if (screen === 'password-recovery') {
    return <PasswordRecoveryFlow initialEmail={recoveryEmail} onExit={() => setScreen('signin')} />
  }

  const renderContent = () => {
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
        initialCandidates={candidates}
        onCandidatesChange={setCandidates}
      />
    )
  }

  return (
    <div className="flex h-screen overflow-hidden font-body" style={{ background: brand.background }}>
      <Sidebar
        role={role}
        onLogout={handleLogout}
        activeNav={activeNav}
        onNavSelect={handleNavSelect}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar
          title={activeNav}
          role={role}
          searchValue=""
          onSearchChange={() => {}}
          onSignOut={handleLogout}
        />
        <main className="flex-1 overflow-y-auto w-full min-w-0 px-4 py-5 lg:px-6 xl:px-8 app-main-content">
          <PageContainer>{renderContent()}</PageContainer>
        </main>
      </div>

      <NewRequirementModal isOpen={isNewReqOpen} onClose={() => setIsNewReqOpen(false)} onAdd={handleAddRequirement} />
      <SubmitCandidateModal
        isOpen={isSubmitCandidateOpen}
        onClose={() => setIsSubmitCandidateOpen(false)}
        requirements={requirements}
        selectedReqId={selectedReqIdForSubmit}
        onSubmit={handleSubmitCandidate}
        currentRecruiterName={currentUser.name}
      />
      <InterviewFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        interview={selectedInterviewForFeedback}
        onSaveFeedback={handleSaveInterviewFeedback}
      />
      <CandidateDetailModal
        isOpen={isCandidateDetailOpen}
        onClose={() => setIsCandidateDetailOpen(false)}
        submission={selectedSubmissionForDetail}
      />

      {/* Dev role switcher for quick in-app switching during development */}
      <DevRoleSwitcher
        currentRole={role}
        currentUserName={currentUser.name}
        onSwitchRole={handleAuthenticated}
      />
    </div>
  )
}
