import {
  FileText,
  Send,
  UserX,
  UserCheck,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Requirement, Submission, Interview } from '../../types'

export type CardFilterType =
  | 'ALL'
  | 'SUBMISSIONS'
  | 'UNASSIGNED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'INTERVIEWS'
  | 'SELECTIONS'
  | 'REJECTIONS'

export function buildRequirementCards(
  requirements: Requirement[],
  submissions: Submission[],
  interviews: Interview[],
) {
  const totalReqs = requirements.length
  const totalSubmissionsCount = requirements.reduce(
    (acc, r) => acc + (r.submissions || 0),
    submissions.length
  )
  const unassignedCount = requirements.filter(
    r =>
      !r.owner ||
      r.owner === 'Unassigned' ||
      r.assignmentStatus === 'Unassigned'
  ).length
  const assignedCount = requirements.filter(
    r =>
      r.owner &&
      r.owner !== 'Unassigned' &&
      r.assignmentStatus !== 'Unassigned'
  ).length
  const inProgressCount = requirements.filter(
    r => r.status === 'Active' || r.assignmentStatus === 'In Progress'
  ).length
  const totalInterviewsCount = requirements.reduce(
    (acc, r) => acc + (r.interviews || 0),
    interviews.length
  )
  const totalSelectionsCount = requirements.reduce(
    (acc, r) => acc + (r.placed || r.selections || 0),
    0
  )
  const totalRejectionsCount = requirements.reduce(
    (acc, r) => acc + (r.rejections || 0),
    interviews.filter(i => i.status === 'Rejected').length
  )

  return [
    {
      key: 'ALL' as CardFilterType,
      label: 'Total',
      value: totalReqs,
      icon: FileText,
      bg: '#F4EFFE',
      borderColor: '#E9D8FD',
      iconBg: '#8B5CF6',
    },
    {
      key: 'SUBMISSIONS' as CardFilterType,
      label: 'Submissions',
      value: totalSubmissionsCount,
      icon: Send,
      bg: '#E6F8F0',
      borderColor: '#A7F3D0',
      iconBg: '#00BA7C',
    },
    {
      key: 'UNASSIGNED' as CardFilterType,
      label: 'Unassigned',
      value: unassignedCount,
      icon: UserX,
      bg: '#FDE8EC',
      borderColor: '#FECDD3',
      iconBg: '#FF3B68',
    },
    {
      key: 'ASSIGNED' as CardFilterType,
      label: 'Assigned',
      value: assignedCount,
      icon: UserCheck,
      bg: '#EBF3FE',
      borderColor: '#BFDBFE',
      iconBg: '#3B82F6',
    },
    {
      key: 'IN_PROGRESS' as CardFilterType,
      label: 'In Progress',
      value: inProgressCount,
      icon: Clock,
      bg: '#FEF6E6',
      borderColor: '#FDE68A',
      iconBg: '#F59E0B',
    },
    {
      key: 'INTERVIEWS' as CardFilterType,
      label: 'Interviews',
      value: totalInterviewsCount,
      icon: Video,
      bg: '#EEF2FF',
      borderColor: '#C7D2FE',
      iconBg: '#6366F1',
    },
    {
      key: 'SELECTIONS' as CardFilterType,
      label: 'Selected',
      value: totalSelectionsCount,
      icon: CheckCircle2,
      bg: '#E6F8F0',
      borderColor: '#A7F3D0',
      iconBg: '#00BA7C',
    },
    {
      key: 'REJECTIONS' as CardFilterType,
      label: 'Rejected',
      value: totalRejectionsCount,
      icon: XCircle,
      bg: '#FDE8EC',
      borderColor: '#FECDD3',
      iconBg: '#FF3B68',
    },
  ]
}
