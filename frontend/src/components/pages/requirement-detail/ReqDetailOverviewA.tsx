import React from 'react'
import { RequirementDetailVm } from './useRequirementDetailOverview'

export function ReqDetailOverviewA({ vm }: { vm: RequirementDetailVm }) {
  const {
    requirement,
    activeTab,
    isUnassigned,
    mandatorySkills,
    generalSkills,
  } = vm
  return (
    <>
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* REQUIREMENT OVERVIEW GRID CARD (MATCHING SCREENSHOT 1 & 2) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Requirement Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-6 text-xs">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">REQUIREMENT ID</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.id}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DEMAND RECEIVED DATE</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.emailArrivedTime || 'Jun 19, 2026, 05:30 AM'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">INTERNAL POC (TO)</div>
                <div className="font-bold text-gray-900 mt-1">offshore demands</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">REQUIREMENT FROM</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.client}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CLIENT LEAD POC (FROM)</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.clientEmail ? requirement.clientEmail.split('@')[0] : 'harish'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CLIENT POC (FROM/CC)</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.clientEmail ? requirement.clientEmail.split('@')[0] : 'harish'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">JOB TITLE</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.title}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">JOB STATUS</div>
                <div className="font-bold text-gray-900 mt-1">{isUnassigned ? 'Unassigned' : (requirement.assignmentStatus || 'Submitted')}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CLOSED DATE</div>
                <div className="font-medium text-gray-700 mt-1">—</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TYPE OF DEMAND</div>
                <div className="font-bold text-gray-900 mt-1">Single</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PRIORITY</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.priority}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">NUMBER OF POSITIONS</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.openings || 1}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">RELEVANT EXPERIENCE</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.experienceLevel || 'Mid Level'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">EMPLOYMENT TYPE</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.employmentType || 'Full-time'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BUDGET CURRENCY</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.budget ? requirement.budget.split(' ')[0] : 'INR'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">YEARLY BUDGET</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.budget || 'Not specified'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">WORK MODE</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.workMode || 'Hybrid'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">LOCATION</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.location || 'Remote, Hybrid, Onsite'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OVERALL EXPERIENCE</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.experience || (requirement.experienceRange?.min ? (requirement.experienceRange.max == null ? `${requirement.experienceRange.min}+ Years` : `${requirement.experienceRange.min}-${requirement.experienceRange.max} Years`) : 'Not specified')}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">NOTICE PERIOD</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.noticePeriod || 'Not specified'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OPEN SINCE</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.emailArrivedTime || 'Recently'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SLA</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.sla || '5 days'}</div>
              </div>
            </div>
          </div>

          {/* SKILLS CARD */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Skills</h3>

            <div className="space-y-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                MANDATORY SKILLS
              </div>
              <div className="flex flex-wrap gap-2">
                {mandatorySkills.length > 0 ? (
                  mandatorySkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200/70"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">None specified</span>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                SKILLS
              </div>
              <div className="flex flex-wrap gap-2">
                {generalSkills.length > 0 ? (
                  generalSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200/70"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-400 italic">None specified</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
