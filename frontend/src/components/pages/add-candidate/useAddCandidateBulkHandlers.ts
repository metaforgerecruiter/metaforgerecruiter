import { apiErrorMessage } from '../../../services/candidatePayload'
import { RESUME_BULK_BATCH, filesService, resumeParserService, uploadedFileId, type ParsedResume } from '../../../services/workspace.service'
import type { AddCandidateVmState, BulkQueueItem } from './useAddCandidatePageState'

const ALLOWED = /\.(pdf|docx?|txt|png|jpe?g|webp|bmp|tiff?)$/i
const MAX_BYTES = 15 * 1024 * 1024

/**
 * Bulk import: resumes are queued, parsed by the backend in batches of RESUME_BULK_BATCH,
 * and stay in the queue until the recruiter reviews and submits (or removes) each one.
 */
export function useAddCandidateBulkHandlers(
  s: AddCandidateVmState,
  h: { applyParsedToForm: (d: ParsedResume) => void; showError: (m: string) => void },
) {
  const { bulkQueue, setBulkQueue, activeQueueId, setActiveQueueId, setSelectedFile, setResumeFileId } = s

  const patch = (ids: string[], update: (q: BulkQueueItem) => Partial<BulkQueueItem>) =>
    setBulkQueue((prev) => prev.map((q) => (ids.includes(q.id) ? { ...q, ...update(q) } : q)))

  const parseItems = async (items: BulkQueueItem[]) => {
    for (let i = 0; i < items.length; i += RESUME_BULK_BATCH) {
      const batch = items.slice(i, i + RESUME_BULK_BATCH)
      const ids = batch.map((b) => b.id)
      patch(ids, () => ({ status: 'parsing', error: undefined }))
      try {
        const [res, uploaded] = await Promise.all([
          resumeParserService.parseBulk(batch.map((b) => b.file)),
          Promise.all(batch.map(async (b) => {
            try {
              const stored = await filesService.upload(b.file)
              return { id: b.id, fileId: uploadedFileId(stored) }
            } catch {
              return { id: b.id, fileId: '' }
            }
          })),
        ])
        const fileIds = new Map(uploaded.map((item) => [item.id, item.fileId]))
        const results = res.results || []
        setBulkQueue((prev) =>
          prev.map((q) => {
            const idx = ids.indexOf(q.id)
            if (idx === -1) return q
            const r = results[idx]
            const storedId = fileIds.get(q.id) || q.resumeFileId
            if (r?.status === 'done' && r.data) {
              return { ...q, status: 'parsed', data: r.data, error: undefined, resumeFileId: storedId || undefined }
            }
            return { ...q, status: 'failed', error: r?.error || 'Could not parse this resume', resumeFileId: storedId || undefined }
          }),
        )
        if (res.notice) h.showError(`Parsed with the local parser: ${res.notice}`)
      } catch (err) {
        patch(ids, () => ({ status: 'failed', error: apiErrorMessage(err) }))
      }
    }
  }

  const handleAddBulkFiles = (files: File[]) => {
    const MAX_BULK_RESUMES = 5
    const activeItems = bulkQueue.filter((q) => q.status !== 'submitted')
    const availableSlots = Math.max(0, MAX_BULK_RESUMES - activeItems.length)

    if (availableSlots <= 0) {
      h.showError(
        `Limit reached: Maximum of ${MAX_BULK_RESUMES} resumes allowed in bulk import at a time. Please review, submit, or remove existing resumes before adding more.`
      )
      return
    }

    let filesToProcess = files
    if (filesToProcess.length > availableSlots) {
      h.showError(
        `Bulk import limit is ${MAX_BULK_RESUMES} resumes. Taking the first ${availableSlots} file(s) out of ${files.length}.`
      )
      filesToProcess = filesToProcess.slice(0, availableSlots)
    }

    const accepted: BulkQueueItem[] = []
    const rejected: string[] = []
    filesToProcess.forEach((file, i) => {
      if (!ALLOWED.test(file.name) || file.size > MAX_BYTES) {
        rejected.push(file.name)
        return
      }
      accepted.push({ id: `${Date.now()}-${i}-${file.name}`, file, status: 'queued' })
    })
    if (rejected.length) h.showError(`Skipped (unsupported type or over 15 MB): ${rejected.join(', ')}`)
    if (!accepted.length) return
    setBulkQueue((prev) => [...prev, ...accepted])
    void parseItems(accepted)
  }

  const handleReviewQueueItem = (id: string) => {
    const item = bulkQueue.find((q) => q.id === id)
    if (!item?.data) return
    setActiveQueueId(id)
    h.applyParsedToForm(item.data)
    setSelectedFile(item.file)
    setResumeFileId(item.resumeFileId || null)
  }

  const handleRetryQueueItem = (id: string) => {
    const item = bulkQueue.find((q) => q.id === id)
    if (item) void parseItems([item])
  }

  const handleRemoveQueueItem = (id: string) => {
    setBulkQueue((prev) => prev.filter((q) => q.id !== id))
    if (activeQueueId === id) setActiveQueueId(null)
  }

  const handleClearSubmitted = () => setBulkQueue((prev) => prev.filter((q) => q.status !== 'submitted'))

  const handleClearAll = () => {
    setBulkQueue([])
    if (activeQueueId) setActiveQueueId(null)
  }

  return { handleAddBulkFiles, handleReviewQueueItem, handleRetryQueueItem, handleRemoveQueueItem, handleClearSubmitted, handleClearAll }
}
