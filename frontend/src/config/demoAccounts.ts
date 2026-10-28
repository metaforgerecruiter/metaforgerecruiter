import { Role } from '../types'

export interface DemoAccount {
  id: string
  role: Role
  roleNumber: number
  roleLabel: string
  name: string
  email: string
  password: string
  title: string
  tagline: string
  avatar: string
  theme: {
    accent: string
    badgeBg: string
    badgeBorder: string
    badgeText: string
    cardBg: string
    cardBorder: string
    cardHoverBorder?: string
    hoverBorder: string
    activeRing: string
    btnBg: string
    btnHover: string
  }
}

/**
 * Quick role accounts on the sign-in page.
 * - Production builds: always off (empty list).
 * - Local/dev: on by default; set NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=false to hide.
 * Passwords prefer NEXT_PUBLIC_DEMO_PASSWORD_* / NEXT_PUBLIC_DEMO_PASSWORD,
 * then fall back to the known local seed passwords for convenience.
 */
function demoUiEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') return false
  if (process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS === 'false') return false
  return true
}

/** Local-only defaults (never shipped in production builds). */
const LOCAL_DEV_PASSWORDS: Record<string, string> = {
  superadmin: 'Admin@2026',
  admin: 'Admin@2026',
  lead: 'Lead@2026',
  recruiter: 'Rec@2026',
  devteam: 'Dev@2026',
  client: 'Client@2026',
}

function demoPasswordFor(role: string): string {
  if (!demoUiEnabled()) return ''
  const roleKey = `NEXT_PUBLIC_DEMO_PASSWORD_${role.toUpperCase()}`
  return (
    process.env[roleKey] ||
    process.env.NEXT_PUBLIC_DEMO_PASSWORD ||
    process.env.NEXT_PUBLIC_SEED_DEMO_PASSWORD ||
    LOCAL_DEV_PASSWORDS[role] ||
    ''
  )
}

function buildDemoAccounts(): DemoAccount[] {
  if (!demoUiEnabled()) return []

  const pw = (role: string) => demoPasswordFor(role)

  return [
    {
      id: 'superadmin',
      role: 'superadmin',
      roleNumber: 1,
      roleLabel: 'Super Admin',
      name: 'Robert Haines',
      email: 'r.haines@talentflow.io',
      password: pw('superadmin'),
      title: 'Enterprise Super Admin',
      tagline: 'Complete enterprise oversight, cross-org administration, RBAC governance & audit trail.',
      avatar: '👑',
      theme: {
        accent: '#7C3AED',
        badgeBg: 'bg-purple-100',
        badgeBorder: 'border-purple-300',
        badgeText: 'text-purple-800',
        cardBg: 'bg-gradient-to-br from-purple-50/70 to-indigo-50/50',
        cardBorder: 'border-purple-200 hover:border-purple-400',
        hoverBorder: 'hover:border-purple-500',
        activeRing: 'ring-purple-500/20 border-purple-600',
        btnBg: 'bg-purple-600 hover:bg-purple-700 text-white',
        btnHover: 'hover:bg-purple-50 text-purple-700 border-purple-200',
      },
    },
    {
      id: 'admin',
      role: 'admin',
      roleNumber: 2,
      roleLabel: 'Admin',
      name: 'David Park',
      email: 'd.park@talentflow.io',
      password: pw('admin'),
      title: 'Operations Admin',
      tagline: 'Client lifecycle, user management, requirement distribution & operations metrics.',
      avatar: '🛡️',
      theme: {
        accent: '#2563EB',
        badgeBg: 'bg-blue-100',
        badgeBorder: 'border-blue-300',
        badgeText: 'text-blue-800',
        cardBg: 'bg-gradient-to-br from-blue-50/70 to-sky-50/50',
        cardBorder: 'border-blue-200 hover:border-blue-400',
        hoverBorder: 'hover:border-blue-500',
        activeRing: 'ring-blue-500/20 border-blue-600',
        btnBg: 'bg-blue-600 hover:bg-blue-700 text-white',
        btnHover: 'hover:bg-blue-50 text-blue-700 border-blue-200',
      },
    },
    {
      id: 'lead',
      role: 'lead',
      roleNumber: 3,
      roleLabel: 'Team Lead',
      name: 'Harish Gadipally',
      email: 'harish.g@metaforgeit.com',
      password: pw('lead'),
      title: 'Recruitment Team Lead',
      tagline: 'Team lead portal, candidate reviews, recruiter assignments & SLA pipeline health.',
      avatar: '👥',
      theme: {
        accent: '#059669',
        badgeBg: 'bg-emerald-100',
        badgeBorder: 'border-emerald-300',
        badgeText: 'text-emerald-800',
        cardBg: 'bg-gradient-to-br from-emerald-50/70 to-teal-50/50',
        cardBorder: 'border-emerald-200 hover:border-emerald-400',
        hoverBorder: 'hover:border-emerald-500',
        activeRing: 'ring-emerald-500/20 border-emerald-600',
        btnBg: 'bg-emerald-600 hover:bg-emerald-700 text-white',
        btnHover: 'hover:bg-emerald-50 text-emerald-700 border-emerald-200',
      },
    },
    {
      id: 'recruiter',
      role: 'recruiter',
      roleNumber: 4,
      roleLabel: 'Recruiter',
      name: 'Marcus Chen',
      email: 'm.chen@talentflow.io',
      password: pw('recruiter'),
      title: 'Senior Recruiter',
      tagline: 'Active talent sourcing, candidate submissions, client feedback & interview schedules.',
      avatar: '🎯',
      theme: {
        accent: '#D97706',
        badgeBg: 'bg-amber-100',
        badgeBorder: 'border-amber-300',
        badgeText: 'text-amber-800',
        cardBg: 'bg-gradient-to-br from-amber-50/70 to-orange-50/50',
        cardBorder: 'border-amber-200 hover:border-amber-400',
        hoverBorder: 'hover:border-amber-500',
        activeRing: 'ring-amber-500/20 border-amber-600',
        btnBg: 'bg-amber-600 hover:bg-amber-700 text-white',
        btnHover: 'hover:bg-amber-50 text-amber-700 border-amber-200',
      },
    },
    {
      id: 'devteam',
      role: 'devteam',
      roleNumber: 5,
      roleLabel: 'Dev Team',
      name: 'Dev Team Engineer',
      email: 'dev.team@talentflow.io',
      password: pw('devteam'),
      title: 'Core Platform Engineer',
      tagline: 'Full administrative rights, developer telemetry, database inspection & test tools.',
      avatar: '💻',
      theme: {
        accent: '#0F172A',
        badgeBg: 'bg-slate-800',
        badgeBorder: 'border-slate-700',
        badgeText: 'text-slate-100',
        cardBg: 'bg-gradient-to-br from-slate-100/90 to-slate-200/50',
        cardBorder: 'border-slate-300 hover:border-slate-500',
        hoverBorder: 'hover:border-slate-600',
        activeRing: 'ring-slate-500/20 border-slate-800',
        btnBg: 'bg-slate-900 hover:bg-black text-white',
        btnHover: 'hover:bg-slate-200 text-slate-800 border-slate-300',
      },
    },
  ]
}

export const DEMO_ACCOUNTS: DemoAccount[] = buildDemoAccounts()
export const ENABLE_DEV_ACCOUNTS_UI = DEMO_ACCOUNTS.length > 0
