'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useRef, type ReactNode } from 'react'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP)
}

export { gsap, ScrollTrigger, useGSAP }

const DEFAULT_EASE = 'power2.out'

export interface ScrollRevealOptions {
  y?: number
  x?: number
  opacity?: number
  duration?: number
  delay?: number
  ease?: string
  start?: string
  scrub?: boolean | number
  pin?: boolean
  stagger?: number
}

export interface EnterOptions {
  y?: number
  x?: number
  opacity?: number
  duration?: number
  delay?: number
  ease?: string
  stagger?: number
  /** CSS selector for children to stagger (relative to container) */
  childSelector?: string
}

/**
 * Scroll-driven reveal. Animates only transform + opacity; skips when
 * prefers-reduced-motion is set.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const containerRef = useRef<T | null>(null)
  const {
    y = 20,
    x = 0,
    opacity = 0,
    duration = 0.6,
    delay = 0,
    ease = DEFAULT_EASE,
    start = 'top 85%',
    scrub = false,
    stagger,
  } = options

  useGSAP(
    () => {
      if (!containerRef.current || typeof window === 'undefined') return

      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const target = containerRef.current
        if (!target) return

        gsap.from(target, {
          y,
          x,
          opacity,
          duration,
          delay,
          ease,
          stagger,
          scrollTrigger: {
            trigger: target,
            start,
            scrub,
            toggleActions: 'play none none reverse',
          },
        })
      })

      return () => mm.revert()
    },
    { scope: containerRef, dependencies: [y, x, opacity, duration, delay, ease, start, scrub, stagger] }
  )

  return containerRef
}

/**
 * Mount entrance for a page or panel (fade + slight rise).
 * Re-runs when `deps` change (e.g. navigation key).
 */
export function usePageEnter<T extends HTMLElement = HTMLDivElement>(
  options: EnterOptions = {},
  deps: unknown[] = []
) {
  const containerRef = useRef<T | null>(null)
  const {
    y = 14,
    x = 0,
    opacity = 0,
    duration = 0.45,
    delay = 0,
    ease = DEFAULT_EASE,
    stagger = 0.06,
    childSelector,
  } = options

  useGSAP(
    () => {
      if (!containerRef.current || typeof window === 'undefined') return

      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const root = containerRef.current
        if (!root) return

        const targets = childSelector
          ? root.querySelectorAll(childSelector)
          : [root]

        if (!targets.length) return

        gsap.from(targets, {
          y,
          x,
          opacity,
          duration,
          delay,
          ease,
          stagger: childSelector ? stagger : 0,
          clearProps: 'transform,opacity',
        })
      })

      return () => mm.revert()
    },
    { scope: containerRef, dependencies: [...deps, y, x, opacity, duration, delay, ease, stagger, childSelector] }
  )

  return containerRef
}

/**
 * Stagger children inside a container on mount (KPI grids, lists).
 */
export function useStaggerEnter<T extends HTMLElement = HTMLDivElement>(
  options: EnterOptions = {},
  deps: unknown[] = []
) {
  return usePageEnter<T>(
    {
      y: 16,
      duration: 0.4,
      stagger: 0.07,
      childSelector: ':scope > *',
      ...options,
    },
    deps
  )
}

/** Drop-in wrapper that plays a page-enter animation when `animationKey` changes. */
export function AnimatedPage({
  children,
  animationKey,
  className = '',
}: {
  children: ReactNode
  animationKey?: string | number
  className?: string
}) {
  const ref = usePageEnter<HTMLDivElement>(
    { y: 12, duration: 0.4 },
    [animationKey]
  )

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
