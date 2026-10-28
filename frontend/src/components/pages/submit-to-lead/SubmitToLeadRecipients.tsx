import React from 'react'
import { SubmitToLeadVm } from './useSubmitToLeadPage'

export function SubmitToLeadRecipients({ vm }: { vm: SubmitToLeadVm }) {
  const {
    forwardLoopChecked,
    threadSubject,
    setThreadSubject,
    recruiterName,
    setRecruiterName,
    recruiterEmail,
    setRecruiterEmail,
    toRecipients,
    ccRecipients,
    newToInput,
    setNewToInput,
    newCcInput,
    setNewCcInput,
    handleAddToRecipient,
    handleAddCcRecipient,
    handleRemoveTo,
    handleRemoveCc,
    leadEmail,
    setLeadEmail,
    leadEmails,
    handleAddLeadEmailField,
    handleUpdateLeadEmail,
    handleRemoveLeadEmail,
  } = vm

  const activeLeadEmails = Array.isArray(leadEmails) && leadEmails.length > 0 ? leadEmails : [leadEmail || '']

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* GREEN STATUS MESSAGE */}
      <div className="text-xs text-emerald-700 font-bold px-1">
        ✓ Original email thread linked. Recipients below are from that message.
      </div>

      {/* THREAD SUBJECT BOX */}
      <div className="p-4 bg-blue-50/40 border border-blue-200/90 rounded-2xl space-y-1.5">
        <label className="block text-blue-900 font-extrabold text-xs">THREAD SUBJECT</label>
        <input
          type="text"
          value={threadSubject}
          onChange={e => setThreadSubject(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-xs font-semibold text-blue-950 focus:outline-none focus:border-blue-500 shadow-2xs"
        />
        <span className="text-[11px] text-blue-800/80 block">
          Pre-filled from the original requirement. Edits apply to this reply; the message stays in the same email thread.
        </span>
      </div>

      {/* FROM RECRUITER GREEN BOX (only when forwarding to the original requirement loop) */}
      {forwardLoopChecked && (
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-4 space-y-3">
          <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider block">
            FROM <span className="font-normal text-emerald-800">Recruiter sending this submission</span>
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1">Display name</label>
              <input
                type="text"
                value={recruiterName || 'K. Mahesh Goud'}
                onChange={e => setRecruiterName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1">Reply-to email</label>
              <input
                type="email"
                value={recruiterEmail || 'mahesh.k@metaforgeit.com'}
                onChange={e => setRecruiterEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
              Clients see <strong className="text-slate-900">{recruiterName || 'the recruiter'}</strong> as the sender. Messages are delivered via <span className="font-mono text-slate-800">recruitment.application@metaforgeit.com</span>. When the client clicks <strong>Reply</strong>, the response goes to your reply-to email. <strong>Reply All</strong> keeps everyone in the original thread plus you on CC.
          </p>
        </div>
      )}

      {/* RECIPIENTS TO / CC / BCC CHIPS (only when forwarding to the original requirement loop) */}
      {forwardLoopChecked && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* TO Column */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900">TO</span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md text-[10px] font-extrabold">
                  {toRecipients.length}
                </span>
              </div>
              <div className="space-y-2 min-h-[110px]">
                {toRecipients.map((email: string) => (
                  <div
                    key={email}
                    className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 shadow-2xs group"
                  >
                    <span className="truncate">{email}</span>
                    <button
                      onClick={() => handleRemoveTo(email)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-sm ml-1"
                      title="Remove recipient"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="email"
                  placeholder="Add email..."
                  value={newToInput}
                  onChange={e => setNewToInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddToRecipient() }}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                />
                <button
                  onClick={handleAddToRecipient}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer shadow-2xs"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* CC Column */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-900">CC</span>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded-md text-[10px] font-extrabold">
                  {ccRecipients.length}
                </span>
              </div>
              <div className="space-y-2 min-h-[110px]">
                {ccRecipients.map((email: string) => (
                  <div
                    key={email}
                    className="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 shadow-2xs group"
                  >
                    <span className="truncate">{email}</span>
                    <button
                      onClick={() => handleRemoveCc(email)}
                      className="text-slate-400 hover:text-slate-600 font-bold text-sm ml-1"
                      title="Remove CC"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="email"
                  placeholder="Add email..."
                  value={newCcInput}
                  onChange={e => setNewCcInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddCcRecipient() }}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                />
                <button
                  onClick={handleAddCcRecipient}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer shadow-2xs"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* BCC Column */}
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/90 space-y-3 flex flex-col justify-between">
              <div>
                <span className="text-xs font-extrabold text-slate-900 block mb-2">BCC</span>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400 my-auto">
                  Drop recipients here
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="email"
                  placeholder="Add email..."
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none"
                />
                <button className="px-3.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer shadow-2xs">
                  + Add
                </button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Drag email chips between To, CC, and BCC. Use Add at the bottom of each column for new recipients.
          </p>
        </div>
      )}

      {/* LEAD REVIEW EMAIL SECTION MATCHING SCREENSHOT */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Lead review email</h3>
          <button
            type="button"
            onClick={handleAddLeadEmailField}
            className="text-xs text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
          >
            + Add lead email
          </button>
        </div>
        <div className="space-y-3">
          {activeLeadEmails.map((emailVal: string, idx: number) => (
            <div key={idx} className="space-y-1">
              <label className="block text-slate-700 font-bold text-xs mb-1">
                {idx === 0 ? 'Lead email' : `Lead email #${idx + 1}`}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={emailVal}
                  onChange={e => handleUpdateLeadEmail ? handleUpdateLeadEmail(idx, e.target.value) : setLeadEmail(e.target.value)}
                  placeholder="lead@company.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
                {(activeLeadEmails.length > 1 || idx > 0) && (
                  <button
                    type="button"
                    onClick={() => handleRemoveLeadEmail && handleRemoveLeadEmail(idx)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors font-bold text-base"
                    title="Remove this lead email"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
