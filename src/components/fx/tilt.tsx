"use client";

import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

/**
 * 3D pointer-tilt card. Reads cursor position over the element and rotates
 * on X/Y with a spring. Adds a subtle sheen gradient that follows the pointer.
 */
export function TiltCard({
  children,
  className,
  max = 8,
}: {
  children: ReactNode
  className?: string
  max?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const px = useMotionValue(0.5)
  const py = useMotionValue(0.5)
  const spx = useSpring(px, { stiffness: 200, damping: 20 })
  const spy = useSpring(py, { stiffness: 200, damping: 20 })
  const rotateY = useTransform(spx, [0, 1], [-max, max])
  const rotateX = useTransform(spy, [0, 1], [max, -max])
  const sheenX = useTransform(spx, [0, 1], ['0%', '100%'])
  const sheenY = useTransform(spy, [0, 1], ['0%', '100%'])

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    px.set((e.clientX - r.left) / r.width)
    py.set((e.clientY - r.top) / r.height)
  }
  const reset = () => {
    px.set(0.5)
    py.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d', transformPerspective: 900 }}
      className={className}
    >
      {children}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          background: 'radial-gradient(circle at var(--sx) var(--sy), #121212 0%, transparent 40%)',
          ['--sx' as string]: sheenX,
          ['--sy' as string]: sheenY,
        }}
      />
    </motion.div>
  )
}