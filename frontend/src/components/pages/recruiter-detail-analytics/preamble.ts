import React, { useState } from 'react'
import {
  ArrowLeft,
  X,
  Award,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Briefcase,
  FileText,
  Check,
  AlertTriangle,
  ArrowUpRight,
  Download,
  Calendar,
  Zap,
  Filter,
  MessageSquare,
  Plus,
  Edit2,
  Sparkles,
  Activity,
  Layers,
  PieChart as PieChartIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from 'recharts'


export interface RecruiterDetailData {
  id: string
  name: string
  role: string
  team: string
  avatar: string
  requirementsCount: number
  workedReqs: number
  nonWorkedReqs: number
  submissionsCount: number
  shortlistedCount: number
  noSubmissionsCount: number
  interviewsCount: number
  hiresCount: number
  conversionRate: string
  dailyTaskStatus: string
  weeklyProgress: string
  weeklyProgressPct: number
  teamLead?: string
  primaryClient?: string
  status: 'On Track' | 'Warning' | 'Critical'
  requirementsList: {
    id: string
    title: string
    client: string
    status: 'Worked' | 'Non-Worked'
    submissions: number
    interviews: number
    positions?: number
    reasonNote?: string
  }[]
}

export interface RecruiterDetailAnalyticsPageProps {
  recruiter: RecruiterDetailData
  onBack: () => void
  userRole?: string
}
