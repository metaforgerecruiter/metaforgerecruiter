import React, { useRef } from 'react'
import { Upload, Sparkles, Bookmark, FileText, CheckCircle2, X, Trash2 } from 'lucide-react'
import { AddCandidateVm } from './useAddCandidatePage'
import type { BulkQueueItem, BulkQueueStatus } from './useAddCandidatePageState'

export function AddCandidateParser({ vm }: { vm: AddCandidateVm }) {
  const {
    importMode,
    setImportMode,
    selectedFile,
    isParsing,
    parsedFileName,
    draftsList,
    handleParseResume,
    handleSelectResumeFile,
    handleAddBulkFiles,
    bulkQueue,
  } = vm

  const fileInputRef = useRef<HTMLInputElement>(null)
  const isBulk = importMode === 'bulk'
  const activeQueueCount = bulkQueue.filter((q) => q.status !== 'submitted').length
  const isQueueFull = isBulk && activeQueueCount >= 5

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const takeFiles = (list: FileList | null | undefined) => {
    const files = Array.from(list || [])
    if (!files.length) return
    if (isBulk) {
      handleAddBulkFiles(files)
      return
    }
    if (handleSelectResumeFile) {
      handleSelectResumeFile(files[0])
    } else {
      handleParseResume(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    takeFiles(e.target.files)
    e.target.value = '' // allow choosing the same file again
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    takeFiles(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const onParseClick = () => {
    if (isParsing) return
    if (selectedFile) {
      handleParseResume(selectedFile)
    } else {
      triggerFileSelect()
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
        multiple={isBulk}
        className="hidden"
        onChange={handleFileChange}
      />
      {/* SECTION 1: RESUME PARSER CARD */}
      <div className="bg-emerald-50/40 rounded-2xl border-2 border-dashed border-emerald-200 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Resume Parser
              {parsedFileName && (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Parsed: {parsedFileName}
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Drop resumes (PDF, DOCX, DOC, TXT) to auto-fill candidate details. In bulk mode, you can upload and parse up to 5 resumes at a time for fast AI processing and review.
            </p>
          </div>

          {/* SINGLE / BULK / DRAFTS IMPORT TOGGLE */}
          <div className="bg-emerald-100/70 p-1 rounded-lg flex items-center shrink-0 border border-emerald-200 flex-wrap gap-1">
            <button
              onClick={() => setImportMode('single')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                importMode === 'single'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-800 hover:text-emerald-900'
              }`}
            >
              Single candidate
            </button>
            <button
              onClick={() => setImportMode('bulk')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                importMode === 'bulk'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-800 hover:text-emerald-900'
              }`}
            >
              Bulk import (Max 5)
            </button>
            <button
              onClick={() => setImportMode('drafts')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                importMode === 'drafts'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-100/80 text-amber-900 hover:bg-amber-200 border border-amber-300/80'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5 text-amber-700" />
              <span>Saved for Later ({draftsList.length})</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          {/* DROPZONE AREA */}
          <div
            onClick={triggerFileSelect}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="w-full sm:w-80 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-5 text-center bg-white cursor-pointer transition-all hover:shadow-sm group"
          >
            {isBulk ? (
              isQueueFull ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-amber-800">
                    Bulk queue limit reached (5/5)
                  </p>
                  <p className="text-[10px] text-amber-700 mt-1">
                    Review, submit, or clear resumes to add more
                  </p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-slate-700">
                    Drop up to 5 resumes or <span className="text-blue-600 underline">browse</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    PDF, DOC, DOCX, TXT, images • Max 5 resumes • Max 15 MB each • Parsed automatically
                  </p>
                </>
              )
            ) : selectedFile ? (
              <div className="space-y-1">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800 truncate max-w-[240px] mx-auto">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-emerald-700 font-semibold">
                  Selected ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB) — Click Parse
                </p>
              </div>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-700">
                  Drop file here or <span className="text-blue-600 underline">browse</span>
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  PDF, DOC, DOCX, TXT, images • Max 15 MB
                </p>
              </>
            )}
          </div>

          {/* PARSE ACTIONS */}
          {isBulk ? (
            <BulkSummary queue={bulkQueue} />
          ) : (
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                const currentName = selectedFile?.name || parsedFileName
                if (currentName) alert(`Viewing file: ${currentName}`)
                else alert('Please upload or parse a resume first.')
              }}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              View
            </button>
            <button
              type="button"
              onClick={onParseClick}
              disabled={isParsing}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isParsing ? 'Parsing with AI...' : selectedFile ? 'Parse Selected Resume' : 'Parse resume'}
            </button>
          </div>
          )}
        </div>

        {isBulk && bulkQueue.length > 0 && <BulkQueueList vm={vm} />}
      </div>
    </>
  )
}

const STATUS_STYLE: Record<BulkQueueStatus, string> = {
  queued: 'bg-slate-100 text-slate-600',
  parsing: 'bg-blue-100 text-blue-700',
  parsed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-700',
  submitted: 'bg-violet-100 text-violet-700',
}

function BulkSummary({ queue }: { queue: BulkQueueItem[] }) {
  const count = (s: BulkQueueStatus) => queue.filter((q) => q.status === s).length
  const activeCount = queue.filter((q) => q.status !== 'submitted').length
  const busy = count('queued') + count('parsing')
  return (
    <div className="text-xs text-slate-600 shrink-0 text-right space-y-0.5">
      {queue.length === 0 ? (
        <p>Drop up to 5 resumes to start. Each one is parsed, then you review and submit it.</p>
      ) : (
        <>
          <p className="font-semibold text-slate-800">
            {activeCount}/5 active in queue • {count('submitted')} submitted
          </p>
          <p>
            {count('parsed')} ready to review
            {busy > 0 && <> • {busy} parsing</>}
            {count('failed') > 0 && <span className="text-red-600"> • {count('failed')} failed</span>}
          </p>
        </>
      )}
    </div>
  )
}

function BulkQueueList({ vm }: { vm: AddCandidateVm }) {
  const {
    bulkQueue,
    activeQueueId,
    handleReviewQueueItem,
    handleRetryQueueItem,
    handleRemoveQueueItem,
    handleClearSubmitted,
    handleClearAll,
  } = vm
  const activeCount = bulkQueue.filter((q) => q.status !== 'submitted').length
  return (
    <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
      <div className="flex items-center justify-between px-4 py-2">
        <p className="text-xs font-bold text-slate-800">Bulk import queue ({activeCount}/5 max)</p>
        <div className="flex items-center gap-3">
          {bulkQueue.some((q) => q.status === 'submitted') && (
            <button
              type="button"
              onClick={handleClearSubmitted}
              className="text-[11px] text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              Clear submitted
            </button>
          )}
          {bulkQueue.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
              title="Clear all resumes from the queue"
            >
              <Trash2 className="w-3 h-3 text-rose-500" />
              <span>Clear all</span>
            </button>
          )}
        </div>
      </div>
      {bulkQueue.map((q) => {
        const isActive = q.id === activeQueueId
        return (
          <div key={q.id} className={`flex flex-wrap items-center gap-3 px-4 py-2 text-xs ${isActive ? 'bg-emerald-50' : ''}`}>
            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800 truncate">
                {q.data?.candidateName || q.file.name}
                {isActive && <span className="ml-2 text-[10px] text-emerald-700">(in the form below)</span>}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {q.status === 'failed'
                  ? q.error
                  : [q.data?.technologies, q.data?.totalExperience, q.data?.currentLocation, q.file.name].filter(Boolean).join(' • ')}
              </p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${STATUS_STYLE[q.status]}`}>{q.status}</span>
            <div className="flex items-center gap-2">
              {q.status === 'parsed' && !isActive && (
                <button type="button" onClick={() => handleReviewQueueItem(q.id)} className="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700">
                  Review
                </button>
              )}
              {q.status === 'failed' && (
                <button type="button" onClick={() => handleRetryQueueItem(q.id)} className="px-2.5 py-1 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50">
                  Retry
                </button>
              )}
              {q.status !== 'parsing' && q.status !== 'submitted' && (
                <button type="button" onClick={() => handleRemoveQueueItem(q.id)} className="text-slate-400 hover:text-red-600" title="Remove from queue">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
