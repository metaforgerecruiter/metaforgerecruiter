import React, { useState } from 'react'

export function useCandidateRepoMasking() {
  const [unmaskedIds, setUnmaskedIds] = useState<Set<string>>(new Set())
  const [unmaskedTimers, setUnmaskedTimers] = useState<{ [id: string]: number }>({})

  const timerRefs = React.useRef<{ [id: string]: NodeJS.Timeout }>({})
  const intervalRefs = React.useRef<{ [id: string]: NodeJS.Timeout }>({})

  // Clean up timers on unmount
  React.useEffect(() => {
    return () => {
      Object.values(timerRefs.current).forEach(clearTimeout)
      Object.values(intervalRefs.current).forEach(clearInterval)
    }
  }, [])

  const clearCandidateTimers = (id: string) => {
    if (timerRefs.current[id]) {
      clearTimeout(timerRefs.current[id])
      delete timerRefs.current[id]
    }
    if (intervalRefs.current[id]) {
      clearInterval(intervalRefs.current[id])
      delete intervalRefs.current[id]
    }
  }

  const toggleMask = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()

    if (unmaskedIds.has(id)) {
      // Re-mask immediately
      clearCandidateTimers(id)
      setUnmaskedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      setUnmaskedTimers(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } else {
      // Unmask with 20-second session timeout
      clearCandidateTimers(id)

      setUnmaskedIds(prev => new Set(prev).add(id))
      setUnmaskedTimers(prev => ({ ...prev, [id]: 20 }))

      // Countdown timer interval (updates badge seconds: 20, 19, 18...)
      intervalRefs.current[id] = setInterval(() => {
        setUnmaskedTimers(prev => {
          const currentVal = prev[id] ?? 0
          if (currentVal <= 1) {
            const next = { ...prev }
            delete next[id]
            return next
          }
          return { ...prev, [id]: currentVal - 1 }
        })
      }, 1000)

      // Auto re-mask after 20 seconds
      timerRefs.current[id] = setTimeout(() => {
        clearCandidateTimers(id)
        setUnmaskedIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        setUnmaskedTimers(prev => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      }, 20000)
    }
  }

  return { unmaskedIds, unmaskedTimers, toggleMask }
}
