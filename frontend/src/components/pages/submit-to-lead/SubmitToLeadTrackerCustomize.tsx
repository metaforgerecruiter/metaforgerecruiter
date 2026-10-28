import React from 'react'
import { GripVertical, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { SubmitToLeadVm } from './useSubmitToLeadPage'

export function SubmitToLeadTrackerCustomize({ vm }: { vm: SubmitToLeadVm }) {
  const {
    columnList, hiddenColumns, customColName, setCustomColName,
    customColPosition, setCustomColPosition, headerColor, setHeaderColor,
    draggedColIndex, dragOverColIndex, selectedColIndex,
    handleDragStart, handleDragEnter, handleDragOver, handleDrop, handleDragEnd,
    handleChipClick, moveColumnLeft, moveColumnRight, handleSaveLayout,
    toggleColumnVisibility, handleInsertCustomColumn, visibleColumns,
  } = vm
  return (
    <>
        {/* TRACKER CUSTOMIZATION PANEL */}
        <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-5 space-y-4">
          <span className="text-xs font-extrabold text-slate-900 block">Tracker customization</span>

          {/* ADD CUSTOM COLUMN */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              ADD CUSTOM COLUMN
            </span>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Column name"
                value={customColName}
                onChange={e => setCustomColName(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
              <select
                value={customColPosition}
                onChange={e => setCustomColPosition(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer"
              >
                <option value="At start">At start</option>
                <option value="At end">At end</option>
              </select>
              <button
                type="button"
                onClick={handleInsertCustomColumn}
                className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                + Insert
              </button>
            </div>
          </div>

          {/* COLUMN LAYOUT CHIPS (DRAG AND DROP REORDERABLE) */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                COLUMN LAYOUT ({visibleColumns.length} VISIBLE / {columnList.length} TOTAL)
              </span>
              <span className="text-[10px] text-[#6B3BF6] font-bold flex items-center gap-1">
                <GripVertical className="w-3 h-3" />
                <span>Drag & drop chips to change column position</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {columnList.map((col: string, index: number) => {
                const isHidden = hiddenColumns.has(col)
                const isDragging = draggedColIndex === index
                const isDragOver = dragOverColIndex === index
                const isSelected = selectedColIndex === index

                return (
                  <div
                    key={col}
                    draggable
                    onDragStart={e => handleDragStart(e, index)}
                    onDragEnter={e => handleDragEnter(e, index)}
                    onDragOver={e => handleDragOver(e, index)}
                    onDrop={e => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleChipClick(index)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-2xs transition-all select-none cursor-grab active:cursor-grabbing ${
                      isDragging
                        ? 'opacity-40 scale-95 border-2 border-dashed border-[#6B3BF6] bg-purple-50'
                        : isDragOver
                        ? 'ring-4 ring-[#6B3BF6]/40 scale-105 bg-purple-100 border-[#6B3BF6]'
                        : isSelected
                        ? 'ring-2 ring-amber-500 bg-amber-100 border-amber-400 scale-105'
                        : isHidden
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 line-through'
                        : 'bg-emerald-50 text-emerald-900 border border-emerald-200 hover:border-emerald-400 hover:shadow-xs'
                    }`}
                    title="Drag or click to reorder position"
                  >
                    <div className={`flex items-center gap-1.5 ${draggedColIndex !== null ? 'pointer-events-none' : ''}`}>
                      {/* Drag Handle */}
                      <span className="p-0.5 shrink-0">
                        <GripVertical className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                      </span>

                      {/* Left Move Button */}
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            moveColumnLeft(index)
                          }}
                          className="p-0.5 hover:bg-black/10 rounded text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
                          title="Move left"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                      )}

                      <span className="whitespace-nowrap">{col.replace(/\u200b/g, '')}</span>

                      {/* Right Move Button */}
                      {index < columnList.length - 1 && (
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation()
                            moveColumnRight(index)
                          }}
                          className="p-0.5 hover:bg-black/10 rounded text-slate-500 hover:text-slate-900 cursor-pointer shrink-0"
                          title="Move right"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}

                      {/* Visibility Toggle Button */}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation()
                          toggleColumnVisibility(col)
                        }}
                        className="cursor-pointer hover:scale-110 transition-transform p-0.5 ml-0.5 shrink-0"
                        title={isHidden ? 'Click to show column' : 'Click to hide column'}
                      >
                        {isHidden ? (
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <Eye className="w-3.5 h-3.5 text-emerald-700" />
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* APPEARANCE HEADER COLOR */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">APPEARANCE</span>
              <span className="text-xs text-slate-600 font-medium">Header row color</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={headerColor}
                onChange={e => setHeaderColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
              />
              <input
                type="text"
                value={headerColor}
                onChange={e => setHeaderColor(e.target.value)}
                className="w-24 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={handleSaveLayout}
              className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
            >
              Save layout
            </button>
          </div>
        </div>
    </>
  )
}
