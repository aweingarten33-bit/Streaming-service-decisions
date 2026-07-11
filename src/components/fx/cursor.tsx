"use client";

import { useEffect, useRef, useState } from 'react'

/**
 * Custom cursor blob — soft ink circle that lags the pointer with a spring,
 * scales up on interactive elements, and inverts to a hollow ring on hover.
 * Auto-disables on touch + reduced-motion. Native cursor stays hidden only
 * on desktop pointers.
 */
export function CustomCursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const finePointer = window.matchMedia('(pointer: fine)').matches
    if (reduce || isTouch || !finePointer) return
    setEnabled(true)

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rx = x
    let ry = y
    let raf = 0

    const onMove = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      if (dot.current) {
        dot.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      }
    }

    const loop = () => {
      rx += (x - rx) * 0.18
      ry += (y - ry) * 0.18
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px, ${ry}px, 0)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onOver = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null
      const interactive = t?.closest('a, button, [role="button"], input, textarea, select, [data-cursor="hover"]')
      if (ring.current) {
        ring.current.dataset.state = interactive ? 'hover' : 'idle'
      }
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('mouseover', onOver)
    document.documentElement.classList.add('cursor-none-root')

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('mouseover', onOver)
      document.documentElement.classList.remove('cursor-none-root')
    }
  }, [])

  if (!enabled) return null

  return (
    <>
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] -ml-1 -mt-1 h-2 w-2 rounded-full bg-ink mix-blend-difference"
        style={{ transform: 'translate3d(-100px,-100px,0)' }}
      />
      <div
        ref={ring}
        aria-hidden
        data-state="idle"
        className="pointer-events-none fixed left-0 top-0 z-[9998] -ml-6 -mt-6 h-12 w-12 rounded-full border border-ink mix-blend-difference transition-[width,height,margin,border-color,background] duration-200 ease-out data-[state=hover]:-ml-9 data-[state=hover]:-mt-9 data-[state=hover]:h-[72px] data-[state=hover]:w-[72px] data-[state=hover]:bg-ink/10"
        style={{ transform: 'translate3d(-100px,-100px,0)' }}
      />
    </>
  )
}