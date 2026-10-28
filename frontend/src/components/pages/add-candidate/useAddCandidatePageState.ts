import type { AddCandidatePageProps } from './preamble'
import { checkDuplicateSubmission, DuplicateCheckResult } from '../../../data/submissionsStore'
import { getSavedDrafts, SavedDraftItem } from '../../../data/savedDraftsStore'
import { candidatesService } from '../../../services/workspace.service'
import { useState, useMemo, useEffect, useRef } from 'react'
import React from 'react'

export function useAddCandidatePageState(props: AddCandidatePageProps) {
  const {
  requirements = [],
  selectedReqId = null,
  showBack = false,
  onOpenRepository,
  onAddCandidate,
}: AddCandidatePageProps = props as AddCandidatePageProps & Record<string, never>
  // Mode selection: 'single' | 'bulk' | 'drafts'
  const [importMode, setImportMode] = useState<'single' | 'bulk' | 'drafts'>('single')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parsedFileName, setParsedFileName] = useState<string | null>(null)
  const [resumeFileId, setResumeFileId] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [showSaveDraftToast, setShowSaveDraftToast] = useState(false)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Bulk import queue: every dropped resume stays here until it is submitted or removed.
  const [bulkQueue, setBulkQueue] = useState<BulkQueueItem[]>([])
  const [activeQueueId, setActiveQueueId] = useState<string | null>(null)

  // Saved Drafts state
  const [draftsList, setDraftsList] = useState<SavedDraftItem[]>(() => getSavedDrafts())

  // Form Fields State (pre-filled with optional defaults matching screenshot)
  const [candidateId, setCandidateId] = useState(`CAND-${new Date().toISOString().slice(0, 10)}-001`)
  const [submissionDate, setSubmissionDate] = useState(new Date().toISOString().slice(0, 10))
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

  const [targetReqId, setTargetReqId] = useState<string>(selectedReqId || '')

  // Real-time Database Duplicate Check (Candidate Repository level)
  const [dbDuplicate, setDbDuplicate] = useState<{
    isDuplicate: boolean
    duplicateField?: string
    candidate?: any
  }>({ isDuplicate: false })

  useEffect(() => {
    const cleanEmail = email.trim()
    const cleanPhone = contactNumber.trim()
    if (!cleanEmail && !cleanPhone) {
      setDbDuplicate({ isDuplicate: false })
      return
    }

    let active = true
    const timer = setTimeout(async () => {
      try {
        const payload: { email?: string; phone?: string } = {}
        if (cleanEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) payload.email = cleanEmail
        if (cleanPhone && cleanPhone.length >= 7) payload.phone = cleanPhone
        if (!payload.email && !payload.phone) return

        const res = await candidatesService.duplicateCheck(payload)
        if (active) {
          if (res?.isDuplicate) {
            setDbDuplicate(res)
          } else {
            setDbDuplicate({ isDuplicate: false })
          }
        }
      } catch {
        // Non-blocking best effort check
      }
    }, 400)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [email, contactNumber])

  // Real-time Duplicate Submission & Repository Check
  const dupCheckResult = useMemo(() => {
    // 1. Requirement submission duplicate check
    if (targetReqId && (candidateName || email || contactNumber)) {
      const reqDup = checkDuplicateSubmission(targetReqId, {
        email,
        phone: contactNumber,
        candidateId,
        name: candidateName,
      })
      if (reqDup.isDuplicate) {
        return {
          isDuplicate: true,
          type: 'requirement' as const,
          existingSubmission: reqDup.existingSubmission,
          matchReason: reqDup.matchReason,
        }
      }
    }

    // 2. Candidate repository duplicate check
    if (dbDuplicate.isDuplicate) {
      return {
        isDuplicate: true,
        type: 'repository' as const,
        existingCandidate: dbDuplicate.candidate,
        duplicateField: dbDuplicate.duplicateField,
        matchReason: `Already exists in repository with matching ${dbDuplicate.duplicateField} (${dbDuplicate.duplicateField === 'email' ? email : contactNumber})`,
      }
    }

    return { isDuplicate: false }
  }, [targetReqId, candidateName, email, contactNumber, candidateId, dbDuplicate])

  return {
    requirements,
    selectedReqId,
    showBack,
    onOpenRepository,
    onAddCandidate,
    importMode,
    setImportMode,
    selectedFile,
    setSelectedFile,
    isParsing,
    setIsParsing,
    parsedFileName,
    setParsedFileName,
    resumeFileId,
    setResumeFileId,
    showSuccessToast,
    setShowSuccessToast,
    showSaveDraftToast,
    setShowSaveDraftToast,
    toastMsg,
    setToastMsg,
    isSaving,
    setIsSaving,
    draftsList,
    setDraftsList,
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
    skills,
    setSkills,
    technologies,
    setTechnologies,
    totalExperience,
    setTotalExperience,
    relevantExperience,
    setRelevantExperience,
    currentCtc,
    setCurrentCtc,
    expectedCtc,
    setExpectedCtc,
    noticePeriod,
    setNoticePeriod,
    currentLocation,
    setCurrentLocation,
    preferredLocation,
    setPreferredLocation,
    interviewAvailability,
    setInterviewAvailability,
    offerInHand,
    setOfferInHand,
    reasonForChange,
    setReasonForChange,
    notes,
    setNotes,
    targetReqId,
    setTargetReqId,
    dupCheckResult,
    bulkQueue,
    setBulkQueue,
    activeQueueId,
    setActiveQueueId,
  }
}

export type BulkQueueStatus = 'queued' | 'parsing' | 'parsed' | 'failed' | 'submitted'

export interface BulkQueueItem {
  id: string
  file: File
  status: BulkQueueStatus
  data?: import('../../../services/workspace.service').ParsedResume
  error?: string
  resumeFileId?: string
}
export type AddCandidateVmState = ReturnType<typeof useAddCandidatePageState>
