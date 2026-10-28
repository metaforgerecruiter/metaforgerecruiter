import React from 'react'
import { Eye, EyeOff, ShieldAlert } from 'lucide-react'
import { checkDuplicateSubmission } from '../../../data/submissionsStore'
import { maskEmail, maskPhone } from './masking'
import { CandidateRepoItem } from './types'
import { CandidateRepoVm } from './useCandidateRepository'

export function CandidateTableRow({ item, vm }: { item: CandidateRepoItem; vm: CandidateRepoVm }) {
  const {
    unmaskedIds,
    selectedIds,
    activeReqId,
    setViewingCandidateDetail,
    toggleSelectCandidate,
    toggleMask,
    handleOpenEdit,
  } = vm

  const isUnmasked = unmaskedIds.has(item.id)
  const isSelected = selectedIds.has(item.id)
  const dupCheck = activeReqId
    ? checkDuplicateSubmission(activeReqId, {
        email: item.email,
        phone: item.phone,
        candidateId: item.candidateId,
        name: item.name,
      })
    : { isDuplicate: false }

  const candidateDisplayId = item.candidateId || '19799'

  return (
    <tr
      onClick={() => setViewingCandidateDetail(item)}
      className={`hover:bg-slate-50/80 cursor-pointer transition-colors group ${
        isSelected ? 'bg-indigo-50/40' : ''
      } ${dupCheck.isDuplicate ? 'bg-rose-50/20' : ''}`}
    >
      {/* Checkbox */}
      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={e => toggleSelectCandidate(item.id, e)}
          className="w-4 h-4 text-[#4F46E5] rounded-md focus:ring-[#4F46E5] cursor-pointer"
        />
      </td>

      {/* CANDIDATE Name & Candidate ID */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900 text-xs group-hover:text-[#4F46E5] transition-colors">
            {item.name}
          </span>
          {dupCheck.isDuplicate && (
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shrink-0 inline-flex items-center gap-1"
              title={`Already submitted by ${dupCheck.existingSubmission?.recruiter || 'another recruiter'}`}
            >
              <ShieldAlert className="w-3 h-3 text-rose-600" />
              <span>Duplicate Submission</span>
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 font-normal mt-0.5">
          {candidateDisplayId}
        </div>
      </td>

      {/* EMAIL */}
      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
        <div className="font-mono text-slate-700 text-xs truncate max-w-[220px]" title={isUnmasked ? item.email : maskEmail(item.email)}>
          {isUnmasked ? item.email : maskEmail(item.email)}
        </div>
      </td>

      {/* PHONE with Eye icon */}
      <td className="px-4 py-4 whitespace-nowrap" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1.5 font-mono text-slate-600 text-xs">
          <span>{isUnmasked ? item.phone : maskPhone(item.phone)}</span>
          <button
            type="button"
            onClick={e => toggleMask(item.id, e)}
            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            title={isUnmasked ? 'Mask contact info' : 'View unmasked contact info'}
          >
            {isUnmasked ? (
              <EyeOff className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
            )}
          </button>
        </div>
      </td>

      {/* TECHNOLOGY */}
      <td className="px-4 py-4 text-slate-800 text-xs font-normal max-w-[340px]">
        <span className="line-clamp-2" title={item.technology || item.skills}>
          {item.technology || item.skills || '—'}
        </span>
      </td>

      {/* TOTAL EXPERIENCE */}
      <td className="px-4 py-4 whitespace-nowrap text-slate-800 text-xs font-normal">
        {item.totalExperience || '—'}
      </td>

      {/* CREATED */}
      <td className="px-4 py-4 whitespace-nowrap text-slate-700 text-xs font-normal">
        {item.createdDate || '08 Oct 2026'}
      </td>

      {/* CREATED BY */}
      <td className="px-4 py-4 whitespace-nowrap text-slate-700 text-xs font-normal">
        {item.createdBy || 'Kalavathi Mallepogu'}
      </td>

      {/* EDIT Action Button */}
      <td className="px-4 py-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={e => handleOpenEdit(item, e)}
          className="px-3.5 py-1.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs active:scale-98"
        >
          Edit
        </button>
      </td>
    </tr>
  )
}
