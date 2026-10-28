import React from 'react'
import { brand, cardThemeColors, kpiVariantKeys } from '../../theme'

export interface KpiItem {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}

export function KpiGrid({ items, columns = 4 }: { items: KpiItem[]; columns?: 2 | 3 | 4 | 6 }) {
  const gridClass =
    columns === 6
      ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6'
      : columns === 3
        ? 'grid-cols-1 sm:grid-cols-3'
        : columns === 2
          ? 'grid-cols-2'
          : 'grid-cols-2 lg:grid-cols-4'

  return (
    <div className={`grid ${gridClass} gap-4`}>
      {items.map((kpi, i) => {
        const variant = kpiVariantKeys[i % kpiVariantKeys.length]
        const theme = cardThemeColors[variant]
        return (
          <div
            key={i}
            className="rounded-2xl border p-4 sm:p-5 shadow-sm transition-all duration-200 hover:shadow-md"
            style={{
              background: theme.bg,
              borderColor: theme.borderColor,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-700">{kpi.label}</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5 tabular-nums">
                  {kpi.value}
                </p>
                {kpi.sub && <p className="text-xs text-slate-500 mt-1 font-medium">{kpi.sub}</p>}
              </div>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm shrink-0"
                style={{ background: theme.iconBg }}
              >
                <span className="text-xs font-bold">✓</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ChartBlock({ title, subtitle }: { title: string; subtitle?: string }) {
  const bars = [40, 65, 50, 80, 55, 70, 45]
  return (
    <div
      className="rounded-2xl border p-5 shadow-sm"
      style={{ background: brand.surface, borderColor: brand.border }}
    >
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {subtitle && <p className="text-xs mt-0.5 mb-4 text-slate-500">{subtitle}</p>}
      <div className="flex items-end gap-2 h-28 pt-2">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div
              className="rounded-t w-full"
              style={{ height: `${h}%`, background: i === bars.length - 1 ? '#6B3BF6' : '#CBD5E1' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
