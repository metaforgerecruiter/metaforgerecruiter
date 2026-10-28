import React from 'react'
import { brand } from '../../theme'

export function AiInsightBanner({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border px-5 py-4 text-sm flex items-start gap-3 bg-[#F4EFFE] border-[#E9D8FD]">
      <span className="font-semibold shrink-0 text-[#6B3BF6]">AI Insight</span>
      <span className="text-slate-600">{text}</span>
    </div>
  )
}

export function ActivityFeed({
  items,
}: {
  items: { time: string; user: string; action: string }[]
}) {
  return (
    <ul className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className="text-xs shrink-0 w-16 text-slate-400">{item.time}</span>
          <span className="text-slate-900">
            <span className="font-medium">{item.user}</span>{' '}
            <span className="text-slate-600">{item.action}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function QuickActions({ actions, onAction }: { actions: string[]; onAction?: (a: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <button
          key={a}
          onClick={() => onAction?.(a)}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#6B3BF6] hover:bg-[#5833E0] transition-colors"
        >
          {a}
        </button>
      ))}
    </div>
  )
}

export function WorkflowStrip() {
  const steps = [
    'Client',
    'Requirement',
    'AI JD',
    'Assignment',
    'AI Match',
    'Source',
    'Duplicate Check',
    'Parse',
    'Lead Approval',
    'Submit',
    'Interview',
    'Offer',
    'Joining',
    'Billing',
  ]
  return (
    <div
      className="rounded-2xl border p-5 overflow-x-auto shadow-sm"
      style={{ background: brand.surface, borderColor: brand.border }}
    >
      <p className="text-xs font-semibold mb-3 text-slate-500 uppercase tracking-wider">
        Recruitment Lifecycle
      </p>
      <div className="flex items-center gap-1 min-w-max">
        {steps.map((step, i) => (
          <React.Fragment key={step}>
            <span className="px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap bg-slate-100 text-slate-600">
              {step}
            </span>
            {i < steps.length - 1 && <span className="text-slate-400">→</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export function PriorityLegend() {
  const items = [
    { label: 'Critical', color: '#DC2626', bg: '#FEF2F2' },
    { label: 'High', color: '#D97706', bg: '#FFFBEB' },
    { label: 'Medium', color: '#6B3BF6', bg: '#F4EFFE' },
    { label: 'Low', color: '#64748B', bg: '#F1F5F9' },
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(p => (
        <span
          key={p.label}
          className="text-xs font-medium px-2.5 py-0.5 rounded-lg"
          style={{ background: p.bg, color: p.color }}
        >
          {p.label}
        </span>
      ))}
    </div>
  )
}
