import React, { useEffect, useState } from 'react'
import { clientsService } from '../../../services/workspace.service'
import { CreateJobDemandVm } from './useCreateJobDemandForm'

export function CreateJobClient({ vm }: { vm: CreateJobDemandVm }) {
  // Clients registered in the application; "Other" allows a new name.
  const [clientNames, setClientNames] = useState<string[]>([])
  useEffect(() => {
    let active = true
    clientsService
      .list()
      .then((rows: any) => {
        const list: any[] = Array.isArray(rows) ? rows : rows?.items || rows?.data || []
        if (active) setClientNames([...new Set(list.map(c => String(c.clientName || c.name || '').trim()).filter(Boolean))].sort())
      })
      .catch(() => active && setClientNames([]))
    return () => {
      active = false
    }
  }, [])
  const {
    requirementFrom,
    setRequirementFrom,
    customCompany,
    setCustomCompany,
    clientLeadPoc,
    setClientLeadPoc,
    toEmails,
    toEmailInput,
    setToEmailInput,
    handleAddToEmail,
    handleRemoveToEmail,
    ccEmails,
    ccEmailInput,
    setCcEmailInput,
    handleAddCcEmail,
    handleRemoveCcEmail,
  } = vm
  return (
    <>
      {/* CLIENT INFORMATION CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Client Information</h3>
          <p className="text-xs text-slate-400">Client details and email recipient defaults.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Requirement From <span className="text-[10px] text-slate-400 font-normal ml-1">Pick a client or Other to type a new one.</span>
            </label>
            <select
              value={requirementFrom}
              onChange={e => setRequirementFrom(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none cursor-pointer"
            >
              {requirementFrom && requirementFrom !== 'Other' && !clientNames.includes(requirementFrom) && (
                <option value={requirementFrom}>{requirementFrom}</option>
              )}
              {clientNames.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>

          {requirementFrom === 'Other' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Specify Company Name
              </label>
              <input
                type="text"
                value={customCompany}
                onChange={e => setCustomCompany(e.target.value)}
                placeholder="Enter client company name..."
                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Requirement Email – From Sender
            </label>
            <input
              type="email"
              value={clientLeadPoc}
              onChange={e => setClientLeadPoc(e.target.value)}
              placeholder="e.g. anusha.k@iexcel.co.in"
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 outline-none font-medium"
            />
          </div>
        </div>

        {/* EMAIL RECIPIENTS SECTION */}
        <div className="pt-2 border-t border-slate-100 space-y-3 text-xs">
          {/* TO RECIPIENTS */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Requirement Email – To Recipients
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[42px]">
              {toEmails.map((email: string) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 shadow-2xs"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveToEmail(email)}
                    className="text-slate-400 hover:text-red-500 font-bold ml-1 transition-colors"
                    title="Remove address"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                <input
                  type="email"
                  value={toEmailInput}
                  onChange={e => setToEmailInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddToEmail()
                    }
                  }}
                  placeholder="Type email and press Enter or Add..."
                  className="flex-1 bg-transparent border-none text-xs text-slate-800 outline-none px-1"
                />
                <button
                  type="button"
                  onClick={handleAddToEmail}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-lg transition-colors"
                >
                  + Add
                </button>
              </div>
            </div>
          </div>

          {/* CC RECIPIENTS */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Requirement Email – CC Recipients
            </label>
            <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[42px]">
              {ccEmails.map((email: string) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 shadow-2xs"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => handleRemoveCcEmail(email)}
                    className="text-slate-400 hover:text-red-500 font-bold ml-1 transition-colors"
                    title="Remove address"
                  >
                    &times;
                  </button>
                </span>
              ))}
              <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                <input
                  type="email"
                  value={ccEmailInput}
                  onChange={e => setCcEmailInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCcEmail()
                    }
                  }}
                  placeholder="Type CC email and press Enter or Add..."
                  className="flex-1 bg-transparent border-none text-xs text-slate-800 outline-none px-1"
                />
                <button
                  type="button"
                  onClick={handleAddCcEmail}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-semibold rounded-lg transition-colors"
                >
                  + Add CC
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
