import React, { useState } from 'react'
import { Terminal } from 'lucide-react'
import { Admin, Interview, Recruiter, Requirement, Candidate, Lead } from '../../types'
import { AiInsightBanner, WorkflowStrip } from '../wireframe/WireframeKit'
import { RequirementsPage } from '../pages/RequirementsPage'
import { AddCandidatePage } from '../pages/AddCandidatePage'
import { CandidateRepositoryPage } from '../pages/CandidateRepositoryPage'
import { SubmissionsPage } from '../pages/SubmissionsPage'
import { DevTeamDashboardOverview } from './DevTeamDashboard.overview'
import { DevTeamDashboardAdminPanel } from './DevTeamDashboard.admin'

interface Props {
  admins: Admin[]
  leads: Lead[]
  recruiters: Recruiter[]
  requirements: Requirement[]
  interviews: Interview[]
  onUpdateRequirements?: (requirements: Requirement[]) => void
  onOpenSubmit?: (reqId?: string) => void
}

export function DevTeamDashboard({
  admins,
  leads,
  recruiters,
  requirements,
  interviews,
  onUpdateRequirements,
  onOpenSubmit,
}: Props) {
  const openPositions = requirements.reduce((a, r) => a + r.openings, 0)
  const [candidatesList, setCandidatesList] = useState<Candidate[]>([])
  const [candViewMode, setCandViewMode] = useState<'add' | 'repository'>('add')
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'candidates' | 'submissions'>('overview')

  return (
    <div className="space-y-8 w-full pb-12 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-md">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Dev Team Dashboard</h1>
              <p className="text-xs text-slate-500 font-medium">
                Full Admin & Super Admin System Access · Core Diagnostics & Operations Console
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Core Platform v3.4 — Stable
          </span>
        </div>
      </div>

      <AiInsightBanner text="Dev Console Active — Full administrative privilege granted. 0 system errors logged in the last 24h. Database query response time averaging 138ms." />

      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'overview'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Executive & System Overview
        </button>
        <button
          onClick={() => setActiveTab('requirements')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'requirements'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Requirements Console ({requirements.length})
        </button>
        <button
          onClick={() => setActiveTab('candidates')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'candidates'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Candidate Repository
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'submissions'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          All Submissions
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <DevTeamDashboardOverview
            openPositions={openPositions}
            requirements={requirements}
            recruiters={recruiters}
            leads={leads}
            interviews={interviews}
          />
          <DevTeamDashboardAdminPanel admins={admins} leads={leads} recruiters={recruiters} />
        </>
      )}

      {activeTab === 'requirements' && (
        <RequirementsPage
          role="devteam"
          requirements={requirements}
          interviews={interviews}
          recruiters={recruiters}
          onOpenSubmit={onOpenSubmit}
          onUpdateRequirements={onUpdateRequirements}
        />
      )}

      {activeTab === 'candidates' && (
        <div>
          {candViewMode === 'repository' ? (
            <CandidateRepositoryPage
              candidates={candidatesList}
              requirements={requirements}
              onOpenAddForm={() => setCandViewMode('add')}
              onBackToDashboard={() => setCandViewMode('add')}
            />
          ) : (
            <AddCandidatePage
              requirements={requirements}
              onOpenRepository={() => setCandViewMode('repository')}
              onAddCandidate={c => setCandidatesList([c, ...candidatesList])}
            />
          )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <SubmissionsPage
          role="devteam"
          requirements={requirements}
          onOpenSubmitCandidate={onOpenSubmit ? (reqId?: string) => onOpenSubmit(reqId) : undefined}
          onUpdateRequirements={onUpdateRequirements}
        />
      )}

      <WorkflowStrip />
    </div>
  )
}
