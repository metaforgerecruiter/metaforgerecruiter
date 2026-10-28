import React from 'react'
import { removeSavedDraft, SavedDraftItem } from '../../../data/savedDraftsStore'
import { apiErrorMessage, createCandidateFromForm } from '../../../services/candidatePayload'
import type { AddCandidateVmState } from './useAddCandidatePageState'

export function useAddCandidatePageHandlers2(s: AddCandidateVmState) {
  const {
    onAddCandidate, setImportMode, parsedFileName, setParsedFileName,
    resumeFileId, setResumeFileId,
    setShowSuccessToast, setToastMsg, setDraftsList, isSaving, setIsSaving, candidateId,
    setCandidateId, submissionDate, candidateName, setCandidateName,
    currentCompany, setCurrentCompany, contactNumber, setContactNumber,
    email, setEmail, linkedInUrl, setLinkedInUrl,
    qualification, setQualification, skills, setSkills,
    technologies, setTechnologies, totalExperience, setTotalExperience,
    relevantExperience, setRelevantExperience, currentCtc, setCurrentCtc,
    expectedCtc, setExpectedCtc, noticePeriod, setNoticePeriod,
    currentLocation, setCurrentLocation, preferredLocation, setPreferredLocation,
    interviewAvailability, setInterviewAvailability, offerInHand, setOfferInHand,
    reasonForChange, setReasonForChange, notes, setNotes
  } = s

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
      setResumeFileId(d.resumeFileId || null)

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

  const handleDirectSubmitDraft = async (draft: SavedDraftItem, e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSaving) return
    if (draft.type !== 'candidate' || !draft.data) return
    const d = draft.data
    setIsSaving(true)
    try {
      const saved = await createCandidateFromForm({
        name: d.candidateName || '',
        email: d.email || '',
        phone: d.contactNumber || '',
        linkedIn: d.linkedInUrl || '',
        company: d.currentCompany || '',
        qualification: d.qualification || '',
        skills: d.skills || '',
        technologies: d.technologies || '',
        totalExperience: d.totalExperience || '',
        relevantExperience: d.relevantExperience || '',
        currentCtc: d.currentCtc || '',
        expectedCtc: d.expectedCtc || '',
        noticePeriod: d.noticePeriod || '',
        currentLocation: d.currentLocation || '',
        preferredLocation: d.preferredLocation || '',
        offerInHand: d.offerInHand || '',
        interviewAvailability: d.interviewAvailability || '',
        reasonForChange: d.reasonForChange || '',
        notes: d.notes || '',
        status: 'Parsed',
        resumeFileId: d.resumeFileId || resumeFileId || undefined,
      })
      onAddCandidate?.({
        ...saved,
        interviewAvailability: d.interviewAvailability || '',
        reasonForChange: d.reasonForChange || '',
        notes: d.notes || '',
        resumeName: saved.resumeName || d.parsedFileName,
        resumeFileId: saved.resumeFileId || d.resumeFileId || resumeFileId || undefined,
        submissionDate: saved.submissionDate || d.submissionDate,
      })
      setDraftsList(removeSavedDraft(draft.id))
      setShowSuccessToast(true)
      setTimeout(() => setShowSuccessToast(false), 3000)
    } catch (err) {
      setToastMsg(apiErrorMessage(err))
      setTimeout(() => setToastMsg(null), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  return {
    handleLoadDraft, handleDeleteDraft, handleDirectSubmitDraft
  }
}
