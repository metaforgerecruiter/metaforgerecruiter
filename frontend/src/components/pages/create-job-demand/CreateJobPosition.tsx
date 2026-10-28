import React from 'react'
import { X } from 'lucide-react'
import { CreateJobDemandVm } from './useCreateJobDemandForm'

export function CreateJobPosition({ vm }: { vm: CreateJobDemandVm }) {
  const {
    openings,
    setOpenings,
    relevantExp,
    setRelevantExp,
    employmentType,
    setEmploymentType,
    workMode,
    setWorkMode,
    budgetCurrency,
    setBudgetCurrency,
    yearlyBudget,
    setYearlyBudget,
    locationInput,
    setLocationInput,
    locations,
    setLocations,
    overallExp,
    setOverallExp,
    noticePeriod,
    setNoticePeriod,
    handleAddLocation,
  } = vm
  return (
    <>
        {/* POSITION DETAILS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Position Details</h3>
            <p className="text-xs text-slate-400">Role scope, location, and joiner availability.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Number of Positions</label>
              <input
                type="number"
                min={1}
                value={openings}
                onChange={e => setOpenings(parseInt(e.target.value) || 1)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Relevant Experience</label>
              <select
                value={relevantExp}
                onChange={e => setRelevantExp(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none cursor-pointer"
              >
                <option value="Entry Level">Entry Level</option>
                <option value="Mid Senior">Mid Senior</option>
                <option value="Senior">Senior</option>
                <option value="Executive">Executive</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Employment Type <span className="text-[10px] text-slate-400 font-normal ml-1">Only Full-time or Contract</span>
              </label>
              <select
                value={employmentType}
                onChange={e => setEmploymentType(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none cursor-pointer"
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Mode</label>
              <select
                value={workMode}
                onChange={e => setWorkMode(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none cursor-pointer"
              >
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Budget Currency</label>
              <select
                value={budgetCurrency}
                onChange={e => setBudgetCurrency(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none cursor-pointer"
              >
                <option value="INR (₹)">INR (₹)</option>
                <option value="USD ($)">USD ($)</option>
                <option value="EUR (€)">EUR (€)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Yearly budget <span className="text-[10px] text-slate-400 font-normal ml-1">Full amount in selected currency</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={yearlyBudget}
                  onChange={e => setYearlyBudget(e.target.value)}
                  placeholder="e.g. 1800000 or 18 LPA"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 pr-16 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">per year</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Location <span className="text-[10px] text-slate-400 font-normal ml-1">Type to search (e.g. hyd → Hyderabad)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={e => setLocationInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
                  placeholder="e.g. Hyderabad, Bengaluru, Remote (type hyd for Hyderabad)"
                  className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddLocation}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                >
                  Add
                </button>
              </div>
              {locations.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {locations.map((loc, idx) => (
                    <span key={idx} className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full text-xs font-medium border border-indigo-100 flex items-center gap-1">
                      {loc}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => setLocations(locations.filter((_, i) => i !== idx))} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Overall Experience</label>
              <select
                value={overallExp}
                onChange={e => setOverallExp(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none cursor-pointer"
              >
                <option value="Select experience range">Select experience range</option>
                <option value="0-2 Years">0-2 Years</option>
                <option value="2-3 Years">2-3 Years</option>
                <option value="3-5 Years">3-5 Years</option>
                <option value="5-8 Years">5-8 Years</option>
                <option value="7-12 Years">7-12 Years</option>
                <option value="10+ Years">10+ Years</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <label className="block font-semibold text-slate-700 mb-1">
              Notice Period <span className="text-[10px] text-slate-400 font-normal ml-1">Enter notice period (e.g., Immediate, 30 days, 2 months, etc.)</span>
            </label>
            <input
              type="text"
              value={noticePeriod}
              onChange={e => setNoticePeriod(e.target.value)}
              placeholder="e.g., Immediate, 30 days, 2 months"
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
            />
          </div>
        </div>

    </>
  )
}
