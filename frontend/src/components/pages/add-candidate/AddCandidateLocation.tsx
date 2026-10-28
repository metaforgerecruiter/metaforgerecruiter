import React from 'react'
import { AddCandidateVm } from './useAddCandidatePage'

export function AddCandidateLocation({ vm }: { vm: AddCandidateVm }) {
  const {
    currentLocation,
    setCurrentLocation,
    preferredLocation,
    setPreferredLocation,
    interviewAvailability,
    setInterviewAvailability,
    offerInHand,
    setOfferInHand,
    reasonForChange,
    setReasonForChange,
    notes,
    setNotes,
  } = vm
  return (
    <>
        {/* SECTION 5: LOCATION & AVAILABILITY CARD (MATCHING SCREENSHOT 2 & 3) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Location & Availability
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Capture location preferences and interview availability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Current Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bengaluru"
                value={currentLocation}
                onChange={e => setCurrentLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Preferred Location */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bengaluru / Remote"
                value={preferredLocation}
                onChange={e => setPreferredLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Availability for Interview */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Availability for Interview
              </label>
              <input
                type="text"
                placeholder="Enter availability details (e.g., Available after 5 PM, Available next week...)"
                value={interviewAvailability}
                onChange={e => setInterviewAvailability(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Offer in Hand */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Offer in Hand
              </label>
              <select
                value={offerInHand}
                onChange={e => setOfferInHand(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 bg-white cursor-pointer"
              >
                <option value="Select">Select</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="In Pipeline">In Pipeline</option>
              </select>
            </div>

            {/* Reason for Job Change */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Job Change
              </label>
              <input
                type="text"
                placeholder="e.g. Better role / Growth"
                value={reasonForChange}
                onChange={e => setReasonForChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Notes
                </label>
                <span className="text-[10px] text-slate-400">
                  Internal recruiter notes (saved on the candidate profile).
                </span>
              </div>
              <textarea
                rows={3}
                placeholder="Optional notes for your team only"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] text-slate-800 placeholder-slate-300"
              />
            </div>
          </div>
        </div>
    </>
  )
}
