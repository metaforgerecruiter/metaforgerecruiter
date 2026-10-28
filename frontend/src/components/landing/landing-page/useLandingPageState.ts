import type { LandingPageProps } from './preamble'
import { useState, useMemo, useEffect, useRef } from 'react'
import React from 'react'

export function useLandingPageState(props: LandingPageProps) {
  const { onSignIn, onRequestAccess }: LandingPageProps = props as LandingPageProps & Record<string, never>
  const [menuOpen, setMenuOpen] = useState(false)

  return {
    onSignIn,
    onRequestAccess,
    menuOpen,
    setMenuOpen,
  }
}
export type LandingVmState = ReturnType<typeof useLandingPageState>
