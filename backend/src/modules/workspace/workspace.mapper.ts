import { displayRequirementId } from '../../common/requirement-id';
const ROUND_MAP: Record<string, string> = {
  Screening: 'Screening',
  'L1 Technical': 'Technical Round 1',
  'L2 Technical': 'Technical Round 2',
  'HR Round': 'HR Round',
  'Manager Round': 'Manager Round',
  'Client Round': 'Final Round',
};

const INTERVIEW_STATUS_MAP: Record<string, string> = {
  Scheduled: 'Scheduled',
  Confirmed: 'Confirmed',
  'In Progress': 'Pending',
  Completed: 'Passed',
  Passed: 'Passed',
  Rejected: 'Rejected',
  Rescheduled: 'Scheduled',
  Cancelled: 'Rejected',
};

function idOf(doc: any): string {
  return doc?._id ? String(doc._id) : String(doc || '');
}

function formatDate(value?: Date | string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value?: Date | string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function relativeTime(value?: Date | string | null): string {
  if (!value) return 'Just now';
  const d = new Date(value);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function formatBudgetDisplay(budgetRange?: { min?: number; max?: number; currency?: string } | null, budgetText?: string | null): string | undefined {
  if (budgetText && budgetText.trim()) {
    return budgetText.trim();
  }
  if (!budgetRange) return undefined;
  const { min = 0, max = 0, currency = 'INR' } = budgetRange;
  if (!min && !max) return undefined;

  if (currency === 'INR') {
    if (min >= 100000 || max >= 100000) {
      const minL = (min / 100000).toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
      const maxL = (max / 100000).toFixed(2).replace(/\.00$/, '').replace(/(\.[1-9])0$/, '$1');
      if (min > 0 && max > 0 && min !== max) {
        return `INR ${minL} - ${maxL} LPA`;
      }
      if (max > 0 && min === max) {
        return `INR ${maxL} LPA`;
      }
      if (max > 0 && min === 0) {
        return `Up to INR ${maxL} LPA`;
      }
      if (min > 0 && max === 0) {
        return `INR ${minL} LPA`;
      }
    }
    if (min > 0 && max > 0 && min !== max) {
      return `₹${min.toLocaleString('en-IN')} - ₹${max.toLocaleString('en-IN')}`;
    }
    if (max > 0) {
      return `₹${max.toLocaleString('en-IN')}`;
    }
  }

  const symbol = currency === 'USD' ? '$' : `${currency} `;
  if (min > 0 && max > 0 && min !== max) {
    return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
  }
  if (max > 0) {
    return `${symbol}${max.toLocaleString()}`;
  }
  return undefined;
}

export function mapRequirement(r: any) {
  const recruiterNames = r.assignedRecruiterNames || '';
  const fallbackOwner = recruiterNames || r.assignedLeadName || 'Unassigned';
  const assignmentStatus = r.assignmentStatus || (fallbackOwner !== 'Unassigned' ? 'Assigned' : 'Unassigned');
  const owner = assignmentStatus === 'Unassigned' ? 'Unassigned' : fallbackOwner;
  const status = r.status === 'In Progress' ? 'Active' : (r.status || (assignmentStatus === 'Assigned' ? 'Assigned' : 'Open'));
  // reqCode is the stored application ID; id/displayId add the client's reference in brackets.
  const code = r.reqCode || idOf(r);
  const displayId = displayRequirementId(code, r.sourceClientJdId);

  return {
    id: displayId,
    displayId,
    _id: idOf(r),
    reqCode: code,
    sourceClientJdId: r.sourceClientJdId || null,
    title: r.title,
    client: r.clientName || '',
    priority: r.priority === 'Urgent' ? 'High' : r.priority || 'Medium',
    status,
    submissions: r.submissionsCount || 0,
    interviews: r.interviewsCount || 0,
    placed: r.placedCount || 0,
    dueDate: formatDate(r.dueDate),
    openings: r.openings || 1,
    budget: formatBudgetDisplay(r.budgetRange, r.budgetText),
    budgetText: r.budgetText || undefined,
    budgetRange: r.budgetRange || undefined,
    skills: r.skillsRequired || [],
    location: r.location,
    assignmentStatus,
    assignedLead: r.assignedLeadName,
    assignedRecruiterNames: recruiterNames,
    revokeRequested: r.revokeRequested,
    revokeReason: r.revokeReason,
    emailArrivedTime: r.emailArrivedTime ? formatDateTime(r.emailArrivedTime) : undefined,
    emailArrivedTimeRaw: r.emailArrivedTime ? new Date(r.emailArrivedTime).toISOString() : undefined,
    owner,
    clientEmail: r.clientEmail || (r.toEmails && r.toEmails.length > 0 ? r.toEmails[0] : (r.clientName && r.clientName.includes('@') ? r.clientName : undefined)),
    toEmails: r.toEmails || [],
    ccEmails: r.ccEmails || [],
    description: r.description || '',
    employmentType: r.employmentType || '',
    workMode: r.workMode || '',
    noticePeriod: r.noticePeriod || '',
    experienceLevel: r.experienceLevel || '',
    experienceRange: r.experienceRange || { min: 0, max: 0 },
    experience: r.experienceRange
      ? (r.experienceRange.max == null
          ? (r.experienceRange.min ? `${r.experienceRange.min}+ yrs` : '')
          : r.experienceRange.min === r.experienceRange.max
            ? (r.experienceRange.min ? `${r.experienceRange.min} yrs` : '')
            : `${r.experienceRange.min}-${r.experienceRange.max} yrs`)
      : '',
    mandatorySkills: r.mandatorySkills || [],
    conversationId: r.conversationId || undefined,
    inReplyTo: r.inReplyTo || undefined,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
    firstDetectedAt: r.firstDetectedAt ? new Date(r.firstDetectedAt).toISOString() : (r.createdAt ? new Date(r.createdAt).toISOString() : undefined),
    first_detected_at: r.firstDetectedAt ? new Date(r.firstDetectedAt).toISOString() : (r.createdAt ? new Date(r.createdAt).toISOString() : undefined),
    lastUpdatedAt: r.lastUpdatedAt ? new Date(r.lastUpdatedAt).toISOString() : (r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined),
    last_updated_at: r.lastUpdatedAt ? new Date(r.lastUpdatedAt).toISOString() : (r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined),
    sourceEmailReceivedAt: r.sourceEmailReceivedAt ? new Date(r.sourceEmailReceivedAt).toISOString() : (r.emailArrivedTime ? new Date(r.emailArrivedTime).toISOString() : undefined),
    source_email_received_at: r.sourceEmailReceivedAt ? new Date(r.sourceEmailReceivedAt).toISOString() : (r.emailArrivedTime ? new Date(r.emailArrivedTime).toISOString() : undefined),
    lastSeenAt: r.lastSeenAt ? new Date(r.lastSeenAt).toISOString() : (r.emailArrivedTime ? new Date(r.emailArrivedTime).toISOString() : undefined),
    last_seen_at: r.lastSeenAt ? new Date(r.lastSeenAt).toISOString() : (r.emailArrivedTime ? new Date(r.emailArrivedTime).toISOString() : undefined),
  };
}

export function mapSubmission(s: any) {
  const cand = s.candidateId && typeof s.candidateId === 'object' ? s.candidateId : null;
  const req = s.requirementId && typeof s.requirementId === 'object' ? s.requirementId : null;
  const client = s.clientId && typeof s.clientId === 'object' ? s.clientId : null;
  const rec = s.recruiterId && typeof s.recruiterId === 'object' ? s.recruiterId : null;
  const score = typeof s.matchScore === 'number'
    ? Math.round(s.matchScore <= 1 ? s.matchScore * 100 : s.matchScore)
    : 85;
  return {
    id: s.submissionId || idOf(s),
    _id: idOf(s),
    candidate: cand?.name || s.candidateName || 'Candidate',
    req: req?.reqCode || s.req || '',
    client: client?.clientName || req?.clientName || s.clientName || '',
    date: formatDate(s.submittedAt || s.createdAt),
    stage: s.stage || 'Submitted',
    match: `${score}%`,
    recruiter: rec?.name || s.recruiterName || '',
    email: cand?.email,
    phone: cand?.phone,
    experience: cand?.totalExperienceYears != null ? `${cand.totalExperienceYears} years` : undefined,
    submittedAt: s.submittedAt ? new Date(s.submittedAt).toISOString() : undefined,
    createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : undefined,
    updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : undefined,
  };
}

export function mapInterview(iv: any, extras?: { candidateName?: string; title?: string; clientName?: string; recruiterName?: string }) {
  const cand = iv.candidateId && typeof iv.candidateId === 'object' ? iv.candidateId : null;
  const req = iv.requirementId && typeof iv.requirementId === 'object' ? iv.requirementId : null;
  return {
    id: iv.interviewId || idOf(iv),
    _id: idOf(iv),
    candidate: extras?.candidateName || cand?.name || 'Candidate',
    position: extras?.title || req?.title || '',
    client: extras?.clientName || req?.clientName || '',
    stage: ROUND_MAP[iv.round] || iv.round || 'Screening',
    date: formatDateTime(iv.dateTime),
    recruiter: extras?.recruiterName || '',
    status: INTERVIEW_STATUS_MAP[iv.status] || iv.status || 'Scheduled',
    notes: iv.notes || '',
  };
}

export function mapActivityLog(log: any) {
  const details = log.details;
  const detailsText = typeof details === 'string'
    ? details
    : details && typeof details === 'object'
      ? details.message || details.summary || JSON.stringify(details)
      : undefined;
  return {
    id: idOf(log),
    timestamp: relativeTime(log.createdAt),
    createdAt: log.createdAt ? new Date(log.createdAt).toISOString() : undefined,
    userName: log.userName,
    userEmail: log.userEmail,
    userRole: log.userRole,
    userAvatar: String(log.userName || 'U').charAt(0).toUpperCase(),
    action: log.action,
    category: log.category,
    targetEntity: log.targetEntity,
    targetId: log.targetId,
    clientName: log.clientName,
    ipAddress: log.ipAddress || '—',
    status: log.status || 'Success',
    details: detailsText,
  };
}

export function mapCandidate(c: any) {
  return {
    id: c.candidateId || idOf(c),
    _id: idOf(c),
    submissionDate: formatDate(c.createdAt),
    name: c.name,
    company: c.currentCompany || '',
    phone: c.phone,
    email: c.email,
    linkedIn: c.linkedInUrl || '',
    qualification: c.qualification || '',
    skills: Array.isArray(c.skills) ? c.skills.join(', ') : c.skills || '',
    technologies: Array.isArray(c.skills) ? c.skills.join(', ') : '',
    totalExperience: c.totalExperienceYears != null ? `${c.totalExperienceYears} Years` : '',
    relevantExperience: c.relevantExperienceYears != null ? `${c.relevantExperienceYears} Years` : '',
    currentCtc: c.currentCtc ? `${c.currentCtc}` : '',
    expectedCtc: c.expectedCtc ? `${c.expectedCtc}` : '',
    noticePeriod: c.noticePeriodDays != null ? `${c.noticePeriodDays} days` : '',
    currentLocation: c.currentLocation || '',
    preferredLocation: c.preferredLocation || '',
    offerInHand: c.offerInHand === 'Yes' || c.offerInHand === 'In Pipeline' ? c.offerInHand : 'No',
    notes: '',
    status: c.status === 'Interviewing' ? 'In Review' : c.status || 'New',
  };
}

export function mapClient(c: any, stats?: { activeReqs?: number; submissions?: number; placements?: number }) {
  const poc = Array.isArray(c.pocContacts) && c.pocContacts[0] ? c.pocContacts[0] : {};
  return {
    id: c.clientId || idOf(c),
    _id: idOf(c),
    name: c.clientName,
    domain: c.domain || '',
    pocName: poc.name || '',
    pocEmail: poc.email || '',
    pocPhone: poc.phone || '',
    location: poc.location || poc.designation || '',
    teamLead: c.accountLeadName || '',
    teamMemberCount: 0,
    teamMembers: [],
    activeReqs: stats?.activeReqs || 0,
    totalSubmissions: stats?.submissions || 0,
    totalPlacements: stats?.placements || 0,
    commercialFee: '8.33% Annual CTC',
    paymentTerms: '30 Days Net',
    slaTAT: `${c.slaDays || 5} Days`,
    agreementStatus: c.status === 'Active' ? 'Active - Executed' : 'Pending Signature',
    agreementStartDate: formatDate(c.createdAt),
    agreementEndDate: '',
    agreementDocName: c.agreementsUrl || '',
    signedBy: '',
    signedDate: '',
  };
}

export { formatDate, formatDateTime, idOf };
