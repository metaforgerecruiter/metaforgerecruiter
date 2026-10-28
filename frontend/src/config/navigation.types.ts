export interface NavItem {
  key: string
  label: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export interface PageMeta {
  title: string
  description: string
  actions?: string[]
  columns?: string[]
  sampleRows?: string[][]
}
