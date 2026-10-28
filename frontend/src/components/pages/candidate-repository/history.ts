import { getSubmissionsStore } from '../../../data/submissionsStore'
import { CandidateRepoItem } from './types'

/**
 * Helper to retrieve candidate submission history (count and companies submitted to)
 */
export function getCandidateSubmissionsHistory(item: CandidateRepoItem) {
  const store = getSubmissionsStore()
  const normEmail = item.email ? item.email.trim().toLowerCase() : ''
  const normPhone = item.phone ? item.phone.replace(/[^\d]/g, '').slice(-10) : ''
  const normName = item.name ? item.name.trim().toLowerCase() : ''

  const matches = store.filter(sub => {
    if (normEmail && sub.email && sub.email.trim().toLowerCase() === normEmail) return true
    if (normPhone && sub.phone && sub.phone.replace(/[^\d]/g, '').slice(-10) === normPhone) return true
    if (normName && sub.candidate) {
      const subName = sub.candidate.trim().toLowerCase()
      if (subName === normName || subName.includes(normName) || normName.includes(subName)) return true
    }
    return false
  })

  const records = matches.map(m => ({
    id: m.id,
    client: m.client || '',
    requirementTitle: m.req || '',
    reqId: m.req || '',
    submittedBy: m.recruiter || '',
    submittedDate: m.date || '',
    status: m.stage || '',
  }))

  const companies: string[] = Array.from(new Set(records.map(r => r.client)))
  const count = records.length

  return {
    count,
    companies,
    records,
    matches,
  }
}
