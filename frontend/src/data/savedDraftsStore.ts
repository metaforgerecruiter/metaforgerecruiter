export interface SavedDraftItem {
  id: string
  type: 'candidate' | 'requirement'
  title: string
  subtitle: string
  savedAt: string
  createdBy: string
  status?: string
  data: any
}

let draftsMemory: SavedDraftItem[] = []

export function getSavedDrafts(): SavedDraftItem[] {
  return draftsMemory
}

export function saveDraftItem(item: Omit<SavedDraftItem, 'id' | 'savedAt'>): SavedDraftItem {
  const current = getSavedDrafts()
  const newItem: SavedDraftItem = {
    ...item,
    id: `DRAFT-${Date.now()}`,
    savedAt: new Date().toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
  draftsMemory = [newItem, ...current]
  return newItem
}

export function removeSavedDraft(id: string): SavedDraftItem[] {
  draftsMemory = getSavedDrafts().filter(item => item.id !== id)
  return draftsMemory
}
