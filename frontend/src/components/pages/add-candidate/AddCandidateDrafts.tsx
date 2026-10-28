import React from 'react'
import { Bookmark, Trash2, Play, Clock } from 'lucide-react'
import { AddCandidateVm } from './useAddCandidatePage'

export function AddCandidateDrafts({ vm }: { vm: AddCandidateVm }) {
  const {
    importMode,
    setImportMode,
    showSaveDraftToast,
    toastMsg,
    draftsList,
    handleLoadDraft,
    handleDeleteDraft,
    handleDirectSubmitDraft,
  } = vm
  return (
    <>
      {/* SAVED FOR LATER DRAFTS VIEW */}
      {importMode === 'drafts' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-amber-600" />
                Saved for Later Storage ({draftsList.length} Item{draftsList.length === 1 ? '' : 's'})
              </h2>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Draft profiles and job demands saved by recruiters and team leads. Click 'Resume Work' to load and complete entry.
              </p>
            </div>
            <button
              onClick={() => setImportMode('single')}
              className="px-4 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
            >
              + Create New Entry
            </button>
          </div>

          {draftsList.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draftsList.map(draft => (
                <div
                  key={draft.id}
                  onClick={() => handleLoadDraft(draft)}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition-all cursor-pointer group flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        draft.type === 'candidate'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {draft.type === 'candidate' ? 'Candidate Draft' : 'Requirement Draft'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {draft.savedAt}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-700 transition-colors">
                      {draft.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                      {draft.subtitle}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Saved by: <strong className="text-slate-600">{draft.createdBy}</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleDeleteDraft(draft.id, e)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDirectSubmitDraft(draft, e)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Submit Now
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLoadDraft(draft)}
                        className="px-4 py-1.5 bg-[#6B3BF6] hover:bg-[#5833E0] text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Resume Work</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No saved drafts found</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When you enter candidate or requirement details and click 'Save for Later', your draft will be stored here for future completion.
              </p>
            </div>
          )}
        </div>
      )}

      {/* DRAFT TOAST NOTIFICATIONS */}
      {showSaveDraftToast && (
        <div className="fixed top-5 right-5 z-50 bg-amber-800 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
          <Bookmark className="w-4 h-4 text-amber-300" />
          <span>Saved for Later! Candidate draft stored successfully.</span>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold animate-in fade-in duration-200">
          {toastMsg}
        </div>
      )}
    </>
  )
}
