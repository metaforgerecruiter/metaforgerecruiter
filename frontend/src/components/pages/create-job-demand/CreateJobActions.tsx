import React from 'react'
import { CreateJobDemandVm } from './useCreateJobDemandForm'

export function CreateJobActions({ vm }: { vm: CreateJobDemandVm }) {
  const {
    onCancel,
    isEdit,
  } = vm
  return (
    <>
        {/* STICKY BOTTOM ACTION BAR */}
        <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 py-3.5 px-6 rounded-2xl shadow-xl flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-gray-100 transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#5B4DFB] hover:bg-[#4A3CE4] text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
          >
            {isEdit ? 'Save changes' : 'Create Requirement'}
          </button>
        </div>
    </>
  )
}
