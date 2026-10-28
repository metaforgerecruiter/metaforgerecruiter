import React from 'react'
import {
  FileText,
  ClipboardList,
  UserPlus,
  Send,
  Calendar,
  BarChart3,
  User,
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  ShieldCheck,
  Sparkles,
  Plug,
  Settings,
  Mail,
  Activity,
  Search,
  Target,
  TrendingUp,
  Bell,
  Bot,
  Terminal,
} from 'lucide-react'
import { Role } from '../../types'

export interface SidebarProps {
  role: Role
  onLogout?: () => void
  activeNav?: string
  onNavSelect?: (nav: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export const ROLE_DASHBOARD_INFO: Record<
  Role,
  {
    dashboardName: string
    roleLabel: string
    icon: React.ElementType
    accentGradient: string
  }
> = {
  superadmin: {
    dashboardName: 'Super Admin Dashboard',
    roleLabel: 'Super Admin',
    icon: Shield,
    accentGradient: 'from-purple-600 to-indigo-600',
  },
  admin: {
    dashboardName: 'Admin Dashboard',
    roleLabel: 'Admin',
    icon: ShieldCheck,
    accentGradient: 'from-blue-600 to-indigo-600',
  },
  lead: {
    dashboardName: 'Team Lead Dashboard',
    roleLabel: 'Team Lead',
    icon: Users,
    accentGradient: 'from-cyan-600 to-blue-600',
  },
  recruiter: {
    dashboardName: 'Recruiter Dashboard',
    roleLabel: 'Recruiter',
    icon: User,
    accentGradient: 'from-emerald-600 to-teal-600',
  },
  client: {
    dashboardName: 'Client Dashboard',
    roleLabel: 'Client Portal',
    icon: Building2,
    accentGradient: 'from-amber-600 to-orange-600',
  },
  devteam: {
    dashboardName: 'Dev Team Dashboard',
    roleLabel: 'Dev Team',
    icon: Terminal,
    accentGradient: 'from-violet-600 to-indigo-600',
  },
}

export const ICONS: Record<string, React.ElementType> = {
  Dashboard: FileText,
  Requirements: ClipboardList,
  Candidates: UserPlus,
  Submissions: Send,
  'Submission to Client': Send,
  Interviews: Calendar,
  Organization: Building2,
  Users: Users,
  Roles: Shield,
  Clients: Building2,
  'AI Center': Sparkles,
  Reports: BarChart3,
  Integrations: Plug,
  Settings: Settings,
  'Audit Logs': FileText,
  Recruiters: Users,
  Teams: Users,
  Calendar: Calendar,
  'Email Center': Mail,
  'Activity Logs': Activity,
  'My Team': Users,
  Performance: TrendingUp,
  Targets: Target,
  'Candidate Search': Search,
  Analytics: BarChart3,
  Notifications: Bell,
  'AI Assistant': Bot,
  Profile: User,
}

export const NAV_LABELS: Record<string, string> = {
  Dashboard: 'My Work',
  Requirements: 'Requirements',
  Candidates: 'Add Candidate',
  Submissions: 'Submissions',
  'Submission to Client': 'Submissions',
  Interviews: 'Interview Tracking',
  Reports: 'Reports',
}

export { LayoutDashboard }
