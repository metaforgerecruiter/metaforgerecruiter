import { useEffect } from 'react'
import { buildTrackerRow, columnsForClient, saveTrackerLayout } from './trackerPresets.data'
import type { SubmitToLeadVmState } from './useSubmitToLeadPageState'
import { getClientEmailDefaults, sanitizeEmailList } from '../../../config/clientEmailDefaults'

export function useSubmitToLeadPageHandlers2(s: SubmitToLeadVmState & Record<string, any>) {
  const {
    selectedCandidates, requirement, recruiterName, setRecruiterEmail, setClientName, toRecipients,
    setToRecipients, ccRecipients, setCcRecipients, newToInput,
    setNewToInput, newCcInput, setNewCcInput, setToastMsg,
    columnList, setColumnList, hiddenColumns, setHiddenColumns,
    customColName, customColPosition, headerColor, setHeaderColor,
    clientName, setTrackerRows, setCustomColName
  } = s
  useEffect(() => {
    const layout = columnsForClient(clientName)
    setColumnList(layout.columns)
    setHiddenColumns(new Set(layout.hidden))
    setHeaderColor(layout.headerColor)
    const candidates = Array.isArray(selectedCandidates) ? selectedCandidates : []
    setTrackerRows(candidates.map((candidate: any, index: number) =>
      buildTrackerRow(layout.columns, candidate, index, { requirement, recruiterName })
    ))
  }, [])

  const handleClientChange = (newClient: string) => {
    setClientName(newClient)
    const layout = columnsForClient(newClient)
    setHeaderColor(layout.headerColor)
    setColumnList(layout.columns)
    setHiddenColumns(new Set(layout.hidden))
    const candidates = Array.isArray(selectedCandidates) ? selectedCandidates : []
    setTrackerRows(candidates.map((candidate: any, index: number) =>
      buildTrackerRow(layout.columns, candidate, index, { requirement, recruiterName })
    ))

    const defaults = getClientEmailDefaults(newClient)
    if (defaults?.submission) {
      if (defaults.submission.from) {
        setRecruiterEmail(defaults.submission.from)
      }
      setToRecipients(sanitizeEmailList(defaults.submission.to))
      setCcRecipients(sanitizeEmailList(defaults.submission.cc))
    } else {
      setToRecipients([])
      setCcRecipients([])
    }

    showToast(`Loaded tracker preset layout for ${newClient}!`)
  }

  const handleSaveLayout = () => {
    saveTrackerLayout(clientName, {
      columns: columnList,
      hidden: Array.from(hiddenColumns),
      headerColor,
    })
    showToast('Column layout & color preferences saved!')
  }

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  const handleAddToRecipient = () => {
    if (newToInput.trim() && newToInput.includes('@')) {
      setToRecipients(sanitizeEmailList([...toRecipients, newToInput.trim()]))
      setNewToInput('')
    }
  }

  const handleAddCcRecipient = () => {
    if (newCcInput.trim() && newCcInput.includes('@')) {
      setCcRecipients(sanitizeEmailList([...ccRecipients, newCcInput.trim()]))
      setNewCcInput('')
    }
  }

  const handleRemoveTo = (email: string) => {
    setToRecipients(toRecipients.filter((e: string) => e !== email))
  }

  const handleRemoveCc = (email: string) => {
    setCcRecipients(ccRecipients.filter((e: string) => e !== email))
  }

  const toggleColumnVisibility = (colName: string) => {
    const next = new Set(hiddenColumns)
    if (next.has(colName)) next.delete(colName)
    else next.add(colName)
    setHiddenColumns(next)
  }

  const handleInsertCustomColumn = () => {
    if (!customColName.trim()) return
    const col = customColName.trim()
    if (columnList.includes(col)) {
      showToast(`Column "${col}" already exists!`)
      return
    }

    if (customColPosition === 'At start') {
      setColumnList([col, ...columnList])
    } else {
      setColumnList([...columnList, col])
    }

    setTrackerRows((prev: Record<string, string>[]) =>
      prev.map((row: Record<string, string>) => ({
        ...row,
        [col]: '',
      }))
    )

    setCustomColName('')
    showToast(`Custom column "${col}" inserted into tracker!`)
  }

  return {
    handleClientChange, handleSaveLayout, showToast, handleAddToRecipient, handleAddCcRecipient,
    handleRemoveTo, handleRemoveCc, toggleColumnVisibility, handleInsertCustomColumn
  }
}
