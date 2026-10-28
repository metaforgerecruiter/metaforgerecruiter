import React, { useState } from 'react'
import { ArrowLeft, Upload, FileText, Plus, X, Sparkles } from 'lucide-react'
import { Requirement } from '../../types'

interface CreateJobDemandFormProps {
  onCancel: () => void
  onSubmit: (newReq: Requirement) => void
  userRole?: string
  mode?: 'create' | 'edit'
  initialData?: Requirement | null
}

export function CreateJobDemandForm({
  onCancel,
  onSubmit,
  userRole = 'Recruiter View',
  mode = 'create',
  initialData = null,
}: CreateJobDemandFormProps) {
  const isEdit = mode === 'edit' || !!initialData

  // Form State
  const [reqId, setReqId] = useState(
    initialData?.id || `REQ-${new Date().toISOString().split('T')[0]}-001`
  )
  const [demandDate, setDemandDate] = useState(
    initialData?.dueDate || new Date().toISOString().split('T')[0]
  )
  const [internalPoc, setInternalPoc] = useState(
    initialData?.assignedLead || 'offshore demands'
  )
  const [requirementFrom, setRequirementFrom] = useState(
    initialData?.client || 'Other company / source...'
  )
  const [customCompany, setCustomCompany] = useState(
    initialData?.client || 'LTTS'
  )
  
  const [clientLeadPoc, setClientLeadPoc] = useState(
    initialData?.clientEmail || 'Kallol.Chakraborty@Ltts.com'
  )
  const [clientPoc, setClientPoc] = useState(
    initialData?.clientEmail || 'Kallol.Chakraborty@Ltts.com'
  )
  const [jobTitle, setJobTitle] = useState(
    initialData?.title || 'Senior Engineer (Catia V6) for'
  )
  const [jobStatus, setJobStatus] = useState(
    initialData?.status === 'Closed' ? 'Closed' : 'Open'
  )
  const [closedDate, setClosedDate] = useState('')
  const [typeOfDemand, setTypeOfDemand] = useState(
    initialData?.openings && initialData.openings > 1 ? 'Multiple' : 'Single'
  )
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>(
    initialData?.priority || 'Low'
  )

  const [openings, setOpenings] = useState<number>(initialData?.openings || 1)
  const [relevantExp, setRelevantExp] = useState('Select relevant experience')
  const [employmentType, setEmploymentType] = useState('Full-time')
  const [workMode, setWorkMode] = useState('On-site')
  const [budgetCurrency, setBudgetCurrency] = useState('INR (₹)')
  const [yearlyBudget, setYearlyBudget] = useState(
    initialData?.budget ? initialData.budget.replace(/[^0-9]/g, '') : '1400000'
  )
  const [locationInput, setLocationInput] = useState('')
  const [locations, setLocations] = useState<string[]>(
    initialData?.location ? initialData.location.split(', ') : ['Pune']
  )
  const [overallExp, setOverallExp] = useState('7-12 years')
  const [noticePeriod, setNoticePeriod] = useState('Immediate')

  const [mandatorySkillInput, setMandatorySkillInput] = useState('')
  const [mandatorySkills, setMandatorySkills] = useState<string[]>(
    initialData?.skills || [
      'Catia V6',
      'Door Panel design experience',
      'knowledge on complete door design',
      'packaging',
      'gaps',
      'other CAE',
      'Plant',
      'forming requirements',
      'Any',
    ]
  )

  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([
    'Master section creation & validation',
    'Door mechanisms',
    'Hinges & handles',
    'Cross-functional collaboration (CFT)',
    'Manufacturing awareness',
    'Experienced in Design & Development of BIW Closures from the concept to mass production Design',
    'Design Considering the Package',
    'master sections',
    'styling',
    'vehicle regulation & performance',
    'Knowledge on Door Regulation for Asian and European market',
    'Worked in atleast two complete life cycle of Door design',
  ])

  const [jdText, setJdText] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Handle Add Location
  const handleAddLocation = () => {
    if (locationInput.trim()) {
      setLocations([...locations, locationInput.trim()])
      setLocationInput('')
    }
  }

  // Handle Add Mandatory Skill
  const handleAddMandatorySkill = () => {
    if (mandatorySkillInput.trim()) {
      const newSkills = mandatorySkillInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      setMandatorySkills([...mandatorySkills, ...newSkills])
      setMandatorySkillInput('')
    }
  }

  // Handle Add Skill
  const handleAddSkill = () => {
    if (skillInput.trim()) {
      const newSkills = skillInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      setSkills([...skills, ...newSkills])
      setSkillInput('')
    }
  }

  // Simulated AI JD Extraction
  const handleExtractAndAutoFill = () => {
    if (!jdText.trim()) {
      showToast('Please paste JD text or upload a document to extract.')
      return
    }
    setIsExtracting(true)
    setTimeout(() => {
      setIsExtracting(false)
      if (!jobTitle) setJobTitle('Senior Data Engineer (AI/ML)')
      if (mandatorySkills.length === 0) setMandatorySkills(['Python', 'PySpark', 'SQL', 'Azure'])
      if (skills.length === 0) setSkills(['Problem Solving', 'Agile', 'ETL Pipelines'])
      showToast('Extracted & auto-filled details from JD text successfully!')
    }, 1200)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobTitle.trim()) {
      showToast('Please specify a Job Title.')
      return
    }

    const finalClient = requirementFrom === 'Other' ? customCompany || 'Other' : requirementFrom

    const updatedReq: Requirement = {
      ...(initialData || {} as any),
      id: reqId || `REQ-${Date.now().toString().slice(-6)}`,
      client: finalClient,
      title: jobTitle,
      priority: priority,
      status: jobStatus === 'Closed' ? 'Closed' : (initialData?.status || 'Active'),
      assignmentStatus: initialData?.assignmentStatus || (jobStatus === 'Assigned' ? 'Assigned' : 'Unassigned'),
      owner: initialData?.owner || (jobStatus === 'Assigned' ? 'Harish Gadipally' : 'Unassigned'),
      submissions: initialData?.submissions || 7,
      interviews: initialData?.interviews || 0,
      placed: initialData?.placed || 0,
      rejections: initialData?.rejections || 0,
      clientEmail: clientLeadPoc || `${finalClient.toLowerCase()}@client.com`,
      clientPhone: '+91 98765 43210',
      location: locations.join(', ') || locationInput || 'Remote',
      openings: openings || 1,
      dueDate: demandDate || new Date().toISOString().split('T')[0],
      emailArrivedTime: initialData?.emailArrivedTime || `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, 05:30 AM`,
      budget: yearlyBudget ? `₹${yearlyBudget}` : '₹1,400,000',
      skills: mandatorySkills,
    }

    onSubmit(updatedReq)
  }

  return (
    <div className="w-full space-y-6 pb-24 font-sans text-slate-800">
      {/* Top Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 mb-3 px-3.5 py-1.5 border border-slate-200 rounded-xl bg-white shadow-2xs cursor-pointer transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {isEdit ? 'Edit Job Demand' : 'Create Job Demand'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isEdit
              ? 'Update requirement details. Requirement ID is read-only.'
              : 'Capture requirement details, client preferences, and assign recruiters.'}
          </p>
        </div>

        {/* Role Card Box */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 max-w-md text-xs shadow-2xs">
          <div className="font-bold text-slate-900">Role: Recruiter</div>
          <div className="text-slate-500 mt-0.5 leading-snug">
            You can assign recruiters, reassign work, and autofill key details using the JD document.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* EXTRACT & AUTO-FILL CARD */}
        <div className="bg-blue-50/40 border border-dashed border-blue-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            {/* Option 1: File Upload */}
            <div className="flex-1 space-y-2">
              <div className="text-xs font-bold text-indigo-900">Extract & Auto-fill (optional)</div>
              <p className="text-[11px] text-indigo-700">
                Option 1: Upload a JD document (PDF or DOCX, max 10MB). Option 2: Paste JD text below. Then click Extract & Auto-fill.
              </p>

              <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-white/80 rounded-2xl p-6 text-center transition-all cursor-pointer group">
                <Upload className="w-6 h-6 text-indigo-400 mx-auto group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-700 mt-2">
                  Drop file here or <span className="text-indigo-600 hover:underline">browse</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX • Max 10.0 MB</div>
              </div>
            </div>

            {/* Middle Extract Button */}
            <div className="flex items-center justify-center self-center py-2">
              <button
                type="button"
                onClick={handleExtractAndAutoFill}
                disabled={isExtracting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isExtracting ? 'Extracting...' : 'Extract & Auto-fill'}</span>
              </button>
            </div>

            {/* Option 2: Paste JD Text */}
            <div className="flex-1 space-y-2">
              <div className="text-xs font-bold text-slate-700">Or paste JD here for Extract & Auto-fill (optional)</div>
              <p className="text-[11px] text-slate-400">
                Paste a job description to use Extract & Auto-fill. Not required for creating a requirement.
              </p>

              <textarea
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder="Paste JD text here (min 50 chars for Extract & Auto-fill)..."
                className="w-full h-28 bg-white border border-slate-200 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] outline-none resize-none placeholder:text-slate-300"
              />
            </div>
          </div>
        </div>

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

        {/* CLIENT INFORMATION CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Client Information</h3>
            <p className="text-xs text-slate-400">Client details and JD reference.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Requirement From <span className="text-[10px] text-slate-400 font-normal ml-1">Pick a preset or Other to type a new company or source.</span>
              </label>
              <select
                value={requirementFrom}
                onChange={e => setRequirementFrom(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none cursor-pointer"
              >
                <option value="ITC">ITC</option>
                <option value="Accenture">Accenture</option>
                <option value="Goldman Sachs">Goldman Sachs</option>
                <option value="LTTS">LTTS</option>
                <option value="TCS">TCS</option>
                <option value="Cognizant">Cognizant</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {requirementFrom === 'Other' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Specify Company Name
                </label>
                <input
                  type="text"
                  value={customCompany}
                  onChange={e => setCustomCompany(e.target.value)}
                  placeholder="Enter client company name..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
                />
              </div>
            )}
          </div>
        </div>

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

        {/* MANDATORY SKILLS CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Mandatory Skills</h3>
            <p className="text-xs text-slate-400">Mandatory skills and tools for the role.</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700">Mandatory Skills</label>
              <span className="text-[10px] text-slate-400">Comma separated</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={mandatorySkillInput}
                onChange={e => setMandatorySkillInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddMandatorySkill())}
                placeholder="e.g. React, TypeScript, SQL, AWS"
                className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
              />
              <button
                type="button"
                onClick={handleAddMandatorySkill}
                className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Add
              </button>
            </div>

            {mandatorySkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {mandatorySkills.map((s, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-medium border border-slate-200 flex items-center gap-1.5">
                    {s}
                    <X className="w-3 h-3 text-slate-400 hover:text-slate-700 cursor-pointer" onClick={() => setMandatorySkills(mandatorySkills.filter((_, i) => i !== idx))} />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

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

        {/* STICKY BOTTOM ACTION BAR */}
        <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-gray-100 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#5B4DFB] hover:bg-[#4A3CE4] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {isEdit ? 'Save changes' : 'Create Requirement'}
          </button>
        </div>
      </form>

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-16 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
