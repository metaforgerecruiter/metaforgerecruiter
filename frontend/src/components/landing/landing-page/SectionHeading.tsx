'use client'

import React from 'react'
import { useScrollReveal } from '../../../lib/animations'

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const ref = useScrollReveal<HTMLDivElement>({ y: 18, duration: 0.55 })

  return (
    <div ref={ref} className="max-w-2xl mb-10 sm:mb-12">
      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-mono font-bold uppercase tracking-wider mb-4">
        {eyebrow}
      </span>
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">{title}</h2>
      <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed">{subtitle}</p>
    </div>
  )
}
export { SectionHeading }
