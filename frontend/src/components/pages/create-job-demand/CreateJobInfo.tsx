import React from 'react'
import { CreateJobDemandVm } from './useCreateJobDemandForm'

export function CreateJobInfo({ vm }: { vm: CreateJobDemandVm }) {
  const {
    clientLeadPoc,
    setClientLeadPoc,
    clientPoc,
    setClientPoc,
    jobTitle,
    setJobTitle,
    jobStatus,
    setJobStatus,
    closedDate,
    setClosedDate,
    typeOfDemand,
    setTypeOfDemand,
    priority,
    setPriority,
  } = vm
  return (
    <>
        {/* CLIENT & JOB INFO CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Client & Job Info</h3>
            <p className="text-xs text-slate-400">Client context and lifecycle status.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Client Lead POC</label>
              <input
                type="text"
                value={clientLeadPoc}
                onChange={e => setClientLeadPoc(e.target.value)}
                placeholder="e.g. Contoso"
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Client POC</label>
              <input
                type="text"
                value={clientPoc}
                onChange={e => setClientPoc(e.target.value)}
                placeholder="e.g. Priya S."
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Full Stack Engineer"
                required
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Job Status</label>
              <select
                value={jobStatus}
                onChange={e => setJobStatus(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none cursor-pointer"
              >
                <option value="Open">Open</option>
                <option value="Assigned">Assigned</option>
                <option value="Submitted">Submitted</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Closed Date <span className="text-[10px] text-slate-400 font-normal ml-1">Enabled only for Closed</span>
              </label>
              <input
                type="date"
                value={closedDate}
                onChange={e => setClosedDate(e.target.value)}
                disabled={jobStatus !== 'Closed'}
                className="w-full bg-white disabled:bg-slate-100 disabled:text-slate-400 border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Type of Demand</label>
              <select
                value={typeOfDemand}
                onChange={e => setTypeOfDemand(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none cursor-pointer"
              >
                <option value="Single">Single</option>
                <option value="Multiple">Multiple</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Priority <span className="text-[10px] text-slate-400 font-normal ml-1">Helps recruiters prioritize work</span>
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none cursor-pointer"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

    </>
  )
}
