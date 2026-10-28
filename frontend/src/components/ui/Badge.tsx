import React from 'react'
import { Priority, InterviewStatus } from '../../types'
import { brand } from '../../theme'

interface PriorityBadgeProps {
  priority: Priority
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const colors: Record<Priority, { bg: string; text: string }> = {
    High: { bg: '#FEF2F2', text: '#DC2626' },
    Medium: { bg: '#FFFBEB', text: '#D97706' },
    Low: { bg: '#F3F4F6', text: '#6B7280' },
  }
  const c = colors[priority] || colors.Medium

  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded"
      style={{ background: c.bg, color: c.text }}
    >
      {priority}
    </span>
  )
}

interface StageBadgeProps {
  stage: string | InterviewStatus
}

export function StageBadge({ stage }: StageBadgeProps) {
  const lower = stage.toLowerCase()
  let bg = '#F3F4F6'
  let text = '#374151'

  if (lower.includes('placed') || lower.includes('confirmed') || lower.includes('passed')) {
    bg = '#ECFDF5'
    text = '#059669'
  } else if (lower.includes('scheduled') || lower.includes('interview')) {
    bg = '#EBF1FF'
    text = '#1B4FD8'
  } else if (lower.includes('review') || lower.includes('pending')) {
    bg = '#FFFBEB'
    text = '#D97706'
  } else if (lower.includes('rejected')) {
    bg = '#FEF2F2'
    text = '#DC2626'
  }

  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded"
      style={{ background: bg, color: text }}
    >
      {stage}
    </span>
  )
}
