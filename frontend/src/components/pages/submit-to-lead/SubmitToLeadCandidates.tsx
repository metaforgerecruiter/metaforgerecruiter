import React, { useRef } from 'react'
import { Plus, FolderOpen } from 'lucide-react'
import { SubmitToLeadVm } from './useSubmitToLeadPage'

export function SubmitToLeadCandidates({ vm }: { vm: SubmitToLeadVm }) {
  const {
    requirement,
    clientName,
    selectedCandidates,
    confirmForwardChecked,
    setConfirmForwardChecked,
    showToast,
    onBack,
  } = vm

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const candidateList = Array.isArray(selectedCandidates) ? selectedCandidates : []
  const skillsList = Array.isArray(requirement?.skills) ? requirement.skills : []
  const experienceLabel = (requirement as any)?.experience
    || ((requirement as any)?.experienceRange
      ? ((requirement as any).experienceRange.max == null
          ? `${(requirement as any).experienceRange.min}+ Years`
          : `${(requirement as any).experienceRange.min} - ${(requirement as any).experienceRange.max} Years`)
      : '')

  return (
    <div className="space-y-6">
      {/* 1. CONFIRMATION CHECKBOX BOX MATCHING SCREENSHOT 3 & 4 */}
      <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 space-y-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmForwardChecked}
            onChange={e => setConfirmForwardChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-amber-600 rounded cursor-pointer focus:ring-amber-500"
          />
          <span className="text-xs font-bold text-amber-950">
            I confirm these candidates should be forwarded in the original client requirement email thread.
          </span>
        </label>
        <p className="text-[11px] text-slate-500 pl-7">
          One submission will be recorded; lead email and client thread forward for:{' '}
          <strong className="text-slate-800">{clientName || requirement?.client || 'the selected client'}</strong>
        </p>
      </div>

      {/* 2. REQUIREMENT READ-ONLY SECTION MATCHING SCREENSHOT 3 & 4 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Requirement</h3>
          <p className="text-xs text-slate-500 mt-0.5">Details of the position you are submitting for (read-only)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ROLE / Title</span>
            <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
              {requirement?.title || '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">CLIENT</span>
            <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
              {requirement?.client || '—'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">EXPERIENCE</span>
            <span className="text-xs font-extrabold text-slate-900 mt-0.5 block">
              {experienceLabel || '—'}
            </span>
          </div>
        </div>

        {/* SKILLS CHIPS */}
        <div className="pt-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">SKILLS</span>
          <div className="flex flex-wrap gap-2">
            {skillsList.map((skill: string, idx: number) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-medium rounded-lg"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. ATTACH CANDIDATES SECTION MATCHING SCREENSHOT 3 & 4 */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Attach Candidates</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Search and attach candidates for this requirement. Profiles do not need every field filled in. Use Attach resume on each row to upload PDF or DOCX (optional if already on file).
          </p>
        </div>

        {/* NUMBER OF POSITIONS TO SUBMIT INPUT */}
        <div>
          <label className="block text-slate-700 font-bold text-xs mb-1">
            Number of Positions to Submit
            <span className="text-slate-400 font-normal text-[11px] ml-2">Maximum number of candidates you can attach</span>
          </label>
          <input
            type="number"
            value={candidateList.length}
            readOnly
            className="w-48 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 focus:outline-none"
          />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => showToast('Attach candidate form opened.')}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Active Candidate</span>
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
          >
            <FolderOpen className="w-4 h-4 text-blue-600" />
            <span>Open Candidate Repository (checkboxes)</span>
          </button>
        </div>

        {/* ATTACHED CANDIDATES LIST */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-extrabold text-slate-900 block">
            Attached Candidates ({candidateList.length} / {candidateList.length})
          </span>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) {
                showToast(`Resume replaced with ${file.name}`)
              }
            }}
          />

          {candidateList.map((cand: any, idx: number) => (
            <div
              key={cand.id || idx}
              className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-extrabold text-slate-900 text-xs">{cand.name || 'Candidate'}</h4>
                  <span className="text-[11px] font-mono text-slate-400">{cand.candidateId || cand.id || ''}</span>
                  <span className="text-[11px] text-blue-700 font-semibold">• {cand.email || 'No email'}</span>
                </div>
                <p className="text-[11px] text-emerald-700 font-bold mt-1">
                  Resume on file:{' '}
                  <span className="underline">
                    {cand.resumeReference || 'No resume on file'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer shadow-2xs transition-all"
                >
                  Replace resume
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Candidate detached.')}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer text-sm font-bold"
                  title="Remove candidate"
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
