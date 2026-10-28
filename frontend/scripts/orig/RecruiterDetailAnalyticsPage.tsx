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

interface RecruiterDetailAnalyticsPageProps {
  recruiter: RecruiterDetailData
  onBack: () => void
  userRole?: string
}

export function RecruiterDetailAnalyticsPage({
  recruiter: initialRecruiter,
  onBack,
  userRole = 'recruiter',
}: RecruiterDetailAnalyticsPageProps) {
  const [recruiter, setRecruiter] = useState<RecruiterDetailData>(initialRecruiter)
  const [activeTab, setActiveTab] = useState<'requirements' | 'submissions'>('requirements')
  const [dateFilter, setDateFilter] = useState<'today' | 'this_week' | 'this_month' | 'custom'>('this_month')
  const [startDate, setStartDate] = useState('2026-08-01')
  const [endDate, setEndDate] = useState('2026-08-11')

  // Reason Modal State
  const [selectedReqForReason, setSelectedReqForReason] = useState<{ id: string; title: string; currentReason?: string } | null>(null)
  const [reasonText, setReasonText] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleOpenReasonModal = (req: { id: string; title: string; reasonNote?: string }) => {
    setSelectedReqForReason({ id: req.id, title: req.title, currentReason: req.reasonNote })
    setReasonText(req.reasonNote || '')
  }

  const handleSaveReasonNote = () => {
    if (!selectedReqForReason) return
    const updatedList = recruiter.requirementsList.map(item =>
      item.id === selectedReqForReason.id ? { ...item, reasonNote: reasonText.trim() } : item
    )
    setRecruiter({ ...recruiter, requirementsList: updatedList })
    showToast(`Saved non-submission reason for ${selectedReqForReason.id}!`)
    setSelectedReqForReason(null)
    setReasonText('')
  }

  const PRESET_REASONS = [
    'Client JD requirements unclear / pending clarification',
    'Candidate salary expectation exceeds client budget',
    'Location constraint / No local candidates available',
    'Requirement put on hold by hiring manager',
    'Niche skill set requiring extended sourcing timeline',
  ]

  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-150">
      {/* 1. TOP NAVIGATION & HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="space-y-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Recruiter Reports</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#6B3BF6]/10 text-[#6B3BF6] font-extrabold flex items-center justify-center text-lg border border-[#6B3BF6]/20 shrink-0">
              {recruiter.avatar || recruiter.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {recruiter.name}
                </h1>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                    recruiter.status === 'On Track'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : recruiter.status === 'Warning'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  ● {recruiter.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Role: <strong className="text-slate-700">{recruiter.role}</strong> • Team: <strong className="text-slate-700">{recruiter.team}</strong> • Recruiter Performance Analytics Page
              </p>
            </div>
          </div>
        </div>

        {userRole !== 'recruiter' && userRole !== 'lead' && userRole !== 'admin' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => showToast(`Exporting ${recruiter.name} Detailed Performance Report...`)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Export Recruiter CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. TOP SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-2xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5B51D8] uppercase tracking-wider">
              Assigned Requirements
            </span>
            <Briefcase className="w-4 h-4 text-[#5B51D8]" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {recruiter.requirementsCount}
          </p>
          <div className="text-xs font-semibold flex items-center justify-between pt-1 border-t border-[#C7D2FE]/60">
            <span className="text-blue-700">Worked: {recruiter.workedReqs}</span>
            <span className="text-amber-700">Non-worked: {recruiter.nonWorkedReqs}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
              Total Submissions
            </span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {recruiter.submissionsCount}
          </p>
          <div className="text-xs font-semibold flex items-center justify-between pt-1 border-t border-purple-200/60">
            <span className="text-purple-700">Shortlisted: {recruiter.shortlistedCount}</span>
            <span className="text-slate-500">Pending: {recruiter.noSubmissionsCount}</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
              Total Interviews
            </span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {recruiter.interviewsCount || '—'}
          </p>
          <div className="text-xs font-semibold text-blue-700 pt-1 border-t border-blue-200/60">
            Conversion Rate: {recruiter.conversionRate}
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Successful Hires
            </span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
            {recruiter.hiresCount}
          </p>
          <div className="text-xs font-semibold text-emerald-700 pt-1 border-t border-emerald-200/60">
            Weekly Target Progress: {recruiter.weeklyProgressPct}%
          </div>
        </div>
      </div>

      {/* 2.5 WORK PERFORMANCE & ANALYTICS CHARTS SECTION */}
      <div className="space-y-6">
        {/* Header Banner */}
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6B3BF6]/20 border border-[#6B3BF6]/40 flex items-center justify-center text-purple-300">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-sans tracking-tight">
                {recruiter.name} — Work Performance & Sourcing Analytics
              </h3>
              <p className="text-xs text-slate-300 font-normal">
                Weekly activity trends, candidate stage funnel, and client distribution metrics
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-[#6B3BF6]/20 border border-[#6B3BF6]/40 text-purple-200 px-3.5 py-1 rounded-full flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
            <span>Live Recruiter Analytics</span>
          </span>
        </div>

        {/* Chart Row 1: Weekly Sourcing, Submissions & Interviews Activity Trend */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#6B3BF6]" />
                <span>Weekly Work Activity & Turnaround Velocity</span>
              </h4>
              <p className="text-xs text-slate-500">
                Candidates Sourced vs Submissions Sent vs Scheduled Interviews over the past 4 weeks
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-600 font-medium">Sourced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#6B3BF6]" />
                <span className="text-slate-600 font-medium">Submissions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600 font-medium">Interviews</span>
              </div>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { week: 'Week 1', sourced: Math.round(recruiter.submissionsCount * 0.35), submissions: Math.round(recruiter.submissionsCount * 0.22), interviews: Math.round((recruiter.interviewsCount || 10) * 0.2) },
                  { week: 'Week 2', sourced: Math.round(recruiter.submissionsCount * 0.45), submissions: Math.round(recruiter.submissionsCount * 0.28), interviews: Math.round((recruiter.interviewsCount || 10) * 0.25) },
                  { week: 'Week 3', sourced: Math.round(recruiter.submissionsCount * 0.40), submissions: Math.round(recruiter.submissionsCount * 0.24), interviews: Math.round((recruiter.interviewsCount || 10) * 0.25) },
                  { week: 'Week 4 (Current)', sourced: Math.round(recruiter.submissionsCount * 0.52), submissions: Math.round(recruiter.submissionsCount * 0.35), interviews: Math.round((recruiter.interviewsCount || 10) * 0.3) },
                ]}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="recSourcedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="recSubsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6B3BF6" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#6B3BF6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="recInterviewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E2E8F0" />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E2E8F0" />
                <Tooltip
                  content={({ active, payload, label }: any) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs space-y-1.5 font-sans">
                          <p className="font-bold text-blue-300 border-b border-slate-700 pb-1">{label}</p>
                          <div className="space-y-1 font-mono text-[11px]">
                            <p className="text-blue-400 flex justify-between gap-4">
                              <span>Sourced:</span>
                              <strong className="text-white">{payload[0]?.value}</strong>
                            </p>
                            <p className="text-purple-300 flex justify-between gap-4">
                              <span>Submissions:</span>
                              <strong className="text-white">{payload[1]?.value}</strong>
                            </p>
                            <p className="text-emerald-400 flex justify-between gap-4">
                              <span>Interviews:</span>
                              <strong className="text-white">{payload[2]?.value}</strong>
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area type="monotone" dataKey="sourced" name="Candidates Sourced" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#recSourcedGrad)" />
                <Area type="monotone" dataKey="submissions" name="Submissions Sent" stroke="#6B3BF6" strokeWidth={2.5} fillOpacity={1} fill="url(#recSubsGrad)" />
                <Area type="monotone" dataKey="interviews" name="Interviews Scheduled" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#recInterviewsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart Row 2: 2 Column Grid for Pipeline Stage Funnel & Client Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Chart: Candidate Submission Stage Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#6B3BF6]" />
                <span>Candidate Pipeline Stage Funnel</span>
              </h4>
              <p className="text-xs text-slate-500">
                Conversion distribution from initial sourcing to placement for {recruiter.name}
              </p>
            </div>

            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={[
                    { stage: 'Sourced', count: recruiter.submissionsCount + 28, color: '#3B82F6' },
                    { stage: 'Submitted to Lead', count: recruiter.submissionsCount, color: '#6B3BF6' },
                    { stage: 'Client Shortlisted', count: recruiter.shortlistedCount, color: '#8B5CF6' },
                    { stage: 'Interviewing', count: recruiter.interviewsCount || 10, color: '#EC4899' },
                    { stage: 'Placed & Hired', count: recruiter.hiresCount, color: '#10B981' },
                  ]}
                  margin={{ top: 5, right: 30, left: 45, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E2E8F0" />
                  <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} stroke="#E2E8F0" width={110} />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl text-xs font-mono shadow-2xl border border-slate-700">
                            <p className="font-bold text-purple-300">{item.stage}</p>
                            <p className="text-white mt-1">Candidate Count: <strong>{item.count}</strong></p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {[
                      { stage: 'Sourced', count: recruiter.submissionsCount + 28, color: '#3B82F6' },
                      { stage: 'Submitted to Lead', count: recruiter.submissionsCount, color: '#6B3BF6' },
                      { stage: 'Client Shortlisted', count: recruiter.shortlistedCount, color: '#8B5CF6' },
                      { stage: 'Interviewing', count: recruiter.interviewsCount || 10, color: '#EC4899' },
                      { stage: 'Placed & Hired', count: recruiter.hiresCount, color: '#10B981' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Chart: Client Account Workload Distribution */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>Client Account Workload & Submissions</span>
              </h4>
              <p className="text-xs text-slate-500">
                Number of submissions made by {recruiter.name} per client account
              </p>
            </div>

            <div className="h-60 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={recruiter.requirementsList.map(req => ({
                    client: req.client.length > 15 ? req.client.substring(0, 13) + '...' : req.client,
                    fullClient: req.client,
                    submissions: req.submissions,
                    interviews: req.interviews,
                  }))}
                  margin={{ top: 10, right: 20, left: -10, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="client" tick={{ fontSize: 10, fill: '#64748B' }} stroke="#E2E8F0" angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} stroke="#E2E8F0" />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        const item = payload[0].payload
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl text-xs font-mono shadow-2xl border border-slate-700">
                            <p className="font-bold text-blue-300">{item.fullClient}</p>
                            <p className="text-purple-300 mt-1">Submissions: <strong>{item.submissions}</strong></p>
                            <p className="text-emerald-400">Interviews: <strong>{item.interviews}</strong></p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="submissions" name="Submissions" fill="#6B3BF6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="interviews" name="Interviews" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 3. WORKED VS NON-WORKED REQUIREMENTS FULL LIST TABLE WITH NON-SUBMISSION REASON NOTES */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4.5 h-4.5 text-[#6B3BF6]" />
              <span>Assigned Requirements Breakdown ({recruiter.requirementsList.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Detailed list of requirements worked vs non-worked by {recruiter.name} with non-submission reasons
            </p>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Filter Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value as any)}
                className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer shadow-2xs"
              >
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>

              {dateFilter === 'custom' && (
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl text-xs shadow-2xs">
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
                  />
                  <span className="text-slate-400 font-bold">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate('')
                      setEndDate('')
                      setDateFilter('this_month')
                    }}
                    className="px-2 py-0.5 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                  >
                    Clear filter
                  </button>
                </div>
              )}
            </div>

            {/* Worked / Non-Worked Tabs (Worked is active by default) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('requirements')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'requirements' ? 'bg-white text-blue-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Worked ({recruiter.workedReqs})
              </button>
              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeTab === 'submissions' ? 'bg-white text-amber-700 shadow-2xs font-bold' : 'text-slate-600'
                }`}
              >
                Non-Worked ({recruiter.nonWorkedReqs})
              </button>
            </div>
          </div>
        </div>

        <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">REQUIREMENT TITLE & ID</th>
                <th className="py-3.5 px-4">CLIENT</th>
                <th className="py-3.5 px-4">WORKED STATUS</th>
                <th className="py-3.5 px-4">NON-SUBMISSION REASON / NOTE</th>
                <th className="py-3.5 px-4 text-center">SUBMISSIONS</th>
                <th className="py-3.5 px-4 text-center">INTERVIEWS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {recruiter.requirementsList
                .filter(r => {
                  if (activeTab === 'requirements') return r.status === 'Worked'
                  if (activeTab === 'submissions') return r.status === 'Non-Worked'
                  return true
                })
                .map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div>{r.title}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{r.id}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">{r.client}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                          r.status === 'Worked'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {r.status === 'Worked' ? '✓ Worked' : '⚠️ Non-Worked'}
                      </span>
                    </td>

                    {/* Non-submission Reason / Note Space */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {r.reasonNote ? (
                        <div className="flex items-start gap-1.5 bg-amber-50/80 border border-amber-200/80 p-2 rounded-xl text-[11px] text-amber-900">
                          <MessageSquare className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span className="flex-1 font-medium leading-tight">{r.reasonNote}</span>
                          <button
                            onClick={() => handleOpenReasonModal(r)}
                            className="text-amber-700 hover:text-amber-900 font-bold p-0.5 rounded cursor-pointer"
                            title="Edit Reason Note"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenReasonModal(r)}
                          className="px-3 py-1.5 bg-[#6B3BF6]/10 text-[#6B3BF6] hover:bg-[#6B3BF6]/20 font-bold rounded-xl text-[11px] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Reason Note</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-purple-700">
                      {r.submissions}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {r.interviews}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ADD NON-SUBMISSION REASON NOTE MODAL */}
      {selectedReqForReason && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Non-Submission Reason Note</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {selectedReqForReason.id} • {selectedReqForReason.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedReqForReason(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Quick Presets (1-Click Selection)</label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_REASONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReasonText(preset)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-purple-100 hover:text-[#6B3BF6] text-slate-700 text-[11px] font-medium rounded-lg border border-slate-200 transition-all text-left cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Custom Reason / Notes *</label>
                <textarea
                  rows={3}
                  placeholder="Explain why candidates have not been submitted for this requirement yet..."
                  value={reasonText}
                  onChange={e => setReasonText(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#6B3BF6] focus:bg-white transition-all text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReqForReason(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveReasonNote}
                className="px-5 py-2 text-xs font-bold bg-[#6B3BF6] text-white rounded-xl hover:bg-[#5833E0] shadow-xs cursor-pointer active:scale-98"
              >
                Save Reason Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed bottom-12 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
