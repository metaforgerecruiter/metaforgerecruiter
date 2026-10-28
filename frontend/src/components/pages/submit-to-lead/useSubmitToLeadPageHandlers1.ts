import React, { useState } from 'react'
import { buildTrackerRow } from './trackerPresets.data'
import type { SubmitToLeadVmState } from './useSubmitToLeadPageState'

export function useSubmitToLeadPageHandlers1(s: SubmitToLeadVmState) {
  const {
    selectedCandidates, requirement, recruiterName, columnList, setColumnList,
    setDraggedColIndex, dragOverColIndex, setDragOverColIndex, selectedColIndex,
    setSelectedColIndex, isDraggingRef, draggedColIndexRef, showToast
  } = s
  const handleDragStart = (e: React.DragEvent, index: number) => {
    isDraggingRef.current = true
    draggedColIndexRef.current = index
    setDraggedColIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColIndex !== index) {
      setDragOverColIndex(index)
    }
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColIndex !== index) {
      setDragOverColIndex(index)
    }
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    const rawData = e.dataTransfer.getData('text/plain')
    let fromIndex = draggedColIndexRef.current

    if (fromIndex === null && rawData) {
      const parsed = parseInt(rawData, 10)
      if (!isNaN(parsed)) fromIndex = parsed
    }

    if (fromIndex !== null && !isNaN(fromIndex) && fromIndex !== dropIndex) {
      const colName = columnList[fromIndex]
      setColumnList((prev: string[]) => {
        const next = [...prev]
        const [movedItem] = next.splice(fromIndex!, 1)
        next.splice(dropIndex, 0, movedItem)
        return next
      })
      showToast(`Placed "${colName}" at position ${dropIndex + 1}!`)
    }

    draggedColIndexRef.current = null
    setDraggedColIndex(null)
    setDragOverColIndex(null)
  }

  const handleDragEnd = () => {
    draggedColIndexRef.current = null
    setDraggedColIndex(null)
    setDragOverColIndex(null)
    setTimeout(() => {
      isDraggingRef.current = false
    }, 200)
  }

  const handleChipClick = (index: number) => {
    if (isDraggingRef.current) return

    if (selectedColIndex === null) {
      setSelectedColIndex(index)
      showToast(`Picked up "${columnList[index]}" — click target position to place it!`)
    } else if (selectedColIndex === index) {
      setSelectedColIndex(null)
    } else {
      setColumnList((prev: string[]) => {
        const next = [...prev]
        const [moved] = next.splice(selectedColIndex, 1)
        next.splice(index, 0, moved)
        return next
      })
      showToast(`Placed column at position ${index + 1}!`)
      setSelectedColIndex(null)
    }
  }

  const moveColumnLeft = (index: number) => {
    if (index <= 0) return
    setColumnList((prev: string[]) => {
      const next = [...prev]
      const [col] = next.splice(index, 1)
      next.splice(index - 1, 0, col)
      return next
    })
  }

  const moveColumnRight = (index: number) => {
    if (index >= columnList.length - 1) return
    setColumnList((prev: string[]) => {
      const next = [...prev]
      const [col] = next.splice(index, 1)
      next.splice(index + 1, 0, col)
      return next
    })
  }

  // Tracker Table Rows (100% Manually Editable)
  const [trackerRows, setTrackerRows] = useState<Record<string, string>[]>(() =>
    (selectedCandidates || []).map((candidate, index) =>
      buildTrackerRow(columnList, candidate, index, { requirement, recruiterName })
    )
  )

  return {
    handleDragStart, handleDragEnter, handleDragOver, handleDrop,
    handleDragEnd, handleChipClick, moveColumnLeft, moveColumnRight,
    trackerRows, setTrackerRows
  }
}
