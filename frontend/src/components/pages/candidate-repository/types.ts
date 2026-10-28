import { Candidate, Requirement, Role } from '../../../types'

export interface CandidateRepoItem {
  id: string
  candidateId: string
  name: string
  email: string
  phone: string
  linkedIn?: string
  technology: string
  totalExperience: string
  createdDate: string
  createdBy: string
  status?: string
  qualification?: string
  skills?: string
  relevantExperience?: string
  currentCompany?: string
  currentCtc?: string
  expectedCtc?: string
  noticePeriod?: string
  currentLocation?: string
  preferredLocation?: string
  interviewAvailability?: string
  reasonForChange?: string
  offerInHand?: string
  resumeReference?: string
  resumeFileId?: string
  notes?: string
}

export interface CandidateRepositoryPageProps {
  candidates?: Candidate[]
  requirements?: Requirement[]
  selectedReqId?: string | null
  role?: Role
  onOpenAddForm: () => void
  onCandidateUpdated?: (candidate: Candidate) => void
  onSelectCandidate?: (candidate: Candidate) => void
  onSelectRequirement?: (reqId: string | null) => void
  onBackToDashboard?: () => void
}
