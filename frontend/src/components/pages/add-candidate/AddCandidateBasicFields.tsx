import React from 'react'
import { AddCandidateVm } from './useAddCandidatePage'

export function AddCandidateBasicFields({ vm }: { vm: AddCandidateVm }) {
  const {
    candidateId,
    setCandidateId,
    submissionDate,
    setSubmissionDate,
    candidateName,
    setCandidateName,
    currentCompany,
    setCurrentCompany,
    contactNumber,
    setContactNumber,
    email,
    setEmail,
    linkedInUrl,
    setLinkedInUrl,
    qualification,
    setQualification,
  } = vm
  return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Candidate ID */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Candidate ID (optional)
                </label>
                <span className="text-[10px] text-slate-400">
                  Auto-increments after each submit (CAND-YYYY-MM-DD-001, 002, ...); editable
                </span>
              </div>
              <input
                type="text"
                value={candidateId}
                onChange={e => setCandidateId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 bg-slate-50/50"
              />
            </div>

            {/* Submission Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Submission Date (optional)
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={submissionDate}
                  onChange={e => setSubmissionDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 bg-slate-50/50"
                />
              </div>
            </div>

            {/* Candidate Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Candidate Name (optional)
              </label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={candidateName}
                onChange={e => setCandidateName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Current Company */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Company
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Corp"
                value={currentCompany}
                onChange={e => setCurrentCompany(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Number (optional)
              </label>
              <input
                type="text"
                placeholder="+91 9xxxx xxxxx"
                value={contactNumber}
                onChange={e => setContactNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email (optional)
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* LinkedIn URL */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                LinkedIn URL
              </label>
              <input
                type="text"
                placeholder="https://www.linkedin.com/in/..."
                value={linkedInUrl}
                onChange={e => setLinkedInUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Highest Qualification */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Highest Qualification
              </label>
              <input
                type="text"
                placeholder="e.g. B.Tech, MCA, MBA"
                value={qualification}
                onChange={e => setQualification(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>
          </div>
  )
}
