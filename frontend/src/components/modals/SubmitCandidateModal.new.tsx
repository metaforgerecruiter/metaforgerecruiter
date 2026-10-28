import React from 'react'
import { Send, ShieldAlert, Upload } from 'lucide-react'
import { Requirement } from '../../types'
import { checkDuplicateSubmission } from '../../data/submissionsStore'

export function SubmitCandidateNewPath({
  resumeName,
  isParsing,
  newCandidateName,
  newEmail,
  newPhone,
  newExperience,
  newCompany,
  newSkills,
  setNewCandidateName,
  setNewEmail,
  setNewPhone,
  setNewExperience,
  setNewCompany,
  setNewSkills,
  targetReq,
  newDupResult,
  onClose,
  onResumeUpload,
  parseError,
  onSubmitNew,
}: {
  resumeName: string | null
  isParsing: boolean
  newCandidateName: string
  newEmail: string
  newPhone: string
  newExperience: string
  newCompany: string
  newSkills: string
  setNewCandidateName: (value: string) => void
  setNewEmail: (value: string) => void
  setNewPhone: (value: string) => void
  setNewExperience: (value: string) => void
  setNewCompany: (value: string) => void
  setNewSkills: (value: string) => void
  targetReq: Requirement | undefined
  newDupResult: ReturnType<typeof checkDuplicateSubmission>
  onClose: () => void
  onResumeUpload: (file: File) => void
  parseError?: string | null
  onSubmitNew: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmitNew} className="space-y-4">
      <label className="block p-5 border-2 border-dashed border-slate-300 hover:border-[#6B3BF6] rounded-2xl bg-slate-50 hover:bg-purple-50/40 transition-all text-center cursor-pointer space-y-1.5">
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) onResumeUpload(f)
            e.target.value = ''
          }}
        />
        <Upload className="w-7 h-7 text-[#6B3BF6] mx-auto" />
        <div className="text-xs font-extrabold text-slate-900">
          {resumeName ? `Attached: ${resumeName}` : 'Click to attach the candidate resume (PDF/DOCX)'}
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          {isParsing ? 'Parsing resume...' : 'The resume parser fills in contact info, experience and skills'}
        </div>
        {parseError && <div className="text-[11px] text-rose-600 font-semibold">{parseError}</div>}
      </label>

      {newDupResult.isDuplicate && newDupResult.existingSubmission && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-rose-900 text-xs uppercase tracking-wide bg-rose-600 text-white px-2 py-0.5 rounded-md">
                Duplicate Submission
              </span>
              <span className="text-xs font-bold text-rose-800">Submission Blocked</span>
            </div>
          </div>
          <p className="text-xs text-rose-950 font-medium leading-relaxed">
            Candidate <strong>{newCandidateName}</strong> ({newEmail || newPhone}) is already submitted for <strong>{targetReq?.title} ({targetReq?.id})</strong>.
          </p>
          <div className="text-[11px] text-rose-900 bg-rose-100/80 p-2.5 rounded-xl border border-rose-200/80 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
            <span>Submitted By: <strong>{newDupResult.existingSubmission.recruiter || 'External Recruiter'}</strong></span>
            <span>Date: <strong>{newDupResult.existingSubmission.date}</strong></span>
            <span>Status: <strong>{newDupResult.existingSubmission.stage}</strong></span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block font-bold text-slate-700 mb-1">Candidate Full Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Anish Malhotra"
            value={newCandidateName}
            onChange={e => setNewCandidateName(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Email Address</label>
          <input
            type="email"
            placeholder="name@example.com"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
          <input
            type="text"
            placeholder="+91 XXXXX XXXXX"
            value={newPhone}
            onChange={e => setNewPhone(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
          />
        </div>
        <div>
          <label className="block font-bold text-slate-700 mb-1">Total Experience</label>
          <input
            type="text"
            placeholder="e.g. 6 Years"
            value={newExperience}
            onChange={e => setNewExperience(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">Current Company</label>
          <input
            type="text"
            placeholder="e.g. Wipro Limited"
            value={newCompany}
            onChange={e => setNewCompany(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-bold text-slate-700 mb-1">Technology & Primary Skills</label>
          <input
            type="text"
            placeholder="e.g. React.js, TypeScript, Node.js"
            value={newSkills}
            onChange={e => setNewSkills(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
          />
        </div>
      </div>

      <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!newCandidateName || newDupResult.isDuplicate}
          className={`px-6 py-2.5 text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 ${
            newDupResult.isDuplicate
              ? 'bg-rose-300 text-rose-800 cursor-not-allowed border border-rose-300 shadow-none'
              : 'bg-[#6B3BF6] hover:bg-[#5833E0] disabled:opacity-50 text-white cursor-pointer active:scale-98'
          }`}
        >
          {newDupResult.isDuplicate ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Duplicate Submission - Cannot Submit</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Submit to Client</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
