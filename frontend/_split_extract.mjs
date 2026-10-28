import fs from 'fs'
import path from 'path'

const PAGES = path.join('src', 'components', 'pages')

function load(name) {
  return fs.readFileSync(path.join(PAGES, name), 'utf8').split(/(?<=\n)/)
}

function body(lines, start, end) {
  return lines.slice(start - 1, end).join('')
}

function write(rel, content) {
  const p = path.join(PAGES, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  if (!content.endsWith('\n')) content += '\n'
  fs.writeFileSync(p, content, 'utf8')
  const n = content.split('\n').length - (content.endsWith('\n') ? 1 : 0)
  const flag = n > 200 ? ' OVER' : ''
  console.log(String(n).padStart(4) + flag + '  ' + rel)
}

const it = load('InterviewTrackingPage.tsx')
const rp = load('ReportsPage.tsx')
const hp = load('HistoryPage.tsx')
const al = load('ActivityLogsPage.tsx')

write(
  'interview-tracking/types.ts',
  `import { Interview, Role } from '../../../types'

${body(it, 41, 84)}
${body(it, 340, 355)}
export type InterviewStatusToggle = 'upcoming' | 'in_progress' | 'completed' | 'rejections' | 'all' | 'onboarding'
export type InterviewScopeTab = 'my_interviews' | 'team_members' | 'all'
export type OfferOutcomeFilter = 'all' | 'joined' | 'not_joined' | 'pending'
export type CalendarStateFilter = 'all' | 'Upcoming' | 'In Progress' | 'Completed'

export interface InterviewTrackingPageProps {
  role?: Role
  interviews?: Interview[]
  onOpenFeedbackModal?: (iv: Interview) => void
}
`
)

write('interview-tracking/rejected.data.ts', "import { RejectedCandidateRowItem } from './types'\n\nexport " + body(it, 86, 193))
write('interview-tracking/schedule.data.ts', "import { ScheduleRowItem } from './types'\n\nexport " + body(it, 194, 338))
write('interview-tracking/offerLetters.data.ts', "import { OfferLetterRowItem } from './types'\n\nexport " + body(it, 357, 434))
write('interview-tracking/finalDecisions.data.ts', "import { FinalDecisionRowItem } from './types'\n\nexport " + body(it, 436, 473))

write(
  'reports/types.ts',
  `import { Role } from '../../../types'
import { RecruiterDetailData } from '../RecruiterDetailAnalyticsPage'
import { ClientPerformanceData } from '../ClientDetailAnalyticsPage'

export interface ClientSubmissionInfo {
  client: string
  submissions: number
}

export interface SubmittedClientsPillCellProps {
  clients: string[]
  onSelectClient?: (clientName: string) => void
  activeClient?: string
}

export interface RecruiterReqDashboardItem {
  id: string
  recruiterName: string
  recruiterRole?: string
  teamLead?: string
  reqId: string
  jobTitle: string
  positions: number
  clientName: string
  submissionsCount: number
  timestamp: string
  receivedTime: string
  firstSubmissionTime: string
  tat: string
  status: 'In Progress' | 'Target Achieved' | 'Active Sourcing' | 'Submissions Completed'
}

export interface ReportsPageProps {
  role?: Role
  initialMainTab?: 'performance' | 'history' | 'audit' | 'client_performance'
}

export interface ClientPerformanceTabContentProps {
  clientPerformanceList: ClientPerformanceData[]
  onSelectClient: (client: ClientPerformanceData) => void
}

export interface SubmissionsDashboardConfig {
  type?: 'recruiter_self' | 'lead_self' | 'team_members_only' | 'overall_company'
  title?: string
  subtitle?: string
  leadName?: string
}

export type ReportsMainTab = 'performance' | 'history' | 'audit' | 'client_performance'
export type { RecruiterDetailData, ClientPerformanceData }
`
)

write(
  'reports/calculateTAT.ts',
  `export function calculateTAT(receivedTime?: string, firstSubmissionTime?: string): string {
  if (!receivedTime || !firstSubmissionTime) return '3h 30m'
  try {
    const d1 = new Date(receivedTime)
    const d2 = new Date(firstSubmissionTime)
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return '3h 30m'
    const diffMs = Math.max(0, d2.getTime() - d1.getTime())
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    if (diffHrs >= 24) {
      const days = Math.floor(diffHrs / 24)
      const remHrs = diffHrs % 24
      return \`\${days}d \${remHrs}h\`
    }
    return \`\${diffHrs}h \${diffMins}m\`
  } catch {
    return '3h 30m'
  }
}
`.replace(/\\`/g, '`').replace(/\\\$/g, '$')
)

write(
  'reports/dashboardData.part1.ts',
  "import { RecruiterReqDashboardItem } from './types'\n\nexport const RECRUITER_REQ_SUBMISSION_DASHBOARD_DATA_PART1: RecruiterReqDashboardItem[] = [\n" +
    body(rp, 201, 328) +
    ']\n'
)
write(
  'reports/dashboardData.part2.ts',
  "import { RecruiterReqDashboardItem } from './types'\n\nexport const RECRUITER_REQ_SUBMISSION_DASHBOARD_DATA_PART2: RecruiterReqDashboardItem[] = [\n" +
    body(rp, 329, 440) +
    ']\n'
)
write(
  'reports/dashboardData.ts',
  `import { RecruiterReqDashboardItem } from './types'
import { RECRUITER_REQ_SUBMISSION_DASHBOARD_DATA_PART1 } from './dashboardData.part1'
import { RECRUITER_REQ_SUBMISSION_DASHBOARD_DATA_PART2 } from './dashboardData.part2'

export const RECRUITER_REQ_SUBMISSION_DASHBOARD_DATA: RecruiterReqDashboardItem[] = [
  ...RECRUITER_REQ_SUBMISSION_DASHBOARD_DATA_PART1,
  ...RECRUITER_REQ_SUBMISSION_DASHBOARD_DATA_PART2,
]
`
)

write(
  'reports/SubmittedClientsPillCell.tsx',
  `import React, { useState } from 'react'
import { Building2, ChevronDown, X } from 'lucide-react'
import { SubmittedClientsPillCellProps } from './types'

export function SubmittedClientsPillCell({ clients, onSelectClient, activeClient }: SubmittedClientsPillCellProps) {
` +
    body(rp, 75, 161) +
    '}\n'
)

write(
  'reports/ClientPerformanceTabContent.tsx',
  `import React, { useState, useMemo } from 'react'
import { Building2, Search, X, ArrowUpRight } from 'lucide-react'
import { PaginationFooter } from '../../ui/PaginationFooter'
import { ClientPerformanceTabContentProps } from './types'
import { ClientPerformanceTable } from './ClientPerformanceTable'
import { ClientPerformanceDrilldownModal } from './ClientPerformanceDrilldownModal'

export function ClientPerformanceTabContent({
  clientPerformanceList,
  onSelectClient,
}: ClientPerformanceTabContentProps) {
` +
    body(rp, 457, 475) +
    `
  return (
    <div className="space-y-6 font-sans">
` +
    body(rp, 479, 508) +
    `
      <ClientPerformanceTable
        paginatedClients={paginatedClients}
        onSelectClient={onSelectClient}
        setDrillDownModal={setDrillDownModal}
        currentPage={currentPage}
        totalPages={totalPages}
        filteredCount={filteredClients.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />
      {drillDownModal && (
        <ClientPerformanceDrilldownModal
          drillDownModal={drillDownModal}
          setDrillDownModal={setDrillDownModal}
          onSelectClient={onSelectClient}
        />
      )}
    </div>
  )
}
`
)

write(
  'reports/ClientPerformanceTable.tsx',
  `import React from 'react'
import { Building2 } from 'lucide-react'
import { PaginationFooter } from '../../ui/PaginationFooter'
import { ClientPerformanceData } from '../ClientDetailAnalyticsPage'

type Metric = 'reqSent' | 'reqAssigned' | 'submissions' | 'openReqs' | 'closedReqs'

interface Props {
  paginatedClients: ClientPerformanceData[]
  onSelectClient: (client: ClientPerformanceData) => void
  setDrillDownModal: (v: { client: ClientPerformanceData; metric: Metric } | null) => void
  currentPage: number
  totalPages: number
  filteredCount: number
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange: (s: number) => void
}

export function ClientPerformanceTable({
  paginatedClients,
  onSelectClient,
  setDrillDownModal,
  currentPage,
  totalPages,
  filteredCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: Props) {
  return (
` +
    body(rp, 510, 637) +
    `
  )
}
`
)

write(
  'reports/ClientPerformanceDrilldownModal.tsx',
  `import React from 'react'
import { Building2, X, ArrowUpRight } from 'lucide-react'
import { ClientPerformanceData } from '../ClientDetailAnalyticsPage'

type Metric = 'reqSent' | 'reqAssigned' | 'submissions' | 'openReqs' | 'closedReqs'

interface Props {
  drillDownModal: { client: ClientPerformanceData; metric: Metric }
  setDrillDownModal: (v: { client: ClientPerformanceData; metric: Metric } | null) => void
  onSelectClient: (client: ClientPerformanceData) => void
}

export function ClientPerformanceDrilldownModal({
  drillDownModal,
  setDrillDownModal,
  onSelectClient,
}: Props) {
  return (
` +
    body(rp, 641, 730) +
    `
  )
}
`
)

write(
  'reports/clientPerformance.data.ts',
  `import { ClientPerformanceData } from '../ClientDetailAnalyticsPage'

export const CLIENT_PERFORMANCE_LIST: ClientPerformanceData[] = [
` +
    body(rp, 963, 1080) +
    ']\n'
)

write(
  'reports/recruitersPerformance.part1.ts',
  `import { RecruiterDetailData } from '../RecruiterDetailAnalyticsPage'

export const RECRUITERS_PERFORMANCE_LIST_PART1: RecruiterDetailData[] = [
` +
    body(rp, 1088, 1243) +
    ']\n'
)
write(
  'reports/recruitersPerformance.part2.ts',
  `import { RecruiterDetailData } from '../RecruiterDetailAnalyticsPage'

export const RECRUITERS_PERFORMANCE_LIST_PART2: RecruiterDetailData[] = [
` +
    body(rp, 1248, 1378) +
    ']\n'
)
write(
  'reports/recruitersPerformance.data.ts',
  `import { RecruiterDetailData } from '../RecruiterDetailAnalyticsPage'
import { RECRUITERS_PERFORMANCE_LIST_PART1 } from './recruitersPerformance.part1'
import { RECRUITERS_PERFORMANCE_LIST_PART2 } from './recruitersPerformance.part2'

export const RECRUITERS_PERFORMANCE_LIST: RecruiterDetailData[] = [
  ...RECRUITERS_PERFORMANCE_LIST_PART1,
  ...RECRUITERS_PERFORMANCE_LIST_PART2,
]
`
)

write(
  'reports/personalProfile.data.ts',
  `import { RecruiterDetailData } from '../RecruiterDetailAnalyticsPage'
import { Role } from '../../../types'

export function getInitialPersonalProfile(role: Role): RecruiterDetailData {
  if (role === 'lead') {
    return {
` +
    body(rp, 896, 923) +
    `
    }
  }
  return {
` +
    body(rp, 926, 949) +
    `
  }
}
`
)

write(
  'history/types.ts',
  `import { Role } from '../../../types'

export interface SubmittedClientsPillCellProps {
  clients: string[]
  onSelectClient?: (clientName: string) => void
  activeClient?: string
}

` +
    body(hp, 115, 153) +
    `
export interface HistoryPageProps {
  role: Role
  currentUserName?: string
  currentUserEmail?: string
}
`
)

write(
  'history/SubmittedClientsPillCell.tsx',
  `import React, { useState } from 'react'
import { Building2, ChevronDown, X } from 'lucide-react'
import { SubmittedClientsPillCellProps } from './types'

export function SubmittedClientsPillCell({ clients, onSelectClient, activeClient }: SubmittedClientsPillCellProps) {
` +
    body(hp, 43, 113) +
    '}\n'
)

write(
  'history/recruitersHistory.data.ts',
  "import { RecruiterHistoryItem } from './types'\n\nexport " + body(hp, 155, 332)
)

write(
  'activity-logs/types.ts',
  `import { Role, ActivityLogItem } from '../../../types'

export type { ActivityLogItem }

` +
    body(al, 35, 51) +
    `
export interface ActivityLogsPageProps {
  role?: Role
  logs?: ActivityLogItem[]
}
`
)

write(
  'activity-logs/loginRecords.today.ts',
  "import { RecruiterLoginRecord } from './types'\n\nexport const LOGIN_RECORDS_TODAY: RecruiterLoginRecord[] = [\n" +
    body(al, 56, 140) +
    ']\n'
)
write(
  'activity-logs/loginRecords.yesterday.ts',
  "import { RecruiterLoginRecord } from './types'\n\nexport const LOGIN_RECORDS_YESTERDAY: RecruiterLoginRecord[] = [\n" +
    body(al, 143, 227) +
    ']\n'
)
write(
  'activity-logs/loginRecords.earlier.ts',
  "import { RecruiterLoginRecord } from './types'\n\nexport const LOGIN_RECORDS_EARLIER: RecruiterLoginRecord[] = [\n" +
    body(al, 230, 386) +
    ']\n'
)
write(
  'activity-logs/loginRecords.data.ts',
  `import { RecruiterLoginRecord } from './types'
import { LOGIN_RECORDS_TODAY } from './loginRecords.today'
import { LOGIN_RECORDS_YESTERDAY } from './loginRecords.yesterday'
import { LOGIN_RECORDS_EARLIER } from './loginRecords.earlier'

export const INITIAL_LOGIN_RECORDS: RecruiterLoginRecord[] = [
  ...LOGIN_RECORDS_TODAY,
  ...LOGIN_RECORDS_YESTERDAY,
  ...LOGIN_RECORDS_EARLIER,
]
`
)

write(
  'activity-logs/auditLogs.data.ts',
  "import { ActivityLogItem } from '../../../types'\n\nexport const INITIAL_LOGS: ActivityLogItem[] = [\n" +
    body(al, 391, 587) +
    ']\n'
)

console.log('done data extract')
