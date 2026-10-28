import { CLIENT_TRACKER_PRESETS, columnsForClient, resolveClientPreset, submissionIntroduction } from './trackerPresets.data'
import type { SubmitToLeadPageProps } from './preamble'
import { getForwardRequestByReq, ForwardRequest } from '../../../data/forwardRequestsStore'
import { saveSubmissionsStore, submissionForDuplicateCheck } from '../../../data/submissionsStore'
import { getSessionUser } from '../../../store/session'
import { clientsService, submissionsService, usersService } from '../../../services/workspace.service'
import { getClientEmailDefaults, sanitizeEmailList } from '../../../config/clientEmailDefaults'
import React, { useState, useEffect, useRef } from 'react'

export function useSubmitToLeadPageState(props: SubmitToLeadPageProps) {
  const {
  selectedCandidates = [],
  requirement = null,
  role,
  onBack,
  onSubmitSuccess,
}: SubmitToLeadPageProps = props as SubmitToLeadPageProps & Record<string, never>
  const storedRole = getSessionUser()?.role || null
  const activeRole = role || storedRole || 'recruiter'
  const normalizedRole = (activeRole || '').toLowerCase()
  const isSuperAdminOrAdmin = normalizedRole === 'superadmin' || normalizedRole === 'admin' || normalizedRole === 'devteam'
  const isLead = normalizedRole === 'lead' || normalizedRole.includes('lead') || normalizedRole === 'team lead' || normalizedRole === 'team_lead'
  const isLeadOrAdmin = isLead || isSuperAdminOrAdmin

  const sessionUser = getSessionUser()
  const currentReqId = requirement?.id || ''

  // Sync forward request from store
  const [forwardReq, setForwardReq] = useState<ForwardRequest | undefined>(() =>
    getForwardRequestByReq(currentReqId)
  )

  // Destination Checkboxes (Forward to client loop starts unticked)
  const [submitToLeadChecked, setSubmitToLeadChecked] = useState(true)
  const [forwardLoopChecked, setForwardLoopChecked] = useState(false)

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
  const initialPreset = resolveClientPreset(requirement?.client || '')
  const initialLayout = columnsForClient(initialPreset)
  const [clientName, setClientName] = useState(initialPreset)

  useEffect(() => {
    let cancelled = false
    const clientLabel = (requirement?.client || clientName || '').trim()
    const defaults = getClientEmailDefaults(clientLabel)

    if (defaults?.submission) {
      if (defaults.submission.from) {
        setRecruiterEmail(defaults.submission.from)
      }
      setToRecipients(sanitizeEmailList(defaults.submission.to))
      setCcRecipients(sanitizeEmailList(defaults.submission.cc))
      return () => { cancelled = true }
    }
    clientsService.list()
      .then((list) => {
        if (cancelled) return
        const clients = Array.isArray(list) ? list : []
        const match = clients.find((client: { clientName?: string; name?: string; pocContacts?: { email?: string; name?: string }[] }) =>
          String(client.clientName || client.name || '').trim().toLowerCase() === clientLabel
        ) || clients.find((client: { clientName?: string; name?: string }) => {
          const label = String(client.clientName || client.name || '').trim().toLowerCase()
          return Boolean(clientLabel) && (label.includes(clientLabel) || clientLabel.includes(label))
        })
        const fromContacts = Array.isArray(match?.pocContacts)
          ? match.pocContacts
              .map((contact: { email?: string }) => String(contact?.email || '').trim())
              .filter(Boolean)
          : []
        const pocName = Array.isArray(match?.pocContacts)
          ? match.pocContacts.map((contact: { name?: string }) => String(contact?.name || '').trim()).find(Boolean)
          : ''
        if (pocName) {
          setEmailGreeting(current => (
            current === 'Dear ,' || current === 'Dear Lead & Hiring Team,'
              ? `Dear ${pocName},`
              : current
          ))
        }
        const fromRequirement = requirement?.clientEmail ? [requirement.clientEmail.trim()] : []
        const unique = [...new Set([...fromRequirement, ...fromContacts])]
        if (unique.length) setToRecipients(unique)
      })
      .catch(() => {
        if (!cancelled && requirement?.clientEmail) setToRecipients([requirement.clientEmail])
      })
    return () => { cancelled = true }
  }, [requirement?.client, requirement?.clientEmail, clientName])

  const isLeadApproved = forwardReq?.status === 'approved'
  const isApprovalRequested = forwardReq?.status === 'pending'

  const [submissionTick, setSubmissionTick] = useState(0)

  useEffect(() => {
    const refresh = () => setSubmissionTick(value => value + 1)
    window.addEventListener('submissions_updated', refresh)
    return () => window.removeEventListener('submissions_updated', refresh)
  }, [])

  useEffect(() => {
    let cancelled = false
    submissionsService.list()
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return
        saveSubmissionsStore(data.map(submissionForDuplicateCheck))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [currentReqId])

  useEffect(() => {
    const leadName = String(requirement?.assignedLead || '').trim().toLowerCase()
    if (!leadName) return
    let cancelled = false
    usersService.list()
      .then((users) => {
        if (cancelled || !Array.isArray(users)) return
        const named = users.filter((user: { name?: string; email?: string }) =>
          String(user?.name || '').trim().toLowerCase() === leadName && String(user?.email || '').includes('@')
        )
        const leads = named.filter((user: { role?: string }) => String(user?.role || '').toLowerCase().includes('lead'))
        const chosen = (leads.length ? leads : named)
          .map((user: { email?: string }) => String(user.email || '').trim().toLowerCase())
        const unique = [...new Set(chosen)]
        if (unique.length) setLeadEmails(unique)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [requirement?.assignedLead])

  // Thread Subject
  const [threadSubject, setThreadSubject] = useState(
    requirement
      ? `${requirement.id} — ${requirement.title} (${requirement.client})`
      : 'Candidate Profile Submission'
  )

  // From Recruiter
  const [recruiterName, setRecruiterName] = useState(sessionUser?.name || '')
  const [recruiterEmail, setRecruiterEmail] = useState(sessionUser?.email || '')

  // Recipients are loaded from the requirement's client contacts.
  const [toRecipients, setToRecipients] = useState<string[]>([])
  const [ccRecipients, setCcRecipients] = useState<string[]>([])
  const [newToInput, setNewToInput] = useState('')
  const [newCcInput, setNewCcInput] = useState('')

  // Lead Email & Introduction (Multiple Lead emails support)
  const [leadEmails, setLeadEmails] = useState<string[]>([''])
  const leadEmail = leadEmails.filter(Boolean).join(',')

  const handleAddLeadEmailField = () => {
    setLeadEmails(prev => [...prev, ''])
  }

  const handleUpdateLeadEmail = (index: number, val: string) => {
    setLeadEmails(prev => {
      const next = [...prev]
      next[index] = val
      return next
    })
  }

  const handleRemoveLeadEmail = (index: number) => {
    setLeadEmails(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : [''])
  }

  const setLeadEmail = (val: string) => {
    setLeadEmails([val])
  }

  const [submissionRole, setSubmissionRole] = useState(requirement?.title || '')
  const [emailGreeting, setEmailGreeting] = useState('Dear ,')
  const [introduction, setIntroduction] = useState(submissionIntroduction(requirement?.title || ''))

  const [confirmForwardChecked, setConfirmForwardChecked] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  // Custom Column & Tracker Table State
  const defaultPreset = CLIENT_TRACKER_PRESETS[initialPreset] || CLIENT_TRACKER_PRESETS['Metaforge ( internal )'] || Object.values(CLIENT_TRACKER_PRESETS)[0]

  const [columnList, setColumnList] = useState<string[]>(initialLayout.columns)
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set(initialLayout.hidden))
  const [customColName, setCustomColName] = useState('')
  const [customColPosition, setCustomColPosition] = useState('At start')
  const [headerColor, setHeaderColor] = useState(initialLayout.headerColor)

  // Drag & Drop State for Column Layout Reordering (Fail-Safe)
  const isDraggingRef = useRef<boolean>(false)
  const draggedColIndexRef = useRef<number | null>(null)
  const [draggedColIndex, setDraggedColIndex] = useState<number | null>(null)
  const [dragOverColIndex, setDragOverColIndex] = useState<number | null>(null)
  const [selectedColIndex, setSelectedColIndex] = useState<number | null>(null)

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  return {
    selectedCandidates,
    requirement,
    role,
    onBack,
    onSubmitSuccess,
    forwardReq,
    setForwardReq,
    submitToLeadChecked,
    setSubmitToLeadChecked,
    forwardLoopChecked,
    setForwardLoopChecked,
    clientName,
    setClientName,
    threadSubject,
    setThreadSubject,
    recruiterName,
    setRecruiterName,
    recruiterEmail,
    setRecruiterEmail,
    toRecipients,
    setToRecipients,
    ccRecipients,
    setCcRecipients,
    newToInput,
    setNewToInput,
    newCcInput,
    setNewCcInput,
    leadEmail,
    setLeadEmail,
    leadEmails,
    setLeadEmails,
    handleAddLeadEmailField,
    handleUpdateLeadEmail,
    handleRemoveLeadEmail,
    submissionRole,
    setSubmissionRole,
    emailGreeting,
    setEmailGreeting,
    introduction,
    setIntroduction,
    submissionTick,
    confirmForwardChecked,
    setConfirmForwardChecked,
    toastMsg,
    setToastMsg,
    columnList,
    setColumnList,
    hiddenColumns,
    setHiddenColumns,
    customColName,
    setCustomColName,
    customColPosition,
    setCustomColPosition,
    headerColor,
    setHeaderColor,
    draggedColIndex,
    setDraggedColIndex,
    dragOverColIndex,
    setDragOverColIndex,
    selectedColIndex,
    setSelectedColIndex,
    storedRole,
    activeRole,
    normalizedRole,
    isSuperAdminOrAdmin,
    isLead,
    isLeadOrAdmin,
    currentReqId,
    isLeadApproved,
    isApprovalRequested,
    CLIENT_TRACKER_PRESETS,
    defaultPreset,
    isDraggingRef,
    draggedColIndexRef,
    showToast,
  }
}
export type SubmitToLeadVmState = ReturnType<typeof useSubmitToLeadPageState>
