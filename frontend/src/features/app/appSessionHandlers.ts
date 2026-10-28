import type { Dispatch, SetStateAction } from 'react'
import { AuthScreen, Role } from '../../types'
import { logoutRemote } from '../../data/authService'
import { clearSession } from '../../store/session'

export function createLogoutHandler(setScreen: Dispatch<SetStateAction<AuthScreen>>, setActiveNav: Dispatch<SetStateAction<string>>) {
  return () => {
    void logoutRemote()
    clearSession()
    setScreen('landing')
    setActiveNav('Requirements')
  }
}

export function createAuthenticatedHandler(
  setRole: Dispatch<SetStateAction<Role>>,
  setActiveNav: Dispatch<SetStateAction<string>>,
  setScreen: Dispatch<SetStateAction<AuthScreen>>,
) {
  return (r: Role) => {
    setRole(r)
    const defaultNav = (r === 'superadmin' || r === 'devteam' || r === 'admin' || r === 'lead') ? 'Requirements' : 'Dashboard'
    setActiveNav(defaultNav)
    setScreen('app')
  }
}

export function createNavSelectHandler(
  setSelectedReqIdForSubmit: Dispatch<SetStateAction<string | null>>,
  setActiveNav: Dispatch<SetStateAction<string>>,
) {
  return (nav: string) => {
    if (nav === 'Candidates' || nav === 'Candidate Search') {
      setSelectedReqIdForSubmit(null)
    }
    setActiveNav(nav)
  }
}
