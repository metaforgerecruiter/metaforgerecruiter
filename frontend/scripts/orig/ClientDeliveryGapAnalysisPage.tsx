import React, { useState, useMemo } from 'react'
import {
  ArrowLeft,
  Building2,
  Briefcase,
  FileText,
  CheckCircle2,
  Clock,
  Download,
  Users,
  TrendingUp,
  BarChart3,
  Sparkles,
  Filter,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Search,
  RotateCcw,
  UserCheck,
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Layers,
  PieChart,
  ShieldAlert,
  Check,
  ExternalLink,
  Eye,
  Award,
  FileSpreadsheet,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell,
} from 'recharts'
import { Role } from '../../types'
import { PaginationFooter } from '../ui/PaginationFooter'

export interface ClientGapAnalysisProps {
  clientName: string
  clientDomain?: string
  pocName?: string
  pocEmail?: string
  pocPhone?: string
  teamLead?: string
  role?: Role
  initialDateRange?: string
  onBack: () => void
  onSelectRequirement?: (reqId: string) => void
}

export interface ClientRequirementItem {
  id: string
  title: string
  domain: string
  positions: number | 'N/A'
  submissions: number
  spoc: string
  status: 'Open' | 'In Progress' | 'Closed'
  createdDate: string
  hasMissingDomain?: boolean
  hasNonNumericPositions?: boolean
  interviews: {
    candidateName: string
    stage: 'Final Select' | 'L1 Reject' | 'Awaiting / Pending' | 'L2 Interview' | 'Sourced'
    date: string
  }[]
}

const STANDARDIZED_DOMAINS_LIST = [
  'Automotive / Mobility',
  'Aerospace & Defense',
  'Plant / Process / Industrial Engineering',
  'Product Engineering / CAD-CAE-PLM',
  'Embedded / Electronics / V&V',
  'Digital / IT / Data',
  'Medical Devices / Healthcare',
  'Energy / Oil & Gas / Renewables',
  'Manufacturing / Quality / Cost Engineering',
  'Warehouse / Supply Chain',
  'Enterprise Apps / Asset & Process Transformation',
  'Other / Needs Validation',
]

// Dynamic data generator helper per client name
export function getClientGapAnalysisDataset(clientName: string = 'Accenture', clientPoc?: string): ClientRequirementItem[] {
  const safeClientName = (clientName || 'Accenture').trim()
  const seed = safeClientName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const clientCode = (safeClientName.length >= 3 ? safeClientName.substring(0, 3) : 'CLI').toUpperCase()

  // Seeded random helper
  const pseudoRandom = (index: number) => {
    const x = Math.sin(seed + index) * 10000
    return x - Math.floor(x)
  }

  const reqTitlesByDomain: Record<string, string[]> = {
    'Automotive / Mobility': [
      'EV Battery Management System Architect',
      'AUTOSAR Software Integration Specialist',
      'ADAS Perception & Sensor Fusion Lead',
      'Chassis & Powertrain Design Engineer',
      'Vehicle Dynamics Simulation Engineer',
    ],
    'Aerospace & Defense': [
      'Avionics Embedded Software Engineer',
      'DO-178C Safety Critical Systems Specialist',
      'Aerostructures Stress Analysis Engineer',
      'Flight Control Systems Specialist',
    ],
    'Plant / Process / Industrial Engineering': [
      'Industrial Automation & PLC Programmer',
      'SCADA Systems Integration Specialist',
      'Plant Layout & Process Optimization Lead',
      'Robotics & Conveyor Cell Engineer',
    ],
    'Product Engineering / CAD-CAE-PLM': [
      'CATIA V5/V6 Mechanical Design Specialist',
      'Teamcenter PLM Solution Architect',
      'ANSYS FEA Thermal & Structural Analyst',
      'CREO Plastics & Sheet Metal Engineer',
    ],
    'Embedded / Electronics / V&V': [
      'Embedded C/C++ Firmware Developer',
      'Hardware-in-the-Loop (HIL) Test Specialist',
      'PCB Design & Hardware Board Bringup Lead',
      'Microcontroller Driver Developer',
    ],
    'Digital / IT / Data': [
      'Senior Full Stack Java & Cloud Architect',
      'AWS / Azure DevOps Systems Lead',
      'Data Engineering & Snowflake Architect',
      'Cybersecurity & Network Infrastructure Specialist',
    ],
    'Medical Devices / Healthcare': [
      'ISO 13485 Medical Device Verification Lead',
      'FDA Regulatory Compliance Specialist',
      'Biomedical Signal Processing Engineer',
    ],
    'Energy / Oil & Gas / Renewables': [
      'Subsea Structural Integrity Analyst',
      'Solar & Wind Farm Substation Specialist',
      'Turbine Control Systems Lead',
    ],
    'Manufacturing / Quality / Cost Engineering': [
      'Six Sigma Black Belt Quality Lead',
      'Should-Cost & Teardown Analysis Engineer',
      'APQP & PPAP Compliance Auditor',
    ],
    'Warehouse / Supply Chain': [
      'Supply Chain Network Optimization Manager',
      'Warehouse Automation & WMS Specialist',
    ],
    'Enterprise Apps / Asset & Process Transformation': [
      'SAP S/4HANA TM & Logistics Architect',
      'Oracle Cloud ERP Implementation Lead',
      'Salesforce Enterprise Solution Architect',
    ],
    'Other / Needs Validation': [
      'Unspecified Technical Consultant Requirement',
      'Pending Client Job Demand Brief',
    ],
  }

  // SPOC List strictly scoped to this client
  const primarySpoc = clientPoc || (safeClientName.includes('Goldman') ? 'Trayeetanu Ganguly' : safeClientName.includes('Infosys') ? 'Ramesh Babu' : safeClientName.includes('JPMorgan') ? 'Siddharth N' : 'Kallol Chakraborty')
  const spocList = [primarySpoc, `${primarySpoc} (Lead)`, 'Marcus Chen', 'Harish Gadipally']

  const dataset: ClientRequirementItem[] = []
  let reqCounter = 101

  STANDARDIZED_DOMAINS_LIST.forEach((domain, dIdx) => {
    const titles = reqTitlesByDomain[domain] || ['Senior Specialist Consultant']
    const reqCount = Math.floor(pseudoRandom(dIdx * 3) * 4) + 1 // 1 to 4 requirements per domain

    for (let i = 0; i < reqCount; i++) {
      const title = titles[i % titles.length]
      const rVal = pseudoRandom(dIdx * 10 + i)

      // Positions & Submissions dynamic calculation
      const isZeroSub = rVal < 0.35 // 35% chance of 0 submissions to reflect gap analysis
      const isMissingDomain = domain === 'Other / Needs Validation' || (rVal > 0.88 && i === 0)
      const isNonNumericPos = rVal > 0.92

      const positionsVal = isNonNumericPos ? ('N/A' as any) : Math.floor(pseudoRandom(dIdx * 7 + i) * 12) + 2
      const submissionsVal = isZeroSub ? 0 : Math.floor(pseudoRandom(dIdx * 5 + i) * (typeof positionsVal === 'number' ? positionsVal * 1.5 : 8)) + 1
      const spocName = spocList[Math.floor(pseudoRandom(dIdx * 9 + i) * spocList.length)]

      // Generate realistic candidate interview records
      const interviewCount = Math.max(0, Math.floor(submissionsVal * 0.4))
      const interviewsList = []

      const candNames = ['Priya Nair', 'Anand K', 'Suresh M', 'Sneha P', 'Rajesh V', 'Kavita R', 'David L', 'Arun G']
      for (let k = 0; k < interviewCount; k++) {
        const kVal = pseudoRandom(dIdx * 20 + k)
        let stage: 'Final Select' | 'L1 Reject' | 'Awaiting / Pending' | 'L2 Interview' | 'Sourced' = 'Awaiting / Pending'
        if (kVal > 0.65) stage = 'Final Select'
        else if (kVal < 0.25) stage = 'L1 Reject'
        else if (kVal < 0.45) stage = 'L2 Interview'

        interviewsList.push({
          candidateName: candNames[k % candNames.length],
          stage,
          date: `2026-08-0${(k % 9) + 1}`,
        })
      }

      // Create dates distributed across week, month, year, and past year
      const datePool = [
        '2026-08-25', // This Week
        '2026-08-23', // This Week
        '2026-08-14', // This Month
        '2026-08-05', // This Month
        '2026-06-18', // This Year
        '2026-04-10', // This Year
        '2026-02-14', // This Year
        '2025-11-20', // All Time (Prior year)
      ]
      const createdDate = datePool[(i + dIdx) % datePool.length]

      dataset.push({
        id: `REQ-2026-${clientCode}-${reqCounter++}`,
        title,
        domain: isMissingDomain ? 'Other / Needs Validation' : domain,
        positions: positionsVal,
        submissions: submissionsVal,
        spoc: spocName,
        status: isZeroSub ? 'Open' : submissionsVal > 10 ? 'Closed' : 'In Progress',
        createdDate,
        hasMissingDomain: isMissingDomain,
        hasNonNumericPositions: isNonNumericPos,
        interviews: interviewsList,
      })
    }
  })

  return dataset
}

export function ClientDeliveryGapAnalysisPage({
  clientName,
  clientDomain = 'Enterprise Engineering & Digital Services',
  pocName = 'Kallol Chakraborty',
  pocEmail = 'kallol.c@client.com',
  pocPhone = '+91 98765 11223',
  teamLead = 'Harish Gadipally',
  role = 'superadmin',
  initialDateRange = 'All Time',
  onBack,
  onSelectRequirement,
}: ClientGapAnalysisProps) {
  // Filters State
  const [dateRange, setDateRange] = useState(initialDateRange || 'All Time')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomainFilter, setSelectedDomainFilter] = useState('All Domains')
  const [selectedSpocFilter, setSelectedSpocFilter] = useState('All SPOCs')
  const [selectedReqStatus, setSelectedReqStatus] = useState('All Statuses')
  const [selectedSubStatus, setSelectedSubStatus] = useState('All')
  const [selectedInterviewStatus, setSelectedInterviewStatus] = useState('All')
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Section Toggle State (for collapsing sections to reduce scrolling)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    kpi: true,
    domainTable: true,
    domainCharts: true,
    spocTable: true,
    reqGaps: true,
  })
  const [activeTabSection, setActiveTabSection] = useState<string>('all')

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const expandAll = () => {
    setOpenSections({
      kpi: true,
      domainTable: true,
      domainCharts: true,
      spocTable: true,
      reqGaps: true,
    })
    setActiveTabSection('all')
    showToast('Expanded all sections.')
  }

  const collapseAll = () => {
    setOpenSections({
      kpi: false,
      domainTable: false,
      domainCharts: false,
      spocTable: false,
      reqGaps: false,
    })
    showToast('Collapsed all sections to reduce scrolling.')
  }

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }

  // Load Dynamic Dataset for this particular client only
  const rawClientRequirements = useMemo(() => {
    return getClientGapAnalysisDataset(clientName, pocName)
  }, [clientName, pocName])

  // Filtered Requirements Dataset
  const filteredRequirements = useMemo(() => {
    return rawClientRequirements.filter(req => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = req.title.toLowerCase().includes(q)
        const matchId = req.id.toLowerCase().includes(q)
        const matchSpoc = req.spoc.toLowerCase().includes(q)
        if (!matchTitle && !matchId && !matchSpoc) return false
      }

      // Time Period Filter (Week / Month / Year / All Time)
      if (dateRange !== 'All Time' && dateRange !== 'All') {
        if (dateRange === 'This Week') {
          if (req.createdDate && req.createdDate < '2026-08-22') return false
        } else if (dateRange === 'This Month') {
          if (req.createdDate && !req.createdDate.includes('2026-08')) return false
        } else if (dateRange === 'This Year') {
          if (req.createdDate && !req.createdDate.includes('2026')) return false
        }
      }

      if (selectedDomainFilter !== 'All Domains' && req.domain !== selectedDomainFilter) {
        return false
      }
      if (selectedSpocFilter !== 'All SPOCs' && req.spoc !== selectedSpocFilter) {
        return false
      }
      if (selectedReqStatus !== 'All Statuses' && req.status !== selectedReqStatus) {
        return false
      }
      if (selectedSubStatus === 'Zero Submissions' && req.submissions > 0) {
        return false
      }
      if (selectedSubStatus === 'Has Submissions' && req.submissions === 0) {
        return false
      }
      if (selectedInterviewStatus === 'Final Selects' && !req.interviews.some(i => i.stage === 'Final Select')) {
        return false
      }
      if (selectedInterviewStatus === 'L1 Rejects' && !req.interviews.some(i => i.stage === 'L1 Reject')) {
        return false
      }
      if (selectedInterviewStatus === 'Awaiting/Pending' && !req.interviews.some(i => i.stage === 'Awaiting / Pending')) {
        return false
      }
      return true
    })
  }, [
    rawClientRequirements,
    searchQuery,
    dateRange,
    selectedDomainFilter,
    selectedSpocFilter,
    selectedReqStatus,
    selectedSubStatus,
    selectedInterviewStatus,
  ])

  // Requirement Gap Analysis Pagination State (10 items limit)
  const [gapCurrentPage, setGapCurrentPage] = useState(1)
  const [gapPageSize, setGapPageSize] = useState(10)

  const gapTotalPages = Math.ceil(filteredRequirements.length / gapPageSize) || 1

  const paginatedRequirements = useMemo(() => {
    const start = (gapCurrentPage - 1) * gapPageSize
    return filteredRequirements.slice(start, start + gapPageSize)
  }, [filteredRequirements, gapCurrentPage, gapPageSize])

  // Dynamic Metrics Calculations
  const metrics = useMemo(() => {
    const totalReqs = filteredRequirements.length
    let totalPositions = 0
    let totalSubmissions = 0
    let zeroSubReqs = 0
    let missingDomainReqs = 0
    let nonNumericPositions = 0

    let totalInterviews = 0
    let finalSelects = 0
    let l1Rejects = 0
    let awaitingPending = 0

    filteredRequirements.forEach(req => {
      if (typeof req.positions === 'number') {
        totalPositions += req.positions
      } else {
        nonNumericPositions++
      }

      totalSubmissions += req.submissions

      if (req.submissions === 0) {
        zeroSubReqs++
      }

      if (req.hasMissingDomain || req.domain === 'Other / Needs Validation') {
        missingDomainReqs++
      }

      req.interviews.forEach(inv => {
        totalInterviews++
        if (inv.stage === 'Final Select') finalSelects++
        else if (inv.stage === 'L1 Reject') l1Rejects++
        else if (inv.stage === 'Awaiting / Pending') awaitingPending++
      })
    })

    const coveragePct = totalPositions > 0 ? Math.round((totalSubmissions / totalPositions) * 100) : 0

    // Dynamic Client Health Status Calculation
    let healthStatus: 'Healthy' | 'Needs Attention' | 'Critical' = 'Healthy'
    if (coveragePct < 25 || zeroSubReqs > totalReqs * 0.35) {
      healthStatus = 'Critical'
    } else if (coveragePct < 45 || zeroSubReqs > totalReqs * 0.18) {
      healthStatus = 'Needs Attention'
    }

    return {
      totalReqs,
      totalPositions,
      totalSubmissions,
      coveragePct,
      zeroSubReqs,
      missingDomainReqs,
      nonNumericPositions,
      totalInterviews,
      finalSelects,
      l1Rejects,
      awaitingPending,
      healthStatus,
    }
  }, [filteredRequirements])

  // Dynamic Standardized Domain Analysis Table Data
  const domainAnalysisRows = useMemo(() => {
    const domainMap: Record<
      string,
      { reqs: number; positions: number; subs: number; zeroSubReqs: number }
    > = {}

    STANDARDIZED_DOMAINS_LIST.forEach(d => {
      domainMap[d] = { reqs: 0, positions: 0, subs: 0, zeroSubReqs: 0 }
    })

    filteredRequirements.forEach(req => {
      const d = STANDARDIZED_DOMAINS_LIST.includes(req.domain) ? req.domain : 'Other / Needs Validation'
      domainMap[d].reqs += 1
      if (typeof req.positions === 'number') {
        domainMap[d].positions += req.positions
      }
      domainMap[d].subs += req.submissions
      if (req.submissions === 0) {
        domainMap[d].zeroSubReqs += 1
      }
    })

    return STANDARDIZED_DOMAINS_LIST.map(domain => {
      const item = domainMap[domain]
      const coverage = item.positions > 0 ? Math.round((item.subs / item.positions) * 100) : 0
      return {
        domain,
        requirements: item.reqs,
        positions: item.positions,
        submissions: item.subs,
        coverage,
        zeroSubReqs: item.zeroSubReqs,
      }
    }).filter(row => row.requirements > 0 || row.positions > 0 || row.submissions > 0)
  }, [filteredRequirements])

  // Dynamic SPOC / Ownership Analysis Table Data
  const spocAnalysisRows = useMemo(() => {
    const spocMap: Record<
      string,
      { reqs: number; positions: number; subs: number; zeroSubReqs: number }
    > = {}

    filteredRequirements.forEach(req => {
      const spoc = req.spoc || 'Unassigned'
      if (!spocMap[spoc]) {
        spocMap[spoc] = { reqs: 0, positions: 0, subs: 0, zeroSubReqs: 0 }
      }
      spocMap[spoc].reqs += 1
      if (typeof req.positions === 'number') {
        spocMap[spoc].positions += req.positions
      }
      spocMap[spoc].subs += req.submissions
      if (req.submissions === 0) {
        spocMap[spoc].zeroSubReqs += 1
      }
    })

    return Object.keys(spocMap).map(spoc => {
      const item = spocMap[spoc]
      const coverage = item.positions > 0 ? Math.round((item.subs / item.positions) * 100) : 0
      return {
        spoc,
        requirements: item.reqs,
        positions: item.positions,
        submissions: item.subs,
        coverage,
        zeroSubReqs: item.zeroSubReqs,
      }
    })
  }, [filteredRequirements])

  // Recharts Data Mapping
  const domainChartData = useMemo(() => {
    return domainAnalysisRows.map(row => ({
      domainShort: row.domain.length > 18 ? row.domain.substring(0, 16) + '...' : row.domain,
      domainFull: row.domain,
      requirements: row.requirements,
      positions: row.positions,
      submissions: row.submissions,
      coverage: row.coverage,
      zeroSubReqs: row.zeroSubReqs,
    }))
  }, [domainAnalysisRows])

  // Extract unique SPOC list for filter
  const uniqueSpocList = useMemo(() => {
    const set = new Set<string>()
    rawClientRequirements.forEach(r => set.add(r.spoc))
    return Array.from(set)
  }, [rawClientRequirements])

  return (
    <div className="space-y-6 w-full pb-16 font-sans text-slate-800 animate-in fade-in duration-150">
      {/* 1. TOP HEADER & HEALTH SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div className="space-y-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer border border-slate-200/90 active:scale-98"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to Clients List</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#6B3BF6] font-extrabold flex items-center justify-center text-lg border border-purple-200 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase">
                  {clientName}
                </h1>

                {/* Health Badge */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold border inline-flex items-center gap-1.5 shadow-2xs ${
                    metrics.healthStatus === 'Healthy'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : metrics.healthStatus === 'Needs Attention'
                      ? 'bg-amber-100 text-amber-900 border-amber-200'
                      : 'bg-rose-100 text-rose-800 border-rose-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      metrics.healthStatus === 'Healthy'
                        ? 'bg-emerald-600'
                        : metrics.healthStatus === 'Needs Attention'
                        ? 'bg-amber-600'
                        : 'bg-rose-600'
                    }`}
                  />
                  <span>
                    Status: {metrics.healthStatus === 'Healthy' ? 'Healthy Coverage' : metrics.healthStatus === 'Needs Attention' ? 'Needs Attention' : 'Critical Delivery Gap'}
                  </span>
                </span>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#EEF2FF] text-[#5B51D8] border border-[#C7D2FE] inline-flex items-center gap-1 shadow-2xs">
                  🔒 Isolated View: {clientName} Data Only
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Client Delivery Gap Analysis • SPOC: <strong className="text-slate-800">{pocName}</strong> ({pocEmail}) • Lead: <strong className="text-purple-700">{teamLead}</strong>
              </p>
            </div>
          </div>
        </div>

        {role !== 'recruiter' && role !== 'lead' && role !== 'admin' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => showToast(`Exporting Delivery Gap Analysis for ${clientName}...`)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center gap-2 cursor-pointer active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Export Gap Report CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. FILTERS CONTROL BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-extrabold text-slate-900">
            <Filter className="w-4 h-4 text-[#6B3BF6]" />
            <span>Dynamic Gap Analysis Filters</span>
          </div>
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedDomainFilter('All Domains')
              setSelectedSpocFilter('All SPOCs')
              setSelectedReqStatus('All Statuses')
              setSelectedSubStatus('All')
              setSelectedInterviewStatus('All')
              showToast('Filters reset to default.')
            }}
            className="text-xs font-semibold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 text-xs">
          {/* Time Period Filter (Week / Month / Year / All Time) */}
          <div>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full px-3 py-2 bg-purple-50/90 border border-purple-200 rounded-xl font-extrabold text-[#6B3BF6] focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All Time">All Time</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Title or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#6B3BF6] text-xs"
            />
          </div>

          {/* Standardized Domain Filter */}
          <div>
            <select
              value={selectedDomainFilter}
              onChange={e => setSelectedDomainFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All Domains">All Domains ({STANDARDIZED_DOMAINS_LIST.length})</option>
              {STANDARDIZED_DOMAINS_LIST.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* SPOC Filter */}
          <div>
            <select
              value={selectedSpocFilter}
              onChange={e => setSelectedSpocFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All SPOCs">All SPOCs</option>
              {uniqueSpocList.map(s => (
                <option key={s} value={s}>
                  SPOC: {s}
                </option>
              ))}
            </select>
          </div>

          {/* Requirement Status */}
          <div>
            <select
              value={selectedReqStatus}
              onChange={e => setSelectedReqStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All Statuses">All Requirement Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Submission Status */}
          <div>
            <select
              value={selectedSubStatus}
              onChange={e => setSelectedSubStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All">All Submission States</option>
              <option value="Zero Submissions">Zero Submissions (0)</option>
              <option value="Has Submissions">Has Submissions (&gt;0)</option>
            </select>
          </div>

          {/* Interview Status */}
          <div>
            <select
              value={selectedInterviewStatus}
              onChange={e => setSelectedInterviewStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 focus:outline-none focus:border-[#6B3BF6] cursor-pointer"
            >
              <option value="All">All Interview Statuses</option>
              <option value="Final Selects">Final Selects</option>
              <option value="L1 Rejects">L1 Rejects</option>
              <option value="Awaiting/Pending">Awaiting / Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2.5 SECTION TOGGLE NAVIGATION CONTROL BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 font-sans">
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => {
              setActiveTabSection('kpi')
              setOpenSections(prev => ({ ...prev, kpi: true }))
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTabSection === 'kpi'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>KPI Summary</span>
          </button>

          <button
            onClick={() => {
              setActiveTabSection('domainTable')
              setOpenSections(prev => ({ ...prev, domainTable: true }))
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTabSection === 'domainTable'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Domain Delivery</span>
          </button>
          <button
            onClick={() => {
              setActiveTabSection('domainCharts')
              setOpenSections(prev => ({ ...prev, domainCharts: true }))
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTabSection === 'domainCharts'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Domain Charts</span>
          </button>
          <button
            onClick={() => {
              setActiveTabSection('spocTable')
              setOpenSections(prev => ({ ...prev, spocTable: true }))
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTabSection === 'spocTable'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>SPOC Analysis</span>
          </button>
          <button
            onClick={() => {
              setActiveTabSection('reqGaps')
              setOpenSections(prev => ({ ...prev, reqGaps: true }))
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              activeTabSection === 'reqGaps'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Requirement Gaps</span>
          </button>
          <button
            onClick={() => {
              setActiveTabSection('all')
              expandAll()
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              activeTabSection === 'all'
                ? 'bg-[#6B3BF6] text-white shadow-2xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Show All Sections
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            title="Expand all sections"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
            title="Collapse all sections to reduce scrolling"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Collapse All</span>
          </button>
        </div>
      </div>

      {/* 3. KEY PERFORMANCE INDICATORS TABLE (EXACT MATCH TO EXCEL ANALYSIS) */}
      {(activeTabSection === 'all' || activeTabSection === 'kpi') && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all">
          {/* Navy Header Banner with Toggle Arrow */}
          <div
            onClick={() => toggleSection('kpi')}
            className="bg-[#1B2A4A] hover:bg-[#15223c] text-white px-6 py-3.5 font-bold text-sm sm:text-base tracking-wide flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3">
              <span>{clientName} – MetaForge Delivery Gap Analysis</span>
              <span className="text-xs font-mono font-normal opacity-80 hidden sm:inline">KPI Summary Table</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-md font-mono">
                {openSections.kpi ? 'Click to Collapse' : 'Click to Expand'}
              </span>
              {openSections.kpi ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>

          {openSections.kpi && (
            <div className="overflow-x-auto animate-in fade-in duration-150">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-6 w-2/3">KPI</th>
                    <th className="py-3 px-6 w-1/3 text-right">VALUE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-900">Requirements</td>
                    <td className="py-3 px-6 text-right font-extrabold text-slate-900 tabular-nums">{metrics.totalReqs}</td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-900">Total Positions</td>
                    <td className="py-3 px-6 text-right font-extrabold text-purple-900 tabular-nums">{metrics.totalPositions}</td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-900">Total Submissions</td>
                    <td className="py-3 px-6 text-right font-extrabold text-[#2563EB] tabular-nums">{metrics.totalSubmissions}</td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-900">Submission Coverage</td>
                    <td className="py-3 px-6 text-right font-extrabold tabular-nums">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                          metrics.coveragePct >= 50
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : metrics.coveragePct >= 25
                            ? 'bg-amber-100 text-amber-900 border-amber-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {metrics.coveragePct}%
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-900">Requirements with 0 submissions</td>
                    <td className="py-3 px-6 text-right font-extrabold text-rose-700 tabular-nums">{metrics.zeroSubReqs}</td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-900">Requirements with missing/unusable domain</td>
                    <td className="py-3 px-6 text-right font-extrabold text-amber-700 tabular-nums">{metrics.missingDomainReqs}</td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-900">Requirements with non-numeric positions</td>
                    <td className="py-3 px-6 text-right font-extrabold text-slate-700 tabular-nums">{metrics.nonNumericPositions}</td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-900">Candidate interview records</td>
                    <td className="py-3 px-6 text-right font-extrabold text-slate-900 tabular-nums">{metrics.totalInterviews}</td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-900">Final selects</td>
                    <td className="py-3 px-6 text-right font-extrabold text-emerald-700 tabular-nums">{metrics.finalSelects}</td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-900">L1 rejects</td>
                    <td className="py-3 px-6 text-right font-extrabold text-rose-700 tabular-nums">{metrics.l1Rejects}</td>
                  </tr>
                  <tr className="hover:bg-purple-50/30 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-900">Awaiting / pending records</td>
                    <td className="py-3 px-6 text-right font-extrabold text-amber-700 tabular-nums">{metrics.awaitingPending}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. STANDARDIZED DOMAIN ANALYSIS TABLE */}
      {(activeTabSection === 'all' || activeTabSection === 'domainTable') && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 transition-all">
          <div
            onClick={() => toggleSection('domainTable')}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 cursor-pointer group"
          >
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 group-hover:text-[#6B3BF6] transition-colors">
                <Layers className="w-5 h-5 text-[#6B3BF6]" />
                <span>Standardized Domain Delivery Analysis ({domainAnalysisRows.length} Active Domains)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Requirements, open headcount, submissions, coverage percentage, and zero-submission count per domain.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Auto-calculated from {clientName} job demand records
              </span>
              {openSections.domainTable ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </div>

          {openSections.domainTable && (
            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl animate-in fade-in duration-150">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">STANDARDIZED DOMAIN</th>
                    <th className="py-3.5 px-4 text-center">REQUIREMENTS</th>
                    <th className="py-3.5 px-4 text-center">POSITIONS</th>
                    <th className="py-3.5 px-4 text-center">SUBMISSIONS</th>
                    <th className="py-3.5 px-4 text-center">COVERAGE %</th>
                    <th className="py-3.5 px-4 text-center">ZERO-SUBMISSION REQS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {domainAnalysisRows.map(row => (
                    <tr key={row.domain} className="hover:bg-purple-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#6B3BF6]" />
                        <span>{row.domain}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-extrabold text-slate-800 tabular-nums">
                        {row.requirements}
                      </td>

                      <td className="py-3.5 px-4 text-center font-extrabold text-purple-900 tabular-nums">
                        {row.positions}
                      </td>

                      <td className="py-3.5 px-4 text-center font-extrabold text-[#2563EB] tabular-nums">
                        {row.submissions}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border tabular-nums ${
                            row.coverage >= 50
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : row.coverage >= 25
                              ? 'bg-amber-100 text-amber-900 border-amber-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {row.coverage}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {row.zeroSubReqs > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 tabular-nums">
                            {row.zeroSubReqs} Reqs
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 tabular-nums">
                            0
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. DOMAIN PERFORMANCE CHARTS (RECHARTS) */}
      {(activeTabSection === 'all' || activeTabSection === 'domainCharts') && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 transition-all">
          <div
            onClick={() => toggleSection('domainCharts')}
            className="flex items-center justify-between border-b border-slate-100 pb-3 cursor-pointer group"
          >
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 group-hover:text-[#6B3BF6] transition-colors">
                <BarChart3 className="w-5 h-5 text-amber-600" />
                <span>Domain Performance Analytics Charts (4 Visual Reports)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Requirements count, Positions vs Submissions, Coverage ratio, and Zero-submission requirements per domain.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                {openSections.domainCharts ? 'Hide Charts' : 'Show Charts'}
              </span>
              {openSections.domainCharts ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </div>

          {openSections.domainCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-150">
              {/* Chart 1: Requirements by Domain */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#6B3BF6]" />
                    <span>Requirements Count by Domain</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">{clientName}</span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={domainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="domainShort" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip
                        formatter={(value: any) => [`${value} Reqs`, 'Requirements']}
                        labelFormatter={(lbl: any) => `Domain: ${lbl}`}
                      />
                      <Bar dataKey="requirements" fill="#6B3BF6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Positions vs Submissions by Domain */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#2563EB]" />
                    <span>Positions vs Submissions by Domain</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Grouped Comparison</span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={domainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="domainShort" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="positions" name="Open Positions" fill="#C7D2FE" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="submissions" name="Submissions Sent" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Coverage % by Domain */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-600" />
                    <span>Submission Coverage % by Domain</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-semibold">Delivery Ratio</span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={domainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="domainShort" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} unit="%" />
                      <Tooltip formatter={(val: any) => [`${val}%`, 'Coverage Ratio']} />
                      <Bar dataKey="coverage" fill="#10B981" radius={[6, 6, 0, 0]}>
                        {domainChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.coverage >= 50 ? '#10B981' : entry.coverage >= 25 ? '#F59E0B' : '#EF4444'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Zero-Submission Requirements by Domain */}
              <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                  <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Zero-Submission Requirements by Domain</span>
                  </h4>
                  <span className="text-[10px] text-rose-700 font-bold">Attention Needed</span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={domainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="domainShort" angle={-25} textAnchor="end" interval={0} tick={{ fontSize: 10, fill: '#64748B' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748B' }} />
                      <Tooltip formatter={(val: any) => [`${val} Reqs`, 'Zero Submissions']} />
                      <Bar dataKey="zeroSubReqs" fill="#EF4444" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. SPOC / OWNERSHIP ANALYSIS SECTION */}
      {(activeTabSection === 'all' || activeTabSection === 'spocTable') && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 transition-all">
          <div
            onClick={() => toggleSection('spocTable')}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 cursor-pointer group"
          >
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 group-hover:text-[#6B3BF6] transition-colors">
                <UserCheck className="w-5 h-5 text-[#6B3BF6]" />
                <span>SPOC / Account Ownership Delivery Analysis</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Breakdown of single point of contacts assigned to {clientName} requirements and their coverage metrics.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[#6B3BF6] font-bold">
                {spocAnalysisRows.length} Active SPOC Owners
              </span>
              {openSections.spocTable ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </div>

          {openSections.spocTable && (
            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl animate-in fade-in duration-150">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">SPOC OWNER</th>
                    <th className="py-3.5 px-4 text-center">ASSIGNED REQS</th>
                    <th className="py-3.5 px-4 text-center">POSITIONS</th>
                    <th className="py-3.5 px-4 text-center">SUBMISSIONS</th>
                    <th className="py-3.5 px-4 text-center">COVERAGE %</th>
                    <th className="py-3.5 px-4 text-center">ZERO-SUB REQS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {spocAnalysisRows.map(sRow => (
                    <tr key={sRow.spoc} className="hover:bg-purple-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-purple-100 text-[#6B3BF6] font-bold flex items-center justify-center text-xs">
                          {sRow.spoc.substring(0, 1)}
                        </div>
                        <span>SPOC: {sRow.spoc}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-extrabold text-slate-800 tabular-nums">
                        {sRow.requirements}
                      </td>

                      <td className="py-3.5 px-4 text-center font-extrabold text-purple-900 tabular-nums">
                        {sRow.positions}
                      </td>

                      <td className="py-3.5 px-4 text-center font-extrabold text-[#2563EB] tabular-nums">
                        {sRow.submissions}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold border tabular-nums ${
                            sRow.coverage >= 50
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : sRow.coverage >= 25
                              ? 'bg-amber-100 text-amber-900 border-amber-200'
                              : 'bg-rose-100 text-rose-800 border-rose-200'
                          }`}
                        >
                          {sRow.coverage}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {sRow.zeroSubReqs > 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 tabular-nums">
                            {sRow.zeroSubReqs} Reqs
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 tabular-nums">
                            0
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 9. REQUIREMENT GAP ANALYSIS (ATTENTION NEEDED LIST) */}
      {(activeTabSection === 'all' || activeTabSection === 'reqGaps') && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4 transition-all">
          <div
            onClick={() => toggleSection('reqGaps')}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4 cursor-pointer group"
          >
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 group-hover:text-[#6B3BF6] transition-colors">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                <span>Requirement Gap Analysis ({filteredRequirements.length} Reqs Monitored)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Click any requirement row below to inspect job details and assign recruiter bandwidth.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-rose-700 font-bold bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
                {metrics.zeroSubReqs} Zero-Submission Gaps
              </span>
              {openSections.reqGaps ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </div>

          {openSections.reqGaps && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">REQUIREMENT TITLE & ID</th>
                      <th className="py-3.5 px-4">STANDARDIZED DOMAIN</th>
                      <th className="py-3.5 px-4 text-center">POSITIONS</th>
                      <th className="py-3.5 px-4 text-center">SUBMISSIONS</th>
                      <th className="py-3.5 px-4">SPOC OWNER</th>
                      <th className="py-3.5 px-4">GAP DIAGNOSTIC FLAG</th>
                      <th className="py-3.5 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {paginatedRequirements.map(req => (
                      <tr
                        key={req.id}
                        onClick={() => onSelectRequirement && onSelectRequirement(req.id)}
                        className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900 group-hover:text-[#6B3BF6] transition-colors">
                            {req.title}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{req.id}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-[#6B3BF6] border border-purple-200">
                            {req.domain}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-extrabold text-slate-900 tabular-nums">
                          {req.positions}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {req.submissions === 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-200 tabular-nums">
                              0 Submissions
                            </span>
                          ) : (
                            <span className="font-extrabold text-[#2563EB] tabular-nums">
                              {req.submissions}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-700">
                          {req.spoc}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1">
                            {req.submissions === 0 && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                🔴 Zero Submissions
                              </span>
                            )}
                            {req.hasMissingDomain && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 text-amber-900 border border-amber-200">
                                🟡 Missing Domain
                              </span>
                            )}
                            {req.hasNonNumericPositions && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                                ⚪ Non-Numeric Pos
                              </span>
                            )}
                            {req.submissions > 0 && !req.hasMissingDomain && !req.hasNonNumericPositions && (
                              <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                🟢 On Track
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              if (onSelectRequirement) onSelectRequirement(req.id)
                            }}
                            className="px-3 py-1 bg-purple-50 hover:bg-purple-100 text-[#6B3BF6] text-xs font-bold rounded-xl border border-purple-200 transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>View Req</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 10-ITEM PAGINATION FOOTER */}
              <PaginationFooter
                currentPage={gapCurrentPage}
                totalPages={gapTotalPages}
                totalItems={filteredRequirements.length}
                pageSize={gapPageSize}
                onPageChange={setGapCurrentPage}
                onPageSizeChange={size => {
                  setGapPageSize(size)
                  setGapCurrentPage(1)
                }}
                pageSizeOptions={[10, 20, 50]}
                itemLabel="requirement gap items"
              />
            </div>
          )}
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
