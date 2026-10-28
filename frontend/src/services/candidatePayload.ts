import { Candidate } from '../types'
import { ApiError } from '../lib/api'
import { candidatesService } from './workspace.service'
import { CandidateRepoItem } from '../components/pages/candidate-repository/types'

const OFFER_VALUES = new Set(['No', 'Yes', 'In Pipeline', 'Multiple'])
const CREATE_STATUSES = new Set(['New', 'Parsed', 'Submitted', 'Interviewing', 'Offered', 'Placed'])

export interface CandidateFormFields {
  name: string
  email: string
  phone: string
  linkedIn?: string
  company?: string
  qualification?: string
  skills?: string
  technologies?: string
  totalExperience?: string
  relevantExperience?: string
  currentCtc?: string
  expectedCtc?: string
  noticePeriod?: string
  currentLocation?: string
  preferredLocation?: string
  offerInHand?: string
  interviewAvailability?: string
  reasonForChange?: string
  notes?: string
  status?: string
  resumeFileId?: string
}

export interface ApiCandidate {
  id?: string
  _id?: string
  candidateId?: string
  name?: string
  email?: string
  phone?: string
  linkedInUrl?: string | null
  currentCompany?: string | null
  qualification?: string | null
  skills?: string[] | string
  totalExperienceYears?: number
  relevantExperienceYears?: number
  currentCtc?: number
  expectedCtc?: number
  noticePeriodDays?: number
  currentLocation?: string | null
  preferredLocation?: string | null
  offerInHand?: string
  interviewAvailability?: string | null
  reasonForChange?: string | null
  notes?: string | null
  status?: string
  createdAt?: string
  resumeFileId?: string | null
  resumeFileName?: string | null
  resumeUrl?: string | null
}

export type UiCandidate = Candidate & { _id?: string }

function parseNumber(value?: string): number | undefined {
  const text = String(value || '').trim()
  if (!text) return undefined
  const match = text.replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
  if (!match) return undefined
  const n = Number(match[0])
  return Number.isFinite(n) ? n : undefined
}

function parseNoticeDays(value?: string): number | undefined {
  const text = String(value || '').trim().toLowerCase()
  if (!text) return undefined
  if (text.includes('immediate')) return 0
  return parseNumber(text)
}

function splitSkills(skills?: string, technologies?: string): string[] {
  const parts = `${skills || ''},${technologies || ''}`
    .split(/[,|/]/)
    .map(part => part.trim())
    .filter(Boolean)
  return [...new Set(parts)]
}

function normalizeOffer(value?: string): string | undefined {
  const text = String(value || '').trim()
  return OFFER_VALUES.has(text) ? text : undefined
}

function blankToEmpty(value?: string | null): string {
  const text = String(value || '').trim()
  return text === 'N/A' ? '' : text
}

export function validateCandidateForm(fields: CandidateFormFields): string | null {
  if (!fields.name.trim()) return 'Candidate name is required'
  if (!fields.email.trim()) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) return 'Enter a valid email address'
  if (!fields.phone.trim()) return 'Phone number is required'
  return null
}

export function buildCandidateBody(fields: CandidateFormFields, mode: 'create' | 'update'): Record<string, unknown> {
  const body: Record<string, unknown> = {
    name: fields.name.trim(),
    email: fields.email.trim(),
    phone: fields.phone.trim(),
  }
  if (fields.linkedIn?.trim()) body.linkedInUrl = fields.linkedIn.trim()
  body.currentCompany = fields.company?.trim() || ''
  body.qualification = fields.qualification?.trim() || ''
  const total = parseNumber(fields.totalExperience)
  const relevant = parseNumber(fields.relevantExperience)
  const currentCtc = parseNumber(fields.currentCtc)
  const expectedCtc = parseNumber(fields.expectedCtc)
  const notice = parseNoticeDays(fields.noticePeriod)
  if (total !== undefined) body.totalExperienceYears = total
  if (relevant !== undefined) body.relevantExperienceYears = relevant
  if (currentCtc !== undefined) body.currentCtc = currentCtc
  if (expectedCtc !== undefined) body.expectedCtc = expectedCtc
  if (notice !== undefined) body.noticePeriodDays = notice
  body.currentLocation = fields.currentLocation?.trim() || ''
  body.preferredLocation = fields.preferredLocation?.trim() || ''
  const offer = normalizeOffer(fields.offerInHand)
  if (offer) body.offerInHand = offer
  body.interviewAvailability = fields.interviewAvailability?.trim() || ''
  body.reasonForChange = fields.reasonForChange?.trim() || ''
  body.notes = fields.notes?.trim() || ''
  body.skills = splitSkills(fields.skills, fields.technologies)
  if (fields.resumeFileId?.trim()) body.resumeFileId = fields.resumeFileId.trim()
  if (mode === 'create') {
    const status = fields.status && CREATE_STATUSES.has(fields.status) ? fields.status : 'Parsed'
    body.status = status
  }
  return body
}

export function apiErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Your session expired. Sign in again.'
    return err.message || 'Could not save candidate'
  }
  if (err instanceof Error && err.message) return err.message
  return 'Unable to reach the API. Confirm you are signed in and the backend is running.'
}

export function apiCandidateToUi(doc: ApiCandidate): UiCandidate {
  const skills = Array.isArray(doc.skills) ? doc.skills.filter(Boolean).join(', ') : String(doc.skills || '')
  const mongoId = typeof doc.id === 'string' && /^[a-f\d]{24}$/i.test(doc.id) ? doc.id : undefined
  const businessId = doc.candidateId || mongoId || doc.id || ''
  const offer = doc.offerInHand === 'Yes' || doc.offerInHand === 'In Pipeline' ? doc.offerInHand : 'No'
  const status = doc.status === 'Interviewing' ? 'In Review' : doc.status || 'New'
  return {
    id: businessId,
    _id: mongoId,
    submissionDate: doc.createdAt ? String(doc.createdAt).slice(0, 10) : undefined,
    name: doc.name || '',
    company: blankToEmpty(doc.currentCompany),
    phone: doc.phone || '',
    email: doc.email || '',
    linkedIn: doc.linkedInUrl || '',
    qualification: blankToEmpty(doc.qualification),
    skills,
    technologies: skills,
    totalExperience: doc.totalExperienceYears != null ? `${doc.totalExperienceYears} Years` : '',
    relevantExperience: doc.relevantExperienceYears != null ? `${doc.relevantExperienceYears} Years` : '',
    currentCtc: doc.currentCtc != null ? String(doc.currentCtc) : '',
    expectedCtc: doc.expectedCtc != null ? String(doc.expectedCtc) : '',
    noticePeriod: doc.noticePeriodDays != null ? `${doc.noticePeriodDays} days` : '',
    currentLocation: blankToEmpty(doc.currentLocation),
    preferredLocation: blankToEmpty(doc.preferredLocation),
    offerInHand: offer,
    interviewAvailability: blankToEmpty(doc.interviewAvailability),
    reasonForChange: blankToEmpty(doc.reasonForChange),
    notes: blankToEmpty(doc.notes),
    status: status as Candidate['status'],
    resumeName: blankToEmpty(doc.resumeFileName) || undefined,
    resumeFileId: doc.resumeFileId ? String(doc.resumeFileId) : undefined,
  }
}

export function uiCandidateToRepo(candidate: UiCandidate): CandidateRepoItem {
  return {
    id: candidate._id || candidate.id,
    candidateId: candidate.id,
    name: candidate.name,
    email: candidate.email || '',
    phone: candidate.phone || '',
    linkedIn: candidate.linkedIn || '',
    technology: candidate.technologies || candidate.skills || '',
    totalExperience: candidate.totalExperience || '',
    relevantExperience: candidate.relevantExperience || '',
    createdDate: candidate.submissionDate || '',
    createdBy: '',
    status: candidate.status,
    qualification: candidate.qualification,
    skills: candidate.skills,
    currentCompany: candidate.company,
    currentCtc: candidate.currentCtc,
    expectedCtc: candidate.expectedCtc,
    noticePeriod: candidate.noticePeriod,
    currentLocation: candidate.currentLocation,
    preferredLocation: candidate.preferredLocation,
    interviewAvailability: candidate.interviewAvailability,
    reasonForChange: candidate.reasonForChange,
    offerInHand: candidate.offerInHand,
    resumeReference: candidate.resumeName,
    resumeFileId: candidate.resumeFileId,
    notes: candidate.notes,
  }
}

export function upsertCandidate(list: UiCandidate[], saved: UiCandidate): UiCandidate[] {
  const index = list.findIndex(item =>
    item.id === saved.id ||
    (!!saved._id && (item._id === saved._id || item.id === saved._id)) ||
    (!!item._id && item._id === saved.id),
  )
  if (index === -1) return [saved, ...list]
  const next = list.slice()
  next[index] = { ...list[index], ...saved }
  return next
}

export async function createCandidateFromForm(fields: CandidateFormFields): Promise<UiCandidate> {
  const error = validateCandidateForm(fields)
  if (error) throw new Error(error)
  const saved = await candidatesService.create(buildCandidateBody(fields, 'create'))
  return apiCandidateToUi(saved as ApiCandidate)
}

export async function updateCandidateFromForm(id: string, fields: CandidateFormFields): Promise<UiCandidate> {
  const error = validateCandidateForm(fields)
  if (error) throw new Error(error)
  const saved = await candidatesService.update(id, buildCandidateBody(fields, 'update'))
  return apiCandidateToUi(saved as ApiCandidate)
}
