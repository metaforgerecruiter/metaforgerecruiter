import React from 'react'
import { Interview, InterviewStatus, Recruiter, Role, Submission, Requirement, ActivityLogItem, Admin, Lead } from '../../types'
import { brand } from '../../theme'
import { Sidebar } from '../../components/layout/Sidebar'
import { PageContainer } from '../../components/layout/PageContainer'
import { NewRequirementModal } from '../../components/modals/NewRequirementModal'
import { SubmitCandidateModal } from '../../components/modals/SubmitCandidateModal'
import { InterviewFeedbackModal } from '../../components/modals/InterviewFeedbackModal'
import { CandidateDetailModal } from '../../components/modals/CandidateDetailModal'
import { AppShellContent } from './AppShell.content'
import { AnimatedPage } from '../../lib/animations'

export interface AppShellProps {
  role: Role
  activeNav: string
  isSidebarCollapsed: boolean
  requirements: Requirement[]
  submissions: Submission[]
  interviews: Interview[]
  recruiters: Recruiter[]
  leads: Lead[]
  admins: Admin[]
  activityLogs: ActivityLogItem[]
  currentUser: { name: string; email: string }
  selectedReqIdForSubmit: string | null
  isNewReqOpen: boolean
  isSubmitCandidateOpen: boolean
  isFeedbackModalOpen: boolean
  selectedInterviewForFeedback: Interview | null
  isCandidateDetailOpen: boolean
  selectedSubmissionForDetail: Submission | null
  onLogout: () => void
  onNavSelect: (nav: string) => void
  onToggleCollapse: () => void
  persistRequirements: (next: Requirement[]) => void
  handleOpenSubmitForReq: (reqId?: string) => void
  handleOpenSubmitCandidateFromDashboard: (reqId?: string) => void
  handleOpenFeedbackForInterview: (iv: Interview) => void
  handleOpenCandidateDetail: (sub: Submission) => void
  handleAddActivityLog: (log: ActivityLogItem) => void
  handleAddRequirement: (req: Requirement) => void
  handleSubmitCandidate: (sub: Submission) => void
  handleSaveInterviewFeedback: (interviewId: string, status: InterviewStatus, notes: string) => void
  setActiveNav: (nav: string) => void
  setSelectedReqIdForSubmit: (id: string | null) => void
  setIsNewReqOpen: (open: boolean) => void
  setIsSubmitCandidateOpen: (open: boolean) => void
  setIsFeedbackModalOpen: (open: boolean) => void
  setIsCandidateDetailOpen: (open: boolean) => void
}

export function AppShell(props: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden font-body" style={{ background: brand.background }}>
      <Sidebar
        role={props.role}
        onLogout={props.onLogout}
        activeNav={props.activeNav}
        onNavSelect={props.onNavSelect}
        collapsed={props.isSidebarCollapsed}
        onToggleCollapse={props.onToggleCollapse}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <main className="flex-1 overflow-y-auto w-full min-w-0 px-4 py-5 lg:px-6 xl:px-8 app-main-content">
          <PageContainer>
            <AnimatedPage animationKey={`${props.role}:${props.activeNav}`}>
              <AppShellContent {...props} />
            </AnimatedPage>
          </PageContainer>
        </main>
      </div>

      <NewRequirementModal isOpen={props.isNewReqOpen} onClose={() => props.setIsNewReqOpen(false)} onAdd={props.handleAddRequirement} />
      <SubmitCandidateModal
        isOpen={props.isSubmitCandidateOpen}
        onClose={() => props.setIsSubmitCandidateOpen(false)}
        requirements={props.requirements}
        selectedReqId={props.selectedReqIdForSubmit}
        onSubmit={props.handleSubmitCandidate}
        currentRecruiterName={props.currentUser.name}
      />
      <InterviewFeedbackModal
        isOpen={props.isFeedbackModalOpen}
        onClose={() => props.setIsFeedbackModalOpen(false)}
        interview={props.selectedInterviewForFeedback}
        onSaveFeedback={props.handleSaveInterviewFeedback}
      />
      <CandidateDetailModal
        isOpen={props.isCandidateDetailOpen}
        onClose={() => props.setIsCandidateDetailOpen(false)}
        submission={props.selectedSubmissionForDetail}
      />
    </div>
  )
}
