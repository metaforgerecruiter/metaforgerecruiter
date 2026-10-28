import { getSessionUser } from '../../store/session'
import React, { useState } from 'react'
import { X, Briefcase, Plus, Sparkles, DollarSign, Bookmark } from 'lucide-react'
import { Priority, Requirement } from '../../types'
import { saveDraftItem } from '../../data/savedDraftsStore'

interface NewRequirementModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (req: Requirement) => void
}

export function NewRequirementModal({ isOpen, onClose, onAdd }: NewRequirementModalProps) {
  const [title, setTitle] = useState('')
  const [client, setClient] = useState('')
  const [priority, setPriority] = useState<Priority>('High')
  const [openings, setOpenings] = useState(2)
  const [budget, setBudget] = useState('$130k - $160k')
  const [dueDate, setDueDate] = useState(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
  const [skillsStr, setSkillsStr] = useState('React, TypeScript, Node.js')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !client) return

    const newReq: Requirement = {
      id: `REQ-00${Math.floor(Math.random() * 90 + 10)}`,
      title,
      client,
      priority,
      status: 'Active',
      submissions: 0,
      interviews: 0,
      placed: 0,
      dueDate,
      openings: Number(openings),
      budget,
      skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
    }

    onAdd(newReq)
    onClose()
  }

  const skillBadges = skillsStr.split(',').map(s => s.trim()).filter(Boolean)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base font-sans">Create Job Requirement</h3>
              <p className="text-xs text-slate-500 font-mono">Post a new client job order to recruiter teams</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold uppercase text-slate-600">Job Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Full Stack Engineer"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold uppercase text-slate-600">Client Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Accenture"
                value={client}
                onChange={e => setClient(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold uppercase text-slate-600">Priority Tier</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-mono"
              >
                <option value="High">🔴 High Priority</option>
                <option value="Medium">⚡ Medium Priority</option>
                <option value="Low">💤 Low Priority</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-mono font-semibold uppercase text-slate-600">Openings</label>
              <input
                type="number"
                min={1}
                value={openings}
                onChange={e => setOpenings(Number(e.target.value))}
                className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-mono"
              />
            </div>
            <div className="space-y-1 col-span-2">
              <label className="text-xs font-mono font-semibold uppercase text-slate-600">Budget Range</label>
              <input
                type="text"
                placeholder="e.g. $140k - $170k"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold uppercase text-slate-600">Required Skills (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. React, TypeScript, GraphQL, AWS"
              value={skillsStr}
              onChange={e => setSkillsStr(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
            {/* Live Tag Builder Preview */}
            <div className="flex flex-wrap gap-1 pt-1">
              {skillBadges.map((s, i) => (
                <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-mono rounded font-semibold">
                  + {s}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-semibold uppercase text-slate-600">Target Due Date</label>
            <input
              type="text"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 focus:bg-white transition-colors font-mono"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-10 text-xs font-mono text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                saveDraftItem({
                  type: 'requirement',
                  title: title || 'Draft Requirement',
                  subtitle: `Client: ${client || 'Internal'} • Priority: ${priority} • Budget: ${budget}`,
                  createdBy: getSessionUser()?.name || '',
                  status: 'Saved for Later',
                  data: { title, client, priority, openings, budget, dueDate, skillsStr },
                })
                onClose()
              }}
              className="px-4 h-10 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 font-sans cursor-pointer active:scale-98"
            >
              <Bookmark className="w-4 h-4 text-amber-600" /> Save for Later
            </button>
            <button
              type="submit"
              className="px-5 h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 font-sans cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" /> Publish Requirement
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
