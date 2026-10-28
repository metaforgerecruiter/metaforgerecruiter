import React, { useState } from 'react'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Calendar,
  CheckCircle2,
  ClipboardList,
  FileSearch,
  Gauge,
  Layers,
  Lock,
  Menu,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Terminal,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  X,
  Building2,
  Cpu,
  Search,
  Check,
  Zap,
  Eye,
} from 'lucide-react'
import { Role } from '../../../types'
import { roleTheme } from '../../../theme'
import { MetaforgeLogo } from '../../common/MetaforgeLogo'

export interface LandingPageProps {
  onSignIn: () => void
  onRequestAccess: () => void
}

export const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'AI Intelligence', href: '#ai-intelligence' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Governance', href: '#governance' },
]

export const AI_CAPABILITIES = [
  {
    icon: FileSearch,
    title: 'AI-Powered JD Parsing',
    desc: 'Automatically parses complex job descriptions to extract required skills, experience tiers, domain competencies, and role prerequisites.',
    tone: '#60A5FA',
  },
  {
    icon: Cpu,
    title: 'Resume Parsing & Structuring',
    desc: 'Converts unstructured CV formats into normalized candidate profiles, extracting employment timeline, technical stack, and education.',
    tone: '#A78BFA',
  },
  {
    icon: Target,
    title: 'JD-to-Resume Semantic Matching',
    desc: 'Evaluates candidate resumes against active job requirements to generate objective skill match scores before submission.',
    tone: '#34D399',
  },
  {
    icon: Search,
    title: 'Candidate Skill Analysis',
    desc: 'Maps candidate competencies against standardized industry domain taxonomies to identify core technical capabilities and gaps.',
    tone: '#FBBF24',
  },
  {
    icon: ShieldCheck,
    title: 'Duplicate Candidate Detection',
    desc: 'Cross-checks candidate emails, phone numbers, and profile data against the internal repository to prevent duplicate client submissions.',
    tone: '#F87171',
  },
  {
    icon: Sparkles,
    title: 'Intelligent Candidate Recommendations',
    desc: 'Surface top-ranked candidates for open requirements instantly, reducing recruiter screening time and accelerating SLA speed.',
    tone: '#38BDF8',
  },
]

export const RECRUITMENT_WORKFLOW = [
  { icon: Briefcase, step: '01', title: 'Requirement Intake', desc: 'Capture requirements with priorities, positions, and SLA deadlines.' },
  { icon: UserCheck, step: '02', title: 'Recruiter Assignment', desc: 'Route requirements to designated team leads and assigned recruiters.' },
  { icon: Search, step: '03', title: 'Candidate Sourcing', desc: 'Source candidates directly into the centralized candidate repository.' },
  { icon: Sparkles, step: '04', title: 'AI Matching', desc: 'Extract CV data and score JD vs Resume skill alignment automatically.' },
  { icon: Send, step: '05', title: 'Submission & Review', desc: 'Package candidate profiles with lead approval before client delivery.' },
  { icon: Calendar, step: '06', title: 'Interview Tracking', desc: 'Coordinate interview rounds and track feedback across selection stages.' },
  { icon: CheckCircle2, step: '07', title: 'Offer & Placement', desc: 'Finalize selection, log candidate offers, and confirm placements.' },
]

export const ENTERPRISE_CAPABILITIES = [
  { icon: Shield, title: 'Role-Based Access Control', desc: 'Granular permissions scoped strictly for Super Admin, Admin, Lead, Recruiter, and Client roles.' },
  { icon: Users, title: 'Recruiter & Team Management', desc: 'Structure recruitment pods, manage lead allocations, and reassign requirements dynamically.' },
  { icon: ClipboardList, title: 'Requirement Management', desc: 'Centralized registry to manage positions, priority status, assigned clients, and SLA targets.' },
  { icon: UserPlus, title: 'Candidate Repository & Direct Call', desc: 'Comprehensive candidate database with instant direct phone call initiation and status logs.' },
  { icon: Send, title: 'Submission Pipeline Control', desc: 'Multi-gate submission review ensuring candidates meet client quality bars prior to delivery.' },
  { icon: Calendar, title: 'Interview & Feedback Tracking', desc: 'End-to-end interview lifecycle management across L1, L2, and final selection stages.' },
  { icon: CheckCircle2, title: 'Offer & Placement Records', desc: 'Track candidate offers in flight, sign-off status, and verified placement milestones.' },
  { icon: TrendingUp, title: 'Recruiter Performance & SLA TAT', desc: 'Monitor recruiter throughput, submission velocity, and turnaround time (TAT) metrics.' },
  { icon: BarChart3, title: 'Client Delivery & Gap Analysis', desc: 'Track domain coverage, position gaps, zero-submission alerts, and SPOC delivery metrics.' },
  { icon: Activity, title: 'Reports & Executive Analytics', desc: 'Unified reporting dashboards for leadership oversight and recruitment operations.' },
  { icon: Lock, title: 'Immutable System Audit Trail', desc: 'Complete activity audit logs recording every requirement change, user action, and system event.' },
]

export const GOVERNANCE_PILLARS = [
  { icon: Lock, title: 'Governed Access Control', desc: 'Role-scoped permissions enforce strict data visibility boundaries across teams and clients.' },
  { icon: Building2, title: 'Centralized Recruitment Operations', desc: 'Unified workspace for multi-client requirements, pod allocations, and delivery tracking.' },
  { icon: Bot, title: 'AI-Assisted Decisions', desc: 'Objective JD-to-resume matching and automated parsing assist recruiter decision-making.' },
  { icon: Eye, title: 'Complete Recruitment Visibility', desc: 'Traceable workflow from requirement creation through submission, interview, and placement.' },
]
