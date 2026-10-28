import React from 'react'
import { AlertTriangle, Check, X, RefreshCw } from 'lucide-react'
import { RequirementCardsGrid } from '../../ui/RequirementCardsGrid'
import { RequirementsVm } from './useRequirementsPage'

export function RequirementsCards({ vm }: { vm: RequirementsVm }) {
  const {
    role,
    requirements,
    submissions,
    interviews,
    localRequirements,
    setIsCreatingDemand,
    activeCardFilter,
    setActiveCardFilter,
    handleGrantRevokeApproval,
    handleDeclineRevokeRequest,
    roleLabel,
    pendingRevokeRequests,
    isSyncingMail,
    mailSyncStatus,
    handleSyncEmails,
  } = vm
  return (
    <>
      {/* 8 TOP CARDS GRID */}
      <RequirementCardsGrid
        requirements={localRequirements}
        submissions={submissions}
        interviews={interviews}
        activeCardFilter={activeCardFilter}
        onSelectFilter={setActiveCardFilter}
        onCreateNewJobDemand={role === 'admin' ? undefined : () => setIsCreatingDemand(true)}
        onSyncEmails={handleSyncEmails}
        isSyncingMail={isSyncingMail}
        mailSyncStatus={mailSyncStatus}
        title="Requirements Dashboard"
        badgeLabel={roleLabel}
        hideCards={role === 'recruiter' || role === 'lead'}
      />

      {/* AUTO EMAIL EXTRACTION SYNC BANNER */}
      {isSyncingMail && (
        <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border border-indigo-200/80 rounded-2xl p-3.5 shadow-xs flex items-center justify-between text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            </div>
            <div>
              <p className="font-extrabold text-indigo-950 flex items-center gap-2">
                <span>Microsoft 365 Auto Mail Extraction Active</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700 font-bold border border-indigo-200">
                  Processing Inbox
                </span>
              </p>
              <p className="text-[11px] text-indigo-700/80 font-medium mt-0.5">
                Fetching client requirement emails, extracting role details, skills, experience, and updating requirements list...
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 shrink-0 hidden sm:inline-block">
            Auto-refreshing view...
          </span>
        </div>
      )}

      {/* PENDING REVOKE APPROVAL BANNER (EXCLUSIVELY FOR SUPER ADMIN & ADMIN) */}
      {(role === 'superadmin' || role === 'admin' || role === 'devteam') && pendingRevokeRequests.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 border border-amber-300/80 rounded-2xl p-4 shadow-sm space-y-3 font-sans animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Pending Revoke Permission Requests</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                    {pendingRevokeRequests.length} Pending
                  </span>
                </h4>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Recruiters have requested permission to revoke requirement assignments. Approving will revert the requirement to Unassigned.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {pendingRevokeRequests.map(pReq => (
              <div
                key={pReq.id}
                className="bg-white/90 backdrop-blur-xs border border-amber-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-bold">
                    <span className="text-[#6B3BF6]">{pReq.id}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-800">{pReq.title}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      {pReq.client}
                    </span>
                  </div>
                  <div className="text-slate-600 text-[11px] leading-relaxed">
                    <span className="font-extrabold text-amber-700">Requested by:</span> {pReq.revokeRequestedBy || pReq.owner || 'Recruiter'}
                    {pReq.revokeReason && (
                      <>
                        <span className="mx-1.5 text-slate-300">|</span>
                        <span className="font-bold text-slate-700">Reason:</span> "{pReq.revokeReason}"
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleGrantRevokeApproval(pReq.id)}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Grant Approval & Revert</span>
                  </button>

                  <button
                    onClick={() => handleDeclineRevokeRequest(pReq.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </>
  )
}
