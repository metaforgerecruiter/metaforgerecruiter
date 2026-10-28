import React from 'react'
import { SubmitToLeadTrackerCustomize } from './SubmitToLeadTrackerCustomize'
import { GripVertical, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react'
import { SubmitToLeadVm } from './useSubmitToLeadPage'
import { columnLabel } from './trackerPresets.data'

export function SubmitToLeadTracker({ vm }: { vm: SubmitToLeadVm }) {
  const {
    clientName,
    columnList,
    hiddenColumns,
    customColName,
    setCustomColName,
    customColPosition,
    setCustomColPosition,
    headerColor,
    setHeaderColor,
    draggedColIndex,
    dragOverColIndex,
    selectedColIndex,
    CLIENT_TRACKER_PRESETS,
    trackerRows,
    handleDragStart,
    handleDragEnter,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleChipClick,
    moveColumnLeft,
    moveColumnRight,
    handleClientChange,
    showToast,
    toggleColumnVisibility,
    handleInsertCustomColumn,
    handleUpdateCell,
    visibleColumns,
  } = vm
  return (
    <>
      {/* 6. CARD 5: CLIENT SUBMISSION TRACKER TABLE & CUSTOMIZATION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Client submission tracker</h3>
            <p className="text-xs text-slate-500">
              {CLIENT_TRACKER_PRESETS[clientName]?.subtitle || 'Client layout: review and edit before sending — the same grid is embedded in the client email.'}
            </p>
          </div>
          {/* Client Filter Relocated (With METAFORGE (INTERNAL) & Client Layout Presets) */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <label className="text-xs font-extrabold text-slate-700 whitespace-nowrap">Client Filter:</label>
            <select
              value={clientName}
              onChange={e => handleClientChange(e.target.value)}
              className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer shadow-2xs"
            >
              {Object.keys(CLIENT_TRACKER_PRESETS).map(preset => (
                <option key={preset} value={preset}>{preset}</option>
              ))}
            </select>
          </div>
        </div>

        {/* FORMAL YELLOW HEADER GRID TABLE (Manual Editable) */}
        <div className="border-2 border-slate-800 rounded-xl overflow-x-auto shadow-xs">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr style={{ backgroundColor: headerColor }} className="text-slate-950 font-black border-b-2 border-slate-800 text-[10px] uppercase">
                {visibleColumns.map((col: string, index: number) => (
                  <th key={`${col}-${index}`} className="p-2.5 border-r-2 border-slate-800">{columnLabel(col)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-800 font-semibold text-slate-900">
              {trackerRows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {visibleColumns.map((col: string, index: number) => (
                    <td key={`${col}-${index}`} className="p-1 border-r-2 border-slate-800">
                      <input
                        type="text"
                        value={row[col] || ''}
                        onChange={e => handleUpdateCell(rIdx, col, e.target.value)}
                        className="w-full px-2 py-1 bg-transparent focus:bg-white focus:outline-none text-xs font-mono"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

          <SubmitToLeadTrackerCustomize vm={vm} />
        </div>
    </>
  )
}
