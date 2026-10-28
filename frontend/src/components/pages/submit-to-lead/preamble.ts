import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  X,
  FileText,
  Building,
  Mail,
  User,
  Layers,
  Sparkles,
  ChevronDown,
  RotateCcw,
  GripVertical,
  Eye,
  EyeOff,
  Send,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'

import { Requirement } from '../../../types'
import {
  getForwardRequestByReq,
  createOrUpdateForwardRequest,
  approveForwardRequest,
  rejectForwardRequest,
  ForwardRequest,
} from '../../../data/forwardRequestsStore'
import { checkDuplicateSubmission } from '../../../data/submissionsStore'

export interface SubmitToLeadPageProps {
  selectedCandidates?: any[]
  requirement?: Requirement | null
  role?: string
  onBack: () => void
  onSubmitSuccess?: () => void
}
