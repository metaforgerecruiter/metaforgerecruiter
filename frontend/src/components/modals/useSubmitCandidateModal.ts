import React, { useState, useMemo, useEffect } from 'react'
import { Requirement, Submission } from '../../types'
import { checkDuplicateSubmission } from '../../data/submissionsStore'
import { CandidateRepoItem } from './SubmitCandidateModal.data'
import { candidatesService, resumeParserService } from '../../services/workspace.service'
import { apiErrorMessage } from '../pages/submissions/preamble'

export function useSubmitCandidateModal({
  requirements,
  selectedReqId,
  onSubmit,
  onClose,
  currentRecruiterName,
}: {
  requirements: Requirement[]
  selectedReqId?: string | null
  onSubmit: (sub: Submission) => void
  onClose: () => void
  currentRecruiterName: string
}) {
  const [pathMode, setPathMode] = useState<'existing' | 'new'>('existing')
  const [targetReqId, setTargetReqId] = useState(selectedReqId || (requirements[0]?.id ?? ''))
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRepoItem | null>(null)
  const [newCandidateName, setNewCandidateName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newExperience, setNewExperience] = useState('')
  const [newCompany, setNewCompany] = useState('')
  const [newSkills, setNewSkills] = useState('')
  const [resumeName, setResumeName] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [existingCandidates, setExistingCandidates] = useState<CandidateRepoItem[]>([])

  // Existing candidates come from the candidate repository.
  useEffect(() => {
    let active = true
    candidatesService
      .list()
      .then((data: any) => {
        const list: any[] = Array.isArray(data) ? data : data?.items || data?.data || []
        if (!active) return
        setExistingCandidates(
          list
            .filter(c => c && !c.deletedAt)
            .map(c => {
              const skills: string[] = Array.isArray(c.skills) ? c.skills : String(c.skills || '').split(',').map((x: string) => x.trim()).filter(Boolean)
              return {
                id: String(c.id || c._id),
                name: c.name || '',
                candidateId: String(c.candidateId || c.id || c._id),
                email: c.email || '',
                phone: c.phone || '',
                technology: c.technology || c.primarySkill || skills[0] || '',
                skills: skills.join(', '),
                totalExperience: c.totalExperienceYears != null ? `${c.totalExperienceYears} Years` : c.totalExperience || '',
                currentCompany: c.currentCompany || '',
                status: c.status || '',
              }
            }),
        )
      })
      .catch(() => active && setExistingCandidates([]))
    return () => {
      active = false
    }
  }, [])

  const targetReq = requirements.find(r => r.id === targetReqId) || requirements[0]

  const existingDupResult = useMemo(() => {
    if (!selectedCandidate || !targetReqId) return { isDuplicate: false }
    return checkDuplicateSubmission(targetReqId, {
      email: selectedCandidate.email,
      phone: selectedCandidate.phone,
      candidateId: selectedCandidate.candidateId,
      name: selectedCandidate.name,
    })
  }, [targetReqId, selectedCandidate])

  const newDupResult = useMemo(() => {
    if (!newCandidateName || !targetReqId) return { isDuplicate: false }
    return checkDuplicateSubmission(targetReqId, {
      email: newEmail,
      phone: newPhone,
      name: newCandidateName,
    })
  }, [targetReqId, newCandidateName, newEmail, newPhone])

  const filteredCandidates = existingCandidates.filter(c => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase().trim()
    return (
      c.name.toLowerCase().includes(q) ||
      c.technology.toLowerCase().includes(q) ||
      c.skills.toLowerCase().includes(q) ||
      c.currentCompany.toLowerCase().includes(q)
    )
  })

  // Parse the chosen resume with the resume parser and fill the form with what it found.
  const handleResumeUpload = async (file: File) => {
    setResumeName(file.name)
    setParseError(null)
    setIsParsing(true)
    try {
      const res = await resumeParserService.parse(file)
      const d = res?.data
      if (d) {
        setNewCandidateName(d.candidateName || '')
        setNewEmail(d.email || '')
        setNewPhone(d.contactNumber || '')
        setNewExperience(d.totalExperience || '')
        setNewCompany(d.currentCompany || '')
        setNewSkills(d.skills || d.technologies || '')
      }
    } catch (err) {
      setParseError(apiErrorMessage(err))
    } finally {
      setIsParsing(false)
    }
  }

  const handleSubmitExisting = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCandidate || existingDupResult.isDuplicate) return
    onSubmit({
      id: `SUB-${Math.floor(Math.random() * 900 + 100)}`,
      candidate: selectedCandidate.name,
      req: targetReqId,
      client: targetReq?.client || '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      stage: 'Submitted',
      match: '',
      recruiter: currentRecruiterName || '',
      email: selectedCandidate.email,
      phone: selectedCandidate.phone,
      experience: selectedCandidate.totalExperience,
    })
    onClose()
  }

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCandidateName || newDupResult.isDuplicate) return
    onSubmit({
      id: `SUB-${Math.floor(Math.random() * 900 + 100)}`,
      candidate: newCandidateName,
      req: targetReqId,
      client: targetReq?.client || '',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      stage: 'Submitted',
      match: '',
      recruiter: currentRecruiterName || '',
      email: newEmail,
      phone: newPhone,
      experience: newExperience,
    })
    onClose()
  }

  return {
    pathMode,
    setPathMode,
    targetReqId,
    searchQuery,
    setSearchQuery,
    selectedCandidate,
    setSelectedCandidate,
    newCandidateName,
    newEmail,
    newPhone,
    newExperience,
    newCompany,
    newSkills,
    resumeName,
    isParsing,
    targetReq,
    existingDupResult,
    newDupResult,
    filteredCandidates,
    setNewCandidateName,
    setNewEmail,
    setNewPhone,
    setNewExperience,
    setNewCompany,
    setNewSkills,
    handleResumeUpload,
    parseError,
    handleSubmitExisting,
    handleSubmitNew,
  }
}
