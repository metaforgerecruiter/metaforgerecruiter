import React from 'react'
import { X } from 'lucide-react'
import { CreateJobDemandVm } from './useCreateJobDemandForm'

export function CreateJobCoreSkills({ vm }: { vm: CreateJobDemandVm }) {
  const {
    skillInput,
    setSkillInput,
    skills,
    setSkills,
    handleAddSkill,
  } = vm
  return (
    <>
        {/* CORE SKILLS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Skills</h3>
            <p className="text-xs text-slate-400">Core skills required for the role.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700">Skills</label>
              <span className="text-[10px] text-slate-400">Comma separated</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="e.g. Communication, Problem solving, Agile"
                className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Add
              </button>
            </div>

            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.map((s, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-medium border border-slate-200 flex items-center gap-1.5">
                    {s}
                    <X className="w-3 h-3 text-slate-400 hover:text-slate-700 cursor-pointer" onClick={() => setSkills(skills.filter((_, i) => i !== idx))} />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

    </>
  )
}
