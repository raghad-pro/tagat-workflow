'use client'

import { useEffect, useRef, useState } from 'react'

// Scroll-reveal wrapper: adds .in when the element enters the viewport.
// Uses one IntersectionObserver per element, disconnects after reveal (cheap).
export default function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }: any) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!('IntersectionObserver' in window)) {
      setShown(true)
      return
    }
    const obs = new IntersectionObserver(
      (entries: any) => {
        if (entries[0].isIntersecting) {
          setShown(true)
          obs.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? 'in' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
