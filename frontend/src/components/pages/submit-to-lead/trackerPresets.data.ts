export const VENDOR_NAME = 'Metaforgeit'
export const SUPPLIER_NAME = 'Shaum'
export const PREVIOUS_AVAILABLE_DOCUMENTS = 'Available Documents\u200b'

export interface TrackerPreset {
  headerColor: string
  columns: string[]
  subtitle: string
}

export const CLIENT_TRACKER_PRESETS: Record<string, TrackerPreset> = {
  'ITC infotech': {
    headerColor: '#FFFF00',
    subtitle: 'ITC Infotech layout: 18 columns in the client submission order.',
    columns: [
      'S.No',
      'Skill',
      'Candidate Name',
      'Total Experience',
      'Relevant Experience',
      'Candidate Mobile Number',
      'Email ID',
      'Current Payroll Company',
      'CTC',
      'ECTC',
      'Official Notice Period / Serving NP (LWD Date)',
      'Current Location',
      'Work Location',
      'Highest Education',
      'Interview Date',
      'Interview Time',
      'SO Number',
      'Status',
    ],
  },
  LTTS: {
    headerColor: '#FFB800',
    subtitle: 'LTTS layout: 17 columns in the client submission order.',
    columns: [
      'S.No',
      'Vendor Name',
      'BU/IS',
      'Position/ Title',
      'Skill',
      'Resumes sent Date (DDMMYY)',
      'Full Name of the candidate',
      'Status',
      'MOBILE NO',
      'Mail ID',
      'NP(Days)',
      'Total Exp',
      'Relevant Exp',
      'Current Location',
      'Job Location',
      'Current Organization',
      'Rate per Month',
    ],
  },
  KPMG: {
    headerColor: '#D6E3F0',
    subtitle: 'KPMG layout: 15 columns in the client submission order.',
    columns: [
      'Submission Date',
      'Name of Candidate',
      'Email ID',
      'Contact Number',
      'Skill',
      'Current Company',
      'Total Experience',
      'Relevant Experience',
      'Current Location',
      'Preferred Location',
      'Contract/Fulltime',
      'Current CTC',
      'Expected CTC',
      'Notice Period',
      'Vendor',
    ],
  },
  Deloitte: {
    headerColor: '#C5E0B4',
    subtitle: 'Deloitte layout: 14 columns in the client submission order.',
    columns: [
      'S.No',
      'Candidate Name',
      'Email ID',
      'Contact Number',
      'Skill',
      'Total Experience',
      'Relevant Experience',
      'Current Company',
      'Current Location',
      'Preferred Location',
      'Current CTC',
      'Expected CTC',
      'Notice Period',
      'Availability for Interview',
    ],
  },
  PWC: {
    headerColor: '#FCE4D6',
    subtitle: 'PWC layout: 15 columns in the client submission order.',
    columns: [
      'Sl No',
      'Submission Date',
      'Candidate Name',
      'Contact Number',
      'Email ID',
      'Skill',
      'Total Experience',
      'Relevant Experience',
      'Current Company',
      'Current Location',
      'Preferred Location',
      'Current CTC',
      'Expected CTC',
      'Notice Period',
      'Availability for Interview',
    ],
  },
  Accenture: {
    headerColor: '#D9D2E9',
    subtitle: 'Accenture layout: 38 columns in the client submission order.',
    columns: [
      'Sl. NO',
      'RV ID',
      'Date of Submission',
      'Candidate DOB',
      'Req ID',
      'Beeline ID',
      'First Name (As per Govt ID )',
      'Last Name (As per Govt ID)',
      'Contact Number',
      'Email ID',
      'Gender',
      'Primary Skill',
      'Total Experience',
      'Relevant Experience',
      'Current Location',
      'Job Location',
      'Notice Period in days',
      'Acc Ex Emp/Cont',
      'Ex Employee- EMP ID(Share EMP ID and Enterprise ID)',
      'Current CTC (Monthly)',
      'Exp CTC (Monthly)',
      'Mark up %',
      'Final Bill Rate Monthly (Exp CTC + mark up)',
      'Supplier name',
      'Current Employer Name',
      'Available Documents',
      'Previous Employer Name',
      PREVIOUS_AVAILABLE_DOCUMENTS,
      'Highest Education',
      'Name of college for highest education',
      'Name of University for highest education',
      'Technical Evaluation',
      'Technical Assessment proof attched in Resume',
      'PAN Card Number',
      'OT Amount',
      'Platform',
      'Linkedin ID',
      'Remarks',
    ],
  },
  'Metaforge ( internal )': {
    headerColor: '#C5E0B4',
    subtitle: 'Metaforge ( internal ) layout: 18 columns in the client submission order.',
    columns: [
      'Sl No',
      'Submission Date',
      'Candidate Name',
      'Skillset',
      'Contact Number',
      'Email id',
      'Total Yrs of Exp',
      'Relevant Exp',
      'Current Company',
      'Current CTC',
      'Notice period',
      'Current Location',
      'Preferred Location',
      'Availability for Interview',
      'Reason',
      'Offer in Hand',
      'Linkedin URL',
      'Educational Qualification',
    ],
  },
  'ED - Eximietas Design': {
    headerColor: '#B4D5E5',
    subtitle: 'ED - Eximietas Design layout: 18 columns in the client submission order.',
    columns: [
      'Submission Date',
      'Name of candidate',
      'Email ID',
      'Contact Number',
      'Skill',
      'Current company',
      'Total Experience',
      'Relevant Experience',
      'Current Location',
      'Preferred Location',
      'Contract/ Fulltime',
      'Current CTC',
      'Expected CTC',
      'Notice Period',
      'Vendor',
      'Reason for job change',
      'offer in hand',
      'Highest Qualification',
    ],
  },
}

export function columnLabel(column: string): string {
  return column.replace(/\u200b/g, '')
}

export function resolveClientPreset(clientName?: string | null): string {
  const name = String(clientName || '').trim().toLowerCase()
  if (CLIENT_TRACKER_PRESETS[clientName || '']) return String(clientName)
  if (name.includes('itc')) return 'ITC infotech'
  if (name.includes('ltts') || name.includes('l&t') || name.includes('l & t')) return 'LTTS'
  if (name.includes('kpmg')) return 'KPMG'
  if (name.includes('deloitte')) return 'Deloitte'
  if (name.includes('pwc') || name.includes('pricewaterhouse')) return 'PWC'
  if (name.includes('accenture')) return 'Accenture'
  if (name.includes('eximietas') || name === 'ed' || name.startsWith('ed -') || name.startsWith('ed-')) return 'ED - Eximietas Design'
  if (name.includes('metaforge')) return 'Metaforge ( internal )'
  return 'Metaforge ( internal )'
}

export function submissionIntroduction(role?: string | null): string {
  return `I hope you are doing well. Please find the attached resume and tracker below for the Role - ${String(role || '').trim()}.`
}

const LAYOUT_KEY = 'metaforge.submitTracker.layouts.v2'

interface SavedLayout {
  columns: string[]
  hidden: string[]
  headerColor: string
}

function readLayouts(): Record<string, SavedLayout> {
  if (typeof window === 'undefined') return {}
  try {
    const parsed = JSON.parse(window.localStorage.getItem(LAYOUT_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function columnsForClient(clientKey: string): { columns: string[]; hidden: string[]; headerColor: string } {
  const preset = CLIENT_TRACKER_PRESETS[clientKey] || CLIENT_TRACKER_PRESETS['Metaforge ( internal )'] || Object.values(CLIENT_TRACKER_PRESETS)[0]
  const saved = readLayouts()[clientKey]
  if (!saved || !Array.isArray(saved.columns) || saved.columns.length === 0) {
    return { columns: [...preset.columns], hidden: [], headerColor: preset.headerColor }
  }
  const savedSet = new Set(saved.columns)
  const isSubset = preset.columns.every(col => savedSet.has(col))
  if (!isSubset) {
    return { columns: [...preset.columns], hidden: [], headerColor: preset.headerColor }
  }
  const columns = [...saved.columns]
  const known = new Set(columns)
  for (const column of preset.columns) {
    if (!known.has(column)) columns.push(column)
  }
  return {
    columns,
    hidden: Array.isArray(saved.hidden) ? saved.hidden : [],
    headerColor: saved.headerColor || preset.headerColor,
  }
}

export function saveTrackerLayout(clientKey: string, layout: SavedLayout): void {
  if (typeof window === 'undefined' || !clientKey) return
  const layouts = readLayouts()
  layouts[clientKey] = {
    columns: layout.columns,
    hidden: layout.hidden,
    headerColor: layout.headerColor,
  }
  window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layouts))
}

export interface TrackerCandidate {
  name?: string
  email?: string
  phone?: string
  linkedIn?: string
  technology?: string
  totalExperience?: string
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
  candidateId?: string
}

export interface TrackerContext {
  requirement?: { id?: string; title?: string; client?: string; location?: string; skills?: string[] } | null
  recruiterName?: string
  submittedOn?: Date
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function formatDate(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`
}

function formatShortDate(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${String(date.getFullYear()).slice(-2)}`
}

function splitName(name?: string): { first: string; last: string } {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  return { first: parts[0] || '', last: parts.slice(1).join(' ') }
}

function publicCandidateCode(candidate: TrackerCandidate): string {
  const code = String(candidate.candidateId || '').trim()
  if (!code || /^[a-f0-9]{24}$/i.test(code)) return ''
  return code
}

function skillText(candidate: TrackerCandidate, context: TrackerContext): string {
  return String(candidate.skills || candidate.technology || context.requirement?.skills?.join(', ') || '').trim()
}

export function monthlyBillRate(expectedMonthly: string, markup: string): string {
  const expectedText = String(expectedMonthly || '').trim()
  const markupText = String(markup || '').trim()
  if (!expectedText || !markupText || /lpa/i.test(expectedText)) return ''
  const expected = Number(expectedText.replace(/,/g, '').replace(/[^\d.]/g, ''))
  const mark = Number(markupText.replace(/[^\d.]/g, ''))
  if (!Number.isFinite(expected) || !Number.isFinite(mark)) return ''
  const total = Math.round(expected * (1 + mark / 100))
  return `₹${total.toLocaleString('en-IN')}`
}

export function applyBillRate(row: Record<string, string>, editedColumn?: string): Record<string, string> {
  const finalKey = 'Final Bill Rate Monthly (Exp CTC + mark up)' in row
    ? 'Final Bill Rate Monthly (Exp CTC + mark up)'
    : ('Final Bill Rate Monthly' in row ? 'Final Bill Rate Monthly' : null)

  if (!finalKey) return row
  if (editedColumn === finalKey) return row

  const expected = row['Exp CTC (Monthly)'] || row['Expected CTC (Monthly)'] || ''
  const markup = row['Mark up %'] || row['Markup %'] || ''
  if (!expected.trim() || !markup.trim()) {
    if (
      editedColumn === 'Exp CTC (Monthly)' ||
      editedColumn === 'Expected CTC (Monthly)' ||
      editedColumn === 'Mark up %' ||
      editedColumn === 'Markup %'
    ) {
      return { ...row, [finalKey]: '' }
    }
    return row
  }
  return { ...row, [finalKey]: monthlyBillRate(expected, markup) }
}

export function buildTrackerRow(
  columns: string[],
  candidate: TrackerCandidate,
  index: number,
  context: TrackerContext = {},
): Record<string, string> {
  const submittedOn = context.submittedOn || new Date()
  const fullDate = formatDate(submittedOn)
  const shortDate = formatShortDate(submittedOn)
  const { first, last } = splitName(candidate.name)
  const skills = skillText(candidate, context)
  const skillParts = skills.split(',').map(part => part.trim()).filter(Boolean)
  const jobLocation = String(context.requirement?.location || candidate.preferredLocation || '').trim()
  const values: Record<string, string> = {
    'Sl No': String(index + 1),
    'Sl.No': String(index + 1),
    'Sl. No': String(index + 1),
    'Sl. NO': String(index + 1),
    'S.No': String(index + 1),
    'Submission Date': fullDate,
    'Profile Submission Date': fullDate,
    'Date of Submission': fullDate,
    'Resumes Sent Date (DDMMYY)': shortDate,
    'Resumes sent Date (DDMMYY)': shortDate,
    Skillset: skills,
    Skill: skills,
    'Primary Skill': skills,
    'Mandatory Skill': skillParts[0] || skills,
    'Skill Combinations': skillParts.length > 1 ? skillParts.slice(1).join(', ') : '',
    'Candidate Name': candidate.name || '',
    'Name of Candidate': candidate.name || '',
    'Name of candidate': candidate.name || '',
    'Full Name of Candidate': candidate.name || '',
    'Full Name of the candidate': candidate.name || '',
    'First Name': first,
    'First Name (As per Govt ID )': first,
    'First Name (As per Govt ID)': first,
    'Last Name': last,
    'Last Name (As per Govt ID)': last,
    'Contact Number': candidate.phone || '',
    'Mobile No': candidate.phone || '',
    'MOBILE NO': candidate.phone || '',
    'Candidate Mobile Number': candidate.phone || '',
    'Email ID': candidate.email || '',
    'Email id': candidate.email || '',
    'Mail ID': candidate.email || '',
    Gender: '',
    'Candidate DOB': '',
    'Beeline ID': '',
    'Total Yrs of Exp': candidate.totalExperience || '',
    'Total Experience': candidate.totalExperience || '',
    'Total Exp': candidate.totalExperience || '',
    'Relevant Exp': candidate.relevantExperience || '',
    'Relevant Experience': candidate.relevantExperience || '',
    'Current Company': candidate.currentCompany || '',
    'Current company': candidate.currentCompany || '',
    'Current Organization': candidate.currentCompany || '',
    'Current Employer Name': candidate.currentCompany || '',
    'Current Payroll Company': candidate.currentCompany || '',
    'Current CTC': candidate.currentCtc || '',
    CTC: candidate.currentCtc || '',
    'Current CTC (Monthly)': '',
    'Exp CTC (Monthly)': '',
    'Expected CTC (Monthly)': '',
    'Mark up %': '',
    'Markup %': '',
    'Final Bill Rate Monthly (Exp CTC + mark up)': '',
    'Final Bill Rate Monthly': '',
    'Expected CTC/Rate Card': candidate.expectedCtc || '',
    'Expected CTC': candidate.expectedCtc || '',
    ECTC: candidate.expectedCtc || '',
    'Rate Card': candidate.expectedCtc || '',
    'Rate per Month': candidate.expectedCtc || '',
    'Notice Period': candidate.noticePeriod || '',
    'Notice period': candidate.noticePeriod || '',
    'Notice Period in days': candidate.noticePeriod || '',
    'Notice Period in Days': candidate.noticePeriod || '',
    'NP (Days)': candidate.noticePeriod || '',
    'NP(Days)': candidate.noticePeriod || '',
    'Official Notice Period / Serving NP (LWD Date)': candidate.noticePeriod || '',
    'Acc Ex Emp/Cont': 'No',
    'Ex Employee- EMP ID(Share EMP ID and Enterprise ID)': '',
    'Ex Employee-EMP ID': '',
    'Current Location': candidate.currentLocation || '',
    'Preferred Location': candidate.preferredLocation || '',
    'Job Location': jobLocation,
    'Work Location': jobLocation,
    'Availability for Interview': candidate.interviewAvailability || '',
    Availability: candidate.interviewAvailability || '',
    Reason: candidate.reasonForChange || '',
    Remarks: candidate.reasonForChange || '',
    'Remarks for Accenture': candidate.reasonForChange || '',
    'Reason for job change': candidate.reasonForChange || '',
    'Offer in Hand': candidate.offerInHand || '',
    'offer in hand': candidate.offerInHand || '',
    'LinkedIn URL': candidate.linkedIn || '',
    'Linkedin URL': candidate.linkedIn || '',
    'Linkedin ID': candidate.linkedIn || '',
    'LinkedIn ID': candidate.linkedIn || '',
    'Last Full-Time Qualification': candidate.qualification || '',
    'Highest Education': candidate.qualification || '',
    'Educational Qualification': candidate.qualification || '',
    'Highest Qualification': candidate.qualification || '',
    'Available Documents': 'Yes',
    'Previous Employer Name': '',
    [PREVIOUS_AVAILABLE_DOCUMENTS]: 'Yes',
    'Name of college for highest education': '',
    'College Name': '',
    'Name of University for highest education': '',
    'University Name': '',
    'Technical Evaluation': 'Passed',
    'Technical Assessment proof attched in Resume': 'Attached',
    'Technical Assessment Proof Attached in Resume': 'Attached',
    'PAN Card Number': '',
    'OT Amount': 'NA',
    Platform: '',
    Vendor: VENDOR_NAME,
    'Vendor Name': VENDOR_NAME,
    'Supplier Name': SUPPLIER_NAME,
    'Supplier name': SUPPLIER_NAME,
    'Recruiter Name': context.recruiterName || '',
    Account: context.requirement?.client || '',
    'BU/IS': '',
    'Position/Title': context.requirement?.title || '',
    'Position/ Title': context.requirement?.title || '',
    'Req ID': context.requirement?.id || '',
    'RV ID': publicCandidateCode(candidate),
    'Contract/Fulltime': 'Fulltime',
    'Contract/ Fulltime': 'Fulltime',
    'Interview Date': '',
    'Interview Time': '',
    'SO Number': '',
    Status: 'Submitted',
  }

  const row: Record<string, string> = {}
  for (const column of columns) {
    row[column] = values[column] || ''
  }
  return applyBillRate(row)
}
