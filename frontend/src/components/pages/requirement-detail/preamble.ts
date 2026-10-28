import React, { useState } from 'react'
import {
  FileText,
  User,
  Clock,
  ArrowLeft,
  Pencil,
  Briefcase,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  Search,
  RotateCcw,
} from 'lucide-react'
import { Requirement } from '../../../types'
import { ScheduleInterviewModal } from '../../modals/ScheduleInterviewModal'
import { SubmitCandidateModal } from '../../modals/SubmitCandidateModal'

export interface RequirementDetailOverviewProps {
  requirement: Requirement
  role?: string
  onBack: () => void
  onOpenAssignModal?: () => void
  onEditRequirement?: () => void
  onAddCandidate?: () => void
  onRevokeRequirement?: () => void
  onRequirementUpdated?: (updated: Requirement) => void
}
