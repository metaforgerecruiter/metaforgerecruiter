import React, { useState, useMemo } from 'react'
import { Candidate, Requirement } from '../../types'
import { PageHeader } from '../layout/PageHeader'
import {
  Users,
  Upload,
  FileText,
  Calendar,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Eye,
  Check,
  Bookmark,
  Trash2,
  Play,
  Clock,
  Briefcase,
  ShieldAlert,
} from 'lucide-react'
import {
  getSavedDrafts,
  saveDraftItem,
  removeSavedDraft,
  SavedDraftItem,
} from '../../data/savedDraftsStore'
import { checkDuplicateSubmission } from '../../data/submissionsStore'

interface AddCandidatePageProps {
  requirements?: Requirement[]
  selectedReqId?: string | null
  onOpenRepository: () => void
  onAddCandidate?: (candidate: Candidate) => void
}

export function AddCandidatePage({
  requirements = [],
  selectedReqId = null,
  onOpenRepository,
  onAddCandidate,
}: AddCandidatePageProps) {
  // Mode selection: 'single' | 'bulk' | 'drafts'
  const [importMode, setImportMode] = useState<'single' | 'bulk' | 'drafts'>('single')
  const [isParsing, setIsParsing] = useState(false)
  const [parsedFileName, setParsedFileName] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showSaveDraftToast, setShowSaveDraftToast] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Saved Drafts state
  const [draftsList, setDraftsList] = useState<SavedDraftItem[]>(() => getSavedDrafts())

  // Form Fields State (pre-filled with optional defaults matching screenshot)
  const [candidateId, setCandidateId] = useState('CAND-2026-08-07-001')
  const [submissionDate, setSubmissionDate] = useState('2026-08-07')
  const [candidateName, setCandidateName] = useState('')
  const [currentCompany, setCurrentCompany] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [email, setEmail] = useState('')
  const [linkedInUrl, setLinkedInUrl] = useState('')
  const [qualification, setQualification] = useState('')

  // Skills & Technologies
  const [skills, setSkills] = useState('')
  const [technologies, setTechnologies] = useState('')

  // Experience & CTC
  const [totalExperience, setTotalExperience] = useState('')
  const [relevantExperience, setRelevantExperience] = useState('')
  const [currentCtc, setCurrentCtc] = useState('')
  const [expectedCtc, setExpectedCtc] = useState('')
  const [noticePeriod, setNoticePeriod] = useState('')

  // Location & Availability
  const [currentLocation, setCurrentLocation] = useState('')
  const [preferredLocation, setPreferredLocation] = useState('')
  const [interviewAvailability, setInterviewAvailability] = useState('')
  const [offerInHand, setOfferInHand] = useState<
    'Select' | 'Yes' | 'No' | 'In Pipeline'
  >('Select')
  const [reasonForChange, setReasonForChange] = useState('')
  const [notes, setNotes] = useState('')

  const [targetReqId, setTargetReqId] = useState<string>(selectedReqId || (requirements[0]?.id ?? 'REQ-001'))

  // Real-time Duplicate Submission Check
  const dupCheckResult = useMemo(() => {
    if (!targetReqId || (!candidateName && !email && !contactNumber)) {
      return { isDuplicate: false }
    }
    return checkDuplicateSubmission(targetReqId, {
      email,
      phone: contactNumber,
      candidateId,
      name: candidateName,
    })
  }, [targetReqId, candidateName, email, contactNumber, candidateId])

  // Simulate Metaforge AI Resume Parsing
  const handleParseResume = () => {
    setIsParsing(true)
    setTimeout(() => {
      setIsParsing(false)
      setParsedFileName('Priya_Nair_Resume.pdf')

      // Fill out form automatically with sample parsed candidate details
      setCandidateName('Priya Nair')
      setCurrentCompany('Contoso')
      setContactNumber('+91 98765 43210')
      setEmail('priya.nair@contoso.com')
      setLinkedInUrl('https://www.linkedin.com/in/priyanair-tech')
      setQualification('B.Tech CS')
      setSkills('Communication, Problem solving, Stakeholder management')
      setTechnologies('React, TypeScript, Node.js, SQL, Tailwind CSS')
      setTotalExperience('4.5 Years')
      setRelevantExperience('3.8 Years')
      setCurrentCtc('12 LPA')
      setExpectedCtc('16 LPA')
      setNoticePeriod('30 days')
      setCurrentLocation('Bengaluru')
      setPreferredLocation('Bengaluru / Remote')
      setInterviewAvailability('Available after 5 PM weekdays')
      setOfferInHand('No')
      setReasonForChange('Better role / Growth')
      setNotes('Parsed via Metaforge AI. Strong frontend architecture expertise.')
    }, 1000)
  }

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (dupCheckResult.isDuplicate) {
      setToastMsg(`⚠️ Duplicate Submission: ${candidateName || 'Candidate'} has already been submitted for this requirement.`)
      setTimeout(() => setToastMsg(null), 3500)
      return
    }

    const newCandidate: Candidate = {
      id: candidateId,
      submissionDate,
      name: candidateName || 'Unnamed Candidate',
      company: currentCompany,
      phone: contactNumber,
      email: email,
      linkedIn: linkedInUrl,
      qualification: qualification,
      skills: skills,
      technologies: technologies,
      totalExperience: totalExperience,
      relevantExperience: relevantExperience,
      currentCtc: currentCtc,
      expectedCtc: expectedCtc,
      noticePeriod: noticePeriod,
      currentLocation: currentLocation,
      preferredLocation: preferredLocation,
      interviewAvailability: interviewAvailability,
      offerInHand: offerInHand,
      reasonForChange: reasonForChange,
      notes: notes,
      resumeName: parsedFileName || undefined,
      matchScore: '95%',
      status: 'Parsed',
    }

    if (onAddCandidate) {
      onAddCandidate(newCandidate)
    }

    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)

    // Auto-increment Candidate ID for next entry
    const match = candidateId.match(/(\d+)$/)
    if (match) {
      const nextNum = (parseInt(match[1], 10) + 1).toString().padStart(3, '0')
      setCandidateId(`CAND-2026-08-07-${nextNum}`)
    }

    // Reset editable text fields
    setCandidateName('')
    setCurrentCompany('')
    setContactNumber('')
    setEmail('')
    setLinkedInUrl('')
    setQualification('')
    setSkills('')
    setTechnologies('')
    setTotalExperience('')
    setRelevantExperience('')
    setCurrentCtc('')
    setExpectedCtc('')
    setNoticePeriod('')
    setCurrentLocation('')
    setPreferredLocation('')
    setInterviewAvailability('')
    setOfferInHand('Select')
    setReasonForChange('')
    setNotes('')
    setParsedFileName(null)
  }

  const handleSaveDraftForLater = () => {
    const draftTitle = candidateName || candidateId || 'Draft Candidate Profile'
    saveDraftItem({
      type: 'candidate',
      title: draftTitle,
      subtitle: `${technologies || 'Technology'} • ${totalExperience || 'Exp'} • Current: ${currentCompany || 'Not specified'} (${currentCtc || 'CTC'})`,
      createdBy: 'Harish Gadipally',
      status: 'Saved for Later',
      data: {
        candidateId,
        submissionDate,
        candidateName,
        currentCompany,
        contactNumber,
        email,
        linkedInUrl,
        qualification,
        skills,
        technologies,
        totalExperience,
        relevantExperience,
        currentCtc,
        expectedCtc,
        noticePeriod,
        currentLocation,
        preferredLocation,
        interviewAvailability,
        offerInHand,
        reasonForChange,
        notes,
        parsedFileName,
      },
    })

    setDraftsList(getSavedDrafts())
    setShowSaveDraftToast(true)
    setTimeout(() => setShowSaveDraftToast(false), 3500)
  }

  const handleLoadDraft = (draft: SavedDraftItem) => {
    if (draft.type === 'candidate' && draft.data) {
      const d = draft.data
      if (d.candidateId) setCandidateId(d.candidateId)
      if (d.candidateName) setCandidateName(d.candidateName)
      if (d.currentCompany) setCurrentCompany(d.currentCompany)
      if (d.contactNumber) setContactNumber(d.contactNumber)
      if (d.email) setEmail(d.email)
      if (d.linkedInUrl) setLinkedInUrl(d.linkedInUrl)
      if (d.qualification) setQualification(d.qualification)
      if (d.skills) setSkills(d.skills)
      if (d.technologies) setTechnologies(d.technologies)
      if (d.totalExperience) setTotalExperience(d.totalExperience)
      if (d.relevantExperience) setRelevantExperience(d.relevantExperience)
      if (d.currentCtc) setCurrentCtc(d.currentCtc)
      if (d.expectedCtc) setExpectedCtc(d.expectedCtc)
      if (d.noticePeriod) setNoticePeriod(d.noticePeriod)
      if (d.currentLocation) setCurrentLocation(d.currentLocation)
      if (d.preferredLocation) setPreferredLocation(d.preferredLocation)
      if (d.interviewAvailability) setInterviewAvailability(d.interviewAvailability)
      if (d.offerInHand) setOfferInHand(d.offerInHand)
      if (d.reasonForChange) setReasonForChange(d.reasonForChange)
      if (d.notes) setNotes(d.notes)
      if (d.parsedFileName) setParsedFileName(d.parsedFileName)

      setImportMode('single')
      setToastMsg(`Restored saved draft "${draft.title}". You can now complete and submit it!`)
      setTimeout(() => setToastMsg(null), 3500)
    }
  }

  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = removeSavedDraft(id)
    setDraftsList(updated)
    setToastMsg('Draft removed from Saved for Later.')
    setTimeout(() => setToastMsg(null), 3000)
  }

  const handleDirectSubmitDraft = (draft: SavedDraftItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (draft.type === 'candidate' && draft.data) {
      const d = draft.data
      const newCand: Candidate = {
        id: d.candidateId || `CAND-${Date.now()}`,
        submissionDate: d.submissionDate || new Date().toISOString().split('T')[0],
        name: d.candidateName || draft.title || 'Saved Candidate',
        company: d.currentCompany || 'Company',
        phone: d.contactNumber || '+91 98765 43210',
        email: d.email || 'candidate@gmail.com',
        linkedIn: d.linkedInUrl || '',
        qualification: d.qualification || '',
        skills: d.skills || '',
        technologies: d.technologies || 'Full Stack',
        totalExperience: d.totalExperience || '5 Years',
        relevantExperience: d.relevantExperience || '4 Years',
        currentCtc: d.currentCtc || '14 LPA',
        expectedCtc: d.expectedCtc || '18 LPA',
        noticePeriod: d.noticePeriod || '30 Days',
        currentLocation: d.currentLocation || 'Hyderabad',
        preferredLocation: d.preferredLocation || 'Hyderabad',
        interviewAvailability: d.interviewAvailability || 'Immediate',
        offerInHand: d.offerInHand || 'No',
        reasonForChange: d.reasonForChange || '',
        notes: d.notes || '',
        resumeName: d.parsedFileName,
        matchScore: '92%',
        status: 'Parsed',
      }
      onAddCandidate?.(newCand)
      handleDeleteDraft(draft.id, e)
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
    }
  }

  return (
    <div className="space-y-6 w-full pb-16 font-sans">
      {/* SUCCESS TOAST ALERT */}
      {showSuccessToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm font-medium animate-bounce">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span>Candidate saved successfully to Repository!</span>
        </div>
      )}

      <PageHeader
        title="Candidate Search & Entry"
        subtitle="Drop a resume to auto-fill details with Metaforge AI, or enter manually. Single or bulk import supported — review before submitting."
        action={
          <button
            onClick={onOpenRepository}
            className="inline-flex items-center justify-center gap-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-all shrink-0"
          >
            <Users className="w-4 h-4" />
            Candidate Repository
          </button>
        }
      />

      {/* SECTION 1: RESUME PARSER CARD */}
      <div className="bg-emerald-50/40 rounded-2xl border-2 border-dashed border-emerald-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Resume Parser
              {parsedFileName && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                  Parsed: {parsedFileName}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Drop one or many resumes (PDF, DOCX, DOC, TXT). Metaforge AI fills
              candidate details automatically. In bulk mode, review and submit
              each candidate — the queue keeps all parsed resumes until you
              finish.
            </p>
          </div>

          {/* SINGLE / BULK / DRAFTS IMPORT TOGGLE */}
          <div className="bg-emerald-100/70 p-1 rounded-lg flex items-center shrink-0 border border-emerald-200 flex-wrap gap-1">
            <button
              onClick={() => setImportMode('single')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                importMode === 'single'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-800 hover:text-emerald-900'
              }`}
            >
              Single candidate
            </button>
            <button
              onClick={() => setImportMode('bulk')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                importMode === 'bulk'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-800 hover:text-emerald-900'
              }`}
            >
              Bulk import
            </button>
            <button
              onClick={() => setImportMode('drafts')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                importMode === 'drafts'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-100/80 text-amber-900 hover:bg-amber-200 border border-amber-300/80'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-700" />
              <span>Saved for Later ({draftsList.length})</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          {/* DROPZONE AREA */}
          <div
            onClick={handleParseResume}
            className="w-full sm:w-80 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-5 text-center bg-white cursor-pointer transition-all hover:shadow-sm group"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700">
              Drop file here or <span className="text-blue-600 underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              PDF, DOC, DOCX • Max 5.0 MB
            </p>
          </div>

          {/* PARSE ACTIONS */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (parsedFileName) alert(`Viewing parsed file: ${parsedFileName}`)
                else alert('Please upload or parse a resume first.')
              }}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              View
            </button>
            <button
              type="button"
              onClick={handleParseResume}
              disabled={isParsing}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isParsing ? 'Parsing with AI...' : 'Parse resume'}
            </button>
          </div>
        </div>
      </div>

      {importMode !== 'drafts' && (
        <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 2: BASIC INFO CARD (MATCHING SCREENSHOT 1) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Basic Info</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Target requirement & candidate contact details for submission validation.
              </p>
            </div>
            {/* Requirement Selector for Submission Check */}
            <div className="flex items-center gap-2 bg-purple-50/70 p-2 rounded-xl border border-purple-200">
              <label className="text-xs font-bold text-purple-900 whitespace-nowrap">Target Requirement:</label>
              <select
                value={targetReqId}
                onChange={e => setTargetReqId(e.target.value)}
                className="px-3 py-1 text-xs font-bold bg-white border border-purple-300 rounded-lg text-purple-950 focus:outline-none cursor-pointer"
              >
                {requirements.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.title} ({r.client})
                  </option>
                ))}
                {!requirements.some(r => r.id === 'REQ-001') && (
                  <option value="REQ-001">REQ-001 — Senior React Developer (Accenture)</option>
                )}
                {!requirements.some(r => r.id === 'REQ-002') && (
                  <option value="REQ-002">REQ-002 — Java Architect (Goldman Sachs)</option>
                )}
                {!requirements.some(r => r.id === 'REQ-006') && (
                  <option value="REQ-006">REQ-006 — Python ML Engineer (Tesla)</option>
                )}
              </select>
            </div>
          </div>

          {/* DUPLICATE SUBMISSION ALERT BANNER */}
          {dupCheckResult.isDuplicate && dupCheckResult.existingSubmission && (
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
                Candidate <strong>{candidateName || 'Entered Candidate'}</strong> ({email || contactNumber}) has already been submitted for target requirement <strong>{targetReqId}</strong>.
              </p>
              <div className="text-[11px] text-rose-900 bg-rose-100/80 p-2.5 rounded-xl border border-rose-200/80 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
                <span>Submitted By: <strong>{dupCheckResult.existingSubmission.recruiter || 'External Recruiter'}</strong></span>
                <span>Date: <strong>{dupCheckResult.existingSubmission.date}</strong></span>
                <span>Status: <strong>{dupCheckResult.existingSubmission.stage}</strong></span>
                <span>Reason: <em>{dupCheckResult.matchReason}</em></span>
              </div>
            </div>
          )}

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
                placeholder="e.g. Priya Nair"
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
                placeholder="e.g. Contoso"
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
        </div>

        {/* SECTION 3: SKILLS & TECHNOLOGIES CARD (MATCHING SCREENSHOT 2) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Skills & technologies
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Use comma-separated values. Skills and technologies are stored in
              separate fields.
            </p>
          </div>

          <div className="space-y-4 pt-1">
            {/* Skills */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Skills
                </label>
                <span className="text-[10px] text-slate-400">
                  e.g. Communication, Problem solving, Team management
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. Communication, Problem solving, Stakeholder management"
                value={skills}
                onChange={e => setSkills(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Technologies */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Technologies
                </label>
                <span className="text-[10px] text-slate-400">
                  e.g. React, TypeScript, Node.js, SQL — use commas between items
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. React, TypeScript, SQL, problem solving"
                value={technologies}
                onChange={e => setTechnologies(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: EXPERIENCE & CTC CARD (MATCHING SCREENSHOT 2) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Experience & CTC</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Capture experience and compensation details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Total Experience */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Total years of experience
                </label>
                <span className="text-[10px] text-slate-400">
                  Years, months, combined, or decimal (e.g. 3.5 Years → 3 Years 5 Months)
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. 3 Years / 8 Months / 4 Years 6 Months / 3.5 Years"
                value={totalExperience}
                onChange={e => setTotalExperience(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Relevant Experience */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Relevant Experience
                </label>
                <span className="text-[10px] text-slate-400">
                  Years, months, combined, or decimal (e.g. 2.8 Years → 2 Years 8 Months)
                </span>
              </div>
              <input
                type="text"
                placeholder="e.g. 2 Years / 6 Months / 3 Years 8 Months / 2.8 Years"
                value={relevantExperience}
                onChange={e => setRelevantExperience(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Current CTC */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current CTC
              </label>
              <input
                type="text"
                placeholder="e.g. 12 LPA"
                value={currentCtc}
                onChange={e => setCurrentCtc(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Expected CTC */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected CTC
              </label>
              <input
                type="text"
                placeholder="e.g. 16 LPA"
                value={expectedCtc}
                onChange={e => setExpectedCtc(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Notice Period */}
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notice Period
              </label>
              <input
                type="text"
                placeholder="e.g. 30 days"
                value={noticePeriod}
                onChange={e => setNoticePeriod(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>
          </div>
        </div>

        {/* SECTION 5: LOCATION & AVAILABILITY CARD (MATCHING SCREENSHOT 2 & 3) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Location & Availability
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Capture location preferences and interview availability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Current Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bengaluru"
                value={currentLocation}
                onChange={e => setCurrentLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Preferred Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bengaluru / Remote"
                value={preferredLocation}
                onChange={e => setPreferredLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Availability for Interview */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Availability for Interview
              </label>
              <input
                type="text"
                placeholder="Enter availability details (e.g., Available after 5 PM, Available next week...)"
                value={interviewAvailability}
                onChange={e => setInterviewAvailability(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Offer in Hand */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Offer in Hand
              </label>
              <select
                value={offerInHand}
                onChange={e => setOfferInHand(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 bg-white cursor-pointer"
              >
                <option value="Select">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="In Pipeline">In Pipeline</option>
              </select>
            </div>

            {/* Reason for Job Change */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Job Change
              </label>
              <input
                type="text"
                placeholder="e.g. Better role / Growth"
                value={reasonForChange}
                onChange={e => setReasonForChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Notes
                </label>
                <span className="text-[10px] text-slate-400">
                  Internal recruiter notes (saved on the candidate profile).
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="Optional notes for your team only"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR (MATCHING SCREENSHOT 3) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-500">
            Fill only what you know, then review and submit, or save for later to work on it anytime.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraftForLater}
              className="w-full sm:w-auto bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/90 font-bold text-xs px-5 py-2.5 rounded-lg shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              title="Save current candidate details to work on later"
            >
              <Bookmark className="w-4 h-4 text-amber-600" />
              <span>Save for Later</span>
            </button>
            <button
              type="submit"
              disabled={dupCheckResult.isDuplicate}
              className={`w-full sm:w-auto font-semibold text-xs px-6 py-2.5 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 ${
                dupCheckResult.isDuplicate
                  ? 'bg-rose-300 text-rose-900 cursor-not-allowed border border-rose-300 shadow-none'
                  : 'bg-[#6B3BF6] hover:bg-[#5833E0] text-white cursor-pointer active:scale-98'
              }`}
            >
              {dupCheckResult.isDuplicate ? (
                <>
                  <ShieldAlert className="w-4 h-4 text-rose-700" />
                  <span>Duplicate Submission - Cannot Submit</span>
                </>
              ) : (
                <>
                  <span>Review & continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      )}

      {/* SAVED FOR LATER DRAFTS VIEW */}
      {importMode === 'drafts' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-600" />
                Saved for Later Storage ({draftsList.length} Item{draftsList.length === 1 ? '' : 's'})
              </h2>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Draft profiles and job demands saved by recruiters and team leads. Click 'Resume Work' to load and complete entry.
              </p>
            </div>
            <button
              onClick={() => setImportMode('single')}
              className="px-4 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              + Create New Entry
            </button>
          </div>

          {draftsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draftsList.map(draft => (
                <div
                  key={draft.id}
                  onClick={() => handleLoadDraft(draft)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        draft.type === 'candidate'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {draft.type === 'candidate' ? 'Candidate Draft' : 'Requirement Draft'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {draft.savedAt}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-700 transition-colors">
                      {draft.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {draft.subtitle}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Saved by: <strong className="text-slate-600">{draft.createdBy}</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDraft(draft.id, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDirectSubmitDraft(draft, e)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Submit Now
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadDraft(draft)}
                        className="px-4 py-1.5 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume Work</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No saved drafts found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When you enter candidate or requirement details and click 'Save for Later', your draft will be stored here for future completion.
              </p>
            </div>
          )}
        </div>
      )}

      {/* DRAFT TOAST NOTIFICATIONS */}
      {showSaveDraftToast && (
        <div className="fixed top-5 right-5 z-50 bg-amber-800 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <Bookmark className="w-4 h-4 text-amber-300" />
          <span>Saved for Later! Candidate draft stored successfully.</span>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
