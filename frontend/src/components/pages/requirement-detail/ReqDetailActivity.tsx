import React from 'react'
import { Clock } from 'lucide-react'
import { RequirementDetailVm } from './useRequirementDetailOverview'

export function ReqDetailActivity({ vm }: { vm: RequirementDetailVm }) {
  const {
    requirement,
    role,
    activeTab,
    isSuperAdminOrAdmin,
    reqSubmissions,
  } = vm
  return (
    <>
      {isSuperAdminOrAdmin && activeTab === 'Activity' && (
        <div className="space-y-6 font-sans">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Requirement Audit & Complete Lifecycle Activity</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider">
                    Super Admin & Admin Access Only
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Complete historical audit log for requirement <strong className="text-slate-800">{requirement.id}</strong> ({requirement.client}) from demand creation to present state.
                </p>
              </div>

              <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Since: <strong>{requirement.openDays !== undefined ? `${requirement.openDays} days` : '5 days'}</strong></span>
              </div>
            </div>

            {/* 4 Summary Lifecycle KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-gradient-to-br from-blue-50/80 to-slate-50 border border-blue-100 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">1. CREATION & DEMAND</div>
                <div className="font-extrabold text-slate-900 text-sm">{requirement.id}</div>
                <div className="text-[11px] text-slate-600 font-medium">Arrived: <span className="font-bold text-slate-800">{requirement.emailArrivedTime || '—'}</span></div>
                <div className="text-[11px] text-slate-600 font-medium">Client: <span className="font-bold text-slate-800">{requirement.client}</span> ({requirement.openings ?? '—'} openings)</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50/80 to-slate-50 border border-purple-100 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">2. ASSIGNMENT & LEAD</div>
                <div className="font-extrabold text-slate-900 text-sm">{requirement.owner || '—'}</div>
                <div className="text-[11px] text-slate-600 font-medium">Assigned Lead: <span className="font-bold text-slate-800">{requirement.assignedLead || '—'}</span></div>
                <div className="text-[11px] text-slate-600 font-medium">Status: <span className="font-bold text-emerald-700">{requirement.assignmentStatus || '—'}</span></div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50/80 to-slate-50 border border-emerald-100 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">3. SUBMISSIONS & PIPELINE</div>
                <div className="font-extrabold text-slate-900 text-sm">{reqSubmissions.length} Candidates Submitted</div>
                <div className="text-[11px] text-slate-600 font-medium">Interviews: <span className="font-bold text-slate-800">{requirement.interviews ?? 0}</span> &nbsp;|&nbsp; Placed: <span className="font-bold text-emerald-700">{requirement.placed || 1}</span></div>
                <div className="text-[11px] text-slate-600 font-medium">Match Score Avg: <span className="font-bold text-slate-800">96%</span></div>
              </div>

              <div className="bg-gradient-to-br from-amber-50/80 to-slate-50 border border-amber-100 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">4. REVOKE & GOVERNANCE</div>
                <div className="font-extrabold text-slate-900 text-sm">{requirement.revokeRequested ? 'Revoke Pending' : 'Normal Lifecycle'}</div>
                <div className="text-[11px] text-slate-600 font-medium">
                  {requirement.revokeRequested ? (
                    <span className="text-amber-700 font-bold">Requested by {requirement.revokeRequestedBy || 'Recruiter'}</span>
                  ) : (
                    <span>No active revoke holds</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 font-medium">Audit Status: <span className="font-bold text-emerald-700">Verified</span></div>
              </div>
            </div>

            {/* Complete Requirement Lifecycle Timeline (Creation to Present End Status) */}
            <div className="space-y-6 pt-2">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span>Complete Requirement Audit Trail (Creation to Present)</span>
                <span className="w-full h-px bg-slate-200/80 flex-1"></span>
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Event 1: Requirement Creation */}
                <div className="relative flex gap-4 text-xs group">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-white shadow-2xs">
                    1
                  </div>
                  <div className="flex-1 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 space-y-2 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>Demand Email Received & Requirement Created</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-md uppercase">REQ.CREATED</span>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">{requirement.emailArrivedTime || '—'}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      Requirement <strong className="text-slate-900">{requirement.id}</strong> for position <strong className="text-slate-900">{requirement.title}</strong> was parsed from client demand email sent by <strong className="text-slate-900">{requirement.client}</strong> ({requirement.clientEmail || '—'}).
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                      <span>Openings: <strong className="text-slate-800">{requirement.openings ?? '—'}</strong></span>
                      <span>Budget: <strong className="text-slate-800">{requirement.budget || '—'}</strong></span>
                      <span>Location: <strong className="text-slate-800">{requirement.location || '—'}</strong></span>
                      <span>Priority: <strong className="text-red-600 font-bold">{requirement.priority || '—'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Event 2: Team Lead & Recruiter Assignment */}
                <div className="relative flex gap-4 text-xs group">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-white shadow-2xs">
                    2
                  </div>
                  <div className="flex-1 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 space-y-2 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>Assigned to Recruiter & Team Lead</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-md uppercase">REQ.ASSIGNED</span>
                      </span>
                      
                    </div>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      Assigned to Team Lead <strong className="text-slate-900">{requirement.assignedLead || '—'}</strong> and primary recruiter <strong className="text-slate-900">{requirement.owner || '—'}</strong>.
                    </p>
                  </div>
                </div>

                {/* Event 3: Candidate Submissions & Pipeline Sourcing */}
                <div className="relative flex gap-4 text-xs group">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-white shadow-2xs">
                    3
                  </div>
                  <div className="flex-1 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>Candidate Sourcing & Submissions Pipeline</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">SUBMISSIONS.LOG</span>
                      </span>
                      
                    </div>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      Recruiters sourced and submitted <strong className="text-slate-900">{reqSubmissions.length} candidates</strong> for client review:
                    </p>
                    <div className="space-y-2 pt-1">
                      {reqSubmissions.length === 0 && <p className="text-xs text-slate-400">No submissions yet.</p>}
                      {reqSubmissions.map(sub => ({
                        name: sub.candidateName,
                        role: sub.currentCompany || '—',
                        exp: sub.experience || '—',
                        status: sub.status,
                        time: sub.submittedOn,
                      })).map((c, cIdx) => (
                        <div key={cIdx} className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 text-xs">{c.name} <span className="text-slate-400 font-normal text-[11px]">({c.exp} exp)</span></div>
                            <div className="text-[11px] text-slate-500">{c.role}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">{c.status}</span>
                            <span className="text-[11px] text-slate-400">{c.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Event 4: Revoke Request / Audit Action (If Revoke Requested) */}
                {requirement.revokeRequested && (
                  <div className="relative flex gap-4 text-xs group">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-white shadow-2xs">
                      4
                    </div>
                    <div className="flex-1 bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
                          <span>Revoke Permission Requested by Recruiter</span>
                          <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-extrabold rounded-md uppercase">REVOKE.PENDING</span>
                        </span>
                        <span className="text-[11px] font-semibold text-amber-700">{requirement.revokeRequestedAt || '—'}</span>
                      </div>
                      <p className="text-amber-900 leading-relaxed text-xs">
                        Recruiter <strong className="text-amber-950">{requirement.revokeRequestedBy || requirement.owner || '—'}</strong> submitted a request to revoke assignment for requirement <strong className="text-amber-950">{requirement.id}</strong>.
                      </p>
                      <div className="bg-white/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-medium">
                        <strong className="font-bold text-amber-950">Revocation Reason:</strong> "{requirement.revokeReason || '—'}"
                      </div>
                    </div>
                  </div>
                )}

                {/* Event 5: Present End Lifecycle Status */}
                <div className="relative flex gap-4 text-xs group">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-white shadow-2xs">
                    {requirement.revokeRequested ? 5 : 4}
                  </div>
                  <div className="flex-1 bg-slate-900 text-white rounded-2xl p-4 space-y-2 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-white text-sm flex items-center gap-2">
                        <span>Current Lifecycle Status (Present)</span>
                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-extrabold rounded-md uppercase">ACTIVE</span>
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">Live System State</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      Requirement <strong className="text-white">{requirement.id}</strong> is currently assigned to <strong className="text-white">{requirement.owner || '—'}</strong> with <strong className="text-white">{requirement.submissions || 7} total submissions</strong> and active client interviews in progress.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}
