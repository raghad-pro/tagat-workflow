'use client'

import { useEffect, useRef, useState } from 'react'

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduced(mq.matches)
    const onChange = (e: any) => setReduced(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return reduced
}

// Tracks whether an element is near the viewport. `once` keeps it true after
// the first hit (mount-and-keep); otherwise it toggles, which lets WebGL
// backgrounds pause when scrolled away.
export function useNearViewport(margin = '200px', once = false) {
  const ref = useRef(null)
  const [near, setNear] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setNear(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries: any) => {
        const hit = entries[0].isIntersecting
        if (hit) {
          setNear(true)
          if (once) obs.disconnect()
        } else if (!once) {
          setNear(false)
        }
      },
      { rootMargin: margin }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [margin, once])

  return [ref, near] as const
}
