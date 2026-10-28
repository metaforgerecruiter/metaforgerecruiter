import React from 'react'
import { Lock } from 'lucide-react'
import { Role } from '../../types'

export function SubmissionCandidateDetailTabs({
  activeTab,
  setActiveTab,
  role,
}: {
  activeTab: 'overview' | 'interviews' | 'feedback' | 'activity' | 'communication' | 'offer'
  setActiveTab: (tab: 'overview' | 'interviews' | 'feedback' | 'activity' | 'communication' | 'offer') => void
  role: Role
}) {
  return (
    <div className="px-6 border-b border-slate-200 bg-slate-50/50 flex items-center gap-1.5 pt-3 pb-2 overflow-x-auto custom-scrollbar">
      <button
        onClick={() => setActiveTab('overview')}
        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'overview'
            ? 'bg-[#0F172A] text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
      >
        Overview
      </button>
      <button
        onClick={() => setActiveTab('interviews')}
        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          activeTab === 'interviews'
            ? 'bg-[#0F172A] text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
      >
        Interviews
      </button>
      <button
        onClick={() => setActiveTab('feedback')}
        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          activeTab === 'feedback'
            ? 'bg-[#0F172A] text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
      >
        Feedback
      </button>
      {role !== 'recruiter' && (
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'activity'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          Activity
        </button>
      )}
      <button
        onClick={() => setActiveTab('communication')}
        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
          activeTab === 'communication'
            ? 'bg-[#0F172A] text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
        }`}
      >
        Communication
      </button>
      <button
        onClick={() => setActiveTab('offer')}
        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
          activeTab === 'offer'
            ? 'bg-[#0F172A] text-white shadow-xs'
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
        }`}
      >
        <Lock className="w-3 h-3 text-slate-400" />
        <span>Offer</span>
      </button>
    </div>
  )
}
