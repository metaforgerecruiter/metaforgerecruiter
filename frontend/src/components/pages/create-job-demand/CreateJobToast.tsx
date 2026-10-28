import React from 'react'
import { CreateJobDemandVm } from './useCreateJobDemandForm'

export function CreateJobToast({ vm }: { vm: CreateJobDemandVm }) {
  const {
    toastMsg,
  } = vm
  return (
    <>
      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed bottom-16 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-gray-700 text-xs font-medium animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </>
  )
}
