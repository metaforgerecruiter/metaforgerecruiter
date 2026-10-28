import React from 'react'
import { Requirement } from '../../../types'
import type { CreateJobDemandVmState } from './useCreateJobDemandFormState'

export function useCreateJobDemandFormHandlers(s: CreateJobDemandVmState) {
  const {
    onSubmit, initialData, reqId, demandDate,
    requirementFrom, customCompany, clientLeadPoc, toEmails, ccEmails, jobTitle,
    setJobTitle, jobStatus, priority, openings,
    yearlyBudget, locationInput, setLocationInput, locations,
    setLocations, mandatorySkillInput, setMandatorySkillInput, mandatorySkills,
    setMandatorySkills, skillInput, setSkillInput, skills,
    setSkills, jdText, setIsExtracting, showToast
  } = s
  const handleAddLocation = () => {
    if (locationInput.trim()) {
      setLocations([...locations, locationInput.trim()])
      setLocationInput('')
    }
  }

  // Handle Add Mandatory Skill
  const handleAddMandatorySkill = () => {
    if (mandatorySkillInput.trim()) {
      const newSkills = mandatorySkillInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      setMandatorySkills([...mandatorySkills, ...newSkills])
      setMandatorySkillInput('')
    }
  }

  // Handle Add Skill
  const handleAddSkill = () => {
    if (skillInput.trim()) {
      const newSkills = skillInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
      setSkills([...skills, ...newSkills])
      setSkillInput('')
    }
  }

  // Fill empty fields from labelled lines in the pasted JD ("Job Title: …", "Mandatory Skills: …").
  const handleExtractAndAutoFill = () => {
    if (!jdText.trim()) {
      showToast('Please paste JD text or upload a document to extract.')
      return
    }
    setIsExtracting(true)
    const valueOf = (labels: string[]) => {
      for (const line of jdText.split(/\r?\n/)) {
        const m = line.match(new RegExp(`^\\s*(?:${labels.join('|')})\\s*[:\\-–—]\\s*(.+)$`, 'i'))
        if (m && m[1].trim()) return m[1].trim()
      }
      return ''
    }
    const list = (v: string) => v.split(/[,;|]/).map(x => x.trim()).filter(Boolean)
    const title = valueOf(['job\\s*title', 'position', 'role', 'designation'])
    const mand = list(valueOf(['mandatory\\s*skills?', 'must\\s*have(?:\\s*skills?)?', 'primary\\s*skills?']))
    const other = list(valueOf(['skills?', 'secondary\\s*skills?', 'good\\s*to\\s*have']))
    const loc = list(valueOf(['job\\s*location', 'work\\s*location', 'location']))
    const filled: string[] = []
    if (!jobTitle && title) { setJobTitle(title); filled.push('title') }
    if (mandatorySkills.length === 0 && mand.length) { setMandatorySkills(mand); filled.push('mandatory skills') }
    if (skills.length === 0 && other.length) { setSkills(other); filled.push('skills') }
    if (locations.length === 0 && loc.length) { setLocations(loc); filled.push('location') }
    setIsExtracting(false)
    showToast(filled.length ? `Filled ${filled.join(', ')} from the JD text.` : 'No labelled fields (e.g. "Job Title:", "Skills:") found in the JD text.')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobTitle.trim()) {
      showToast('Please specify a Job Title.')
      return
    }

    const finalClient = requirementFrom === 'Other' ? customCompany || 'Other' : requirementFrom

    const updatedReq: Requirement = {
      ...(initialData || {} as any),
      id: reqId || `REQ-${Date.now().toString().slice(-6)}`,
      client: finalClient,
      title: jobTitle,
      priority: priority,
      status: jobStatus === 'Closed' ? 'Closed' : (initialData?.status || 'Active'),
      assignmentStatus: initialData?.assignmentStatus || (jobStatus === 'Assigned' ? 'Assigned' : 'Unassigned'),
      owner: initialData?.owner || 'Unassigned',
      submissions: initialData?.submissions || 0,
      interviews: initialData?.interviews || 0,
      placed: initialData?.placed || 0,
      rejections: initialData?.rejections || 0,
      clientEmail: clientLeadPoc || initialData?.clientEmail || '',
      toEmails: Array.isArray(toEmails) ? toEmails : [],
      ccEmails: Array.isArray(ccEmails) ? ccEmails : [],
      clientPhone: initialData?.clientPhone || '',
      location: locations.join(', ') || locationInput || '',
      openings: openings || 1,
      dueDate: demandDate || new Date().toISOString().split('T')[0],
      emailArrivedTime: initialData?.emailArrivedTime || '',
      budget: yearlyBudget ? `₹${yearlyBudget}` : initialData?.budget || '',
      skills: mandatorySkills,
    }

    onSubmit(updatedReq)
  }

  return {
    handleAddLocation, handleAddMandatorySkill, handleAddSkill, handleExtractAndAutoFill,
    handleSubmit
  }
}
