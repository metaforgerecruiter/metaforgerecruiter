import React from 'react'
import { Upload, Sparkles } from 'lucide-react'
import { CreateJobDemandVm } from './useCreateJobDemandForm'

export function CreateJobExtract({ vm }: { vm: CreateJobDemandVm }) {
  const {
    jdText,
    setJdText,
    isExtracting,
    handleExtractAndAutoFill,
  } = vm
  return (
    <>
        {/* EXTRACT & AUTO-FILL CARD */}
        <div className="bg-blue-50/40 border border-dashed border-blue-200 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            {/* Option 1: File Upload */}
            <div className="flex-1 space-y-2">
              <div className="text-xs font-bold text-indigo-900">Extract & Auto-fill (optional)</div>
              <p className="text-[11px] text-indigo-700">
                Option 1: Upload a JD document (PDF or DOCX, max 10MB). Option 2: Paste JD text below. Then click Extract & Auto-fill.
              </p>

              <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-white/80 rounded-2xl p-6 text-center transition-all cursor-pointer group">
                <Upload className="w-6 h-6 text-indigo-400 mx-auto group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-700 mt-2">
                  Drop file here or <span className="text-indigo-600 hover:underline">browse</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">PDF, DOCX • Max 10.0 MB</div>
              </div>
            </div>

            {/* Middle Extract Button */}
            <div className="flex items-center justify-center self-center py-2">
              <button
                type="button"
                onClick={handleExtractAndAutoFill}
                disabled={isExtracting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isExtracting ? 'Extracting...' : 'Extract & Auto-fill'}</span>
              </button>
            </div>

            {/* Option 2: Paste JD Text */}
            <div className="flex-1 space-y-2">
              <div className="text-xs font-bold text-slate-700">Or paste JD here for Extract & Auto-fill (optional)</div>
              <p className="text-[11px] text-slate-400">
                Paste a job description to use Extract & Auto-fill. Not required for creating a requirement.
              </p>

              <textarea
                value={jdText}
                onChange={e => setJdText(e.target.value)}
                placeholder="Paste JD text here (min 50 chars for Extract & Auto-fill)..."
                className="w-full h-28 bg-white border border-slate-200 rounded-2xl p-3 text-xs focus:ring-2 focus:ring-[#6B3BF6]/20 focus:border-[#6B3BF6] outline-none resize-none placeholder:text-slate-300"
              />
            </div>
          </div>
        </div>
    </>
  )
}
