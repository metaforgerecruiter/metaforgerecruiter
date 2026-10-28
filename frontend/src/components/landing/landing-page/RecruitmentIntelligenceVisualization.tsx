import React from 'react'
import { FileSearch, Send, Sparkles, Zap, CheckCircle2 } from 'lucide-react'

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

export { RecruitmentIntelligenceVisualization }
