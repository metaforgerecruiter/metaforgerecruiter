import React, { useState } from 'react'
import { X } from 'lucide-react'
import { ScheduleInterviewFormFields } from './ScheduleInterviewModal.fields'
import { interviewsService, submissionsService, candidatesService } from '../../services/workspace.service'
import { apiErrorMessage } from '../pages/submissions/preamble'

interface ScheduleInterviewModalProps {
  isOpen: boolean
  onClose: () => void
  initialSubmission?: string
  submissionsOptions?: Array<{ id: string; candidateName: string; requirement: string }>
  onScheduleSuccess?: (data: any) => void
  submissionId?: string
}

export function ScheduleInterviewModal({
  isOpen,
  onClose,
  initialSubmission = '',
  submissionsOptions = [],
  onScheduleSuccess,
  submissionId,
}: ScheduleInterviewModalProps) {
  const getTodayDateString = () => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const [submission, setSubmission] = useState(initialSubmission)
  const [interviewRound, setInterviewRound] = useState('L1 - Technical Round')
  const [date, setDate] = useState(getTodayDateString)
  const [time, setTime] = useState('10:00')
  const [interviewMode, setInterviewMode] = useState('Online')
  const [status, setStatus] = useState('Scheduled')
  const [meetingLink, setMeetingLink] = useState('')
  const [candidateEmail, setCandidateEmail] = useState('')
  const [candidatePhone, setCandidatePhone] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [sendWhatsApp, setSendWhatsApp] = useState(true)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [dynamicSubmissionsList, setDynamicSubmissionsList] = useState<Array<{ id: string; label: string }>>([])
  const [rawSubmissions, setRawSubmissions] = useState<any[]>([])
  const [rawCandidates, setRawCandidates] = useState<any[]>([])

  React.useEffect(() => {
    if (isOpen) {
      if (initialSubmission) setSubmission(initialSubmission)
      setDate(getTodayDateString())
      setErrorMsg(null)

      Promise.all([
        submissionsService.list().catch(() => []),
        candidatesService.list().catch(() => ({ data: [] })),
      ]).then(([subs, candRes]) => {
        const subsArr: any[] = Array.isArray(subs) ? subs : []
        const candsArr: any[] = Array.isArray(candRes) ? candRes : (candRes?.data || [])
        setRawSubmissions(subsArr)
        setRawCandidates(candsArr)

        const mapped: Array<{ id: string; label: string }> = []
        subsArr.forEach((s: any) => {
          mapped.push({
            id: s.id || s._id,
            label: `${s.candidateName || s.candidate || 'Candidate'} — ${s.requirementTitle || s.requirement || 'Requirement'}`,
          })
        })

        // Also add candidate options if not already listed in submissions
        candsArr.forEach((c: any) => {
          const cId = c.id || c._id
          const hasInSub = subsArr.some((s: any) =>
            (s.candidateId && (s.candidateId === cId || s.candidateId._id === cId)) ||
            (s.candidateName && s.candidateName.toLowerCase() === (c.name || '').toLowerCase())
          )
          if (!hasInSub) {
            mapped.push({
              id: cId,
              label: `${c.name || c.fullName || 'Candidate'} (Candidate Direct)`,
            })
          }
        })

        setDynamicSubmissionsList(mapped)

        const chosen = initialSubmission || submission || (mapped.length > 0 ? mapped[0].id : '')
        if (!submission && mapped.length > 0) {
          setSubmission(mapped[0].id)
        }

        // Auto-fill candidate email & phone from matched submission or candidate
        const foundSub = subsArr.find((s: any) =>
          (s.id || s._id) === chosen ||
          s.submissionId === chosen ||
          `${s.candidateName || s.candidate} — ${s.requirementTitle || s.requirement}` === chosen ||
          (s.candidateName && chosen.toLowerCase().includes(s.candidateName.toLowerCase()))
        )
        if (foundSub) {
          if (foundSub.email || foundSub.candidateEmail) setCandidateEmail(foundSub.email || foundSub.candidateEmail)
          if (foundSub.phone || foundSub.candidatePhone) setCandidatePhone(foundSub.phone || foundSub.candidatePhone)
        } else {
          const foundCand = candsArr.find((c: any) =>
            (c.id || c._id) === chosen ||
            c.candidateId === chosen ||
            c.name === chosen ||
            (c.name && chosen.toLowerCase().includes(c.name.toLowerCase()))
          )
          if (foundCand) {
            if (foundCand.email) setCandidateEmail(foundCand.email)
            if (foundCand.phone) setCandidatePhone(foundCand.phone)
          }
        }
      }).catch(() => undefined)
    }
  }, [isOpen, initialSubmission])

  const handleSubmissionChange = (newSub: string) => {
    setSubmission(newSub)
    const foundSub = rawSubmissions.find((s: any) =>
      (s.id || s._id) === newSub ||
      s.submissionId === newSub ||
      `${s.candidateName || s.candidate} — ${s.requirementTitle || s.requirement}` === newSub ||
      (s.candidateName && newSub.toLowerCase().includes(s.candidateName.toLowerCase()))
    )
    if (foundSub) {
      if (foundSub.email || foundSub.candidateEmail) setCandidateEmail(foundSub.email || foundSub.candidateEmail)
      if (foundSub.phone || foundSub.candidatePhone) setCandidatePhone(foundSub.phone || foundSub.candidatePhone)
    } else {
      const foundCand = rawCandidates.find((c: any) =>
        (c.id || c._id) === newSub ||
        c.candidateId === newSub ||
        c.name === newSub ||
        (c.name && newSub.toLowerCase().includes(c.name.toLowerCase()))
      )
      if (foundCand) {
        if (foundCand.email) setCandidateEmail(foundCand.email)
        if (foundCand.phone) setCandidatePhone(foundCand.phone)
      }
    }
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)
    try {
      let targetSubId = submissionId || submission

      if (!targetSubId && submission) {
        if (submission.match(/^[0-9a-fA-F]{24}$/)) {
          targetSubId = submission
        } else {
          const matchedOpt = submissionsOptions?.find(
            s => s.id === submission || `${s.candidateName} — ${s.requirement}` === submission
          )
          if (matchedOpt) {
            targetSubId = matchedOpt.id
          } else {
            const matchedDyn = dynamicSubmissionsList.find(s => s.id === submission || s.label === submission)
            if (matchedDyn) {
              targetSubId = matchedDyn.id
            } else {
              const matchedRaw = rawSubmissions.find(s =>
                (s.id || s._id) === submission ||
                s.submissionId === submission ||
                (s.candidateName && submission.toLowerCase().includes(s.candidateName.toLowerCase())) ||
                (s.candidate && submission.toLowerCase().includes(s.candidate.toLowerCase()))
              )
              if (matchedRaw) {
                targetSubId = matchedRaw.id || matchedRaw._id
              }
            }
          }
        }
      }

      if (!targetSubId) {
        targetSubId = submission
      }

      // Safely parse date and time to ISO string
      let parsedDate = new Date()
      try {
        let cleanTime = (time || '10:00').trim()
        const timeMatch = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10)
          const mins = parseInt(timeMatch[2], 10)
          const meridian = timeMatch[3]?.toUpperCase()
          if (meridian === 'PM' && hours < 12) hours += 12
          if (meridian === 'AM' && hours === 12) hours = 0
          cleanTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
        }

        let yyyy = '', mm = '', dd = ''
        if (date.includes('-')) {
          const parts = date.split('-')
          yyyy = parts[0]
          mm = parts[1]
          dd = parts[2]
        } else if (date.includes('/')) {
          const parts = date.split('/')
          if (parts[0].length === 4) {
            yyyy = parts[0]; mm = parts[1]; dd = parts[2]
          } else {
            mm = parts[0]; dd = parts[1]; yyyy = parts[2]
          }
        }
        if (yyyy && mm && dd) {
          parsedDate = new Date(`${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}T${cleanTime}:00`)
        } else {
          parsedDate = new Date(`${date} ${cleanTime}`)
        }
      } catch {
        parsedDate = new Date()
      }

      const dateTimeIso = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString()

      const created = await interviewsService.create({
        submissionId: targetSubId || submission,
        round: interviewRound,
        dateTime: dateTimeIso,
        mode: interviewMode,
        status,
        meetingUrl: meetingLink.trim() || undefined,
        candidateEmail: candidateEmail.trim() || undefined,
        candidatePhone: candidatePhone.trim() || undefined,
        notes: notes.trim() || undefined,
        sendEmail: Boolean(sendEmail),
        sendWhatsApp: Boolean(sendWhatsApp),
      })

      // If WhatsApp dispatch requested and WhatsApp url returned, open it for immediate sending
      if (sendWhatsApp && created?.whatsappUrl) {
        try {
          window.open(created.whatsappUrl, '_blank')
        } catch {
          // ignore popup blocker if restricted
        }
      }

      const scheduleData = {
        ...created,
        submission: submission || 'Select submission',
        interviewRound,
        date,
        time,
        interviewMode,
        status: created?.status || status,
        meetingLink,
        candidateEmail,
        candidatePhone,
        sendEmail,
        sendWhatsApp,
        notes,
      }

      if (onScheduleSuccess) {
        onScheduleSuccess(scheduleData)
      }
      onClose()
    } catch (err) {
      setErrorMsg(apiErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-slate-200 my-6 animate-in zoom-in-95 duration-150 font-sans text-slate-800">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Schedule New Interview
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <ScheduleInterviewFormFields
            submission={submission}
            setSubmission={handleSubmissionChange}
            interviewRound={interviewRound}
            setInterviewRound={setInterviewRound}
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            interviewMode={interviewMode}
            setInterviewMode={setInterviewMode}
            status={status}
            setStatus={setStatus}
            meetingLink={meetingLink}
            setMeetingLink={setMeetingLink}
            candidateEmail={candidateEmail}
            setCandidateEmail={setCandidateEmail}
            candidatePhone={candidatePhone}
            setCandidatePhone={setCandidatePhone}
            dynamicSubmissions={dynamicSubmissionsList}
          />

          <div className="pt-2 space-y-2">
            <label className="block font-bold text-slate-800">Send Interview Schedule</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={e => setSendEmail(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                />
                <span>Send via Email</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendWhatsApp}
                  onChange={e => setSendWhatsApp(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB] cursor-pointer"
                />
                <span>Send via WhatsApp</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Notes</label>
            <textarea
              rows={4}
              placeholder="Additional interview details, requirements, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full p-3 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-white font-bold rounded-xl shadow-sm transition-all cursor-pointer active:scale-98"
            >
              {isSubmitting ? 'Scheduling & Dispatching Invites...' : 'Schedule Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
