import React, { useState } from 'react'
import { apiErrorMessage, uiCandidateToRepo, updateCandidateFromForm, UiCandidate } from '../../../services/candidatePayload'
import { CandidateRepoItem } from './types'

export function useCandidateRepoEdit(
  setRepoList: React.Dispatch<React.SetStateAction<CandidateRepoItem[]>>,
  showToast: (msg: string) => void,
  onCandidateUpdated?: (candidate: UiCandidate) => void,
) {
  const [editingCandidate, setEditingCandidate] = useState<CandidateRepoItem | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editLinkedIn, setEditLinkedIn] = useState('')
  const [editCurrentCompany, setEditCurrentCompany] = useState('')
  const [editQualification, setEditQualification] = useState('')
  const [editSkills, setEditSkills] = useState('')
  const [editTechnology, setEditTechnology] = useState('')
  const [editTotalExp, setEditTotalExp] = useState('')
  const [editRelevantExp, setEditRelevantExp] = useState('')
  const [editCurrentCtc, setEditCurrentCtc] = useState('')
  const [editExpectedCtc, setEditExpectedCtc] = useState('')
  const [editNoticePeriod, setEditNoticePeriod] = useState('')
  const [editCurrentLoc, setEditCurrentLoc] = useState('')
  const [editPreferredLoc, setEditPreferredLoc] = useState('')
  const [editAvailability, setEditAvailability] = useState('')
  const [editReasonForChange, setEditReasonForChange] = useState('')
  const [editOfferInHand, setEditOfferInHand] = useState('—')
  const [editResumeReference, setEditResumeReference] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Open Full-Page Edit Form
  const handleOpenEdit = (item: CandidateRepoItem, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingCandidate(item)
    setEditFullName(item.name || '')
    setEditEmail(item.email || '')
    setEditPhone(item.phone || '')
    setEditLinkedIn(item.linkedIn || '')
    setEditCurrentCompany(item.currentCompany || '')
    setEditQualification(item.qualification || '')
    setEditSkills(item.skills || '')
    setEditTechnology(item.technology || '')
    setEditTotalExp(item.totalExperience || '')
    setEditRelevantExp(item.relevantExperience || '')
    setEditCurrentCtc(item.currentCtc || '')
    setEditExpectedCtc(item.expectedCtc || '')
    setEditNoticePeriod(item.noticePeriod || '')
    setEditCurrentLoc(item.currentLocation || '')
    setEditPreferredLoc(item.preferredLocation || '')
    setEditAvailability(item.interviewAvailability || '')
    setEditReasonForChange(item.reasonForChange || '')
    setEditOfferInHand(item.offerInHand || '')
    setEditResumeReference(item.resumeReference || '')
    setEditNotes(item.notes || '')
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCandidate || isSaving) return
    const recordId = editingCandidate.id || editingCandidate.candidateId
    setIsSaving(true)
    try {
      const saved = await updateCandidateFromForm(recordId, {
        name: editFullName,
        email: editEmail,
        phone: editPhone,
        linkedIn: editLinkedIn,
        company: editCurrentCompany,
        qualification: editQualification,
        skills: editSkills,
        technologies: editTechnology,
        totalExperience: editTotalExp,
        relevantExperience: editRelevantExp,
        currentCtc: editCurrentCtc,
        expectedCtc: editExpectedCtc,
        noticePeriod: editNoticePeriod,
        currentLocation: editCurrentLoc,
        preferredLocation: editPreferredLoc,
        offerInHand: editOfferInHand,
        interviewAvailability: editAvailability,
        reasonForChange: editReasonForChange,
        notes: editNotes,
      })
      const refreshed = uiCandidateToRepo({
        ...saved,
        interviewAvailability: editAvailability,
        reasonForChange: editReasonForChange,
        notes: editNotes,
        resumeName: editResumeReference || undefined,
      })
      setRepoList(prev => prev.map(item => (item.id === editingCandidate.id ? { ...item, ...refreshed, id: item.id } : item)))
      onCandidateUpdated?.({
        ...saved,
        interviewAvailability: editAvailability,
        reasonForChange: editReasonForChange,
        notes: editNotes,
        resumeName: editResumeReference || undefined,
      })
      setEditingCandidate(null)
      showToast('Candidate profile updated successfully!')
    } catch (err) {
      showToast(apiErrorMessage(err))
    } finally {
      setIsSaving(false)
    }
  }

  return {
    editingCandidate,
    setEditingCandidate,
    editFullName,
    setEditFullName,
    editEmail,
    setEditEmail,
    editPhone,
    setEditPhone,
    editLinkedIn,
    setEditLinkedIn,
    editCurrentCompany,
    setEditCurrentCompany,
    editQualification,
    setEditQualification,
    editSkills,
    setEditSkills,
    editTechnology,
    setEditTechnology,
    editTotalExp,
    setEditTotalExp,
    editRelevantExp,
    setEditRelevantExp,
    editCurrentCtc,
    setEditCurrentCtc,
    editExpectedCtc,
    setEditExpectedCtc,
    editNoticePeriod,
    setEditNoticePeriod,
    editCurrentLoc,
    setEditCurrentLoc,
    editPreferredLoc,
    setEditPreferredLoc,
    editAvailability,
    setEditAvailability,
    editReasonForChange,
    setEditReasonForChange,
    editOfferInHand,
    setEditOfferInHand,
    editResumeReference,
    setEditResumeReference,
    editNotes,
    setEditNotes,
    handleOpenEdit,
    handleEditSubmit,
  }
}
