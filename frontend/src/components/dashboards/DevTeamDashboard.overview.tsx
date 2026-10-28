import React, { useState, useEffect, useMemo } from 'react'
import { ResponsiveContainer, BarChart, Bar, ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Building2, Target } from 'lucide-react'
import { Interview, Recruiter, Requirement, Lead } from '../../types'
import { KpiGrid, Panel, ActivityFeed } from '../wireframe/WireframeKit'
import { CustomDevTooltip } from './DevTeamDashboard.data'
import { analyticsService } from '../../services/workspace.service'

export function DevTeamDashboardOverview({
  openPositions,
  requirements,
  recruiters,
  leads,
  interviews,
}: {
  openPositions: number
  requirements: Requirement[]
  recruiters: Recruiter[]
  leads: Lead[]
  interviews: Interview[]
}) {
  const [liveKpis, setLiveKpis] = useState<any>(null)
  const [clientStats, setClientStats] = useState<any>(null)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      analyticsService.dashboard().catch(() => null),
      analyticsService.clients().catch(() => null),
    ]).then(([dashRes, clientRes]) => {
      if (isMounted) {
        if (dashRes?.kpis) setLiveKpis(dashRes.kpis)
        if (clientRes) setClientStats(clientRes)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  const kpis = liveKpis || {}
  const totalClients = clientStats?.total ?? new Set(requirements.map(r => r.client).filter(Boolean)).size
  const totalSubs = kpis.totalSubmissions ?? recruiters.reduce((n, r) => n + (r.submissions || 0), 0)
  const activeReqs = kpis.activeRequirements ?? requirements.length
  const totalInts = kpis.totalInterviews ?? interviews.length

  // Requirements and openings per client, from the live requirement list.
  const clientRequirementsData = useMemo(() => {
    const byClient = new Map<string, { client: string; Requirements: number; Openings: number }>()
    for (const r of requirements) {
      const key = r.client || 'Unknown'
      const row = byClient.get(key) || { client: key, Requirements: 0, Openings: 0 }
      row.Requirements += 1
      row.Openings += r.openings || 0
      byClient.set(key, row)
    }
    return [...byClient.values()].sort((a, b) => b.Requirements - a.Requirements).slice(0, 8)
  }, [requirements])

  // Each recruiter's recorded submissions against their target.
  const recruiterOutputData = useMemo(
    () =>
      recruiters
        .map(r => ({ name: r.name, Submissions: r.submissions || 0, Target: r.target || 0 }))
        .sort((a, b) => b.Submissions - a.Submissions)
        .slice(0, 8),
    [recruiters],
  )

  // Newest requirements first (the list arrives in creation order, newest at the top).
  const latestRequirements = requirements.slice(0, 5)

  return (
    <>
      <KpiGrid
        columns={4}
        items={[
          { label: 'Total Clients', value: totalClients },
          { label: 'Active Reqs', value: activeReqs, highlight: true },
          { label: 'Open Positions', value: kpis.totalOpenings ?? openPositions },
          { label: 'Total Recruiters', value: recruiters.length },
          { label: 'Active Leads', value: leads.length },
          { label: 'Total Submissions', value: totalSubs },
          { label: 'Interviews Active', value: totalInts },
          { label: 'Candidate Profiles', value: kpis.totalCandidates ?? 0, sub: 'Resumes & Candidates' },
        ]}
      />


      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Client Requirements</h3>
                <p className="text-[11px] text-slate-500">Active positions by client entity</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[10px] font-extrabold border border-blue-200">
              Enterprise
            </span>
          </div>

          <div className="h-[220px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientRequirementsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="client" tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomDevTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '8px' }} />
                <Bar dataKey="Requirements" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Openings" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Recruiter Output</h3>
                <p className="text-[11px] text-slate-500">Submissions vs quota target</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-extrabold border border-emerald-200">
              Performance
            </span>
          </div>

          <div className="h-[220px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={recruiterOutputData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomDevTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700, paddingTop: '8px' }} />
                <Bar dataKey="Submissions" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="Target" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: '#EF4444' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        <Panel title="Latest Requirements">
          {latestRequirements.length ? (
            <ActivityFeed
              items={latestRequirements.map(r => ({
                time: r.createdAt || '',
                user: r.client || '—',
                action: `${r.title} (${r.id})`,
              }))}
            />
          ) : (
            <p className="text-sm text-slate-500 py-6 text-center">No requirements yet.</p>
          )}
        </Panel>

      </div>
    </>
  )
}
