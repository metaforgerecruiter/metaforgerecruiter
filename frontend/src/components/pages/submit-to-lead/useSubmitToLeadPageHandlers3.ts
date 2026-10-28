import React, { useMemo, useRef } from 'react'
import { checkDuplicateSubmission, addSubmissionToStore } from '../../../data/submissionsStore'
import { workspaceService } from '../../../services/workspace.service'
import { ApiError } from '../../../lib/api'
import { hasCapability } from '../../../store/session'
import { applyBillRate, buildTrackerRow } from './trackerPresets.data'
import type { SubmitToLeadVmState } from './useSubmitToLeadPageState'

function rowValue(row: Record<string, string>, names: string[]): string {
  for (const name of names) {
    if (row[name]) return row[name]
  }
  return ''
}

export function useSubmitToLeadPageHandlers3(s: SubmitToLeadVmState & Record<string, any>) {
  const {
    requirement, onBack, onSubmitSuccess, columnList, hiddenColumns,
    currentReqId, trackerRows, setTrackerRows, showToast, submissionTick,
    selectedCandidates, clientName, toRecipients, ccRecipients, threadSubject, recruiterName,
    recruiterEmail, emailGreeting, introduction, headerColor
  } = s
  const submittingRef = useRef(false)

  const handleUpdateCell = (rowIndex: number, colName: string, value: string) => {
    setTrackerRows((prev: Record<string, string>[]) => {
      const next = [...prev]
      next[rowIndex] = applyBillRate({ ...next[rowIndex], [colName]: value }, colName)
      return next
    })
  }

  const handleAddTrackerRow = () => {
    const row = buildTrackerRow(columnList, {}, trackerRows.length, { requirement, recruiterName })
    setTrackerRows([...trackerRows, row])
    showToast('New editable row added to submission tracker!')
  }

  // Duplicate Check computation for attached candidates / tracker rows
  const duplicateCheckResults = useMemo(() => {
    const candidateList = Array.isArray(selectedCandidates) ? selectedCandidates : []
    return candidateList.map((cand: any, index: number) => {
      const row = trackerRows?.[index] || {}
      const candidateName = cand.name || rowValue(row, ['Candidate Name', 'Name of Candidate', 'Full Name of Candidate', 'First Name'])
      const email = cand.email || rowValue(row, ['Email ID', 'Mail ID'])
      const phone = cand.phone || rowValue(row, ['Contact Number', 'Mobile No', 'Candidate Mobile Number'])
      const candidateId = cand.id || cand.candidateId || ''
      const dupResult = checkDuplicateSubmission(currentReqId || requirement?._id, {
        email,
        phone,
        candidateId,
        name: candidateName,
      })
      return {
        candidate: cand,
        row,
        candidateName: candidateName || 'Selected Candidate',
        ...dupResult,
      }
    })
  }, [selectedCandidates, trackerRows, currentReqId, requirement?._id, submissionTick])

  const hasDuplicateSubmission = duplicateCheckResults.some((r: any) => r.isDuplicate)
  const firstDuplicate = duplicateCheckResults.find((r: any) => r.isDuplicate)
  const validCandidateResults = useMemo(() => duplicateCheckResults.filter((r: any) => !r.isDuplicate), [duplicateCheckResults])
  const validCandidatesToSubmit = useMemo(() => validCandidateResults.map((r: any) => r.candidate), [validCandidateResults])
  const allCandidatesAreDuplicates = useMemo(() => duplicateCheckResults.length > 0 && duplicateCheckResults.every((r: any) => r.isDuplicate), [duplicateCheckResults])

  const handleSubmitFinal = async () => {
    if (submittingRef.current) return

    if (!hasCapability('submitToClients')) {
      showToast('Permission Restricted: Super Admin has disabled client submissions for your account.')
      return
    }

    // Mandatory confirmation checkbox check
    if (!s.confirmForwardChecked) {
      showToast('Please check the confirmation checkbox before submitting.')
      return
    }

    if (!validCandidatesToSubmit.length) {
      showToast('The candidate is already submitted for this requirement.')
      return
    }

    const uniqueEmails = (emails: string[]) => [...new Set(
      emails.map((email: string) => String(email || '').trim().toLowerCase()).filter((email: string) => email.includes('@'))
    )]
    // Client TO/CC recipients are only used when forwarding to the original requirement loop.
    const forwardToLoop = Boolean(s.forwardLoopChecked)
    const clientEmails = forwardToLoop ? uniqueEmails(Array.isArray(toRecipients) ? toRecipients : []) : []
    const rawLeadEmails = Array.isArray(s.leadEmails) && s.leadEmails.length > 0
      ? s.leadEmails
      : (s.leadEmail ? String(s.leadEmail).split(',') : [])
    const leadEmails = uniqueEmails(rawLeadEmails)

    if (!clientEmails.length && !leadEmails.length) {
      showToast('Add a client or lead email recipient before submitting.')
      return
    }

    const reqCode = requirement?.id || currentReqId
    if (!reqCode) {
      showToast('This submission is missing a requirement.')
      return
    }

    submittingRef.current = true
    const targetClient = clientName || requirement?.client || ''
    const ccEmails = uniqueEmails(forwardToLoop && Array.isArray(ccRecipients) ? ccRecipients : [])
      .filter((email: string) => !clientEmails.includes(email) && !leadEmails.includes(email))

    try {
      const columns = columnList.filter((col: string) => !hiddenColumns.has(col))
      const rowsForEmail = validCandidateResults
        .map((result: any) => result.row)
        .filter((row: Record<string, string>) => row && Object.keys(row).length > 0)
      const validCandidateIds = validCandidatesToSubmit.map((c: any) => c.id).filter(Boolean)
      let savedCount = 0
      let emailAttached = false
      let blockedCount = duplicateCheckResults.length - validCandidatesToSubmit.length

      for (let i = 0; i < validCandidatesToSubmit.length; i++) {
        const candObj = validCandidatesToSubmit[i]
        const row = validCandidateResults[i]?.row || {}
        const includeEmail = !emailAttached
        try {
          const saved: any = await workspaceService.createSubmission({
            candidateId: candObj.id,
            candidateIds: includeEmail ? validCandidateIds : undefined,
            req: reqCode,
            requirementId: requirement?._id || undefined,
            candidate: candObj.name || rowValue(row, ['Candidate Name', 'Name of Candidate', 'Full Name of Candidate']),
            email: candObj.email || rowValue(row, ['Email ID', 'Mail ID']),
            phone: candObj.phone || rowValue(row, ['Contact Number', 'Mobile No', 'Candidate Mobile Number']),
            experience: candObj.totalExperience || rowValue(row, ['Total Yrs of Exp', 'Total Experience', 'Total Exp']),
            client: targetClient,
            stage: 'Submitted to Client',
            clientEmails: includeEmail ? clientEmails : undefined,
            leadEmail: includeEmail && leadEmails.length > 0 ? leadEmails[0] : undefined,
            leadEmails: includeEmail ? leadEmails : undefined,
            ccEmails: includeEmail ? ccEmails : undefined,
            emailSubject: threadSubject,
            trackerColumns: includeEmail ? columns : undefined,
            trackerRows: includeEmail ? rowsForEmail : undefined,
            trackerHeaderColor: includeEmail ? headerColor : undefined,
            emailGreeting: includeEmail ? emailGreeting : undefined,
            emailIntroduction: includeEmail ? introduction : undefined,
            recruiterName: includeEmail ? recruiterName : undefined,
            recruiterEmail: includeEmail ? recruiterEmail : undefined,
          } as any)
          if (includeEmail) emailAttached = true
          savedCount += 1
          addSubmissionToStore({
            id: saved?.id || saved?.submissionId || `${reqCode}-${candObj.id}`,
            candidate: candObj.name || '',
            candidateId: candObj.id || '',
            req: reqCode,
            reqCode,
            requirementId: requirement?._id || '',
            client: saved?.client || targetClient,
            date: saved?.date || new Date().toLocaleDateString('en-GB'),
            stage: 'Submitted to Client',
            match: saved?.match || '',
            recruiter: saved?.recruiter || recruiterName || '',
            email: candObj.email || '',
            phone: candObj.phone || '',
            experience: candObj.totalExperience || '',
          })
        } catch (err) {
          if (err instanceof ApiError && err.status === 409) {
            blockedCount += 1
            continue
          }
          throw err
        }
      }

      if (!savedCount) {
        showToast('The candidate is already submitted for this requirement.')
        return
      }

      let msg = `Submitted ${savedCount} candidate(s) successfully.`
      if (blockedCount > 0) msg += ` (${blockedCount} duplicate candidate(s) excluded).`
      showToast(msg)

      if (onSubmitSuccess) setTimeout(() => onSubmitSuccess(), 1200)
      else setTimeout(() => onBack(), 1200)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'The submission could not be saved or emailed.'
      showToast(message)
    } finally {
      submittingRef.current = false
    }
  }

  const visibleColumns = columnList.filter((col: string) => !hiddenColumns.has(col))

  return {
    handleUpdateCell, handleAddTrackerRow, duplicateCheckResults, hasDuplicateSubmission,
    firstDuplicate, validCandidateResults, validCandidatesToSubmit, allCandidatesAreDuplicates,
    handleSubmitFinal, visibleColumns
  }
}

