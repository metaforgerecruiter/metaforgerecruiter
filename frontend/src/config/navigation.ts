import { Role } from '../types'
import { NavItem } from './navigation.types'
import { ROLE_NAV } from './roleNav'
import { UNIVERSAL_NAV } from './universalNav'

export type { NavItem, NavSection, PageMeta } from './navigation.types'
export { ROLE_NAV } from './roleNav'
export { PAGE_META } from './pageMeta'
export { UNIVERSAL_NAV } from './universalNav'

export function getPageTitle(role: Role, key: string): string {
  if (key === 'My Profile' || key === 'Profile') return 'My Profile'
  for (const section of ROLE_NAV[role]) {
    const item = section.items.find(i => i.key === key)
    if (item) return item.label
  }
  const universal = UNIVERSAL_NAV.find(i => i.key === key)
  return universal?.label || key
}

export function flattenNav(role: Role): NavItem[] {
  return [...ROLE_NAV[role].flatMap(s => s.items), ...UNIVERSAL_NAV]
}
