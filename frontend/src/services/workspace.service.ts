import { api } from '../lib/api'
import type {
  ActivityLogItem,
  Admin,
  Candidate,
  Interview,
  Lead,
  Recruiter,
  Requirement,
  Submission,
} from '../types'

export interface OriginalRequirementEmail {
  requirementId: string
  subject: string | null
  from: string | null
  fromName: string | null
  to: string[]
  cc: string[]
  receivedAt: string | null
  bodyText: string | null
  bodyHtml: string | null
  hasOriginal: boolean
  fallbackDescription: string | null
}

export interface WorkspaceUser {
  id: string
  _id?: string
  name: string
  email: string
  phone?: string
  employeeId?: string
  role: string
  roleCode?: string
  team?: string
  supervisor?: string
  status?: string
  lastLogin?: string
}

export interface WorkspacePayload {
  requirements: Requirement[]
  submissions: Submission[]
  interviews: Interview[]
  recruiters: Recruiter[]
  leads: Lead[]
  admins: Admin[]
  activityLogs: ActivityLogItem[]
  candidates: Candidate[]
  clients: unknown[]
  teams: unknown[]
  users: WorkspaceUser[]
  user?: { id: string; email: string; name: string; role: string }
}

export const workspaceService = {
  load: () => api.get<WorkspacePayload>('/workspace'),
  createRequirement: (body: Requirement) =>
    api.post('/requirements', {
      title: body.title,
      client: body.client,
      clientName: body.client,
      priority: body.priority,
      openings: body.openings,
      skillsRequired: body.skills,
      location: body.location,
      status: body.status === 'Active' ? 'In Progress' : body.status,
    }),
  updateRequirements: (body: Requirement[]) => api.put('/requirements/bulk', body),
  updateRequirement: (id: string, body: Partial<Requirement> & Record<string, any>) => {
    const payload = {
      ...body,
      clientName: body.clientName || body.client,
      skillsRequired: body.skillsRequired || body.skills,
      status: body.status === 'Active' ? 'In Progress' : body.status,
    }
    return api.put<any>(`/requirements/${encodeURIComponent(id)}`, payload)
  },
  assignRequirement: (id: string, body: { recruiterIds?: string[]; leadId?: string }) =>
    api.post(`/requirements/${encodeURIComponent(id)}/assign`, body),
  revokeRequirement: (id: string, body: { reason: string }) =>
    api.post(`/requirements/${encodeURIComponent(id)}/revoke`, body),
  getOriginalEmail: (id: string) =>
    api.get<OriginalRequirementEmail>(`/requirements/${encodeURIComponent(id)}/original-email`),
  createSubmission: (body: Submission) => api.post('/submissions', body),
  saveInterviewFeedback: (id: string, status: string, notes: string) =>
    api.post(`/interviews/${encodeURIComponent(id)}/feedback`, {
      recommendation: status === 'Passed' || status === 'Confirmed' || status === 'Completed' ? 'Passed' : status === 'Rejected' || status === 'Cancelled' ? 'Rejected' : 'Hold',
      notes,
      feedbackNotes: notes,
    }),
  addActivityLog: (body: ActivityLogItem) => api.post('/audit/logs', body),
  syncRequirementsFromEmail: (limit = 25) =>
    api.post<{ status: string; message: string }>('/requirements/sync-emails', { limit }),
  getRequirementsSyncStatus: () =>
    api.get<{
      status: 'idle' | 'running' | 'completed' | 'failed'
      lastSyncedAt?: string
      totalProcessed: number
      totalSynced: number
      totalDeduped: number
      message: string
      error?: string | null
    }>('/requirements/sync-status'),
}

export const usersService = {
  list: (query = '') => api.get<any[]>(`/users${query}`),
  me: () => api.get('/users/me'),
  updateMe: (body: unknown) => api.put('/users/me', body),
  create: (body: unknown) => api.post('/users', body),
  update: (id: string, body: unknown) => api.put(`/users/${encodeURIComponent(id)}`, body),
  remove: (id: string) => api.delete(`/users/${encodeURIComponent(id)}`),
  restore: (id: string) => api.post(`/users/restore/${encodeURIComponent(id)}`),
  screenTime: (body: unknown) => api.post('/users/screen-time', body),
}

export const rolesService = {
  permissions: () => api.get<any[]>('/roles/permissions'),
  updatePermissions: (body: unknown) => api.put('/roles/permissions', body),
}

export const clientsService = {
  list: () => api.get<any[]>('/clients'),
  create: (body: unknown) => api.post('/clients', body),
  update: (id: string, body: unknown) => api.put(`/clients/${id}`, body),
  remove: (id: string) => api.delete(`/clients/${id}`),
}

export const candidatesService = {
  list: () => api.get<any>('/candidates'),
  create: (body: unknown) => api.post('/candidates', body),
  update: (id: string, body: unknown) => api.put(`/candidates/${encodeURIComponent(id)}`, body),
  duplicateCheck: (body: unknown) =>
    api.post<{ isDuplicate: boolean; duplicateField?: string; candidate?: any }>('/candidates/duplicate-check', body),
}

export const teamsService = {
  list: () => api.get<any[]>('/teams'),
}

export const submissionsService = {
  list: (query = '') => api.get<any[]>(`/submissions${query}`),
  getById: (id: string) => api.get<any>(`/submissions/${encodeURIComponent(id)}`),
  create: (body: unknown) => api.post('/submissions', body),
  updateStage: (id: string, body: { stage: string; notes?: string }) =>
    api.put(`/submissions/${encodeURIComponent(id)}/stage`, body),
  leadApproval: (id: string, body: { approved?: boolean; status?: string; reason?: string; notes?: string }) =>
    api.post(`/submissions/${encodeURIComponent(id)}/lead-approval`, body),
  forwardClient: (id: string, body?: { notes?: string }) =>
    api.post(`/submissions/${encodeURIComponent(id)}/forward-client`, body || {}),
}

export const interviewsService = {
  list: (query = '') => api.get<any[]>(`/interviews${query}`),
  getById: (id: string) => api.get<any>(`/interviews/${encodeURIComponent(id)}`),
  create: (body: {
    submissionId: string
    candidateId?: string
    requirementId?: string
    round?: string
    dateTime: string
    durationMinutes?: number
    mode?: string
    meetingUrl?: string
    interviewerName?: string
    interviewerEmail?: string
    status?: string
    notes?: string
    candidateEmail?: string
    candidatePhone?: string
    sendEmail?: boolean
    sendWhatsApp?: boolean
  }) => api.post<any>('/interviews', body),
  reschedule: (id: string, body: { dateTime: string; durationMinutes?: number; reason?: string }) =>
    api.put<any>(`/interviews/${encodeURIComponent(id)}/reschedule`, body),
  submitFeedback: (id: string, body: { evaluatorName?: string; evaluatorEmail?: string; technicalScore?: number; feedbackNotes?: string; notes?: string; recommendation: string; rejectionReason?: string }) =>
    api.post<any>(`/interviews/${encodeURIComponent(id)}/feedback`, body),
  cancel: (id: string, body?: { reason?: string }) =>
    api.post<any>(`/interviews/${encodeURIComponent(id)}/cancel`, body || {}),
  remove: (id: string) => api.delete<any>(`/interviews/${encodeURIComponent(id)}`),
}


export const notificationsService = {
  list: (query = '') => api.get<any>(`/notifications${query}`),
  markRead: (id: string) => api.post<any>(`/notifications/${encodeURIComponent(id)}/read`),
  markAllAsRead: () => api.post<any>('/notifications/read-all'),
  remove: (id: string) => api.delete<any>(`/notifications/${encodeURIComponent(id)}`),
}

export const offersService = {
  list: (query = '') => api.get<any[]>(`/offers${query}`),
  getById: (id: string) => api.get<any>(`/offers/${encodeURIComponent(id)}`),
  create: (body: {
    submissionId: string
    candidateId?: string
    requirementId?: string
    offeredCtc: number
    joiningDate: string
    status?: string
    declinedReason?: string
  }) => api.post<any>('/offers', body),
  update: (id: string, body: {
    offeredCtc?: number
    joiningDate?: string
    status?: string
    declinedReason?: string
    notJoinedNote?: string
  }) => api.put<any>(`/offers/${encodeURIComponent(id)}`, body),
  updateStatus: (id: string, body: {
    status: string
    declinedReason?: string
    notJoinedNote?: string
    notes?: string
  }) => api.put<any>(`/offers/${encodeURIComponent(id)}/status`, body),
  remove: (id: string) => api.delete<any>(`/offers/${encodeURIComponent(id)}`),
}

export interface AnalyticsFilterQuery {
  startDate?: string
  endDate?: string
  recruiterId?: string
  clientId?: string
  leadId?: string
  status?: string
  priority?: string
  stage?: string
  round?: string
  interviewerEmail?: string
  tier?: string
}

function toQueryString(params?: AnalyticsFilterQuery): string {
  if (!params) return ''
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      searchParams.append(k, String(v))
    }
  })
  const str = searchParams.toString()
  return str ? `?${str}` : ''
}

export const analyticsService = {
  dashboard: (params?: AnalyticsFilterQuery) => api.get<any>(`/analytics/dashboard${toQueryString(params)}`),
  requirements: (params?: AnalyticsFilterQuery) => api.get<any>(`/analytics/requirements${toQueryString(params)}`),
  candidates: (params?: AnalyticsFilterQuery) => api.get<any>(`/analytics/candidates${toQueryString(params)}`),
  submissions: (params?: AnalyticsFilterQuery) => api.get<any>(`/analytics/submissions${toQueryString(params)}`),
  interviews: (params?: AnalyticsFilterQuery) => api.get<any>(`/analytics/interviews${toQueryString(params)}`),
  offers: (params?: AnalyticsFilterQuery) => api.get<any>(`/analytics/offers${toQueryString(params)}`),
  clients: (params?: AnalyticsFilterQuery) => api.get<any>(`/analytics/clients${toQueryString(params)}`),
  recruiters: (params?: AnalyticsFilterQuery) => api.get<any>(`/analytics/recruiters${toQueryString(params)}`),
}

export interface FileMetadata {
  id?: string
  _id?: string
  fileId: string
  originalName: string
  mimeType: string
  sizeBytes: number
  storageProvider?: string
  storageKey?: string
  checksumSha256?: string
  scanStatus?: string
  uploadedBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface FilesListResponse {
  items: FileMetadata[]
  total: number
  page: number
  limit: number
}

export function uploadedFileId(file: { id?: string; _id?: string } | null | undefined): string {
  const id = String(file?.id || file?._id || '').trim()
  if (!id) throw new Error('Resume upload did not return a file id')
  return id
}

export const filesService = {
  list: (query = '') => api.get<FilesListResponse>(`/files${query}`),
  getById: (id: string) => api.get<FileMetadata>(`/files/${encodeURIComponent(id)}`),
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.upload<FileMetadata & { downloadUrl?: string; downloadExpiresAt?: string }>('/files', formData)
  },
  remove: (id: string) => api.delete<{ success: boolean; message: string }>(`/files/${encodeURIComponent(id)}`),
  /** Mint a short-lived HMAC download URL (preferred). */
  createSignedDownload: (id: string, expiresInSeconds = 300) =>
    api.post<{ url: string; expiresAt: string; token: string }>(
      `/files/${encodeURIComponent(id)}/signed-url`,
      { expiresInSeconds },
    ),
  /** @deprecated Prefer createSignedDownload — this path 302s to a signed URL. */
  downloadUrl: (id: string) => `/api/v1/files/${encodeURIComponent(id)}/download`,
  async download(id: string): Promise<void> {
    const signed = await filesService.createSignedDownload(id)
    if (typeof window !== 'undefined') {
      window.location.assign(signed.url)
    }
  },
}

export interface AISearchPayload {
  query?: string
  skills?: string[]
  minExperience?: number
  maxExperience?: number
  limit?: number
}

/** Candidate fields extracted from a resume by the integrated resume-parser module. */
export interface ParsedResume {
  candidateName: string | null
  email: string | null
  contactNumber: string | null
  linkedInUrl: string | null
  qualification: string | null
  skills: string | null
  technologies: string | null
  totalExperience: string | null
  relevantExperience: string | null
  currentCompany: string | null
  currentLocation: string | null
  sourceFile: string
  parser: string
}

export interface BulkParseResult {
  sourceFile: string
  status: 'done' | 'error'
  data?: ParsedResume
  error?: string
}

/** Max resumes per bulk request (the backend parses them one by one). */
export const RESUME_BULK_BATCH = 5

export const resumeParserService = {
  health: () => api.get<{ status: string; mode: string; aiParserAvailable?: boolean; aiSuspendedNotice?: string | null }>('/resume-parser/health'),
  parse: (file: File) => {
    const form = new FormData()
    form.append('resume', file)
    return api.upload<{ success: boolean; data: ParsedResume }>('/resume-parser/parse', form)
  },
  parseBulk: (files: File[]) => {
    const form = new FormData()
    files.slice(0, RESUME_BULK_BATCH).forEach((f) => form.append('resumes', f))
    return api.upload<{ success: boolean; results: BulkParseResult[]; notice?: string | null }>('/resume-parser/parse/bulk', form)
  },
}

export const aiService = {
  match: (body: { candidateId: string; requirementId: string }) => api.post<any>('/ai/match', body),
  search: (body: AISearchPayload) => api.post<any>('/ai/search', body),
  parseResume: (body: { resumeText?: string; fileId?: string }) => api.post<any>('/ai/parse-resume', body),
  enrich: (body: { candidateId: string; resumeText?: string }) => api.post<any>('/ai/enrich', body),
  matchScores: (query = '') => api.get<any>(`/ai/match-scores${query}`),
}

export interface UserAuditLogItem {
  id: string
  _id?: string
  userId: string
  userName: string
  userEmail: string
  role: string
  date: string
  firstLoginTime: string | null
  latestLogoutTime: string | null
  firstLoginFormattedIST: string | null
  latestLogoutFormattedIST: string | null
  status: 'Active' | 'Logged Out' | 'Session Expired'
  ipAddress?: string
  userAgent?: string
  loginCount?: number
  lastActiveAt?: string
  createdAt?: string
}

export interface UserAuditLogsResponse {
  success: boolean
  data: UserAuditLogItem[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export const auditService = {
  getUserLogs: (params: {
    date?: string
    startDate?: string
    endDate?: string
    role?: string
    status?: string
    search?: string
    page?: number
    limit?: number
  } = {}) => {
    const searchParams = new URLSearchParams()
    if (params.date) searchParams.set('date', params.date)
    if (params.startDate) searchParams.set('startDate', params.startDate)
    if (params.endDate) searchParams.set('endDate', params.endDate)
    if (params.role && params.role !== 'All Roles') searchParams.set('role', params.role)
    if (params.status && params.status !== 'All Statuses') searchParams.set('status', params.status)
    if (params.search && params.search.trim()) searchParams.set('search', params.search.trim())
    if (params.page) searchParams.set('page', String(params.page))
    if (params.limit) searchParams.set('limit', String(params.limit))
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''
    return api.get<UserAuditLogsResponse>(`/audit/user-logs${query}`)
  },
  downloadCsv: async (params: {
    date?: string
    startDate?: string
    endDate?: string
    role?: string
    status?: string
    search?: string
  } = {}) => {
    const searchParams = new URLSearchParams()
    if (params.date) searchParams.set('date', params.date)
    if (params.startDate) searchParams.set('startDate', params.startDate)
    if (params.endDate) searchParams.set('endDate', params.endDate)
    if (params.role && params.role !== 'All Roles') searchParams.set('role', params.role)
    if (params.status && params.status !== 'All Statuses') searchParams.set('status', params.status)
    if (params.search && params.search.trim()) searchParams.set('search', params.search.trim())
    const query = searchParams.toString() ? `?${searchParams.toString()}` : ''

    const blob = await api.getBlob(`/audit/export-csv${query}`)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_logs_${params.date || new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  },
}
