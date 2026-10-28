export interface UnifiedTeamMember {
  id: string
  name: string
  email: string
  avatar: string
  role: string
  isTeamLead: boolean
  teamLead: string
  clientNames: string[]
  totalRequirements: number
  totalSubmissions: number
  tatDays: number
  totalInterviews: number
  performanceStatus: 'Top Performer' | 'On Track' | 'Needs Attention'
  membersCount?: number
  teamMembers?: string[]
}
