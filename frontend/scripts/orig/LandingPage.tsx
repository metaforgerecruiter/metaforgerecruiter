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
import { Role } from '../../types'
import { roleTheme } from '../../theme'
import { MetaforgeLogo } from '../common/MetaforgeLogo'

interface LandingPageProps {
  onSignIn: () => void
  onRequestAccess: () => void
}

const NAV_LINKS = [
  { label: 'Platform', href: '#platform' },
  { label: 'AI Intelligence', href: '#ai-intelligence' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Capabilities', href: '#capabilities' },
  { label: 'Governance', href: '#governance' },
]

const AI_CAPABILITIES = [
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

const RECRUITMENT_WORKFLOW = [
  { icon: Briefcase, step: '01', title: 'Requirement Intake', desc: 'Capture requirements with priorities, positions, and SLA deadlines.' },
  { icon: UserCheck, step: '02', title: 'Recruiter Assignment', desc: 'Route requirements to designated team leads and assigned recruiters.' },
  { icon: Search, step: '03', title: 'Candidate Sourcing', desc: 'Source candidates directly into the centralized candidate repository.' },
  { icon: Sparkles, step: '04', title: 'AI Matching', desc: 'Extract CV data and score JD vs Resume skill alignment automatically.' },
  { icon: Send, step: '05', title: 'Submission & Review', desc: 'Package candidate profiles with lead approval before client delivery.' },
  { icon: Calendar, step: '06', title: 'Interview Tracking', desc: 'Coordinate interview rounds and track feedback across selection stages.' },
  { icon: CheckCircle2, step: '07', title: 'Offer & Placement', desc: 'Finalize selection, log candidate offers, and confirm placements.' },
]

const ENTERPRISE_CAPABILITIES = [
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

const GOVERNANCE_PILLARS = [
  { icon: Lock, title: 'Governed Access Control', desc: 'Role-scoped permissions enforce strict data visibility boundaries across teams and clients.' },
  { icon: Building2, title: 'Centralized Recruitment Operations', desc: 'Unified workspace for multi-client requirements, pod allocations, and delivery tracking.' },
  { icon: Bot, title: 'AI-Assisted Decisions', desc: 'Objective JD-to-resume matching and automated parsing assist recruiter decision-making.' },
  { icon: Eye, title: 'Complete Recruitment Visibility', desc: 'Traceable workflow from requirement creation through submission, interview, and placement.' },
]

export function LandingPage({ onSignIn, onRequestAccess }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 font-sans overflow-x-hidden text-slate-800">
      {/* ---------------------------------------------------------------- */}
      {/* Navigation Bar                                                    */}
      {/* ---------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/90 shadow-2xs">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 sm:h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <MetaforgeLogo variant="dark" size="md" />
            <span className="hidden sm:block h-6 w-px bg-slate-200" />
            <span className="hidden sm:block text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold leading-tight">
              Recruiter Intelligence
              <br />
              Platform
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 rounded-lg text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onRequestAccess}
              className="hidden sm:inline-flex h-10 items-center px-4 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-slate-400 transition-all cursor-pointer shadow-2xs"
            >
              Request Workspace Access
            </button>
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex h-10 items-center gap-2 px-4 sm:px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-extrabold shadow-md shadow-blue-600/25 hover:shadow-blue-600/35 transition-all active:scale-[0.98] cursor-pointer"
            >
              Sign In to MRAP <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMenuOpen(o => !o)}
              className="lg:hidden w-10 h-10 rounded-xl border border-slate-300 bg-white text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-slate-200/80 bg-white px-5 sm:px-8 py-4 space-y-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false)
                onRequestAccess()
              }}
              className="w-full mt-2 h-11 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
            >
              Request Workspace Access
            </button>
          </div>
        )}
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Hero Section                                                      */}
      {/* ---------------------------------------------------------------- */}
      <section id="platform" className="relative bg-[#0B1021] text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute -top-32 -left-24 w-[500px] h-[500px] bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[560px] h-[560px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] gap-12 lg:gap-14 items-center">
            {/* Copy column */}
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-mono font-bold mb-7 shadow-sm">
                <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                <span>MetaForge Enterprise Recruiter Intelligence Platform</span>
              </div>

              <h1 className="text-4xl sm:text-5xl xl:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight mb-6">
                Recruitment Intelligence.
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                  Built for High-Performance Teams.
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mb-9 font-medium">
                Manage requirements, candidates, submissions, interviews and recruiter performance from one intelligent recruitment platform.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-11">
                <button
                  type="button"
                  onClick={onSignIn}
                  className="h-13 px-7 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold shadow-lg shadow-blue-600/30 hover:shadow-blue-600/40 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Sign In to MRAP <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onRequestAccess}
                  className="h-13 px-7 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  Request Workspace Access
                </button>
              </div>

              {/* Qualitative Enterprise Positioning Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-7">
                {[
                  { label: 'Governed Access Control', icon: ShieldCheck },
                  { label: 'Centralized Operations', icon: Building2 },
                  { label: 'AI Match Scoring', icon: Sparkles },
                  { label: 'Complete Traceability', icon: Activity },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <item.icon className="w-4 h-4 text-blue-400 shrink-0" />
                    <span className="text-[11px] font-bold text-slate-300 font-sans">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Visualization column */}
            <RecruitmentIntelligenceVisualization />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* AI Intelligence Section                                          */}
      {/* ---------------------------------------------------------------- */}
      <section id="ai-intelligence" className="py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="AI Intelligence Engine"
            title="Embedded recruitment AI for faster, higher-quality sourcing"
            subtitle="Eliminate manual screening bottlenecks with automated JD parsing, resume extraction, semantic match scoring, and duplicate detection."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {AI_CAPABILITIES.map(item => (
              <div
                key={item.title}
                className="group bg-slate-50/80 border border-slate-200/90 rounded-3xl p-6 shadow-2xs hover:shadow-xl hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-white transition-all duration-200"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105 shadow-2xs"
                  style={{ background: `${item.tone}1A`, color: item.tone }}
                >
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight mb-2">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* End-to-End Recruitment Workflow                                   */}
      {/* ---------------------------------------------------------------- */}
      <section id="workflow" className="py-16 sm:py-20 lg:py-24 bg-slate-900 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#3B82F6 1px, transparent 1px), linear-gradient(90deg, #3B82F6 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-2xl mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-300 text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
              Lifecycle Governance
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
              End-to-end recruitment lifecycle workflow
            </h2>
            <p className="text-sm sm:text-base text-slate-400 font-medium leading-relaxed">
              Every requirement moves through structured, traceable stages from initial intake to final candidate placement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {RECRUITMENT_WORKFLOW.map(stage => (
              <div
                key={stage.title}
                className="bg-slate-800/60 border border-slate-700/70 rounded-3xl p-5 hover:border-blue-500/50 hover:bg-slate-800/90 transition-all duration-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold">
                    <stage.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono font-extrabold text-blue-400">{stage.step}</span>
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">{stage.title}</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Enterprise Capabilities Grid                                      */}
      {/* ---------------------------------------------------------------- */}
      <section id="capabilities" className="py-16 sm:py-20 lg:py-24 bg-white border-b border-slate-200/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="Enterprise Capabilities"
            title="Comprehensive module suite for enterprise hiring teams"
            subtitle="Built for structured recruitment operations across multi-client accounts, team pods, and dedicated recruiters."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {ENTERPRISE_CAPABILITIES.map(cap => (
              <div
                key={cap.title}
                className="p-6 bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-lg hover:border-purple-300 transition-all duration-200 space-y-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6B3BF6] border border-purple-200/80 flex items-center justify-center shrink-0">
                    <cap.icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900">{cap.title}</h3>
                </div>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Governance & Trust Positioning                                    */}
      {/* ---------------------------------------------------------------- */}
      <section id="governance" className="py-16 sm:py-20 lg:py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
                Governance & Intelligence
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
                Controlled recruitment operations designed for accountability
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed mb-8">
                MetaForge Recruiter Application Platform provides centralized visibility and role-governed execution across every tier of your hiring organization.
              </p>

              <div className="grid sm:grid-cols-2 gap-5">
                {GOVERNANCE_PILLARS.map(p => (
                  <div key={p.title} className="space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
                      <p.icon className="w-5 h-5 text-blue-400" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-900">{p.title}</h4>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative rounded-3xl bg-[#0B1021] border border-slate-800 p-8 shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-extrabold text-white">Role Governance Matrix</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">● Active Governance</span>
              </div>

              <div className="space-y-3 text-xs">
                {[
                  { role: 'Super Admin', access: 'Full System Administration, User Management & System Audit Logs' },
                  { role: 'Admin', access: 'Regional Operations, Clients, Teams & Recruiter Oversight' },
                  { role: 'Team Lead', access: 'Pod Allocations, Submission Quality Review & SLA Tracking' },
                  { role: 'Recruiter', access: 'Candidate Sourcing, Resume Uploads & Requirements Execution' },
                  { role: 'Client Portal', access: 'Isolated View of Assigned Requirements & Submissions' },
                ].map(r => (
                  <div key={r.role} className="p-3 bg-white/[0.04] border border-white/5 rounded-2xl space-y-1">
                    <span className="font-extrabold text-blue-300 text-xs">{r.role}</span>
                    <p className="text-[11px] text-slate-400 font-medium">{r.access}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Final CTA Section                                                */}
      {/* ---------------------------------------------------------------- */}
      <section className="py-16 sm:py-20 lg:py-24 bg-white border-t border-slate-200/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="relative rounded-3xl bg-[#0B1021] overflow-hidden px-7 sm:px-12 lg:px-16 py-12 sm:py-16 text-center shadow-2xl border border-slate-800">
            <div className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Accelerate your enterprise recruitment operations
              </h2>
              <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed max-w-2xl mx-auto">
                Sign in to access your role-scoped recruitment workspace or request access to get provisioned by your administrator.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-3">
                <button
                  type="button"
                  onClick={onSignIn}
                  className="h-13 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold shadow-lg shadow-blue-600/30 transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Sign In to MRAP <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onRequestAccess}
                  className="h-13 px-8 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white text-sm font-bold transition-all cursor-pointer"
                >
                  Request Workspace Access
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Footer                                                            */}
      {/* ---------------------------------------------------------------- */}
      <footer className="bg-white border-t border-slate-200/80">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <MetaforgeLogo variant="dark" size="sm" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
              Recruiter Intelligence Platform
            </span>
          </div>
          <div className="flex items-center gap-5 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Enterprise Governed
            </span>
            <span>v3.2.0</span>
            <span>© 2026 MetaForge</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Local building blocks                                               */
/* ------------------------------------------------------------------ */

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="max-w-2xl mb-10 sm:mb-12">
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
        {eyebrow}
      </span>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">{title}</h2>
      <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed">{subtitle}</p>
    </div>
  )
}

/** Conceptual Product Visualization of AI Recruitment Engine (No fake business metrics) */
function RecruitmentIntelligenceVisualization() {
  return (
    <div className="relative font-sans">
      <div className="absolute -inset-4 bg-gradient-to-tr from-blue-600/25 via-purple-600/15 to-indigo-600/25 rounded-[2.5rem] blur-2xl pointer-events-none" />

      <div className="relative rounded-3xl bg-slate-900/85 border border-slate-700/70 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Window Chrome & Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 shadow-xs" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-xs" />
          </div>

          <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1 rounded-xl border border-slate-700/80 text-[11px] font-mono text-blue-300 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>AI Talent Intelligence Engine</span>
          </div>
        </div>

        {/* Conceptual AI Recruitment Flow */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 uppercase tracking-widest font-extrabold flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Intelligent Sourcing & Evaluation Flow
            </span>
            <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">Automated Pipeline</span>
          </div>

          {/* Sequential Stage Flow Diagram */}
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-1.5 text-center text-[10px] font-mono font-bold">
            {[
              { label: 'Requirement', color: 'text-slate-300 bg-white/10' },
              { label: 'JD Analysis', color: 'text-blue-300 bg-blue-500/20' },
              { label: 'Matching', color: 'text-indigo-300 bg-indigo-500/20' },
              { label: 'Match Score', color: 'text-purple-300 bg-purple-500/20' },
              { label: 'Submission', color: 'text-emerald-300 bg-emerald-500/20' },
              { label: 'Interview', color: 'text-amber-300 bg-amber-500/20' },
              { label: 'Offer', color: 'text-rose-300 bg-rose-500/20' },
            ].map(stage => (
              <div key={stage.label} className={`p-2 rounded-xl border border-white/5 truncate ${stage.color}`}>
                {stage.label}
              </div>
            ))}
          </div>
        </div>

        {/* AI Processing Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <FileSearch className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-blue-300 font-bold uppercase tracking-wider block">JD Parsed & Extracted</span>
              <p className="text-xs text-white font-bold mt-0.5">14 Core Skills & Experience Tier Identified</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider block">Candidate Match Score</span>
              <p className="text-xs text-white font-bold mt-0.5">94% Semantic JD Skill Alignment</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider block">Duplicate Check Passed</span>
              <p className="text-xs text-white font-bold mt-0.5">Repository Cross-Check Verified</p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider block">Recommendation Gate</span>
              <p className="text-xs text-white font-bold mt-0.5">Recommended for Lead Review & Submission</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
