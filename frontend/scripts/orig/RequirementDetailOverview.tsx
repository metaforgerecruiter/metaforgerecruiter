import React, { useState, useMemo } from 'react'
import {
  ArrowLeft,
  FileText,
  Pencil,
  Briefcase,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
  User,
  Users,
  UserPlus,
  ChevronRight,
  ChevronDown,
  Search,
  RotateCcw,
} from 'lucide-react'
import { Requirement } from '../../types'
import { ScheduleInterviewModal } from '../modals/ScheduleInterviewModal'
import { SubmitCandidateModal } from '../modals/SubmitCandidateModal'

interface RequirementDetailOverviewProps {
  requirement: Requirement
  role?: string
  onBack: () => void
  onOpenAssignModal?: () => void
  onEditRequirement?: () => void
  onAddCandidate?: () => void
  onRevokeRequirement?: () => void
}

export function RequirementDetailOverview({
  requirement,
  role = 'superadmin',
  onBack,
  onOpenAssignModal,
  onEditRequirement,
  onAddCandidate,
  onRevokeRequirement,
}: RequirementDetailOverviewProps) {
  const normalizedRole = (role || '').toLowerCase()
  const isRecruiter = normalizedRole === 'recruiter'
  const isSuperAdminOrAdmin = normalizedRole === 'superadmin' || normalizedRole === 'admin' || normalizedRole === 'devteam'
  const availableTabs = isSuperAdminOrAdmin
    ? (['Overview', 'Pipeline', 'Interviews', 'Offers', 'Activity'] as const)
    : (['Overview', 'Pipeline', 'Interviews', 'Offers'] as const)

  const [activeTab, setActiveTab] = useState<'Overview' | 'Pipeline' | 'Interviews' | 'Offers' | 'Activity'>('Overview')
  const [historyTabFilter, setHistoryTabFilter] = useState<'all' | 'submitted_lead' | 'submitted_client' | 'interview' | 'selected' | 'rejected'>('all')
  const [historySearchQuery, setHistorySearchQuery] = useState('')
  const [historyPage, setHistoryPage] = useState(1)
  const [assignTabFilter, setAssignTabFilter] = useState<'all' | 'active' | 'revoked'>('all')
  const [assignSearchQuery, setAssignSearchQuery] = useState('')
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [schedulingCandidateRow, setSchedulingCandidateRow] = useState<any>(null)
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false)

  const currentUserName = useMemo(() => {
    if (isSuperAdminOrAdmin) return 'Harish Gadipally'
    if (normalizedRole === 'lead') return 'Sarah Kim'
    if (isRecruiter) return 'Marcus Chen'
    return 'Marcus Chen'
  }, [normalizedRole, isRecruiter, isSuperAdminOrAdmin])

  const rawHistorySubmissions = useMemo(
    () => [
      {
        subId: 'SUB-197',
        avatar: 'MS',
        name: 'MUNTAZAR SAYED',
        email: 'sayedmuntazar1996@gmail.com',
        submittedBy: 'Marcus Chen',
        submitterEmail: 'm.chen@talentflow.io',
        submittedOn: '06/19/2026, 07:29 PM',
        status: 'Submitted to Client',
        canSchedule: true,
      },
      {
        subId: 'SUB-196',
        avatar: 'NJ',
        name: 'Nikhil Joshte',
        email: 'nikhiljoshte@gmail.com',
        submittedBy: 'Marcus Chen',
        submitterEmail: 'm.chen@talentflow.io',
        submittedOn: '06/19/2026, 07:29 PM',
        status: 'Submitted to Client',
        canSchedule: true,
      },
      {
        subId: 'SUB-195',
        avatar: 'PK',
        name: 'Pratibha Kale',
        email: 'pratibhakale13@yahoo.com',
        submittedBy: 'Harish Gadipally',
        submitterEmail: 'harish.g@metaforgeit.com',
        submittedOn: '06/19/2026, 06:45 PM',
        status: 'Submitted to Client',
        canSchedule: true,
      },
      {
        subId: 'SUB-194',
        avatar: 'SY',
        name: 'SANDEEP YADAV',
        email: 'sandeep886441@gmail.com',
        submittedBy: 'Saiteja Puttapaka',
        submitterEmail: 'saiteja.p@metaforgeit.com',
        submittedOn: '06/19/2026, 06:38 PM',
        status: 'Submitted to Client',
        canSchedule: false,
      },
      {
        subId: 'SUB-193',
        avatar: 'AS',
        name: 'Akshay Soni',
        email: 'akkisoni12123@gmail.com',
        submittedBy: 'Harish Gadipally',
        submitterEmail: 'harish.g@metaforgeit.com',
        submittedOn: '06/19/2026, 06:33 PM',
        status: 'Submitted to Client',
        canSchedule: true,
      },
    ],
    []
  )

  const filteredHistoryRows = useMemo(() => {
    return rawHistorySubmissions.filter(row => {
      // For recruiter module, ONLY show their own submissions!
      if (isRecruiter) {
        const isOwnSubmission =
          row.submittedBy === 'Marcus Chen' ||
          row.submitterEmail === 'm.chen@talentflow.io' ||
          row.submittedBy === currentUserName
        if (!isOwnSubmission) return false
      }

      if (historyTabFilter !== 'all') {
        if (historyTabFilter === 'submitted_client' && row.status !== 'Submitted to Client') return false
        if (historyTabFilter === 'submitted_lead' && row.status !== 'Submitted to Lead') return false
      }

      if (historySearchQuery.trim()) {
        const q = historySearchQuery.toLowerCase()
        const matchName = row.name.toLowerCase().includes(q)
        const matchSubId = row.subId.toLowerCase().includes(q)
        const matchSubmitter = row.submittedBy.toLowerCase().includes(q)
        if (!matchName && !matchSubId && !matchSubmitter) return false
      }

      return true
    })
  }, [role, currentUserName, historyTabFilter, historySearchQuery, rawHistorySubmissions])

  const isUnassigned = !requirement.owner || requirement.owner === 'Unassigned'

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Skills lists matching attached screenshot
  const mandatorySkills = [
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

  const generalSkills = [
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
  ]

  return (
    <div className="space-y-6 w-full pb-16 font-sans text-gray-800">
      {/* 1. TOP BAR WITH BACK BUTTON AND ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-2xs cursor-pointer w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-gray-500" />
          <span>Back</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isRecruiter && onOpenAssignModal && !isUnassigned && (
            <button
              onClick={onOpenAssignModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-blue-200 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-600" />
              <span>Reassign</span>
            </button>
          )}

          {onRevokeRequirement && !isUnassigned && (
            <button
              onClick={onRevokeRequirement}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Revoke Requirement</span>
            </button>
          )}

          {!isUnassigned && (
            <button
              onClick={() => {
                if (onAddCandidate) onAddCandidate()
                setIsAddCandidateModalOpen(true)
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#6B3BF6]/30 rounded-xl text-xs font-bold text-[#6B3BF6] bg-purple-50 hover:bg-purple-100 transition-all shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#6B3BF6]" />
              <span>Add Candidate</span>
            </button>
          )}

          <button
            onClick={onEditRequirement || (() => showToast('Editing requirement details...'))}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-gray-200/90 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-all shadow-2xs cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-gray-500" />
            <span>Edit Requirement</span>
          </button>
        </div>
      </div>

      {/* 2. HEADER BANNER WITH REQUIREMENT ID, PRIORITY, TITLE & SUBTEXT */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-2">
        {/* Top Badges Line */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-gray-800">
            <Briefcase className="w-4 h-4 text-gray-400" />
            <span>{requirement.id}</span>
          </div>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${
              requirement.priority === 'High'
                ? 'bg-red-50 text-red-700 border-red-200'
                : requirement.priority === 'Medium'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-gray-100 text-gray-700 border-gray-300'
            }`}
          >
            {requirement.priority}
          </span>

          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
              isUnassigned
                ? 'bg-gray-100 text-gray-600 border-gray-300'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}
          >
            {isUnassigned ? 'Unassigned' : (requirement.assignmentStatus || 'Submitted')}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
          {requirement.title}
        </h1>

        {/* Metadata sub-row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 font-medium pt-1">
          <span>{requirement.clientEmail ? requirement.clientEmail.split('@')[0] : 'harish'}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>SLA remaining: <strong>{isUnassigned ? '10 days' : '0 days'}</strong></span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 bg-purple-50 text-[#6B3BF6] px-2.5 py-0.5 rounded-full border border-purple-200 font-extrabold">
            <User className="w-3.5 h-3.5 text-[#6B3BF6]" />
            <span>Assigned Recruiter: <strong>{requirement.owner || 'Unassigned'}</strong></span>
            {!isRecruiter && onOpenAssignModal && (
              <button
                onClick={onOpenAssignModal}
                className="text-blue-600 font-bold hover:underline cursor-pointer ml-1 text-[11px]"
              >
                Reassign
              </button>
            )}
          </span>
        </div>
      </div>

      {/* 3. VIEW ONLY WARNING BANNER (IF UNASSIGNED) */}
      {isUnassigned && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-900 flex items-center gap-2.5 shadow-2xs">
          <Eye className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <strong className="font-bold mr-1.5">View only</strong>
            <span>This requirement is not assigned. Candidates cannot be added or submitted until it is assigned.</span>
          </div>
        </div>
      )}

      {/* 4. METRICS ROW (7 STAT CARDS MATCHING SCREENSHOT) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* TOTAL CANDIDATES */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            TOTAL CANDIDATES
          </div>
          <div className="text-2xl font-extrabold text-gray-900 mt-1">
            {isUnassigned ? 0 : (requirement.submissions || 7)}
          </div>
        </div>

        {/* SUBMITTED */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            SUBMITTED
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {isUnassigned ? 0 : (requirement.submissions || 7)}
          </div>
        </div>

        {/* INTERVIEWING */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            INTERVIEWING
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {requirement.interviews || 0}
          </div>
        </div>

        {/* SELECTED */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            SELECTED
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {requirement.placed || 0}
          </div>
        </div>

        {/* REJECTED */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            REJECTED
          </div>
          <div className="text-2xl font-extrabold text-red-600 mt-1">
            {requirement.rejections || 0}
          </div>
        </div>

        {/* OFFER RELEASED */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            OFFER RELEASED
          </div>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">
            0
          </div>
        </div>

        {/* SLA REMAINING (DAYS) */}
        <div className="bg-white rounded-xl border border-gray-200/80 p-3.5 shadow-2xs">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            SLA REMAINING (DAYS)
          </div>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">
            {isUnassigned ? 10 : 0}
          </div>
        </div>
      </div>

      {/* SUGGESTIONS BOX (WHEN ASSIGNED) */}
      {!isUnassigned && (
        <div className="bg-blue-50/70 border border-blue-200/70 rounded-xl p-3.5 text-xs text-blue-900 space-y-1 shadow-2xs">
          <div className="font-bold text-blue-950">Suggestions</div>
          <div className="flex items-center gap-2 text-blue-800 font-medium">
            <span>• • {requirement.submissions || 7} candidate(s) idle in Submitted for over 7 days.</span>
          </div>
        </div>
      )}

      {isUnassigned && (
        <div className="text-xs font-semibold text-gray-500 pl-1">
          SLA 10d left
        </div>
      )}

      {/* 5. RECRUITMENT PROGRESS CARD */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-gray-900">Recruitment Progress</h3>
        <div className="flex flex-wrap items-center gap-4 py-2">
          {/* Step 1: Assigned */}
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-emerald-700">Assigned</span>
          </div>

          <div className="w-10 sm:w-12 h-0.5 bg-emerald-500"></div>

          {/* Step 2: Sourcing */}
          <div className="flex flex-col items-center gap-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${
              !isUnassigned ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white font-bold text-xs'
            }`}>
              {!isUnassigned ? <CheckCircle className="w-4 h-4" /> : '●'}
            </div>
            <span className={`text-[11px] font-bold ${!isUnassigned ? 'text-emerald-700' : 'text-blue-600'}`}>Sourcing</span>
          </div>

          {!isUnassigned && (
            <>
              <div className="w-10 sm:w-12 h-0.5 bg-emerald-500"></div>

              {/* Step 3: Submitted to Lead */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700">Submitted to Lead</span>
              </div>

              <div className="w-10 sm:w-12 h-0.5 bg-emerald-500"></div>

              {/* Step 4: Submitted to Client */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700">Submitted to Client</span>
              </div>

              <div className="w-10 sm:w-12 h-0.5 bg-amber-400"></div>

              {/* Step 5: Interview Scheduled */}
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs ${
                  (requirement as any).status?.toLowerCase().includes('interview') || requirement.interviews > 0
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-200 text-slate-500 font-bold text-xs'
                }`}>
                  {(requirement as any).status?.toLowerCase().includes('interview') || requirement.interviews > 0 ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    '5'
                  )}
                </div>
                <span className={`text-[11px] font-bold ${
                  (requirement as any).status?.toLowerCase().includes('interview') || requirement.interviews > 0
                    ? 'text-amber-700'
                    : 'text-slate-500'
                }`}>
                  Interview Scheduled
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 6. TAB NAVIGATION BAR (Activity tab visible strictly to Super Admin & Admin) */}
      <div className="bg-slate-50/80 border border-gray-200/80 rounded-xl p-1.5 flex items-center gap-1">
        {availableTabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-xs border border-gray-200/60'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/60'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 7. TAB CONTENT AREA */}
      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {/* REQUIREMENT OVERVIEW GRID CARD (MATCHING SCREENSHOT 1 & 2) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-3">
              Requirement Overview
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-5 gap-x-6 text-xs">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">REQUIREMENT ID</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.id}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DEMAND RECEIVED DATE</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.emailArrivedTime || 'Jun 19, 2026, 05:30 AM'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">INTERNAL POC (TO)</div>
                <div className="font-bold text-gray-900 mt-1">offshore demands</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">REQUIREMENT FROM</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.client}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CLIENT LEAD POC (FROM)</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.clientEmail ? requirement.clientEmail.split('@')[0] : 'harish'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CLIENT POC (FROM/CC)</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.clientEmail ? requirement.clientEmail.split('@')[0] : 'harish'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">JOB TITLE</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.title}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">JOB STATUS</div>
                <div className="font-bold text-gray-900 mt-1">{isUnassigned ? 'Unassigned' : (requirement.assignmentStatus || 'Submitted')}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CLOSED DATE</div>
                <div className="font-medium text-gray-700 mt-1">—</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TYPE OF DEMAND</div>
                <div className="font-bold text-gray-900 mt-1">Single</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">PRIORITY</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.priority}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">NUMBER OF POSITIONS</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.openings || 1}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">RELEVANT EXPERIENCE</div>
                <div className="font-bold text-gray-900 mt-1">Entry Level</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">EMPLOYMENT TYPE</div>
                <div className="font-bold text-gray-900 mt-1">Full-time</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BUDGET CURRENCY</div>
                <div className="font-bold text-gray-900 mt-1">INR</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">YEARLY BUDGET</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.budget || '₹5,000,000'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">WORK MODE</div>
                <div className="font-bold text-gray-900 mt-1">On-site</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">LOCATION</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.location || 'Remote, Hybrid, Onsite'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OVERALL EXPERIENCE</div>
                <div className="font-bold text-gray-900 mt-1">2-3 Years</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">NOTICE PERIOD</div>
                <div className="font-bold text-gray-900 mt-1">Not specified</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OPEN SINCE</div>
                <div className="font-bold text-gray-900 mt-1">{requirement.emailArrivedTime || 'Jun 19, 2026 (52 days)'}</div>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SLA</div>
                <div className="font-bold text-gray-900 mt-1">10 days</div>
              </div>
            </div>
          </div>

          {/* SKILLS CARD */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Skills</h3>

            <div className="space-y-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                MANDATORY SKILLS
              </div>
              <div className="flex flex-wrap gap-2">
                {mandatorySkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200/70"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                SKILLS
              </div>
              <div className="flex flex-wrap gap-2">
                {generalSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200/70"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ASSIGNMENT HISTORY CARD (ONLY VISIBLE TO LEADS, ADMIN, SUPERADMIN - HIDDEN FOR RECRUITER) */}
          {!isRecruiter && (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Assignment history</h3>
                  <p className="text-xs text-gray-500 font-normal mt-0.5">
                    Track who was assigned to this requirement and when. Updates when you Reassign or Revoke.
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>4 active</span>
                </span>
              </div>

              {/* Filter Pills & Search Input Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <button
                    onClick={() => setAssignTabFilter('all')}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                      assignTabFilter === 'all'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>All</span>
                    <span className="px-1.5 py-0.2 bg-blue-200/60 text-blue-800 rounded-full text-[10px] font-extrabold">4</span>
                  </button>

                  <button
                    onClick={() => setAssignTabFilter('active')}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                      assignTabFilter === 'active'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Active</span>
                    <span className="px-1.5 py-0.2 bg-blue-200/60 text-blue-800 rounded-full text-[10px] font-extrabold">4</span>
                  </button>

                  <button
                    onClick={() => setAssignTabFilter('revoked')}
                    className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                      assignTabFilter === 'revoked'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Revoked</span>
                    <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold">0</span>
                  </button>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search recruiter or assigner..."
                    value={assignSearchQuery}
                    onChange={e => setAssignSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800"
                  />
                </div>
              </div>

              {/* Assignment Groups / List */}
              <div className="space-y-3 pt-2">
                {/* Group 1: 2 recruiters grouped */}
                <div className="border border-slate-200/80 rounded-2xl p-4 bg-white space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900 text-sm">2 recruiters</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-extrabold uppercase">
                            ACTIVE
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 font-normal mt-0.5">
                          Assigned on 06/19/2026, 06:42 PM &nbsp; By <strong className="text-gray-600 font-semibold">Harish Gadipally</strong>
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Sub-cards inside (2 columns) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                        CD
                      </div>
                      <div>
                        <div className="font-extrabold text-gray-900 text-xs">Charlie Darwin</div>
                        <div className="text-[11px] text-gray-400 font-normal">charlie@metaforgeit.com</div>
                      </div>
                    </div>

                    <div className="bg-slate-50/70 border border-slate-200/70 rounded-xl p-3.5 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                        RK
                      </div>
                      <div>
                        <div className="font-extrabold text-gray-900 text-xs">Raghu Karnam</div>
                        <div className="text-[11px] text-gray-400 font-normal">rkarnam@metaforgeit.com</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item 2: Saiteja Puttapaka */}
                <div className="border border-slate-200/80 rounded-2xl p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                      SP
                    </div>
                    <div>
                      <div className="font-extrabold text-gray-900 text-xs">Saiteja Puttapaka</div>
                      <div className="text-[11px] text-gray-400 font-normal">saiteja.p@metaforgeit.com</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-gray-400 font-normal text-[11px]">
                      Assigned on 06/19/2026, 06:35 PM &nbsp; By <strong className="text-gray-600 font-semibold">Harish Gadipally</strong>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-extrabold uppercase">
                      ACTIVE
                    </span>
                  </div>
                </div>

                {/* Item 3: Harish Gadipally */}
                <div className="border border-slate-200/80 rounded-2xl p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-purple-100 text-purple-700 font-extrabold text-xs flex items-center justify-center shrink-0">
                      HG
                    </div>
                    <div>
                      <div className="font-extrabold text-gray-900 text-xs">Harish Gadipally</div>
                      <div className="text-[11px] text-gray-400 font-normal">harish.g@metaforgeit.com</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-gray-400 font-normal text-[11px]">
                      Assigned on 06/19/2026, 05:48 PM &nbsp; By <strong className="text-gray-600 font-semibold">Harish Gadipally</strong>
                    </div>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-md text-[10px] font-extrabold uppercase">
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* REQUIREMENT HISTORY CARD (MATCHING USER SCREENSHOT) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 tracking-tight">Requirement History</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {isRecruiter ? 'Your candidate submissions for this requirement, newest first.' : 'All recruiter submissions for this requirement, newest first.'}
              </p>
            </div>

            {/* Top Metric Cards (3 Columns) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-50/80 border border-gray-200/80 rounded-xl p-4 space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">RECRUITERS WORKING</div>
                <div className="text-2xl font-extrabold text-gray-900">{isRecruiter ? 1 : 4}</div>
              </div>

              <div className="bg-slate-50/80 border border-gray-200/80 rounded-xl p-4 space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">RESUMES SUBMITTED</div>
                <div className="text-2xl font-extrabold text-gray-900">{filteredHistoryRows.length}</div>
              </div>

              <div className="bg-slate-50/80 border border-gray-200/80 rounded-xl p-4 space-y-1">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">BY STATUS</div>
                <div className="text-xs font-bold text-gray-800 flex flex-wrap gap-x-2 gap-y-1 pt-1">
                  <span>Lead review: <strong className="text-slate-900">0</strong></span>
                  <span className="text-gray-300">|</span>
                  <span>Client: <strong className="text-slate-900">{filteredHistoryRows.filter(r => r.status === 'Submitted to Client').length}</strong></span>
                  <span className="text-gray-300">|</span>
                  <span>Interview: <strong className="text-slate-900">0</strong></span>
                  <span className="text-gray-300">|</span>
                  <span>Selected: <strong className="text-slate-900">0</strong></span>
                  <span className="text-gray-300">|</span>
                  <span>Rejected: <strong className="text-slate-900">0</strong></span>
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                <button
                  onClick={() => setHistoryTabFilter('all')}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyTabFilter === 'all'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>All</span>
                  <span className="px-1.5 py-0.2 bg-blue-200/60 text-blue-800 rounded-full text-[10px] font-extrabold">{filteredHistoryRows.length}</span>
                </button>

                <button
                  onClick={() => setHistoryTabFilter('submitted_lead')}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyTabFilter === 'submitted_lead'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Submitted to Lead</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold">0</span>
                </button>

                <button
                  onClick={() => setHistoryTabFilter('submitted_client')}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyTabFilter === 'submitted_client'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Submitted to Client</span>
                  <span className="px-1.5 py-0.2 bg-blue-200/60 text-blue-800 rounded-full text-[10px] font-extrabold">{filteredHistoryRows.filter(r => r.status === 'Submitted to Client').length}</span>
                </button>

                <button
                  onClick={() => setHistoryTabFilter('interview')}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyTabFilter === 'interview'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Interview</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold">0</span>
                </button>

                <button
                  onClick={() => setHistoryTabFilter('selected')}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyTabFilter === 'selected'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Selected</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold">0</span>
                </button>

                <button
                  onClick={() => setHistoryTabFilter('rejected')}
                  className={`px-3 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
                    historyTabFilter === 'rejected'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>Rejected</span>
                  <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-extrabold">0</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search candidate or submitter..."
                  value={historySearchQuery}
                  onChange={e => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800"
                />
              </div>
            </div>

            {/* Table Info Bar */}
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-1">
              <span>1-{filteredHistoryRows.length} of {filteredHistoryRows.length} submissions</span>
              <span>Page 1 of 1</span>
            </div>

            {/* History Table */}
            <div className="border border-gray-200/80 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-4">SUBMISSION</th>
                    <th className="py-3 px-4">CANDIDATE</th>
                    <th className="py-3 px-4">SUBMITTED BY</th>
                    <th className="py-3 px-4">SUBMITTED ON</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-800 bg-white">
                  {filteredHistoryRows.map(row => (
                    <tr key={row.subId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-600">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px]">
                          {row.subId}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-[11px] flex items-center justify-center shrink-0">
                            {row.avatar}
                          </div>
                          <div>
                            <div className="font-extrabold text-gray-900">{row.name}</div>
                            <div className="text-[11px] text-gray-400 font-normal">{row.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-gray-900">{row.submittedBy}</div>
                        <div className="text-[11px] text-gray-400 font-normal">{row.submitterEmail}</div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600 font-medium whitespace-nowrap">
                        {row.submittedOn}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-[11px] font-bold">
                          {row.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {row.canSchedule ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setSchedulingCandidateRow(row)
                                setIsScheduleModalOpen(true)
                              }}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold cursor-pointer shadow-2xs flex items-center gap-1 transition-all"
                            >
                              <Calendar className="w-3 h-3 text-blue-600" />
                              <span>Schedule</span>
                            </button>
                            <button
                              onClick={() => showToast(`Editing submission for ${row.name}...`)}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer"
                              title="Edit submission"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium flex items-center justify-end gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            <span>View only</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="flex items-center justify-between pt-2 text-xs text-gray-500 font-medium">
              <span>Showing submissions 1-5 on page {historyPage}</span>
              <div className="flex items-center gap-1.5 font-bold">
                <button
                  disabled={historyPage === 1}
                  onClick={() => setHistoryPage(1)}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  &lt; Previous
                </button>
                <button
                  onClick={() => setHistoryPage(1)}
                  className={`w-7 h-7 rounded-lg border text-xs cursor-pointer ${
                    historyPage === 1 ? 'border-blue-600 bg-blue-50 text-blue-700 font-extrabold' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  1
                </button>
                <button
                  onClick={() => setHistoryPage(2)}
                  className={`w-7 h-7 rounded-lg border text-xs cursor-pointer ${
                    historyPage === 2 ? 'border-blue-600 bg-blue-50 text-blue-700 font-extrabold' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  2
                </button>
                <button
                  disabled={historyPage === 2}
                  onClick={() => setHistoryPage(2)}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Next &gt;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIPELINE TAB (MATCHING SCREENSHOT 2) */}
      {activeTab === 'Pipeline' && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Candidate Pipeline</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Table view for high-volume tracking across all stages.
              </p>
            </div>
            <div className="bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>7 candidates</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-3 font-bold">CANDIDATE</th>
                  <th className="py-3 px-3 font-bold">EXPERIENCE</th>
                  <th className="py-3 px-3 font-bold">COMPANY</th>
                  <th className="py-3 px-3 font-bold">NOTICE</th>
                  <th className="py-3 px-3 font-bold">SUBMISSION STATUS</th>
                  <th className="py-3 px-2 font-bold text-center">L1</th>
                  <th className="py-3 px-2 font-bold text-center">L2</th>
                  <th className="py-3 px-2 font-bold text-center">FINAL</th>
                  <th className="py-3 px-2 font-bold text-center">OFFER LETTER</th>
                  <th className="py-3 px-3 font-bold">LAST ACTIVITY</th>
                  <th className="py-3 px-3 font-bold text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {[
                  {
                    name: 'MUNTAZAR SAYED',
                    exp: '8 Years 2 Months',
                    company: '—',
                    notice: '—',
                    status: 'Submitted to Client',
                    activity: '19/06/2026, 19:29',
                    action: 'Schedule Interview',
                  },
                  {
                    name: 'Nikhil Joshte',
                    exp: '10 Years 4 Months',
                    company: '—',
                    notice: '—',
                    status: 'Submitted to Client',
                    activity: '19/06/2026, 19:29',
                    action: 'Schedule Interview',
                  },
                  {
                    name: 'Pratibha Kale',
                    exp: '10 Years 5 Months',
                    company: '—',
                    notice: '—',
                    status: 'Submitted to Client',
                    activity: '19/06/2026, 18:45',
                    action: 'Schedule Interview',
                  },
                  {
                    name: 'SANDEEP YADAV',
                    exp: '13 Years 1 Month',
                    company: '—',
                    notice: '—',
                    status: 'Submitted to Client',
                    activity: '19/06/2026, 18:38',
                    action: 'View only',
                  },
                  {
                    name: 'Akshay Soni',
                    exp: '3 Years 6 Months',
                    company: '—',
                    notice: '—',
                    status: 'Submitted to Client',
                    activity: '19/06/2026, 18:33',
                    action: 'Schedule Interview',
                  },
                  {
                    name: 'Sima Borokar',
                    exp: '4 Years 5 Months',
                    company: '—',
                    notice: '—',
                    status: 'Submitted to Client',
                    activity: '19/06/2026, 17:56',
                    action: 'Schedule Interview',
                  },
                  {
                    name: 'Puttapaka Saiteja',
                    exp: '5 years',
                    company: 'Metaforge it solutions',
                    notice: '30 days ,last working 29 April 2026.',
                    status: 'Submitted to Client',
                    activity: '19/06/2026, 17:50',
                    action: 'Schedule Interview',
                  },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                    <td className="py-3 px-3 font-bold text-gray-900 whitespace-nowrap">{row.name}</td>
                    <td className="py-3 px-3 text-gray-700 whitespace-nowrap">{row.exp}</td>
                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{row.company}</td>
                    <td className="py-3 px-3 text-gray-600 max-w-xs truncate">{row.notice}</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[11px] font-semibold">
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center text-gray-400">—</td>
                    <td className="py-3 px-2 text-center text-gray-400">—</td>
                    <td className="py-3 px-2 text-center text-gray-400">—</td>
                    <td className="py-3 px-2 text-center text-gray-400">—</td>
                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{row.activity}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {row.action === 'Schedule Interview' ? (
                        <button
                          onClick={() => {
                            setSchedulingCandidateRow({
                              name: row.name,
                              email: `${row.name.toLowerCase().replace(/\s+/g, '.')}@gmail.com`,
                              requirementId: requirement.id,
                              position: requirement.title,
                              client: requirement.client,
                            })
                            setIsScheduleModalOpen(true)
                          }}
                          className="px-3.5 py-1.5 bg-[#6B3BF6] hover:bg-[#5833E0] text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs transition-all active:scale-98"
                        >
                          Schedule Interview
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INTERVIEWS TAB (MATCHING SCREENSHOT 3) */}
      {activeTab === 'Interviews' && (
        <div className="space-y-6">
          {/* Card 1: Spec table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Interview rounds (spec table)</h3>
              <p className="text-xs text-gray-400 font-normal mt-0.5">
                Rows from <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">interview_rounds</code>, dual-written from legacy interviews.
              </p>
            </div>
            <div className="text-xs text-gray-500 pt-2">
              No interview rounds yet — schedule from the pipeline.
            </div>
          </div>

          {/* Card 2: Legacy interviews */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-3">
            <h3 className="text-base font-bold text-gray-900">Legacy interviews (API)</h3>
            <div className="text-xs text-gray-500 pt-1">
              No interviews scheduled yet for this requirement.
            </div>
          </div>
        </div>
      )}

      {/* OFFERS TAB (MATCHING SCREENSHOT 4) */}
      {activeTab === 'Offers' && (
        <div className="space-y-6">
          {/* Card 1: Offer management */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-3">
            <div>
              <h3 className="text-base font-bold text-gray-900">Offer management (spec table)</h3>
              <p className="text-xs text-gray-400 font-normal mt-0.5">
                Rows from <code className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[11px]">offer_management</code>, dual-written from legacy offer letters.
              </p>
            </div>
            <div className="text-xs text-gray-500 pt-2">
              No offer rows yet.
            </div>
          </div>

          {/* Card 2: Legacy offer letters summary */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-gray-900">Legacy offer letters summary</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3 font-bold">CANDIDATE</th>
                    <th className="py-2.5 px-3 font-bold">STATUS</th>
                    <th className="py-2.5 px-3 font-bold">COMPENSATION</th>
                    <th className="py-2.5 px-3 font-bold">JOINING</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  <tr>
                    <td className="py-3.5 px-3 font-bold text-gray-900">MUNTAZAR SAYED</td>
                    <td className="py-3.5 px-3 text-gray-400">—</td>
                    <td className="py-3.5 px-3 text-gray-400">—</td>
                    <td className="py-3.5 px-3 text-gray-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVITY TAB (EXCLUSIVE TO SUPER ADMIN & ADMIN - REQUIREMENT HISTORY FROM CREATION TO END) */}
      {isSuperAdminOrAdmin && activeTab === 'Activity' && (
        <div className="space-y-6 font-sans">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Requirement Audit & Complete Lifecycle Activity</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wider">
                    Super Admin & Admin Access Only
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Complete historical audit log for requirement <strong className="text-slate-800">{requirement.id}</strong> ({requirement.client}) from demand creation to present state.
                </p>
              </div>

              <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-2 shrink-0">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Open Since: <strong>{requirement.openDays !== undefined ? `${requirement.openDays} days` : '5 days'}</strong></span>
              </div>
            </div>

            {/* 4 Summary Lifecycle KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-gradient-to-br from-blue-50/80 to-slate-50 border border-blue-100 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">1. CREATION & DEMAND</div>
                <div className="font-extrabold text-slate-900 text-sm">{requirement.id}</div>
                <div className="text-[11px] text-slate-600 font-medium">Arrived: <span className="font-bold text-slate-800">{requirement.emailArrivedTime || 'Aug 1, 2026, 10:45 AM'}</span></div>
                <div className="text-[11px] text-slate-600 font-medium">Client: <span className="font-bold text-slate-800">{requirement.client}</span> ({requirement.openings || 4} openings)</div>
              </div>

              <div className="bg-gradient-to-br from-purple-50/80 to-slate-50 border border-purple-100 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wider">2. ASSIGNMENT & LEAD</div>
                <div className="font-extrabold text-slate-900 text-sm">{requirement.owner || 'Marcus Chen'}</div>
                <div className="text-[11px] text-slate-600 font-medium">Assigned Lead: <span className="font-bold text-slate-800">{requirement.assignedLead || 'Sarah Kim'}</span></div>
                <div className="text-[11px] text-slate-600 font-medium">Status: <span className="font-bold text-emerald-700">{requirement.assignmentStatus || 'Assigned'}</span></div>
              </div>

              <div className="bg-gradient-to-br from-emerald-50/80 to-slate-50 border border-emerald-100 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider">3. SUBMISSIONS & PIPELINE</div>
                <div className="font-extrabold text-slate-900 text-sm">{requirement.submissions || 7} Candidates Submitted</div>
                <div className="text-[11px] text-slate-600 font-medium">Interviews: <span className="font-bold text-slate-800">{requirement.interviews || 3}</span> &nbsp;|&nbsp; Placed: <span className="font-bold text-emerald-700">{requirement.placed || 1}</span></div>
                <div className="text-[11px] text-slate-600 font-medium">Match Score Avg: <span className="font-bold text-slate-800">96%</span></div>
              </div>

              <div className="bg-gradient-to-br from-amber-50/80 to-slate-50 border border-amber-100 rounded-2xl p-4 space-y-1.5 shadow-2xs">
                <div className="text-[10px] font-extrabold text-amber-600 uppercase tracking-wider">4. REVOKE & GOVERNANCE</div>
                <div className="font-extrabold text-slate-900 text-sm">{requirement.revokeRequested ? 'Revoke Pending' : 'Normal Lifecycle'}</div>
                <div className="text-[11px] text-slate-600 font-medium">
                  {requirement.revokeRequested ? (
                    <span className="text-amber-700 font-bold">Requested by {requirement.revokeRequestedBy || 'Recruiter'}</span>
                  ) : (
                    <span>No active revoke holds</span>
                  )}
                </div>
                <div className="text-[11px] text-slate-600 font-medium">Audit Status: <span className="font-bold text-emerald-700">Verified</span></div>
              </div>
            </div>

            {/* Complete Requirement Lifecycle Timeline (Creation to Present End Status) */}
            <div className="space-y-6 pt-2">
              <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <span>Complete Requirement Audit Trail (Creation to Present)</span>
                <span className="w-full h-px bg-slate-200/80 flex-1"></span>
              </h4>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {/* Event 1: Requirement Creation */}
                <div className="relative flex gap-4 text-xs group">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-white shadow-2xs">
                    1
                  </div>
                  <div className="flex-1 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 space-y-2 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>Demand Email Received & Requirement Created</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-extrabold rounded-md uppercase">REQ.CREATED</span>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">{requirement.emailArrivedTime || 'Aug 1, 2026, 10:45 AM'}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      Requirement <strong className="text-slate-900">{requirement.id}</strong> for position <strong className="text-slate-900">{requirement.title}</strong> was parsed from client demand email sent by <strong className="text-slate-900">{requirement.client}</strong> ({requirement.clientEmail || 'recruiting@client.com'}).
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-200/60">
                      <span>Openings: <strong className="text-slate-800">{requirement.openings || 4}</strong></span>
                      <span>Budget: <strong className="text-slate-800">{requirement.budget || '$140k - $175k'}</strong></span>
                      <span>Location: <strong className="text-slate-800">{requirement.location || 'Dallas, TX'}</strong></span>
                      <span>Priority: <strong className="text-red-600 font-bold">{requirement.priority || 'High'}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Event 2: Team Lead & Recruiter Assignment */}
                <div className="relative flex gap-4 text-xs group">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-white shadow-2xs">
                    2
                  </div>
                  <div className="flex-1 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 space-y-2 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>Assigned to Recruiter & Team Lead</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-extrabold rounded-md uppercase">REQ.ASSIGNED</span>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">Aug 2, 2026, 09:15 AM</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      Assigned to Team Lead <strong className="text-slate-900">{requirement.assignedLead || 'Sarah Kim'}</strong> and primary recruiter <strong className="text-slate-900">{requirement.owner || 'Marcus Chen'}</strong> by Super Admin <strong className="text-slate-900">Harish Gadipally</strong>.
                    </p>
                  </div>
                </div>

                {/* Event 3: Candidate Submissions & Pipeline Sourcing */}
                <div className="relative flex gap-4 text-xs group">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-white shadow-2xs">
                    3
                  </div>
                  <div className="flex-1 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 hover:bg-slate-50 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        <span>Candidate Sourcing & Submissions Pipeline</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-md uppercase">SUBMISSIONS.LOG</span>
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">Aug 3 – Aug 12, 2026</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-xs">
                      Recruiters sourced and submitted <strong className="text-slate-900">{requirement.submissions || 7} candidates</strong> for client review:
                    </p>
                    <div className="space-y-2 pt-1">
                      {[
                        { name: 'MUNTAZAR SAYED', role: 'Senior React Engineer', exp: '8 Yrs', status: 'Submitted to Client', time: 'Aug 06, 2026' },
                        { name: 'Rania Khalil', role: 'Java / Microservices Specialist', exp: '11 Yrs', status: 'In Client Review', time: 'Aug 05, 2026' },
                        { name: 'Ben Wallace', role: 'DevOps / Kubernetes Specialist', exp: '10 Yrs', status: 'Interview Scheduled', time: 'Aug 04, 2026' },
                      ].map((c, cIdx) => (
                        <div key={cIdx} className="bg-white border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 text-xs">{c.name} <span className="text-slate-400 font-normal text-[11px]">({c.exp} exp)</span></div>
                            <div className="text-[11px] text-slate-500">{c.role}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">{c.status}</span>
                            <span className="text-[11px] text-slate-400">{c.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Event 4: Revoke Request / Audit Action (If Revoke Requested) */}
                {requirement.revokeRequested && (
                  <div className="relative flex gap-4 text-xs group">
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-white shadow-2xs">
                      4
                    </div>
                    <div className="flex-1 bg-amber-50/90 border border-amber-200 rounded-2xl p-4 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
                          <span>Revoke Permission Requested by Recruiter</span>
                          <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-extrabold rounded-md uppercase">REVOKE.PENDING</span>
                        </span>
                        <span className="text-[11px] font-semibold text-amber-700">{requirement.revokeRequestedAt || 'Today at 01:15 PM'}</span>
                      </div>
                      <p className="text-amber-900 leading-relaxed text-xs">
                        Recruiter <strong className="text-amber-950">{requirement.revokeRequestedBy || requirement.owner || 'Marcus Chen'}</strong> submitted a request to revoke assignment for requirement <strong className="text-amber-950">{requirement.id}</strong>.
                      </p>
                      <div className="bg-white/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 font-medium">
                        <strong className="font-bold text-amber-950">Revocation Reason:</strong> "{requirement.revokeReason || 'Client JD requirements pending clarification & candidate salary expectation mismatch'}"
                      </div>
                    </div>
                  </div>
                )}

                {/* Event 5: Present End Lifecycle Status */}
                <div className="relative flex gap-4 text-xs group">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] ring-4 ring-white shadow-2xs">
                    {requirement.revokeRequested ? 5 : 4}
                  </div>
                  <div className="flex-1 bg-slate-900 text-white rounded-2xl p-4 space-y-2 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-white text-sm flex items-center gap-2">
                        <span>Current Lifecycle Status (Present)</span>
                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-extrabold rounded-md uppercase">ACTIVE</span>
                      </span>
                      <span className="text-[11px] font-medium text-slate-400">Live System State</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      Requirement <strong className="text-white">{requirement.id}</strong> is currently assigned to <strong className="text-white">{requirement.owner || 'Marcus Chen'}</strong> with <strong className="text-white">{requirement.submissions || 7} total submissions</strong> and active client interviews in progress.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false)
          setSchedulingCandidateRow(null)
        }}
        onScheduleSuccess={() => {
          showToast(`Interview successfully scheduled for ${schedulingCandidateRow?.name || 'candidate'}!`)
          setIsScheduleModalOpen(false)
          setSchedulingCandidateRow(null)
        }}
      />

      {/* ADD CANDIDATE MODAL (IN-PLACE RECRUITER WORKFLOW) */}
      <SubmitCandidateModal
        isOpen={isAddCandidateModalOpen}
        onClose={() => setIsAddCandidateModalOpen(false)}
        requirements={[requirement]}
        selectedReqId={requirement.id}
        currentRecruiterName={currentUserName}
        onSubmit={(newSub) => {
          showToast(`Candidate ${newSub.candidate} successfully submitted to client for ${requirement.id}!`)
          setIsAddCandidateModalOpen(false)
        }}
      />

      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
