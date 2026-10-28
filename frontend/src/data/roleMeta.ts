import { Role } from '../types'

export const ROLE_META: Record<Role, { label: string; desc: string; color: string; bg: string; border: string }> = {
  superadmin: { label: 'Super Admin', desc: 'Full platform metrics & enterprise settings', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  admin: { label: 'Admin', desc: 'Oversee regional leads & recruiter teams', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  lead: { label: 'Team Lead', desc: 'Track team performance & assigned reqs', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  recruiter: { label: 'Recruiter', desc: 'Candidate submissions & interview management', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  devteam: { label: 'Dev Team', desc: 'Full Super Admin control, platform metrics, and administrative privileges', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  client: { label: 'Client', desc: 'Client portal for requirements and candidate review', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
}

/** Display title for a role when the user record has none. */
export function titleForRole(role: Role): string {
  return ROLE_META[role]?.label || role
}
