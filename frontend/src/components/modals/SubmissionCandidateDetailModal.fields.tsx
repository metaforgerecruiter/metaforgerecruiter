import React from 'react'

export function SubmissionCandidateDetailFields({
  exp,
  company,
  submittedBy,
  submittedOn,
  submissionId,
  status,
  skills,
  expectedSalary,
  currentSalary,
  noticePeriod,
  location,
  clientName,
  requirement,
}: {
  exp: string
  company: string
  submittedBy: string
  submittedOn: string
  submissionId: string
  status: string
  skills?: string[] | string
  expectedSalary?: string
  currentSalary?: string
  noticePeriod?: string
  location?: string
  clientName?: string
  requirement?: string
}) {
  const skillsList = Array.isArray(skills)
    ? skills
    : typeof skills === 'string'
    ? skills.split(',').map(s => s.trim()).filter(Boolean)
    : ['React', 'TypeScript', 'Node.js']

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5 text-xs">
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            ROLE / REQUIREMENT
          </span>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{requirement || 'Senior Developer'}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            TOTAL EXPERIENCE
          </span>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{exp}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            NOTICE PERIOD
          </span>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{noticePeriod || '—'}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            EXPECTED SALARY / CTC
          </span>
          <p className="text-sm font-semibold text-[#6B3BF6] mt-0.5">{expectedSalary || '—'}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            PREFERRED LOCATION
          </span>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{location || '—'}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            CORE SKILLS & TECH STACK
          </span>
          <div className="flex flex-wrap gap-1.5">
            {skillsList.map((skill, idx) => (
              <span key={idx} className="px-2.5 py-1 bg-purple-50 text-[#6B3BF6] border border-purple-100 rounded-lg font-semibold text-[11px]">
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            SUBMISSION ID
          </span>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{submissionId}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            SUBMITTED TO (CLIENT)
          </span>
          <p className="text-sm font-extrabold text-[#6B3BF6] mt-0.5">{clientName || 'Accenture'}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            CURRENT COMPANY
          </span>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{company}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            CURRENT SALARY / CTC
          </span>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{currentSalary || '—'}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            CURRENT LOCATION
          </span>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{location || '—'}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            SUBMITTED BY (RECRUITER)
          </span>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{submittedBy}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            SUBMISSION DATE & TIME
          </span>
          <p className="text-sm font-semibold text-slate-900 mt-0.5">{submittedOn}</p>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            CLIENT SUBMISSION STATUS
          </span>
          <span className="inline-block mt-0.5 px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {status}
          </span>
        </div>
      </div>
    </div>
  )
}
