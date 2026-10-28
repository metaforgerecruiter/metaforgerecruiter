import React from 'react'
import { X, Mail, Phone, Briefcase, Calendar, Award, CheckCircle2, FileText, ExternalLink, Sparkles } from 'lucide-react'
import { Submission } from '../../types'
import { StageBadge } from '../ui/Badge'

interface CandidateDetailModalProps {
  isOpen: boolean
  onClose: () => void
  submission: Submission | null
}

export function CandidateDetailModal({ isOpen, onClose, submission }: CandidateDetailModalProps) {
  if (!isOpen || !submission) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200/90 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Top Header Drawer Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xl font-mono shadow-lg shadow-blue-500/30">
              {submission.candidate.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                  {submission.match ? `${submission.match} AI Match` : 'No match score'}
                </span>
                <span className="text-[10px] font-mono text-slate-400">ID: {submission.id}</span>
              </div>
              <h2 className="text-xl font-bold font-sans tracking-tight text-white">{submission.candidate}</h2>
              <p className="text-xs text-slate-300 font-body">Submitted for {submission.req} · {submission.client}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Quick Contact Bar */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-700 min-w-0">
              <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="truncate">{submission.email || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 min-w-0">
              <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="truncate">{submission.phone || '—'}</span>
            </div>
          </div>

          {/* Current Pipeline Status */}
          <div className="border border-slate-200/80 rounded-2xl p-4 bg-white shadow-xs">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider mb-2">
              Pipeline Stage & Activity
            </h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-900 font-sans">{submission.stage}</p>
                <p className="text-[11px] font-mono text-slate-400">Submitted on {submission.date}</p>
              </div>
              <StageBadge stage={submission.stage} />
            </div>
          </div>

          {/* Experience & Core Skills */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
              Profile Summary & Experience
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <p className="text-slate-700 font-body">
                <span className="font-semibold text-slate-900">Total Experience:</span> {submission.experience || '—'}
              </p>
            </div>
          </div>

          {/* Candidate Skills Pills */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
              Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {((submission as any).skills || []).length === 0 && <span className="text-xs text-slate-400">No skills recorded.</span>}
              {((submission as any).skills || []).map((skill: string) => (
                <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs font-mono rounded-lg border border-blue-200/80 font-medium">
                  ✓ {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Timeline of Stage History */}
          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold uppercase text-slate-500 tracking-wider">
              Recruitment Process Audit Trail
            </h4>
            <div className="space-y-2 border-l-2 border-slate-200 pl-4 text-xs font-mono">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 absolute -left-[21px] top-1" />
                <p className="font-bold text-slate-900">{submission.stage}</p>
                <p className="text-[10px] text-slate-400">Updated by {submission.recruiter}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] font-mono text-slate-500">Recruiter: {submission.recruiter}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-blue-600 text-white text-xs font-mono font-semibold rounded-xl transition-colors shadow-xs"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  )
}
