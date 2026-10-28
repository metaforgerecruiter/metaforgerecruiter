import { Role } from '../../types'

export const PRESET_REJECTION_REASONS = [
  'Internal screening reject',
  'Duplicate rejection',
  'External screening reject',
  'Screen pending',
  'Candidate no response',
  'L1 rejected',
  'Feedback pending',
  'L2 rejected',
  'CV rejected by BU',
  'Final round rejected',
  'Fitment check',
  'No show',
]

export interface SubmissionCandidateDetailModalProps {
  submission: any | null
  role?: Role
  onClose: () => void
  onViewFullProfile?: (sub: any) => void
  onBackToRequirement?: () => void
  rejectionReason?: string
  onSaveRejectionReason?: (submissionId: string, newReason: string) => void
  onUpdateStage?: (id: string, stage: string, notes?: string) => Promise<void> | void
  onLeadApproval?: (id: string, approved: boolean, status?: string, reason?: string) => Promise<void> | void
  onForwardClient?: (id: string, notes?: string) => Promise<void> | void
}

