import React from 'react'
import { CreateJobDemandVm } from './useCreateJobDemandForm'

export function CreateJobBasic({ vm }: { vm: CreateJobDemandVm }) {
  const {
    reqId,
    setReqId,
    demandDate,
    setDemandDate,
    internalPoc,
    setInternalPoc,
  } = vm
  return (
    <>
        {/* BASIC INFO CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Basic Info</h3>
            <p className="text-xs text-slate-400">Core details for tracking and auditability.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Requirement ID <span className="text-[10px] text-slate-400 font-normal ml-1">Auto-generated from Demand Received Date (editable)</span>
              </label>
              <input
                type="text"
                value={reqId}
                onChange={e => setReqId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Demand Received Date <span className="text-[10px] text-slate-400 font-normal ml-1">Select today or up to 2 previous calendar days</span>
              </label>
              <input
                type="date"
                value={demandDate}
                onChange={e => setDemandDate(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Internal POC <span className="text-[10px] text-slate-400 font-normal ml-1">Searchable</span>
              </label>
              <input
                type="text"
                value={internalPoc}
                onChange={e => setInternalPoc(e.target.value)}
                placeholder="Type a name or email..."
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
              />
            </div>
          </div>
        </div>

    </>
  )
}
