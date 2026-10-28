import { Submission, Requirement, Role } from '../../../types'

export interface SubmissionsPageProps {
  role?: Role
  currentUserName?: string
  submissions?: Submission[]
  requirements?: Requirement[]
  onOpenSubmitCandidate?: (reqId?: string) => void
  onUpdateRequirements?: (updated: Requirement[]) => void
}

export interface ScreenshotSubmission {
  id: string
  submissionId?: string
  candidateName: string
  requirement: string
  reqId?: string
  clientName?: string
  experience: string
  currentCompany: string
  submittedBy: string
  submittedOn: string
  status: string
  leadApprovalStatus?: string
  rejectionReason?: string
  email?: string
  phone?: string
  skills?: string[] | string
  expectedSalary?: string
  currentSalary?: string
  noticePeriod?: string
  location?: string
  clientPoc?: string
  clientStage?: string
  raw?: any
}

export function apiErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const obj = err as Record<string, any>
    if (typeof obj.message === 'string') return obj.message
    if (Array.isArray(obj.message) && obj.message.length > 0) return String(obj.message[0])
    if (typeof obj.error === 'string') return obj.error
  }
  if (typeof err === 'string') return err
  return 'An unexpected error occurred. Please try again.'
}

export function mapBackendSubmission(s: any): ScreenshotSubmission {
  const candidateName = s.candidateName || s.candidate || s.candidateId?.name || '—'
  const requirementTitle = s.requirementTitle || s.req || s.requirementId?.title || '—'
  const reqCode = s.requirementId?.reqCode || s.reqCode || s.reqId || s.req || ''
  const clientName = s.clientName || s.client || s.requirementId?.client || '—'
  const recruiterName = s.recruiterName || s.recruiter || s.recruiterId?.name || '—'
  const dateStr = s.date || (s.submittedAt ? new Date(s.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')

  const email = s.email || s.candidateEmail || s.candidateId?.email || ''
  const phone = s.phone || s.candidatePhone || s.candidateId?.phone || ''
  const skills = s.skills || s.candidateId?.skills || []
  const expectedSalary = s.expectedSalary || s.expectedCtc || s.candidateId?.expectedSalary || ''
  const currentSalary = s.currentSalary || s.currentCtc || s.candidateId?.currentSalary || ''
  const noticePeriod = s.noticePeriod || s.candidateId?.noticePeriod || ''
  const location = s.location || s.candidateId?.location || ''

  return {
    id: s.id || s._id || s.submissionId,
    submissionId: s.submissionId || s.id || s._id,
    candidateName,
    requirement: requirementTitle,
    reqId: typeof reqCode === 'object' ? '' : String(reqCode),
    clientName,
    experience: s.experience || (s.candidateId?.totalExperienceYears ? `${s.candidateId.totalExperienceYears} Years` : ''),
    currentCompany: s.currentCompany || s.candidateId?.currentCompany || '',
    submittedBy: recruiterName,
    submittedOn: dateStr,
    status: s.stage || 'Submitted to Client',
    leadApprovalStatus: s.leadApprovalStatus || 'Forwarded',
    rejectionReason: s.rejectionReason || '',
    email,
    phone,
    skills,
    expectedSalary,
    currentSalary,
    noticePeriod,
    location,
    clientPoc: s.clientPoc || s.clientContact || '',
    raw: s,
  }
}

