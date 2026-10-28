import React from 'react'

export function ScheduleInterviewFormFields({
  submission,
  setSubmission,
  interviewRound,
  setInterviewRound,
  date,
  setDate,
  time,
  setTime,
  interviewMode,
  setInterviewMode,
  status,
  setStatus,
  meetingLink,
  setMeetingLink,
  candidateEmail,
  setCandidateEmail,
  candidatePhone,
  setCandidatePhone,
  dynamicSubmissions = [],
}: {
  submission: string
  setSubmission: (value: string) => void
  interviewRound: string
  setInterviewRound: (value: string) => void
  date: string
  setDate: (value: string) => void
  time: string
  setTime: (value: string) => void
  interviewMode: string
  setInterviewMode: (value: string) => void
  status: string
  setStatus: (value: string) => void
  meetingLink: string
  setMeetingLink: (value: string) => void
  candidateEmail: string
  setCandidateEmail: (value: string) => void
  candidatePhone: string
  setCandidatePhone: (value: string) => void
  dynamicSubmissions?: Array<{ id: string; label: string }>
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Submission</label>
          <select
            value={submission}
            onChange={e => setSubmission(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="">
              Select submission
            </option>
            {submission && !dynamicSubmissions.some(item => item.id === submission || item.label === submission) && (
              <option value={submission}>{submission}</option>
            )}
            {dynamicSubmissions.length > 0 ? (
              dynamicSubmissions.map(item => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))
            ) : (
              <>
                <option value="Siddharth Sunil — Java Full Stack Developer">
                  Siddharth Sunil — Java Full Stack Developer
                </option>
                <option value="Priyanka Sharma — Senior React Developer">
                  Priyanka Sharma — Senior React Developer
                </option>
                <option value="Vidyasagar Gade — SAP MM Specialist">
                  Vidyasagar Gade — SAP MM Specialist
                </option>
                <option value="Kanchan Meshram — AI Developer">
                  Kanchan Meshram — AI Developer
                </option>
                <option value="Arpit Srivastav — MIG Welding Engineer">
                  Arpit Srivastav — MIG Welding Engineer
                </option>
              </>
            )}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Interview Round</label>
          <select
            value={interviewRound}
            onChange={e => setInterviewRound(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="L1 - Technical Round">L1 - Technical Round</option>
            <option value="L2 - Technical Round">L2 - Technical Round</option>
            <option value="Managerial Round">Managerial Round</option>
            <option value="HR Screening Round">HR Screening Round</option>
            <option value="Final Round">Final Round</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Time</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Interview Mode</label>
          <select
            value={interviewMode}
            onChange={e => setInterviewMode(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="Online">Online</option>
            <option value="Offline / In-Person">Offline / In-Person</option>
            <option value="Telephonic">Telephonic</option>
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Rescheduled">Rescheduled</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-semibold text-slate-700 mb-1.5">Meeting Link (Optional)</label>
        <input
          type="text"
          placeholder="https://meet.google.com/xxx-xxx-xxx"
          value={meetingLink}
          onChange={e => setMeetingLink(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Candidate Email</label>
          <input
            type="email"
            placeholder="candidate@email.com"
            value={candidateEmail}
            onChange={e => setCandidateEmail(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1.5">Candidate Phone</label>
          <input
            type="text"
            placeholder="+91 XXXXX XXXXX"
            value={candidatePhone}
            onChange={e => setCandidatePhone(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>
    </>
  )
}
