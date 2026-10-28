import React, { useState, useMemo, useEffect } from 'react'
import {
  Building2,
  Plus,
  Search,
  FileText,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Phone,
  Mail,
  User,
  Users,
  Calendar,
  ExternalLink,
  Edit2,
  Trash2,
  Filter,
  Award,
  DollarSign,
  AlertCircle,
  X,
  FileCheck,
  Upload,
  ArrowLeft,
  Briefcase,
  MapPin,
  FileSpreadsheet,
  Save,
  Check,
  Shield,
  FileSignature,
  Printer,
  Share2,
  ChevronDown,
  Sparkles,
  Layers,
} from 'lucide-react'
import { Role, Requirement } from '../../types'
import { PaginationFooter } from '../ui/PaginationFooter'
import { ClientDeliveryGapAnalysisPage } from './ClientDeliveryGapAnalysisPage'
import { clientsService } from '../../services/workspace.service'

export interface ClientRecord {
  id: string
  name: string
  domain: string
  pocName: string
  pocEmail: string
  pocPhone: string
  location: string
  teamLead: string
  teamMemberCount: number
  teamMembers: string[]
  activeReqs: number
  totalSubmissions: number
  totalPlacements: number
  commercialFee: string // e.g. "8.33% Annual CTC"
  paymentTerms: string // e.g. "30 Days Net"
  slaTAT: string // e.g. "3.5 Days"
  agreementStatus: 'Active - Executed' | 'Pending Signature' | 'Under Legal Review' | 'Expired'
  agreementStartDate: string
  agreementEndDate: string
  agreementDocName: string
  signedBy: string
  signedDate: string
}


export interface ClientRequirementItem {
  id: string
  title: string
  clientName: string
  assignedDate: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'In Progress' | 'Open' | 'Assigned' | 'Filled'
  assignedRecruiter: string
  submissionsCount: number
  interviewsCount: number
  experience: string
  location: string
}


const sameClient = (a?: string, b?: string) => (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase()

export const getRequirementsForClient = (client: ClientRecord, requirements: Requirement[]): ClientRequirementItem[] =>
  requirements
    .filter(r => sameClient(r.client, client.name))
    .map(r => {
      const exp = (r as any).experienceRange
      return {
        id: r.id,
        title: r.title,
        clientName: r.client,
        assignedDate: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
        priority: (['High', 'Medium', 'Low'].includes(r.priority as string) ? r.priority : 'Medium') as ClientRequirementItem['priority'],
        status: (r.assignmentStatus === 'Assigned' ? 'Assigned' : r.status === 'Closed' ? 'Filled' : 'Open') as ClientRequirementItem['status'],
        assignedRecruiter: r.owner || '—',
        submissionsCount: r.submissions || 0,
        interviewsCount: r.interviews || 0,
        experience: (r as any).experience || (exp?.min ? `${exp.min}${exp.max == null ? '+' : `-${exp.max}`} Yrs` : '—'),
        location: r.location || '—',
      }
    })

interface ClientsPageProps {
  role?: Role
  /** Live requirements; per-client counts and lists are derived from them. */
  requirements?: Requirement[]
}

export const getClientStats = (
  client: ClientRecord,
  period: 'All Time' | 'This Week' | 'This Month' | 'This Year',
  requirements: Requirement[],
) => {
  const now = new Date()
  const start =
    period === 'This Week' ? new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6)
    : period === 'This Month' ? new Date(now.getFullYear(), now.getMonth(), 1)
    : period === 'This Year' ? new Date(now.getFullYear(), 0, 1)
    : null
  const reqs = requirements.filter(r => {
    if (!sameClient(r.client, client.name)) return false
    if (!start) return true
    const created = r.createdAt ? new Date(r.createdAt) : null
    return !!created && created >= start
  })
  return {
    reqs: reqs.length,
    submissions: reqs.reduce((n, r) => n + (r.submissions || 0), 0),
    placements: reqs.reduce((n, r) => n + (r.placed || 0), 0),
  }
}

export function ClientsPage({ role = 'superadmin', requirements = [] }: ClientsPageProps) {
  const [clients, setClients] = useState<ClientRecord[]>([])
  const canAddClient = role !== 'admin'
  const [viewMode, setViewMode] = useState<'list' | 'add' | 'view_agreement'>('list')
  const [selectedClientForAgreement, setSelectedClientForAgreement] = useState<ClientRecord | null>(null)
  const [selectedClientForGapAnalysis, setSelectedClientForGapAnalysis] = useState<ClientRecord | null>(null)
  const [selectedClientForReqsModal, setSelectedClientForReqsModal] = useState<ClientRecord | null>(null)
  const [reqsModalSearchQuery, setReqsModalSearchQuery] = useState('')
  const [reqsModalPriorityFilter, setReqsModalPriorityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All')
  const [activeDropdownClientId, setActiveDropdownClientId] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [domainFilter, setDomainFilter] = useState('All Domains')
  const [periodFilter, setPeriodFilter] = useState<'All Time' | 'This Week' | 'This Month' | 'This Year'>('All Time')

  // Dedicated Add Client Page Form State
  const [newClientName, setNewClientName] = useState('')
  const [newClientDomain, setNewClientDomain] = useState('Software & Cloud Services')
  const [newPocName, setNewPocName] = useState('')
  const [newPocDesignation, setNewPocDesignation] = useState('')
  const [newPocEmail, setNewPocEmail] = useState('')
  const [newPocPhone, setNewPocPhone] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [newCommercialFee, setNewCommercialFee] = useState('')
  const [newPaymentTerms, setNewPaymentTerms] = useState('')
  const [newSlaTAT, setNewSlaTAT] = useState('')
  const [newAgreementStartDate, setNewAgreementStartDate] = useState('')
  const [newAgreementEndDate, setNewAgreementEndDate] = useState('')
  const [newAgreementDoc, setNewAgreementDoc] = useState<File | null>(null)

  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const [reloadKey, setReloadKey] = useState(0)
  useEffect(() => {
    let cancelled = false
    clientsService
      .list()
      .then((rows: any) => {
        const list = Array.isArray(rows) ? rows : rows?.items || rows?.data || []
        if (cancelled) return
        setClients(
          list.map((c: any): ClientRecord => {
            const poc = Array.isArray(c.pocContacts) && c.pocContacts[0] ? c.pocContacts[0] : {}
            return {
              id: c.clientId || c.id,
              name: c.clientName || c.name || '',
              domain: c.domain || '',
              pocName: poc.name || c.pocName || '',
              pocEmail: poc.email || c.pocEmail || '',
              pocPhone: poc.phone || c.pocPhone || '',
              location: poc.designation || c.location || '',
              teamLead: c.accountLeadName || c.teamLead || '',
              teamMemberCount: c.teamMemberCount || 0,
              teamMembers: c.teamMembers || [],
              activeReqs: c.activeReqs || 0,
              totalSubmissions: c.totalSubmissions || 0,
              totalPlacements: c.totalPlacements || 0,
              commercialFee: c.commercialFee || '—',
              paymentTerms: c.paymentTerms || '—',
              slaTAT: c.slaDays ? `${c.slaDays} Days` : c.slaTAT || '—',
              agreementStatus: c.status === 'Active' ? 'Active - Executed' : 'Pending Signature',
              agreementStartDate: c.agreementStartDate || '',
              agreementEndDate: c.agreementEndDate || '',
              agreementDocName: c.agreementsUrl || c.agreementDocName || '',
              signedBy: c.signedBy || '',
              signedDate: c.signedDate || '',
            }
          }),
        )
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [reloadKey])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (domainFilter !== 'All Domains' && c.domain !== domainFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          c.pocName.toLowerCase().includes(q) ||
          c.pocEmail.toLowerCase().includes(q) ||
          c.domain.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [clients, searchQuery, domainFilter])

  // Filtered requirements for Client Requirements Breakdown Modal
  const filteredModalReqs = useMemo(() => {
    if (!selectedClientForReqsModal) return []
    const list = getRequirementsForClient(selectedClientForReqsModal, requirements)
    return list.filter(r => {
      if (reqsModalPriorityFilter !== 'All' && r.priority !== reqsModalPriorityFilter) {
        return false
      }
      if (reqsModalSearchQuery.trim()) {
        const q = reqsModalSearchQuery.toLowerCase()
        const matchTitle = r.title.toLowerCase().includes(q)
        const matchId = r.id.toLowerCase().includes(q)
        const matchRecruiter = r.assignedRecruiter.toLowerCase().includes(q)
        const matchStatus = r.status.toLowerCase().includes(q)
        if (!matchTitle && !matchId && !matchRecruiter && !matchStatus) return false
      }
      return true
    })
  }, [selectedClientForReqsModal, reqsModalSearchQuery, reqsModalPriorityFilter])

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(5)

  const totalPages = Math.ceil(filteredClients.length / pageSize) || 1

  const paginatedClients = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredClients.slice(start, start + pageSize)
  }, [filteredClients, currentPage, pageSize])

  // Open Full-Page Agreement View
  const openAgreementPage = (client: ClientRecord) => {
    setSelectedClientForAgreement(client)
    setViewMode('view_agreement')
  }

  // Handle Add Client Form Submit (Full Page Submission)
  const handleAddClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClientName.trim() || !newPocName.trim()) return
    const sla = parseFloat(newSlaTAT)
    try {
      await clientsService.create({
        clientName: newClientName.trim(),
        domain: newClientDomain,
        status: 'Active',
        ...(Number.isFinite(sla) ? { slaDays: sla } : {}),
        pocContacts: [
          {
            name: newPocName.trim(),
            email: newPocEmail.trim(),
            ...(newPocPhone.trim() ? { phone: newPocPhone.trim() } : {}),
            ...(newPocDesignation.trim() ? { designation: newPocDesignation.trim() } : {}),
          },
        ],
      })
      setReloadKey(k => k + 1)
      setViewMode('list')
      showToast(`Client ${newClientName.trim()} saved`)
      setNewClientName('')
      setNewPocName('')
      setNewPocEmail('')
      setNewPocPhone('')
    } catch (err: any) {
      showToast(err?.message || 'Could not save the client')
    }
  }

  // Render Client Delivery Gap Analysis Page when client is clicked
  if (selectedClientForGapAnalysis) {
    return (
      <ClientDeliveryGapAnalysisPage
        clientName={selectedClientForGapAnalysis.name}
        clientDomain={selectedClientForGapAnalysis.domain}
        pocName={selectedClientForGapAnalysis.pocName}
        pocEmail={selectedClientForGapAnalysis.pocEmail}
        pocPhone={selectedClientForGapAnalysis.pocPhone}
        teamLead={selectedClientForGapAnalysis.teamLead}
        role={role}
        requirements={requirements}
        initialDateRange={periodFilter}
        onBack={() => setSelectedClientForGapAnalysis(null)}
      />
    )
  }

  // Calculate totals for current periodFilter
  const totalPeriodReqs = filteredClients.reduce((acc, c) => acc + getClientStats(c, periodFilter, requirements).reqs, 0)
  const totalPeriodSubmissions = filteredClients.reduce((acc, c) => acc + getClientStats(c, periodFilter, requirements).submissions, 0)
  const totalPeriodPlacements = filteredClients.reduce((acc, c) => acc + getClientStats(c, periodFilter, requirements).placements, 0)

  // -------------------------------------------------------------
  // DEDICATED FULL-PAGE VIEW: VIEW MASTER SERVICES AGREEMENT (MSA)
  // -------------------------------------------------------------
  if (viewMode === 'view_agreement' && selectedClientForAgreement) {
    const agreement = selectedClientForAgreement
    return (
      <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-200">
        {/* TOP HEADER WITH BACK BUTTON & DOWNLOAD PDF ACTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('list')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-slate-200"
              title="Back to Clients List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Master Services Agreement (MSA)
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{agreement.agreementStatus}</span>
                </span>
              </div>
              <p className="text-xs text-[#6B3BF6] font-bold mt-0.5">
                Empaneled Client Partner: <strong className="text-slate-900">{agreement.name}</strong> ({agreement.id})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => showToast(`Printing Agreement Record for ${agreement.name}...`)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print MSA</span>
            </button>

            <button
              onClick={() => showToast(`Downloading ${agreement.agreementDocName}...`)}
              className="px-4 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Download Signed Agreement (PDF)</span>
            </button>
          </div>
        </div>

        {/* AGREEMENT OVERVIEW DASHBOARD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* LEFT 2 COLUMNS: DETAILED AGREEMENT SECTIONS */}
          <div className="lg:col-span-2 space-y-5">
            {/* CARD 1: CONTRACTING PARTIES & LEGAL INFORMATION */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-extrabold text-sm">
                <Building2 className="w-5 h-5 text-blue-600" />
                <span>1. Contracting Client Partner & Signatory Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Organization Name:</span>
                    <span className="font-extrabold text-slate-900">{agreement.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Industry Domain:</span>
                    <span className="font-bold text-[#6B3BF6]">{agreement.domain}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Empanelment ID:</span>
                    <span className="font-bold text-slate-800">{agreement.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Operating Location:</span>
                    <span className="font-semibold text-slate-700">{agreement.location}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Authorized Signatory:</span>
                    <span className="font-extrabold text-slate-900">{agreement.signedBy}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Primary POC Email:</span>
                    <span className="font-bold text-blue-700">{agreement.pocEmail}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-1.5">
                    <span className="text-slate-500 font-medium">Primary POC Contact:</span>
                    <span className="font-semibold text-slate-800">{agreement.pocPhone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Execution Date:</span>
                    <span className="font-bold text-emerald-800">{agreement.signedDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: COMMERCIAL SLA BENCHMARKS & PAYMENT TERMS */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-extrabold text-sm">
                <Award className="w-5 h-5 text-emerald-600" />
                <span>2. Commercial SLA & Fee Structure</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Commercial Empanelment Fee
                  </span>
                  <p className="text-lg font-extrabold text-emerald-950">{agreement.commercialFee}</p>
                  <p className="text-[10px] text-emerald-700">Calculated on First Year Gross CTC</p>
                </div>

                <div className="bg-purple-50/70 border border-purple-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
                    Payment Credit Period
                  </span>
                  <p className="text-lg font-extrabold text-purple-950">{agreement.paymentTerms}</p>
                  <p className="text-[10px] text-purple-700">Triggered upon joining date</p>
                </div>

                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
                    First Submissions SLA TAT
                  </span>
                  <p className="text-lg font-extrabold text-blue-950">{agreement.slaTAT}</p>
                  <p className="text-[10px] text-blue-700">Turnaround SLA Benchmark</p>
                </div>
              </div>
            </div>

            {/* CARD 3: LEGAL CLAUSES & GUARANTEE COVENANTS */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-3 text-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-extrabold text-sm">
                <ShieldCheck className="w-5 h-5 text-[#6B3BF6]" />
                <span>3. Guarantee Covenants & Legal Terms</span>
              </div>

              <div className="space-y-2 text-slate-700 font-medium leading-relaxed">
                <p>
                  <strong>• Candidate Replacement Guarantee:</strong> Includes a 90-day free replacement guarantee. If a candidate leaves within 90 calendar days of joining, a replacement candidate will be provided at zero additional cost within 30 days.
                </p>
                <p>
                  <strong>• Non-Solicitation & NDA Covenant:</strong> Both parties agree to strict confidentiality and non-solicitation guidelines for a duration of 24 months post-agreement termination.
                </p>
                <p>
                  <strong>• Invoicing Milestones:</strong> Invoices are generated on candidate joining date with standard payment clearance terms as specified ({agreement.paymentTerms}).
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DIGITAL DOCUMENT PREVIEW & VALIDITY RECORD */}
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl border border-slate-700 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <FileSignature className="w-5 h-5 text-emerald-400" />
                  <span className="font-extrabold text-sm">Executed MSA Record</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  🔒 Legally Sealed
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider block">Document Filename</span>
                  <p className="font-bold text-white text-xs mt-0.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span>{agreement.agreementDocName}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-medium">Valid From:</span>
                    <p className="font-bold text-white mt-0.5">{agreement.agreementStartDate}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Valid Until:</span>
                    <p className="font-bold text-emerald-400 mt-0.5">{agreement.agreementEndDate}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <span className="text-slate-400 text-[10px] block font-medium">SHA-256 Digital Checksum:</span>
                  <p className="font-mono text-[10px] text-slate-300 break-all bg-slate-800/90 p-2 rounded-xl border border-slate-700 mt-1">
                    e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
                  </p>
                </div>
              </div>

              <button
                onClick={() => showToast(`Downloading ${agreement.agreementDocName}...`)}
                className="w-full py-3 bg-[#6B3BF6] hover:bg-[#5833E0] text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Signed Agreement PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------
  // DEDICATED FULL-PAGE VIEW: ADD NEW CLIENT PAGE
  // -------------------------------------------------------------
  if (viewMode === 'add') {
    return (
      <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-200">
        {/* TOP PAGE HEADER WITH BACK BUTTON */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode('list')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-slate-200"
              title="Back to Clients List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Building2 className="w-6 h-6 text-[#6B3BF6]" />
                <span>Empanel New Client Partner</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Fill in the organization details, primary contact POC, commercial SLA terms, and upload the signed Master Services Agreement (MSA).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              form="add-client-full-form"
              type="submit"
              className="px-5 py-2 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Save & Empanel Client</span>
            </button>
          </div>
        </div>

        {/* FULL PAGE FORM CONTAINER */}
        <form id="add-client-full-form" onSubmit={handleAddClientSubmit} className="space-y-6">
          {/* SECTION 1: CLIENT ORGANIZATION DETAILS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-extrabold text-sm">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>1. Client Organization Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Client Organization Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wipro Digital Solutions"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Industry Sector / Domain</label>
                <select
                  value={newClientDomain}
                  onChange={e => setNewClientDomain(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="Software & Cloud Services">Software & Cloud Services</option>
                  <option value="Hardware & Automotive Engineering">Hardware & Automotive Engineering</option>
                  <option value="Enterprise Security & IT">Enterprise Security & IT</option>
                  <option value="Enterprise SAP & ERP">Enterprise SAP & ERP</option>
                  <option value="AI, Data & Analytics">AI, Data & Analytics</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Operating Location / Region</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore / Hyderabad / Remote"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: PRIMARY POC & CONTACT DETAILS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-extrabold text-sm">
              <User className="w-5 h-5 text-purple-600" />
              <span>2. Primary Point of Contact (POC)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Primary POC Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newPocName}
                  onChange={e => setNewPocName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Designation</label>
                <input
                  type="text"
                  placeholder="e.g. Procurement Lead / VP Hiring"
                  value={newPocDesignation}
                  onChange={e => setNewPocDesignation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Official Email Address</label>
                <input
                  type="email"
                  placeholder="ramesh.k@wipro.com"
                  value={newPocEmail}
                  onChange={e => setNewPocEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Mobile Contact Number</label>
                <input
                  type="text"
                  placeholder="+91 XXXXX XXXXX"
                  value={newPocPhone}
                  onChange={e => setNewPocPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: COMMERCIAL TERMS & SLA BENCHMARKS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 text-slate-900 font-extrabold text-sm">
              <Award className="w-5 h-5 text-emerald-600" />
              <span>3. Commercial SLA & Payment Terms</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Commercial Empanelment Fee %</label>
                <input
                  type="text"
                  placeholder="e.g. 8.33% Annual CTC"
                  value={newCommercialFee}
                  onChange={e => setNewCommercialFee(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Payment Credit Terms</label>
                <input
                  type="text"
                  placeholder="e.g. 30 Days Net"
                  value={newPaymentTerms}
                  onChange={e => setNewPaymentTerms(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">First Submission SLA TAT</label>
                <input
                  type="text"
                  placeholder="e.g. 3.0 Days"
                  value={newSlaTAT}
                  onChange={e => setNewSlaTAT(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: MASTER SERVICES AGREEMENT (MSA) ATTACHMENT */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <FileText className="w-5 h-5 text-[#6B3BF6]" />
                <span>4. Master Services Agreement (MSA) Contract</span>
              </div>
              <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Active Legal Executed Contract
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Contract Effective Start Date</label>
                <input
                  type="date"
                  value={newAgreementStartDate}
                  onChange={e => setNewAgreementStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1.5">Contract Expiry / Renewal Date</label>
                <input
                  type="date"
                  value={newAgreementEndDate}
                  onChange={e => setNewAgreementEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#6B3BF6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1.5">Upload Signed MSA Agreement PDF / Document</label>
              <div
                onClick={() => document.getElementById('full-page-msa-upload')?.click()}
                className="border-2 border-dashed border-purple-200 rounded-2xl p-6 bg-purple-50/40 text-center cursor-pointer hover:bg-purple-50 transition-colors"
              >
                <Upload className="w-8 h-8 text-[#6B3BF6] mx-auto mb-2" />
                <p className="text-xs text-slate-800 font-bold">Click to attach signed Master Services Agreement (MSA)</p>
                <p className="text-[10px] text-slate-400 mt-1">Supports PDF, DOCX up to 25MB (Digital Signatures Accepted)</p>
                <input
                  type="file"
                  accept=".pdf,.docx"
                  onChange={e => setNewAgreementDoc(e.target.files?.[0] || null)}
                  className="hidden"
                  id="full-page-msa-upload"
                />
              </div>
              {newAgreementDoc && (
                <p className="text-xs text-emerald-700 font-bold mt-2 text-center flex items-center justify-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Document Attached: {newAgreementDoc.name}</span>
                </p>
              )}
            </div>
          </div>

          {/* BOTTOM SUBMIT BAR */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Save className="w-4 h-4" />
              <span>Save & Empanel Client Partner</span>
            </button>
          </div>
        </form>
      </div>
    )
  }

  // -------------------------------------------------------------
  // MAIN CLIENTS LIST PAGE
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800">
      {/* 1. TOP HEADER & ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Client Management</h1>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-100 text-blue-900 border border-blue-200 inline-flex items-center gap-1.5 shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>{clients.length} Empaneled Clients</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage empaneled client accounts, view Master Services Agreements (MSA), and add new client partners.
          </p>
        </div>

        {canAddClient && (
          <div className="flex items-center gap-3">
            {/* BUTTON SWITCHES TO DEDICATED FULL-PAGE ADD CLIENT VIEW */}
            <button
              onClick={() => setViewMode('add')}
              className="px-4 py-2.5 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Client</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. SUMMARY KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Active Executed MSAs
            </span>
            <p className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {clients.filter(c => c.agreementStatus === 'Active - Executed').length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6B3BF6]">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Reqs ({periodFilter})
            </span>
            <p className="text-2xl font-extrabold text-blue-600 mt-1 tabular-nums">
              {totalPeriodReqs}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Submissions ({periodFilter})
            </span>
            <p className="text-2xl font-extrabold text-purple-600 mt-1 tabular-nums">
              {totalPeriodSubmissions}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#6B3BF6]">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Placements ({periodFilter})
            </span>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
              {totalPeriodPlacements}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. SEARCH & DOMAIN & REQUIREMENTS PERIOD FILTER BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search client organization, POC, email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Requirements Time Period Filter (Week / Month / Year / All Time) */}
          <div className="relative w-full sm:w-52">
            <select
              value={periodFilter}
              onChange={e => setPeriodFilter(e.target.value as any)}
              className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs border border-purple-200 bg-purple-50/70 rounded-xl font-extrabold text-[#6B3BF6] focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All Time">Requirements: All Time</option>
              <option value="This Week">Requirements: This Week</option>
              <option value="This Month">Requirements: This Month</option>
              <option value="This Year">Requirements: This Year</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B3BF6] pointer-events-none" />
          </div>

          <div className="w-full sm:w-52">
            <select
              value={domainFilter}
              onChange={e => setDomainFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All Domains">All Industry Domains</option>
              <option value="Software & Cloud Services">Software & Cloud Services</option>
              <option value="Hardware & Automotive Engineering">Hardware & Automotive Engineering</option>
              <option value="Enterprise Security & IT">Enterprise Security & IT</option>
              <option value="Enterprise SAP & ERP">Enterprise SAP & ERP</option>
              <option value="AI, Data & Analytics">AI, Data & Analytics</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. CLIENTS TABLE LIST */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">CLIENT ORGANIZATION</th>
                <th className="py-3.5 px-4">ASSIGNED TEAM & MEMBERS</th>
                <th className="py-3.5 px-4 text-center">REQUIREMENTS</th>
                <th className="py-3.5 px-4 text-center">SUBMISSIONS</th>
                <th className="py-3.5 px-4">CLIENT POC</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {paginatedClients.map(client => (
                <tr
                  key={client.id}
                  className="hover:bg-purple-50/40 transition-colors group"
                >
                  {/* Column 1: Client Organization */}
                  <td className="py-4 px-4 font-bold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#6B3BF6] to-[#5833E0] text-white font-extrabold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-slate-900 font-extrabold text-xs flex items-center gap-1.5">
                          <span>{client.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                            {client.id}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#6B3BF6] font-semibold mt-0.5">{client.domain}</div>
                        <div className="text-[10px] text-slate-500 font-normal mt-0.5">{client.location}</div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Combined Team Lead & Team Members Working */}
                  <td className="py-4 px-4 whitespace-nowrap min-w-56">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          setActiveDropdownClientId(activeDropdownClientId === client.id ? null : client.id)
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold cursor-pointer transition-all flex items-center justify-between gap-2 shadow-2xs ${
                          activeDropdownClientId === client.id
                            ? 'bg-[#6B3BF6] text-white border-[#5833E0] ring-2 ring-[#6B3BF6]/20'
                            : 'bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] border-purple-200'
                        }`}
                        title={`Click to view team members working under ${client.teamLead}`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${activeDropdownClientId === client.id ? 'text-white' : 'text-blue-600'}`} />
                          <span>{client.teamLead} (Team Lead)</span>
                        </div>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${activeDropdownClientId === client.id ? 'rotate-180 text-white' : 'text-[#6B3BF6]'}`} />
                      </button>

                      {/* Custom Animated UI Dropdown Popover */}
                      {activeDropdownClientId === client.id && (
                        <>
                          {/* Backdrop overlay to close */}
                          <div
                            className="fixed inset-0 z-40"
                            onClick={e => {
                              e.stopPropagation()
                              setActiveDropdownClientId(null)
                            }}
                          />

                          <div
                            className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 p-3 space-y-2 font-sans animate-in fade-in zoom-in-95 duration-150"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <Users className="w-3 h-3 text-[#6B3BF6]" />
                                <span>Team Members ({client.teamMembers.length})</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-purple-100 text-[#6B3BF6] text-[9px] font-extrabold">
                                Lead: {client.teamLead}
                              </span>
                            </div>

                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {client.teamMembers.map(member => (
                                <div
                                  key={member}
                                  className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50/80 border border-slate-100 transition-colors flex items-center gap-2.5"
                                >
                                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#6B3BF6] font-extrabold text-xs flex items-center justify-center shrink-0 border border-purple-200">
                                    {member.charAt(0)}
                                  </div>
                                  <div className="truncate">
                                    <div className="font-extrabold text-slate-900 text-xs truncate">{member}</div>
                                    <div className="text-[10px] text-slate-500 font-medium">Team Member</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Column 4: Requirements Count (Interactive Button Opens Modal) */}
                  <td className="py-4 px-4 whitespace-nowrap text-center">
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedClientForReqsModal(client)
                        setReqsModalSearchQuery('')
                        setReqsModalPriorityFilter('All')
                      }}
                      className="px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 hover:border-blue-400 tabular-nums transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 inline-flex items-center gap-1.5"
                      title={`Click to view all requirements received from ${client.name}`}
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>{getClientStats(client, periodFilter, requirements).reqs} Reqs</span>
                    </button>
                    {periodFilter !== 'All Time' && (
                      <div className="text-[10px] text-purple-700 font-extrabold mt-0.5">({periodFilter})</div>
                    )}
                  </td>

                  {/* Column 5: Submissions Count */}
                  <td className="py-4 px-4 whitespace-nowrap text-center">
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-purple-900 border border-purple-200 tabular-nums">
                      {getClientStats(client, periodFilter, requirements).submissions} Subs
                    </span>
                    {periodFilter !== 'All Time' && (
                      <div className="text-[10px] text-purple-700 font-extrabold mt-0.5">({periodFilter})</div>
                    )}
                  </td>

                  {/* Column 6: CLIENT POC */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-purple-600" />
                        <span>{client.pocName}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium">
                        {client.pocEmail}
                      </div>
                    </div>
                  </td>

                  {/* Column 7: Actions */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    {/* CLIENT DELIVERY GAP ANALYSIS BUTTON */}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedClientForGapAnalysis(client)
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#6B3BF6] hover:bg-[#5833E0] text-white font-extrabold cursor-pointer inline-flex items-center gap-1.5 text-xs shadow-2xs transition-all active:scale-98"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gap Analysis</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 10-ITEM PAGINATION FOOTER */}
        <PaginationFooter
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredClients.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* 5. CLIENT REQUIREMENTS BREAKDOWN MODAL */}
      {selectedClientForReqsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* MODAL HEADER */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6B3BF6] to-[#5833E0] text-white font-black text-lg flex items-center justify-center shrink-0 border border-purple-300 shadow-md">
                  {selectedClientForReqsModal.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">
                      Requirements Received from {selectedClientForReqsModal.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                      {selectedClientForReqsModal.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Domain: <strong className="text-purple-700">{selectedClientForReqsModal.domain}</strong> • Primary POC: <strong className="text-slate-900">{selectedClientForReqsModal.pocName}</strong> ({selectedClientForReqsModal.pocEmail})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClientForReqsModal(null)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* OVERVIEW STATS CARDS */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-blue-50/80 rounded-2xl border border-blue-100 text-center">
                <span className="text-[10px] font-bold text-blue-800 uppercase block">Total Client Reqs</span>
                <span className="text-2xl font-black text-blue-950 font-mono">
                  {getClientStats(selectedClientForReqsModal, periodFilter, requirements).reqs}
                </span>
              </div>
              <div className="p-3.5 bg-purple-50/80 rounded-2xl border border-purple-100 text-center">
                <span className="text-[10px] font-bold text-purple-800 uppercase block">Total Submissions</span>
                <span className="text-2xl font-black text-purple-950 font-mono">
                  {getClientStats(selectedClientForReqsModal, periodFilter, requirements).submissions}
                </span>
              </div>
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-100 text-center">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Placements</span>
                <span className="text-2xl font-black text-emerald-950 font-mono">
                  {getClientStats(selectedClientForReqsModal, periodFilter, requirements).placements}
                </span>
              </div>
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-100 text-center">
                <span className="text-[10px] font-bold text-amber-900 uppercase block">SLA TAT Target</span>
                <span className="text-2xl font-black text-amber-950 font-mono">
                  {selectedClientForReqsModal.slaTAT}
                </span>
              </div>
            </div>

            {/* SEARCH & PRIORITY FILTER BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search requirement title, ID, recruiter..."
                  value={reqsModalSearchQuery}
                  onChange={e => setReqsModalSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-slate-800"
                />
              </div>

              {/* Priority Filter Pills */}
              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Priority:</span>
                {(['All', 'High', 'Medium', 'Low'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setReqsModalPriorityFilter(p)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      reqsModalPriorityFilter === p
                        ? 'bg-[#6B3BF6] text-white shadow-2xs'
                        : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* REQUIREMENTS TABLE LIST */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/80 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="py-2.5 px-3.5">REQUIREMENT ID & TITLE</th>
                      <th className="py-2.5 px-3.5">ASSIGNED DATE</th>
                      <th className="py-2.5 px-3.5 text-center">PRIORITY</th>
                      <th className="py-2.5 px-3.5 text-center">STATUS</th>
                      <th className="py-2.5 px-3.5">ASSIGNED RECRUITER</th>
                      <th className="py-2.5 px-3.5 text-center">SUBMISSIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-slate-800 font-medium">
                    {filteredModalReqs.map(req => (
                      <tr key={req.id} className="hover:bg-white transition-colors">
                        <td className="py-3 px-3.5">
                          <div className="font-extrabold text-slate-900 text-xs">{req.title}</div>
                          <div className="text-[10px] text-purple-700 font-bold mt-0.5">
                            ID: {req.id} • <span className="text-slate-500 font-normal">{req.experience}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3.5 text-slate-500 font-mono text-[11px]">
                          {req.assignedDate}
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              req.priority === 'High'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : req.priority === 'Medium'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {req.priority}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-bold text-slate-900">
                          {req.assignedRecruiter}
                        </td>
                        <td className="py-3 px-3.5 text-center font-bold text-slate-900 font-mono">
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#6B3BF6] border border-purple-200">
                            {req.submissionsCount} Subs ({req.interviewsCount} Int)
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredModalReqs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                          No requirements found matching your search and filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Showing {filteredModalReqs.length} requirement(s) from {selectedClientForReqsModal.name}
              </span>
              <button
                onClick={() => setSelectedClientForReqsModal(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed bottom-12 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
