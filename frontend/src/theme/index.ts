import { Role } from '../types'

/** TalentFlow enterprise design tokens — single source of truth */
export const brand = {
  name: 'metaforge',
  primary: '#1B4FD8',
  primaryHover: '#1640B8',
  primaryLight: '#EBF1FF',
  primaryMuted: '#93B4F5',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  border: '#E4E8EF',
  borderLight: '#F0F2F5',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  success: '#059669',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  danger: '#DC2626',
  dangerLight: '#FEF2F2',
} as const

/** In-app UI accent — unified metaforge purple (auth pages keep roleTheme) */
export const appTheme = {
  accent: '#6B3BF6',
  accentHover: '#5833E0',
  accentLight: '#F4EFFE',
  sidebarGradient: 'linear-gradient(180deg, #0A1424 0%, #0D1B30 100%)',
  navActiveGradient: 'linear-gradient(135deg, #6B3BF6 0%, #5833E0 100%)',
} as const

/** Unified Auth Page Design Tokens for consistent, high-end login experience */
export const authTheme = {
  panelGradient: 'linear-gradient(145deg, #0B1021 0%, #0F172A 50%, #131D38 100%)',
  panelBorder: '#1E293B',
  bgPage: '#F8FAFC',
  cardBg: '#FFFFFF',
  cardBorder: '#E2E8F0',
  cardShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.08), 0 0 0 1px rgba(226, 232, 240, 0.8)',
  primaryButton: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
  primaryButtonHover: 'linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%)',
  inputBg: '#F8FAFC',
  inputBorder: '#CBD5E1',
  inputFocusRing: '0 0 0 4px rgba(37, 99, 235, 0.12)',
  inputFocusBorder: '#2563EB',
} as const

export const kpiVariantKeys = ['purple', 'mint', 'rose', 'blue', 'amber', 'indigo'] as const

export interface CardThemeColor {
  bg: string
  borderColor: string
  iconBg: string
  textColor: string
}

export const cardThemeColors: Record<string, CardThemeColor> = {
  purple: {
    bg: '#F4EFFE',
    borderColor: '#E9D8FD',
    iconBg: '#8B5CF6',
    textColor: '#4C1D95',
  },
  mint: {
    bg: '#E6F8F0',
    borderColor: '#A7F3D0',
    iconBg: '#00BA7C',
    textColor: '#047857',
  },
  rose: {
    bg: '#FDE8EC',
    borderColor: '#FECDD3',
    iconBg: '#FF3B68',
    textColor: '#BE123C',
  },
  blue: {
    bg: '#EBF3FF',
    borderColor: '#BFDBFE',
    iconBg: '#2F80ED',
    textColor: '#1D4ED8',
  },
  amber: {
    bg: '#FFF8E7',
    borderColor: '#FDE68A',
    iconBg: '#F2994A',
    textColor: '#B45309',
  },
  indigo: {
    bg: '#EEF2FF',
    borderColor: '#C7D2FE',
    iconBg: '#5B51D8',
    textColor: '#4338CA',
  },
}

export const roleTheme: Record<
  Role,
  {
    label: string
    portalTitle: string
    portalDesc: string
    accent: string
    accentLight: string
    accentDark: string
    gradient: string
  }
> = {
  superadmin: {
    label: 'Super Admin',
    portalTitle: 'Platform Administration',
    portalDesc: 'Full system access, org settings, and enterprise analytics.',
    accent: '#5B21B6',
    accentLight: '#F3E8FF',
    accentDark: '#4C1D95',
    gradient: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)',
  },
  admin: {
    label: 'Admin',
    portalTitle: 'Operations Console',
    portalDesc: 'Manage leads, recruiters, requirements, and regional performance.',
    accent: '#1B4FD8',
    accentLight: '#EBF1FF',
    accentDark: '#1640B8',
    gradient: 'linear-gradient(135deg, #1B4FD8 0%, #2563EB 100%)',
  },
  lead: {
    label: 'Team Lead',
    portalTitle: 'Team Lead Portal',
    portalDesc: 'Track team quotas, interview pipelines, and assigned requirements.',
    accent: '#0E7490',
    accentLight: '#ECFEFF',
    accentDark: '#0C6378',
    gradient: 'linear-gradient(135deg, #0E7490 0%, #0891B2 100%)',
  },
  recruiter: {
    label: 'Recruiter',
    portalTitle: 'Recruiter Workspace',
    portalDesc: 'Submit candidates, manage interviews, and hit daily targets.',
    accent: '#047857',
    accentLight: '#ECFDF5',
    accentDark: '#065F46',
    gradient: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
  },
  devteam: {
    label: 'Dev Team',
    portalTitle: 'Developer & Engineering Console',
    portalDesc: 'Full administrative control, platform architecture, system logs, and operational tools.',
    accent: '#7C3AED',
    accentLight: '#F5F3FF',
    accentDark: '#5B21B6',
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
  },
  client: {
    label: 'Client',
    portalTitle: 'Client Portal',
    portalDesc: 'Review active requirements, candidate submissions, and interview feedback.',
    accent: '#D97706',
    accentLight: '#FEF3C7',
    accentDark: '#B45309',
    gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
  },
}

// Legacy helper — prefer ROLE_NAV from config/navigation.ts
export function getRoleNav(role: Role): { label: string; key: string }[] {
  return []
}
