import { Submission } from '../types'

let memory: Submission[] = []

export function getSubmissionsStore(): Submission[] {
  return memory
}

export function saveSubmissionsStore(submissions: Submission[]): void {
  memory = submissions
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('submissions_updated'))
  }
}

export function addSubmissionToStore(sub: Submission): Submission[] {
  const current = getSubmissionsStore()
  const existsIndex = current.findIndex(s => s.id === sub.id)
  let updated: Submission[]
  if (existsIndex >= 0) {
    updated = [...current]
    updated[existsIndex] = sub
  } else {
    updated = [sub, ...current]
  }
  saveSubmissionsStore(updated)
  return updated
}

export interface DuplicateCheckCandidate {
  email?: string | null
  phone?: string | null
  candidateId?: string | null
  name?: string | null
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingSubmission?: Submission
  matchReason?: string
}

function normalizePhone(phone?: string | null): string {
  if (!phone) return ''
  let cleaned = phone.replace(/[^\d]/g, '')
  if (cleaned.length > 10) cleaned = cleaned.slice(-10)
  return cleaned
}

function normalizeEmail(email?: string | null): string {
  if (!email) return ''
  return email.trim().toLowerCase()
}

function normalizeName(name?: string | null): string {
  if (!name) return ''
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function submissionForDuplicateCheck(raw: any): Submission {
  const candidate = raw?.candidateId && typeof raw.candidateId === 'object' ? raw.candidateId : null
  const requirement = raw?.requirementId && typeof raw.requirementId === 'object' ? raw.requirementId : null
  const reqCode = String(raw?.reqCode || requirement?.reqCode || '')
  return {
    id: String(raw?.submissionId || raw?.id || raw?._id || ''),
    candidate: String(raw?.candidateName || candidate?.name || raw?.candidate || ''),
    candidateId: String(candidate?._id || (typeof raw?.candidateId === 'string' ? raw.candidateId : '') || ''),
    req: reqCode || String(raw?.req || ''),
    reqCode,
    requirementId: String(requirement?._id || (typeof raw?.requirementId === 'string' ? raw.requirementId : '') || ''),
    client: String(raw?.clientName || raw?.client || ''),
    date: String(raw?.date || ''),
    stage: raw?.stage || 'Submitted',
    match: String(raw?.match || ''),
    recruiter: String(raw?.recruiterName || raw?.recruiter || ''),
    email: String(raw?.email || candidate?.email || ''),
    phone: String(raw?.phone || candidate?.phone || ''),
  }
}

export function checkDuplicateSubmission(
  reqId?: string | null,
  candidate?: DuplicateCheckCandidate | null,
): DuplicateCheckResult {
  if (!reqId || !candidate) return { isDuplicate: false }

  const submissions = getSubmissionsStore()
  const normEmail = normalizeEmail(candidate.email)
  const normPhone = normalizePhone(candidate.phone)
  const normName = normalizeName(candidate.name)
  const candidateId = candidate.candidateId?.trim().toLowerCase()
  const targetReqId = reqId.trim().toLowerCase()

  for (const sub of submissions) {
    const subReqValues = [sub.req, sub.reqCode, sub.requirementId]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map(value => value.trim().toLowerCase())
    if (!subReqValues.includes(targetReqId)) continue

    const subCandidateId = String(sub.candidateId || '').trim().toLowerCase()
    if (candidateId && subCandidateId && subCandidateId === candidateId) {
      return { isDuplicate: true, existingSubmission: sub, matchReason: 'Matching candidate on this requirement' }
    }
    if (normEmail && sub.email && normalizeEmail(sub.email) === normEmail) {
      return { isDuplicate: true, existingSubmission: sub, matchReason: `Matching email address (${candidate.email})` }
    }
    if (normPhone && normPhone.length >= 7 && sub.phone && normalizePhone(sub.phone) === normPhone) {
      return { isDuplicate: true, existingSubmission: sub, matchReason: `Matching phone number (${candidate.phone})` }
    }
    if (normName && sub.candidate) {
      const subNameNorm = normalizeName(sub.candidate)
      if (subNameNorm && subNameNorm === normName && normName.length > 3) {
        return { isDuplicate: true, existingSubmission: sub, matchReason: `Matching candidate name (${sub.candidate})` }
      }
    }
  }
  return { isDuplicate: false }
}
