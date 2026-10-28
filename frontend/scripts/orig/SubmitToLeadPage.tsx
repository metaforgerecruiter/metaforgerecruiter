import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  X,
  FileText,
  Building,
  Mail,
  User,
  Layers,
  Sparkles,
  ChevronDown,
  RotateCcw,
  GripVertical,
  Eye,
  EyeOff,
  Send,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react'

import { Requirement } from '../../types'
import {
  getForwardRequestByReq,
  createOrUpdateForwardRequest,
  approveForwardRequest,
  rejectForwardRequest,
  ForwardRequest,
} from '../../data/forwardRequestsStore'
import { checkDuplicateSubmission } from '../../data/submissionsStore'

interface SubmitToLeadPageProps {
  selectedCandidates?: any[]
  requirement?: Requirement | null
  role?: string
  onBack: () => void
  onSubmitSuccess?: () => void
}

export function SubmitToLeadPage({
  selectedCandidates = [],
  requirement = null,
  role,
  onBack,
  onSubmitSuccess,
}: SubmitToLeadPageProps) {
  const storedRole = typeof window !== 'undefined' ? localStorage.getItem('metaforge_user_role') : null
  const activeRole = role || storedRole || 'recruiter'
  const normalizedRole = (activeRole || '').toLowerCase()
  const isSuperAdminOrAdmin = normalizedRole === 'superadmin' || normalizedRole === 'admin' || normalizedRole === 'devteam'
  const isLead = normalizedRole === 'lead' || normalizedRole.includes('lead') || normalizedRole === 'team lead' || normalizedRole === 'team_lead'
  const isLeadOrAdmin = isLead || isSuperAdminOrAdmin

  const currentReqId = requirement?.id || 'REQ-2026-08-12-001'

  // Sync forward request from store
  const [forwardReq, setForwardReq] = useState<ForwardRequest | undefined>(() =>
    getForwardRequestByReq(currentReqId)
  )

  // Destination Checkboxes (Forward to client loop is DEFAULT as requested)
  const [submitToLeadChecked, setSubmitToLeadChecked] = useState(true)
  const [forwardLoopChecked, setForwardLoopChecked] = useState(true)

  // Sync state with forwardRequestsStore
  useEffect(() => {
    const handleSync = () => {
      const updated = getForwardRequestByReq(currentReqId)
      setForwardReq(updated)
    }
    handleSync()
    window.addEventListener('forward_requests_updated', handleSync)
    return () => window.removeEventListener('forward_requests_updated', handleSync)
  }, [currentReqId])

  const isLeadApproved = forwardReq?.status === 'approved'
  const isApprovalRequested = forwardReq?.status === 'pending'
  // Client Tracker Preset Definitions (Matching exact user screenshot & rules)
  const CLIENT_TRACKER_PRESETS: Record<string, { headerColor: string; columns: string[]; subtitle: string }> = {
    'METAFORGE (INTERNAL)': {
      headerColor: '#C5E0B4', // Light Sage Green from user screenshot
      subtitle: 'Metaforge Internal Layout: Light Sage Green header (#C5E0B4) with 18 candidate tracking fields.',
      columns: [
        'Sl No',
        'Submission Date',
        'Skillset',
        'Candidate Name',
        'Contact Number',
        'Email id',
        'Total Yrs of Exp',
        'Relevant Exp',
        'Current Company',
        'Current CTC',
        'Expected CTC/Rate card',
        'Notice period',
        'Current Location',
        'Preferred Location',
        'Availability for Interview',
        'Reason',
        'Offer in Hand',
        'Linkedin URL',
      ],
    },
    'LTTS / L&T': {
      headerColor: '#FFB800', // Bright Golden Amber / Orange Yellow from user screenshot
      subtitle: 'LTTS / L&T Layout: Bright Golden Amber header (#FFB800) with 17 candidate tracking fields.',
      columns: [
        'Sl.No',
        'Vendor Name',
        'BU/IS',
        'Position/ Title',
        'Skill',
        'Resumes sent Date (DDMMYY)',
        'Full Name of the candidate',
        'Last Full Time Qualification',
        'MOBILE NO',
        'Mail ID',
        'NP(Days)',
        'Total Exp',
        'Relevant Exp',
        'Current Location',
        'Job Location',
        'Current Organization',
        'Rate per Month',
      ],
    },
    'Continental Automotive': {
      headerColor: '#FCE4D6', // Soft Peach
      subtitle: 'Continental Automotive Layout: Light peach header row (#FCE4D6) with technical assessment fields.',
      columns: [
        'Sl No',
        'Candidate Name',
        'Skillset',
        'Total Yrs of Exp',
        'Relevant Exp',
        'Current Location',
        'Current CTC',
        'Expected CTC/Rate card',
        'Notice period',
        'Contact Number',
        'Email id',
      ],
    },
    'Bosch Global': {
      headerColor: '#D9E1F2', // Soft Blue
      subtitle: 'Bosch Global Layout: Soft blue header row (#D9E1F2) with Bosch sourcing tracker format.',
      columns: [
        'Sl No',
        'Candidate Name',
        'Skillset',
        'Total Yrs of Exp',
        'Current Company',
        'Current Location',
        'Notice period',
        'Expected CTC/Rate card',
        'Contact Number',
        'Email id',
      ],
    },
    'Accenture Enterprise': {
      headerColor: '#7C5CFC', // Medium Purple / Violet from user screenshot
      subtitle: 'Accenture Layout: Medium Purple header (#7C5CFC) with 35 vendor Beeline tracking fields & Govt ID verification.',
      columns: [
        'Sl. NO',
        'RV ID',
        'Date of Submission',
        'Candidate DOB',
        'Req ID',
        'Beeline ID',
        'First Name',
        'Last Name',
        'Contact Number',
        'Email ID',
        'Gender',
        'Primary Skill',
        'Total Experience',
        'Relevant Experience',
        'Current Location',
        'Job Location',
        'Notice Period in days',
        'Acc Ex Emp/Cont',
        'Ex Employee- EMP ID',
        'Current CTC (Monthly)',
        'Exp CTC (Monthly)',
        'Mark up %',
        'Final Bill Rate Monthly (Exp CTC + mark up)',
        'Supplier name',
        'Current Employer Name',
        'Available Documents',
        'Previous Employer Name',
        'Available Documents (Prev)',
        'Highest Education',
        'Name of college for highest education',
        'Name of University for highest education',
        'Technical Evaluation',
        'Technical Assessment proof attached in Resume',
        'PAN Card Number',
        'OT Amount',
      ],
    },
    'ITC Infotech': {
      headerColor: '#FFFF00', // Pure Vibrant Yellow from user screenshot
      subtitle: 'ITC Infotech Layout: Pure Yellow header (#FFFF00) with 18 candidate tracking & SO fields.',
      columns: [
        'S.No',
        'Skill',
        'Candidate Name',
        'Total experience',
        'Relevant experience',
        'Candidate Mobile Number',
        'Email ID',
        'Current Payroll Company',
        'CTC',
        'ECTC',
        'Official Notice Period /Serving NP (LWD Date)',
        'Current Location',
        'Work Location',
        'Highest Education',
        'Interview date',
        'Interview time',
        'SO Number',
        'Status',
      ],
    },
  }

  const [clientName, setClientName] = useState(
    requirement?.client || 'METAFORGE (INTERNAL)'
  )

  // Thread Subject
  const [threadSubject, setThreadSubject] = useState(
    requirement
      ? `${requirement.id} — ${requirement.title} (${requirement.client})`
      : 'Candidate Profile Submission'
  )

  // From Recruiter
  const [recruiterName, setRecruiterName] = useState('Harish Gadipally')
  const [recruiterEmail, setRecruiterEmail] = useState('harish.g@metaforgeit.com')

  // Recipients
  const [toRecipients, setToRecipients] = useState([
    'Nikitha.S@Ltts.com',
    'Deepashree.Bc_ext@Ltts.com',
    'Bowya.Bowya_ext@Ltts.com',
  ])
  const [ccRecipients, setCcRecipients] = useState([
    'Ashwini.Kudi@Ltts.com',
    'Kallol.Chakraborty@Ltts.com',
  ])
  const [newToInput, setNewToInput] = useState('')
  const [newCcInput, setNewCcInput] = useState('')

  // Lead Email & Introduction (Default Mandatory for Recruiters, Counts as 1 Submission)
  const [leadEmail, setLeadEmail] = useState('lead.review@metaforgeit.com')
  const [emailGreeting, setEmailGreeting] = useState('Dear Lead & Hiring Team,')
  const [introduction, setIntroduction] = useState(
    'I hope you are doing well.\n\nPlease find below the candidate profile submitted for your review against the discussed requirement.\n\nKindly review the profile and share your feedback. We will be happy to coordinate the next steps based on your evaluation.'
  )

  const [confirmForwardChecked, setConfirmForwardChecked] = useState(true)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Custom Column & Tracker Table State
  const defaultPreset = CLIENT_TRACKER_PRESETS['METAFORGE (INTERNAL)']

  const [columnList, setColumnList] = useState<string[]>(defaultPreset.columns)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set())
  const [customColName, setCustomColName] = useState('')
  const [customColPosition, setCustomColPosition] = useState('At start')
  const [headerColor, setHeaderColor] = useState(defaultPreset.headerColor)

  // Drag & Drop State for Column Layout Reordering (Fail-Safe)
  const isDraggingRef = useRef<boolean>(false)
  const draggedColIndexRef = useRef<number | null>(null)
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null)
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null)
  const [selectedColIndex, setSelectedColIndex] = useState<number | null>(null)

  const handleDragStart = (e: React.DragEvent, index: number) => {
    isDraggingRef.current = true
    draggedColIndexRef.current = index
    setDraggedColIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColIndex !== index) {
      setDragOverColIndex(index)
    }
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColIndex !== index) {
      setDragOverColIndex(index)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    const rawData = e.dataTransfer.getData('text/plain')
    let fromIndex = draggedColIndexRef.current

    if (fromIndex === null && rawData) {
      const parsed = parseInt(rawData, 10)
      if (!isNaN(parsed)) fromIndex = parsed
    }

    if (fromIndex !== null && !isNaN(fromIndex) && fromIndex !== dropIndex) {
      const colName = columnList[fromIndex]
      setColumnList(prev => {
        const next = [...prev]
        const [movedItem] = next.splice(fromIndex!, 1)
        next.splice(dropIndex, 0, movedItem)
        return next
      })
      showToast(`Placed "${colName}" at position ${dropIndex + 1}!`)
    }

    draggedColIndexRef.current = null
    setDraggedColIndex(null)
    setDragOverColIndex(null)
  }

  const handleDragEnd = () => {
    draggedColIndexRef.current = null
    setDraggedColIndex(null)
    setDragOverColIndex(null)
    setTimeout(() => {
      isDraggingRef.current = false
    }, 200)
  }

  const handleChipClick = (index: number) => {
    if (isDraggingRef.current) return

    if (selectedColIndex === null) {
      setSelectedColIndex(index)
      showToast(`Picked up "${columnList[index]}" — click target position to place it!`)
    } else if (selectedColIndex === index) {
      setSelectedColIndex(null)
    } else {
      setColumnList(prev => {
        const next = [...prev]
        const [moved] = next.splice(selectedColIndex, 1)
        next.splice(index, 0, moved)
        return next
      })
      showToast(`Placed column at position ${index + 1}!`)
      setSelectedColIndex(null)
    }
  }

  const moveColumnLeft = (index: number) => {
    if (index <= 0) return
    setColumnList(prev => {
      const next = [...prev]
      const [col] = next.splice(index, 1)
      next.splice(index - 1, 0, col)
      return next
    })
  }

  const moveColumnRight = (index: number) => {
    if (index >= columnList.length - 1) return
    setColumnList(prev => {
      const next = [...prev]
      const [col] = next.splice(index, 1)
      next.splice(index + 1, 0, col)
      return next
    })
  }

  // Tracker Table Rows (100% Manually Editable)
  const [trackerRows, setTrackerRows] = useState<Record<string, string>[]>(() => {
    if (selectedCandidates && selectedCandidates.length > 0) {
      return selectedCandidates.map((c, idx) => ({
        'Sl No': String(idx + 1),
        'Submission Date': '19/08/2026',
        'Skillset': requirement?.skills?.join(', ') || 'QA Lead, Selenium, Automation Frameworks',
        'Candidate Name': c.name || 'Priyanka Sharma',
        'Contact Number': c.phone || '+91 98210 44905',
        'Email id': c.email || 'priyanka.sharma@gmail.com',
        'Total Yrs of Exp': c.totalExperience || '11 Years 3 Months',
        'Relevant Exp': c.relevantExperience || '9 Years',
        'Current Company': c.currentCompany || 'Cognizant Technology Solutions',
        'Current CTC': c.currentCtc || '18.5 LPA',
        'Expected CTC/Rate card': c.expectedCtc || '25 LPA',
        'Notice period': c.noticePeriod || '30 Days',
        'Current Location': c.currentLocation || 'Bangalore',
        'Preferred Location': c.preferredLocation || 'Bangalore / Hybrid',
        'Availability for Interview': c.interviewAvailability || 'Available weekdays after 4 PM',
        'Reason': c.reasonForChange || 'Career Advancement & Technical Leadership',
        'Offer in Hand': c.offerInHand || 'Yes (28 LPA from Capgemini)',
        'Linkedin URL': 'https://linkedin.com/in/priyanka-sharma',
      }))
    }
    return [
      {
        'Sl No': '1',
        'Submission Date': '19/08/2026',
        'Skillset': requirement?.skills?.join(', ') || 'QA Lead, Selenium, Test Management',
        'Candidate Name': 'Priyanka Sharma',
        'Contact Number': '+91 98210 44905',
        'Email id': 'priyanka.sharma@gmail.com',
        'Total Yrs of Exp': '11 Years 3 Months',
        'Relevant Exp': '9 Years',
        'Current Company': 'Cognizant Technology Solutions',
        'Current CTC': '18.5 LPA',
        'Expected CTC/Rate card': '25 LPA',
        'Notice period': '30 Days',
        'Current Location': 'Bangalore',
        'Preferred Location': 'Bangalore / Hybrid',
        'Availability for Interview': 'Available weekdays after 4 PM',
        'Reason': 'Career Advancement',
        'Offer in Hand': 'Yes (28 LPA from Capgemini)',
        'Linkedin URL': 'https://linkedin.com/in/priyanka-sharma',
      },
    ]
  })

  const handleClientChange = (newClient: string) => {
    setClientName(newClient)
    const preset = CLIENT_TRACKER_PRESETS[newClient]
    if (preset) {
      setHeaderColor(preset.headerColor)
      setColumnList(preset.columns)
      setHiddenColumns(new Set())

      setTrackerRows(prev =>
        prev.map((r, idx) => {
          const updatedRow: Record<string, string> = {}
          preset.columns.forEach(col => {
            if (col === 'S.No' || col === 'Sl. NO' || col === 'Sl No' || col === 'Sl.No') updatedRow[col] = String(idx + 1)
            else if (col === 'Vendor Name') updatedRow[col] = 'MetaForge'
            else if (col === 'BU/IS') updatedRow[col] = 'Engineering'
            else if (col === 'Position/ Title') updatedRow[col] = newClient === 'LTTS / L&T' ? 'Teamcenter Admin' : (requirement?.title || 'Senior Software Engineer')
            else if (col === 'Skill') updatedRow[col] = newClient === 'ITC Infotech' ? 'Dot Net Angular/React' : newClient === 'LTTS / L&T' ? 'Teamcenter Administration 5.0 Years, Teamcenter RAC 5.0 Years, Active Workspace (AWC) 4.0 Years, BMIDE Customization 4.0 Years, Workflow Designer 4.0 Years, Access Manager 4.0 Years, Multisite Setup 3.5 Years, Deployment Center 3.2 Years, CI/CD (Jenkins / Azure DevOps) 3.0 Years, FMS / TcServer Setup 3.1 Years, Import/Export / BNU 2.0 Years' : (requirement?.skills?.join(', ') || 'Java, React, Automation')
            else if (col === 'Resumes sent Date (DDMMYY)') updatedRow[col] = newClient === 'LTTS / L&T' ? '16/3/2026' : '19/08/2026'
            else if (col === 'Full Name of the candidate') updatedRow[col] = newClient === 'LTTS / L&T' ? 'HARISH C. MITKARI' : (r['Full Name of the candidate'] || r['Candidate Name'] || selectedCandidates[idx]?.name || 'Priyanka Sharma')
            else if (col === 'Candidate Name') updatedRow[col] = newClient === 'ITC Infotech' ? 'Manjeet Kumar' : (r['Candidate Name'] || r['Full Name of the candidate'] || selectedCandidates[idx]?.name || 'Priyanka Sharma')
            else if (col === 'Total experience') updatedRow[col] = '8.0 Years'
            else if (col === 'Relevant experience') updatedRow[col] = 'Cloud Dotnet Core - 4.0 Years, Web API - 4.0 Years, Cloud Native - 2.0 Years, Angular - 1.0 Years, Rest API - 2.0 Years'
            else if (col === 'Candidate Mobile Number') updatedRow[col] = '9625302940'
            else if (col === 'Current Payroll Company') updatedRow[col] = 'USAFect Inc'
            else if (col === 'CTC') updatedRow[col] = '18.0 LPA'
            else if (col === 'ECTC') updatedRow[col] = '22.0 LPA'
            else if (col === 'Official Notice Period /Serving NP (LWD Date)') updatedRow[col] = 'Immediate (LWD: 15-Dec-2025)'
            else if (col === 'Work Location') updatedRow[col] = 'Bengaluru'
            else if (col === 'Interview date') updatedRow[col] = '—'
            else if (col === 'Interview time') updatedRow[col] = '—'
            else if (col === 'SO Number') updatedRow[col] = 'PCIIL_0000241067_1'
            else if (col === 'Status') updatedRow[col] = 'Submitted'
            else if (col === 'Last Full Time Qualification') updatedRow[col] = newClient === 'LTTS / L&T' ? 'B.Tech' : 'B.E. Computer Science'
            else if (col === 'MOBILE NO') updatedRow[col] = newClient === 'LTTS / L&T' ? '7798829401' : '+91 98210 44905'
            else if (col === 'Mail ID') updatedRow[col] = newClient === 'LTTS / L&T' ? 'harish.mitkari@gmail.com' : 'priyanka.sharma@gmail.com'
            else if (col === 'NP(Days)') updatedRow[col] = newClient === 'LTTS / L&T' ? 'Official NP is 30 Days, Negotiable up to 15 Days' : '30 Days'
            else if (col === 'Total Exp') updatedRow[col] = newClient === 'LTTS / L&T' ? '5.2 Years' : '11 Years 3 Months'
            else if (col === 'Relevant Exp') updatedRow[col] = newClient === 'LTTS / L&T' ? '5.2 Years' : '9 Years'
            else if (col === 'Current Location') updatedRow[col] = newClient === 'ITC Infotech' ? 'New Delhi' : newClient === 'LTTS / L&T' ? 'Pune' : 'Bangalore'
            else if (col === 'Job Location') updatedRow[col] = newClient === 'LTTS / L&T' ? 'Chennai' : 'Bangalore / Hybrid'
            else if (col === 'Current Organization') updatedRow[col] = newClient === 'LTTS / L&T' ? 'MetaForge Partner' : 'Cognizant Technology Solutions'
            else if (col === 'Rate per Month') updatedRow[col] = newClient === 'LTTS / L&T' ? '135000+Taxes PM' : '25 LPA'
            else if (col === 'RV ID') updatedRow[col] = `RV-${8821 + idx}`
            else if (col === 'Date of Submission' || col === 'Submission Date') updatedRow[col] = '19/08/2026'
            else if (col === 'Candidate DOB') updatedRow[col] = '14/05/1993'
            else if (col === 'Req ID') updatedRow[col] = requirement?.id || 'REQ-2026-08-12-001'
            else if (col === 'Beeline ID') updatedRow[col] = `BL-${994102 + idx}`
            else if (col === 'First Name') updatedRow[col] = (r['Candidate Name'] || selectedCandidates[idx]?.name || 'Priyanka Sharma').split(' ')[0]
            else if (col === 'Last Name') updatedRow[col] = (r['Candidate Name'] || selectedCandidates[idx]?.name || 'Priyanka Sharma').split(' ')[1] || 'Sharma'
            else if (col === 'Contact Number') updatedRow[col] = r['Contact Number'] || r['MOBILE NO'] || selectedCandidates[idx]?.phone || '+91 98210 44905'
            else if (col === 'Email ID' || col === 'Email id') updatedRow[col] = newClient === 'ITC Infotech' ? 'manjeet.techacc9597@gmail.com' : (r['Email ID'] || r['Email id'] || r['Mail ID'] || selectedCandidates[idx]?.email || 'priyanka.sharma@gmail.com')
            else if (col === 'Gender') updatedRow[col] = 'Female'
            else if (col === 'Primary Skill' || col === 'Skillset') updatedRow[col] = r['Primary Skill'] || r['Skillset'] || r['Skill'] || requirement?.skills?.join(', ') || 'Java, React, SQL, Selenium'
            else if (col === 'Total Experience' || col === 'Total Yrs of Exp') updatedRow[col] = '11 Years 3 Months'
            else if (col === 'Relevant Experience') updatedRow[col] = '9 Years'
            else if (col === 'Preferred Location') updatedRow[col] = 'Bangalore / Hybrid'
            else if (col === 'Notice Period in days' || col === 'Notice period') updatedRow[col] = '30 Days'
            else if (col === 'Acc Ex Emp/Cont') updatedRow[col] = 'No'
            else if (col === 'Ex Employee- EMP ID') updatedRow[col] = '—'
            else if (col === 'Current CTC (Monthly)' || col === 'Current CTC') updatedRow[col] = '₹1,54,166'
            else if (col === 'Exp CTC (Monthly)' || col === 'Expected CTC/Rate card') updatedRow[col] = '₹2,08,333'
            else if (col === 'Mark up %') updatedRow[col] = '15%'
            else if (col === 'Final Bill Rate Monthly (Exp CTC + mark up)') updatedRow[col] = '₹2,39,583'
            else if (col === 'Supplier name') updatedRow[col] = 'MetaForge IT'
            else if (col === 'Current Employer Name' || col === 'Current Company') updatedRow[col] = 'Cognizant Technology Solutions'
            else if (col === 'Available Documents') updatedRow[col] = 'PAN, Aadhar, Payslips, Relieving Letter'
            else if (col === 'Previous Employer Name') updatedRow[col] = 'TCS Limited'
            else if (col === 'Available Documents (Prev)') updatedRow[col] = 'Experience Letter, Form 16'
            else if (col === 'Highest Education') updatedRow[col] = newClient === 'ITC Infotech' ? 'MCA' : 'B.E. Computer Science'
            else if (col === 'Name of college for highest education') updatedRow[col] = 'University College of Engineering'
            else if (col === 'Name of University for highest education') updatedRow[col] = 'Osmania University'
            else if (col === 'Technical Evaluation') updatedRow[col] = 'Passed - L1/L2 Technical'
            else if (col === 'Technical Assessment proof attached in Resume') updatedRow[col] = 'Yes (Attached in Resume PDF)'
            else if (col === 'PAN Card Number') updatedRow[col] = 'ABCDE1234F'
            else if (col === 'OT Amount') updatedRow[col] = 'As per Accenture Policy'
            else if (col === 'Availability for Interview') updatedRow[col] = 'Available weekdays after 4 PM'
            else if (col === 'Reason') updatedRow[col] = 'Career Advancement & Leadership'
            else if (col === 'Offer in Hand') updatedRow[col] = 'Yes (28 LPA from Capgemini)'
            else if (col === 'Linkedin URL') updatedRow[col] = 'https://linkedin.com/in/priyanka-sharma'
            else updatedRow[col] = r[col] || ''
          })
          return updatedRow
        })
      )
      showToast(`Loaded tracker preset layout for ${newClient}!`)
    }
  }

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const handleAddToRecipient = () => {
    if (newToInput.trim() && newToInput.includes('@')) {
      setToRecipients([...toRecipients, newToInput.trim()])
      setNewToInput('')
    }
  }

  const handleAddCcRecipient = () => {
    if (newCcInput.trim() && newCcInput.includes('@')) {
      setCcRecipients([...ccRecipients, newCcInput.trim()])
      setNewCcInput('')
    }
  }

  const handleRemoveTo = (email: string) => {
    setToRecipients(toRecipients.filter(e => e !== email))
  }

  const handleRemoveCc = (email: string) => {
    setCcRecipients(ccRecipients.filter(e => e !== email))
  }

  const toggleColumnVisibility = (colName: string) => {
    const next = new Set(hiddenColumns)
    if (next.has(colName)) next.delete(colName)
    else next.add(colName)
    setHiddenColumns(next)
  }

  const handleInsertCustomColumn = () => {
    if (!customColName.trim()) return
    const col = customColName.trim()
    if (columnList.includes(col)) {
      showToast(`Column "${col}" already exists!`)
      return
    }

    if (customColPosition === 'At start') {
      setColumnList([col, ...columnList])
    } else {
      setColumnList([...columnList, col])
    }

    setTrackerRows(prev =>
      prev.map(row => ({
        ...row,
        [col]: '',
      }))
    )

    setCustomColName('')
    showToast(`Custom column "${col}" inserted into tracker!`)
  }

  const handleUpdateCell = (rowIndex: number, colName: string, value: string) => {
    setTrackerRows(prev => {
      const next = [...prev]
      next[rowIndex] = { ...next[rowIndex], [colName]: value }
      return next
    })
  }

  const handleAddTrackerRow = () => {
    const newRow: Record<string, string> = {}
    columnList.forEach(col => {
      if (col === 'Sl.No') newRow[col] = String(trackerRows.length + 1)
      else if (col === 'Vendor Name') newRow[col] = 'MetaForge'
      else newRow[col] = ''
    })
    setTrackerRows([...trackerRows, newRow])
    showToast('New editable row added to submission tracker!')
  }

  // Duplicate Check computation for attached candidates / tracker rows
  const duplicateCheckResults = useMemo(() => {
    if (!trackerRows || trackerRows.length === 0) return []
    return trackerRows.map(row => {
      const candidateName = row['Candidate Name'] || row['Full Name of the candidate'] || row['First Name']
      const email = row['Email id'] || row['Mail ID'] || row['Email ID']
      const phone = row['Contact Number'] || row['MOBILE NO'] || row['Candidate Mobile Number']
      const candidateId = row['Sl No'] || row['RV ID']
      return {
        row,
        candidateName: candidateName || 'Selected Candidate',
        ...checkDuplicateSubmission(currentReqId, {
          email,
          phone,
          candidateId,
          name: candidateName,
        }),
      }
    })
  }, [trackerRows, currentReqId])

  const hasDuplicateSubmission = duplicateCheckResults.some((r: any) => r.isDuplicate)
  const firstDuplicate = duplicateCheckResults.find((r: any) => r.isDuplicate)

  const handleSubmitFinal = () => {
    if (hasDuplicateSubmission && firstDuplicate) {
      showToast(`⚠️ Duplicate Submission: Candidate "${firstDuplicate.candidateName}" has already been submitted for this requirement. Cannot submit!`)
      return
    }
    showToast(`Forwarded candidate to client loop (${requirement?.client || 'Client Account'}) — Recorded submission successfully!`)
    if (onSubmitSuccess) {
      setTimeout(() => onSubmitSuccess(), 1200)
    } else {
      setTimeout(() => onBack(), 1200)
    }
  }

  const visibleColumns = columnList.filter(col => !hiddenColumns.has(col))

  return (
    <div className="space-y-6 w-full pb-24 font-sans text-slate-800 animate-in fade-in duration-200">
      {/* 1. TOP NAVIGATION HEADER */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
        <button
          onClick={onBack}
          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer flex items-center justify-center border border-slate-200"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submission to Client</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit candidates for <strong className="text-slate-800">TPC - Requirement - C# Automation - Bangalore /Mysore - Embedded</strong> at Kallol.Chakraborty@Ltts.com
          </p>
        </div>
      </div>

      {/* 2. CARD 1: SUBMISSION DESTINATION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
        <div>
          <h3 className="text-base font-extrabold text-slate-900">Submission destination</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Forward candidate(s) directly in the client email loop.
          </p>
        </div>

        {/* CHECKBOX CARD (Forward to client loop is DEFAULT & MANDATORY) */}
        <div className="grid grid-cols-1 gap-4">
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/90 rounded-2xl flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0"
              />
              <div className="truncate">
                <span className="font-extrabold text-slate-900">Forward to client loop</span>
                <span className="text-slate-500 text-[11px] ml-1.5 truncate hidden sm:inline">(Reply in client/DL thread)</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded-md text-[10px] font-extrabold uppercase tracking-wider">Mandatory Default</span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-extrabold">1 Submission</span>
            </div>
          </div>
        </div>
      </div>
        {/* EMAIL THREAD SETUP & PICTURE SENDING INFORMATION SECTION */}
        {forwardLoopChecked && (
          <div className="space-y-6 pt-2 animate-in fade-in duration-200 w-full">
              {/* HOW THE EMAIL LOOP CONNECTS BOX */}
              <div className="bg-blue-50/50 border border-blue-200/80 rounded-2xl p-4 text-xs text-slate-700 space-y-1.5">
                <span className="font-extrabold text-blue-900 block mb-1">How the email loop connects</span>
                <p className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Auto-ingested requirements</strong> — the app stores the Microsoft Graph message ID from the <span className="text-emerald-700 underline font-bold">linked mailbox message (ready)</span>.</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Manually created requirements</strong> — paste the exact original subject below and click <strong>Find email thread</strong>. The app searches <span className="font-mono text-slate-900">recruitment.application@metaforgeit.com</span> and saves the link on this requirement.</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>On forward</strong> — the app calls Microsoft Graph <span className="font-mono text-slate-900">createReplyAll</span> on that message so your submission appears in the same client/DL thread (not a new email).</span>
                </p>
              </div>

              {/* THREAD SUBJECT */}
              <div>
                <label className="block text-slate-700 font-bold text-xs mb-1">THREAD SUBJECT</label>
                <input
                  type="text"
                  value={threadSubject}
                  onChange={e => setThreadSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-blue-50/30 border border-blue-200 rounded-xl text-xs font-semibold text-blue-950 focus:outline-none focus:border-blue-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Pre-filled from the original requirement. Edits apply to this reply; the message stays in the same email thread.
                </span>
              </div>

              {/* FROM RECRUITER GREEN BOX */}
              <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-4 space-y-3">
                <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                  FROM Recruiter sending this submission
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1">Display name</label>
                    <input
                      type="text"
                      value={recruiterName}
                      onChange={e => setRecruiterName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold text-xs mb-1">Reply-to email</label>
                    <input
                      type="email"
                      value={recruiterEmail}
                      onChange={e => setRecruiterEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  Clients see <strong className="text-slate-800">{recruiterName}</strong> as the sender. Messages are delivered via <span className="font-mono text-slate-800">recruitment.application@metaforgeit.com</span>. When the client clicks <strong>Reply</strong>, the response goes to your reply-to email. <strong>Reply All</strong> keeps everyone in the original thread plus you on CC.
                </p>
              </div>

              {/* RECIPIENTS TO / CC / BCC CHIPS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {/* TO Column */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">TO ({toRecipients.length})</span>
                  </div>
                  <div className="space-y-1.5 min-h-[90px]">
                    {toRecipients.map(e => (
                      <div key={e} className="flex items-center justify-between px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
                        <span>{e}</span>
                        <button onClick={() => handleRemoveTo(e)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="email"
                      placeholder="Add email..."
                      value={newToInput}
                      onChange={e => setNewToInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <button onClick={handleAddToRecipient} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer">
                      + Add
                    </button>
                  </div>
                </div>

                {/* CC Column */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-900">CC ({ccRecipients.length})</span>
                  </div>
                  <div className="space-y-1.5 min-h-[90px]">
                    {ccRecipients.map(e => (
                      <div key={e} className="flex items-center justify-between px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
                        <span>{e}</span>
                        <button onClick={() => handleRemoveCc(e)} className="text-slate-400 hover:text-slate-600 font-bold">&times;</button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="email"
                      placeholder="Add email..."
                      value={newCcInput}
                      onChange={e => setNewCcInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <button onClick={handleAddCcRecipient} className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer">
                      + Add
                    </button>
                  </div>
                </div>

                {/* BCC Column */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                  <span className="text-xs font-extrabold text-slate-900">BCC</span>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400 my-auto">
                    Drop recipients here
                  </div>
                  <div className="flex gap-2 pt-1">
                    <input
                      type="email"
                      placeholder="Add email..."
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <button className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer">
                      + Add
                    </button>
                  </div>
                </div>
              </div>
          </div>
        )}

      {/* 3. CARD 2: LEAD REVIEW EMAIL (COMPACT & SIMPLE) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-slate-900">Lead review email</h3>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-[#6B3BF6] border border-purple-200">Default (1 Submission)</span>
          </div>
          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
            ✓ Mandatory
          </span>
        </div>

        <div>
          <label className="block text-slate-700 font-bold text-xs mb-1">Lead email</label>
          <input
            type="email"
            value={leadEmail}
            onChange={e => setLeadEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none"
          />
        </div>



        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-700 font-bold text-xs">INTRODUCTION</label>
            <button onClick={() => setIntroduction('I hope you are doing well.')} className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer">
              Reset to default
            </button>
          </div>
          <textarea
            rows={4}
            value={introduction}
            onChange={e => setIntroduction(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none leading-relaxed"
          />
        </div>
      </div>



      {/* 5. CARD 4: ATTACH CANDIDATES */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Attach Candidates</h3>
            <p className="text-xs text-slate-500">Search and attach candidates for this requirement.</p>
          </div>
        </div>



        {/* ATTACHED CANDIDATES LIST */}
        <div className="space-y-3 pt-2">
          <span className="text-xs font-extrabold text-slate-900 block">Attached Candidates (1 / 1)</span>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 text-xs">Candidate (draft)</h4>
                <span className="text-[10px] font-mono text-slate-400">18016</span>
                <span className="text-[10px] text-blue-700 font-semibold">• pritishmalik8@gmail.com</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-bold mt-1">
                Resume on file: <span className="underline">PritishMalikImmediateJoiner[11y_0m].pdf</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl cursor-pointer">
                Replace resume
              </button>
              <button className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer">
                &times;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. CARD 5: CLIENT SUBMISSION TRACKER TABLE & CUSTOMIZATION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Client submission tracker</h3>
            <p className="text-xs text-slate-500">
              {CLIENT_TRACKER_PRESETS[clientName]?.subtitle || 'Client layout: review and edit before sending — the same grid is embedded in the client email.'}
            </p>
          </div>
          {/* Client Filter Relocated (With METAFORGE (INTERNAL) & Client Layout Presets) */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <label className="text-xs font-extrabold text-slate-700 whitespace-nowrap">Client Filter:</label>
            <select
              value={clientName}
              onChange={e => handleClientChange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer shadow-2xs"
            >
              <option value="METAFORGE (INTERNAL)">METAFORGE (INTERNAL)</option>
              <option value="LTTS / L&T">LTTS / L&T</option>
              <option value="Continental Automotive">Continental Automotive</option>
              <option value="Bosch Global">Bosch Global</option>
              <option value="Accenture Enterprise">Accenture Enterprise</option>
              <option value="ITC Infotech">ITC Infotech</option>
            </select>
          </div>
        </div>

        {/* FORMAL YELLOW HEADER GRID TABLE (Manual Editable) */}
        <div className="border-2 border-slate-800 rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr style={{ backgroundColor: headerColor }} className="text-slate-950 font-black border-b-2 border-slate-800 text-[10px] uppercase">
                {visibleColumns.map(col => (
                  <th key={col} className="p-2.5 border-r-2 border-slate-800">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-800 font-semibold text-slate-900">
              {trackerRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {visibleColumns.map(col => (
                    <td key={col} className="p-1 border-r-2 border-slate-800">
                      <input
                        type="text"
                        value={row[col] || ''}
                        onChange={e => handleUpdateCell(rIdx, col, e.target.value)}
                        className="w-full px-2 py-1 bg-transparent focus:bg-white focus:outline-none text-xs font-mono"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TRACKER CUSTOMIZATION PANEL */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-4">
          <span className="text-xs font-extrabold text-slate-900 block">Tracker customization</span>

          {/* ADD CUSTOM COLUMN */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              ADD CUSTOM COLUMN
            </span>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Column name"
                value={customColName}
                onChange={e => setCustomColName(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
              <select
                value={customColPosition}
                onChange={e => setCustomColPosition(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="At start">At start</option>
                <option value="At end">At end</option>
              </select>
              <button
                type="button"
                onClick={handleInsertCustomColumn}
                className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                + Insert
              </button>
            </div>
          </div>

          {/* COLUMN LAYOUT CHIPS (DRAG AND DROP REORDERABLE) */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                COLUMN LAYOUT ({visibleColumns.length} VISIBLE / {columnList.length} TOTAL)
              </span>
              <span className="text-[10px] text-[#6B3BF6] font-bold flex items-center gap-1">
                <GripVertical className="w-3 h-3" />
                <span>Drag & drop chips to change column position</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {columnList.map((col, index) => {
                const isHidden = hiddenColumns.has(col)
                const isDragging = draggedColIndex === index
                const isDragOver = dragOverColIndex === index
                const isSelected = selectedColIndex === index

                return (
                  <div
                    key={col}
                    draggable
                    onDragStart={e => handleDragStart(e, index)}
                    onDragEnter={e => handleDragEnter(e, index)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDrop={e => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleChipClick(index)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all select-none cursor-grab active:cursor-grabbing ${
                      isDragging
                        ? 'opacity-40 scale-95 border-2 border-dashed border-[#6B3BF6] bg-purple-50'
                        : isDragOver
                        ? 'ring-4 ring-[#6B3BF6]/40 scale-105 bg-purple-100 border-[#6B3BF6]'
                        : isSelected
                        ? 'ring-2 ring-amber-500 bg-amber-100 border-amber-400 scale-105'
                        : isHidden
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 line-through'
                        : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:border-emerald-400 hover:shadow-xs'
                    }`}
                    title="Drag or click to reorder position"
                  >
                    <div className={`flex items-center gap-1.5 ${draggedColIndex !== null ? 'pointer-events-none' : ''}`}>
                      {/* Drag Handle */}
                      <span className="p-0.5 shrink-0">
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                      </span>

                      {/* Left Move Button */}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            moveColumnLeft(index)
                          }}
                          className="p-0.5 hover:bg-black/10 rounded text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
                          title="Move left"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                      )}

                      <span className="whitespace-nowrap">{col}</span>

                      {/* Right Move Button */}
                      {index < columnList.length - 1 && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            moveColumnRight(index)
                          }}
                          className="p-0.5 hover:bg-black/10 rounded text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
                          title="Move right"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}

                      {/* Visibility Toggle Button */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          toggleColumnVisibility(col)
                        }}
                        className="cursor-pointer hover:scale-110 transition-transform p-0.5 ml-0.5 shrink-0"
                        title={isHidden ? 'Click to show column' : 'Click to hide column'}
                      >
                        {isHidden ? (
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* APPEARANCE HEADER COLOR */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">APPEARANCE</span>
              <span className="text-xs text-slate-600 font-medium">Header row color</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={headerColor}
                onChange={e => setHeaderColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
              />
              <input
                type="text"
                value={headerColor}
                onChange={e => setHeaderColor(e.target.value)}
                className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => showToast('Column layout & color preferences saved!')}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Save layout
            </button>
          </div>
        </div>
      </div>

      {/* 7. CONFIRMATION CHECKBOX (Only shown after Forward to client loop is approved & checked) */}
      {isLeadApproved && forwardLoopChecked && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2 animate-in fade-in duration-200">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmForwardChecked}
              onChange={e => setConfirmForwardChecked(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-amber-950">
              I confirm these candidates should be forwarded in the original client requirement email thread.
            </span>
          </label>
          <p className="text-[10px] text-slate-500 pl-7">
            One submission will be recorded; lead email and client thread forward for: <strong>{requirement?.client || 'Client Account'}</strong>
          </p>
        </div>
      )}

      {/* DUPLICATE SUBMISSION BANNER IN PAGE */}
      {hasDuplicateSubmission && firstDuplicate && (
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
            Candidate <strong>{firstDuplicate.candidateName}</strong> has already been submitted for this requirement (<strong>{currentReqId}</strong>) by another vendor/recruiter.
          </p>
          <div className="text-[11px] text-rose-900 bg-rose-100/80 p-2.5 rounded-xl border border-rose-200/80 flex flex-wrap gap-x-4 gap-y-1 font-semibold">
            <span>Submitted By: <strong>{firstDuplicate.existingSubmission?.recruiter || 'External Vendor'}</strong></span>
            <span>Date: <strong>{firstDuplicate.existingSubmission?.date}</strong></span>
            <span>Status: <strong>{firstDuplicate.existingSubmission?.stage}</strong></span>
            <span>Reason: <em>{firstDuplicate.matchReason}</em></span>
          </div>
        </div>
      )}

      {/* 8. STICKY BOTTOM ACTION BAR */}
      <div className={`sticky bottom-4 z-30 border backdrop-blur-md py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-between gap-4 mt-6 ${
        hasDuplicateSubmission
          ? 'bg-rose-50/95 border-rose-300'
          : 'bg-white/95 border-slate-200/90'
      }`}>
        <span className="text-xs font-bold text-slate-700">
          {hasDuplicateSubmission ? (
            <span className="text-rose-700 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Duplicate Candidate Submission — Cannot forward to Client.</span>
            </span>
          ) : (
            <span>Forward candidate(s) in the client email loop.</span>
          )}
        </span>

        <button
          onClick={handleSubmitFinal}
          disabled={hasDuplicateSubmission}
          className={`px-6 py-2.5 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 shrink-0 ${
            hasDuplicateSubmission
              ? 'bg-rose-300 text-rose-900 cursor-not-allowed border border-rose-300 shadow-none'
              : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer active:scale-98'
          }`}
        >
          {hasDuplicateSubmission ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Duplicate Submission - Blocked</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Forward to Client</span>
            </>
          )}
        </button>
      </div>

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed bottom-20 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
