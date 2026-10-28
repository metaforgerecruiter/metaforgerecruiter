import type { CreateJobDemandFormProps } from './preamble'
import { useState, useMemo, useEffect, useRef } from 'react'
import React from 'react'
import { getClientEmailDefaults, isAccentureClient, sanitizeEmailList } from '../../../config/clientEmailDefaults'

export function useCreateJobDemandFormState(props: CreateJobDemandFormProps) {
  const {
  onCancel,
  onSubmit,
  userRole = 'Recruiter View',
  mode = 'create',
  initialData = null,
}: CreateJobDemandFormProps = props as CreateJobDemandFormProps & Record<string, never>
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
    initialData?.client || 'Other'
  )
  const [customCompany, setCustomCompany] = useState(
    initialData?.client || ''
  )
  
  const [toEmails, setToEmails] = useState<string[]>(initialData?.toEmails || [])
  const [ccEmails, setCcEmails] = useState<string[]>(initialData?.ccEmails || [])
  const [toEmailInput, setToEmailInput] = useState('')
  const [ccEmailInput, setCcEmailInput] = useState('')
  const [clientLeadPoc, setClientLeadPoc] = useState(
    initialData?.clientEmail || ''
  )
  const [clientPoc, setClientPoc] = useState(initialData?.clientEmail || '')
  useEffect(() => {
    const finalClient = requirementFrom === 'Other' ? customCompany : requirementFrom
    const defaults = getClientEmailDefaults(finalClient)
    if (defaults) {
      if (defaults.requirement.from) {
        setClientLeadPoc(defaults.requirement.from)
      }
      setToEmails(sanitizeEmailList(defaults.requirement.to))
      setCcEmails(sanitizeEmailList(defaults.requirement.cc))
    } else if (isAccentureClient(initialData?.client) && !isAccentureClient(finalClient)) {
      setToEmails([])
      setCcEmails([])
    }
  }, [requirementFrom, customCompany])

  const handleAddToEmail = () => {
    if (toEmailInput.trim() && toEmailInput.includes('@')) {
      setToEmails(prev => sanitizeEmailList([...prev, toEmailInput.trim()]))
      setToEmailInput('')
    }
  }

  const handleRemoveToEmail = (email: string) => {
    setToEmails(prev => prev.filter(e => e.toLowerCase() !== email.trim().toLowerCase()))
  }

  const handleAddCcEmail = () => {
    if (ccEmailInput.trim() && ccEmailInput.includes('@')) {
      setCcEmails(prev => sanitizeEmailList([...prev, ccEmailInput.trim()]))
      setCcEmailInput('')
    }
  }

  const handleRemoveCcEmail = (email: string) => {
    setCcEmails(prev => prev.filter(e => e.toLowerCase() !== email.trim().toLowerCase()))
  }


  const [jobTitle, setJobTitle] = useState(
    initialData?.title || ''
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
  return {
    onCancel,
    onSubmit,
    userRole,
    mode,
    initialData,
    reqId,
    setReqId,
    demandDate,
    setDemandDate,
    internalPoc,
    setInternalPoc,
    requirementFrom,
    setRequirementFrom,
    customCompany,
    setCustomCompany,
    clientLeadPoc,
    setClientLeadPoc,
    clientPoc,
    setClientPoc,
    toEmails,
    setToEmails,
    ccEmails,
    setCcEmails,
    toEmailInput,
    setToEmailInput,
    ccEmailInput,
    setCcEmailInput,
    handleAddToEmail,
    handleRemoveToEmail,
    handleAddCcEmail,
    handleRemoveCcEmail,
    jobTitle,
    setJobTitle,
    jobStatus,
    setJobStatus,
    closedDate,
    setClosedDate,
    typeOfDemand,
    setTypeOfDemand,
    priority,
    setPriority,
    openings,
    setOpenings,
    relevantExp,
    setRelevantExp,
    employmentType,
    setEmploymentType,
    workMode,
    setWorkMode,
    budgetCurrency,
    setBudgetCurrency,
    yearlyBudget,
    setYearlyBudget,
    locationInput,
    setLocationInput,
    locations,
    setLocations,
    overallExp,
    setOverallExp,
    noticePeriod,
    setNoticePeriod,
    mandatorySkillInput,
    setMandatorySkillInput,
    mandatorySkills,
    setMandatorySkills,
    skillInput,
    setSkillInput,
    skills,
    setSkills,
    jdText,
    setJdText,
    isExtracting,
    setIsExtracting,
    toastMsg,
    setToastMsg,
    isEdit,
    showToast,
  }
}
export type CreateJobDemandVmState = ReturnType<typeof useCreateJobDemandFormState>
