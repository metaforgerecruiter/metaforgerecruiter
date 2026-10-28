import React from 'react'
import { CheckCircle } from 'lucide-react'
import { RequirementDetailVm } from './useRequirementDetailOverview'

export function ReqDetailProgressTabs({ vm }: { vm: RequirementDetailVm }) {
  const {
    requirement,
    activeTab,
    setActiveTab,
    availableTabs,
    isUnassigned,
    reqSubmissions,
  } = vm
  // Steps 3-5 reflect the stages this requirement's submissions have actually reached.
  const stages = reqSubmissions.map(sub => String(sub.raw?.stage || '').toLowerCase())
  const reachedInterview =
    stages.some(st => /interview|offer|placed/.test(st)) ||
    String((requirement as any).status || '').toLowerCase().includes('interview') ||
    requirement.interviews > 0
  const reachedClient = reachedInterview || stages.some(st => st === 'submitted to client' || st === 'client review')
  const reachedLead = reachedClient || stages.some(st => st === 'submitted' || st === 'submitted to lead')
  return (
    <>
      {/* 5. RECRUITMENT PROGRESS CARD */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Recruitment Progress</h3>
        <div className="flex flex-wrap items-center gap-4 py-2">
          {/* Step 1: Assigned */}
          <ProgressStep n={1} label="Assigned" done={!isUnassigned} />

          <div className={`w-10 sm:w-12 h-0.5 ${!isUnassigned ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>

          {/* Step 2: Sourcing (current step until a candidate is submitted) */}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${
              reachedLead ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white font-bold text-xs'
            }`}>
              {reachedLead ? <CheckCircle className="w-4 h-4" /> : '●'}
            </div>
            <span className={`text-[11px] font-bold ${reachedLead ? 'text-emerald-700' : 'text-blue-600'}`}>Sourcing</span>
          </div>

          {!isUnassigned && (
            <>
              <div className={`w-10 sm:w-12 h-0.5 ${reachedLead ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
              <ProgressStep n={3} label="Submitted to Lead" done={reachedLead} />
              <div className={`w-10 sm:w-12 h-0.5 ${reachedClient ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
              <ProgressStep n={4} label="Submitted to Client" done={reachedClient} />
              <div className={`w-10 sm:w-12 h-0.5 ${reachedInterview ? 'bg-amber-400' : 'bg-slate-200'}`}></div>
              <ProgressStep n={5} label="Interview Scheduled" done={reachedInterview} tone="amber" />
            </>
          )}
        </div>
      </div>

      {/* 6. TAB NAVIGATION BAR (Activity tab visible strictly to Super Admin & Admin) */}
      <div className="bg-slate-50/80 border border-gray-200/80 rounded-xl p-1.5 flex items-center gap-1">
        {availableTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-xs border border-gray-200/60'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

    </>
  )
}

function ProgressStep({ n, label, done, tone = 'emerald' }: { n: number; label: string; done: boolean; tone?: 'emerald' | 'amber' }) {
  const doneCircle = tone === 'amber' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
  const doneText = tone === 'amber' ? 'text-amber-700' : 'text-emerald-700'
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${done ? doneCircle : 'bg-slate-200 text-slate-500 font-bold text-xs'}`}>
        {done ? <CheckCircle className="w-4 h-4" /> : n}
      </div>
      <span className={`text-[11px] font-bold ${done ? doneText : 'text-slate-500'}`}>{label}</span>
    </div>
  )
}
