import React from 'react'
import { RefreshCw } from 'lucide-react'
import { Requirement, Submission, Interview } from '../../types'
import { buildRequirementCards, CardFilterType } from './RequirementCardsGrid.cards'

export type { CardFilterType }

interface RequirementCardsGridProps {
  requirements: Requirement[]
  submissions?: Submission[]
  interviews?: Interview[]
  activeCardFilter?: CardFilterType
  onSelectFilter?: (filter: CardFilterType) => void
  onCreateNewJobDemand?: () => void
  onSyncEmails?: () => void
  isSyncingMail?: boolean
  mailSyncStatus?: {
    status: string
    message: string
    lastSyncedAt?: string
    totalProcessed?: number
    totalSynced?: number
    totalDeduped?: number
    error?: string | null
  } | null
  title?: string
  badgeLabel?: string
  hideCards?: boolean
}

export function RequirementCardsGrid({
  requirements = [],
  submissions = [],
  interviews = [],
  activeCardFilter = 'ALL',
  onSelectFilter,
  onCreateNewJobDemand,
  onSyncEmails,
  isSyncingMail = false,
  mailSyncStatus,
  title = 'Requirements Dashboard',
  badgeLabel,
  hideCards = false,
}: RequirementCardsGridProps) {
  const cards = buildRequirementCards(requirements, submissions, interviews)

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            {title}
            {badgeLabel && (
              <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                {badgeLabel}
              </span>
            )}
          </h2>
          <p className="text-xs text-gray-400 font-normal mt-0.5">
            Track and manage all hiring requirements
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {onSyncEmails && (
            <button
              type="button"
              onClick={onSyncEmails}
              disabled={isSyncingMail}
              className={`relative px-3.5 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer border ${
                isSyncingMail
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700 cursor-not-allowed opacity-90'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-slate-900 active:scale-98 shadow-xs'
              }`}
              title={
                mailSyncStatus?.lastSyncedAt
                  ? `Last synced: ${new Date(mailSyncStatus.lastSyncedAt).toLocaleTimeString()}`
                  : 'Sync requirements from Microsoft 365 Outlook emails'
              }
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isSyncingMail ? 'animate-spin' : ''}`} />
              <span>{isSyncingMail ? 'Syncing Outlook...' : 'Sync Mail'}</span>
              {mailSyncStatus?.status === 'completed' && mailSyncStatus.lastSyncedAt && !isSyncingMail && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Ready & synced" />
              )}
            </button>
          )}

          {onCreateNewJobDemand && (
            <button
              onClick={onCreateNewJobDemand}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:shadow transition-all cursor-pointer flex items-center gap-1.5 w-fit shrink-0"
            >
              <span className="text-sm leading-none font-extrabold">+</span>
              <span>Create New Job Demand</span>
            </button>
          )}
        </div>
      </div>

      {!hideCards && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(card => {
              const Icon = card.icon
              const isActive = activeCardFilter === card.key
              return (
                <div
                  key={card.key}
                  onClick={() => {
                    if (onSelectFilter) {
                      onSelectFilter(isActive ? 'ALL' : card.key)
                    }
                  }}
                  className={`relative group rounded-2xl border p-4 sm:p-5 transition-all duration-200 shadow-sm ${
                    onSelectFilter ? 'cursor-pointer' : ''
                  } ${
                    isActive
                      ? 'ring-2 ring-blue-500 shadow-md transform -translate-y-0.5'
                      : 'hover:shadow-md hover:-translate-y-0.5'
                  }`}
                  style={{
                    background: card.bg,
                    borderColor: card.borderColor,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className="text-xs sm:text-sm font-semibold text-slate-700 block truncate"
                        title={card.label}
                      >
                        {card.label}
                      </span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2 tabular-nums">
                        {card.value}
                      </div>
                    </div>
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm shrink-0 transition-transform group-hover:scale-105"
                      style={{ background: card.iconBg }}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  {onSelectFilter && (
                    <div className="mt-1 flex justify-end">
                      <span className="text-[10px] text-slate-500 font-medium">
                        {isActive ? 'Active Filter' : 'Click to filter'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
      )}
    </div>
  )
}
