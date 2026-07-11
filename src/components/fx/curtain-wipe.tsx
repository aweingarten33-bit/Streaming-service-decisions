"use client";

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

/**
 * CurtainWipe — cinematic transition between two dark sections. As the
 * container enters, two panels part vertically to reveal children, with a
 * scale + blur pop on the content itself.
 */
export function CurtainWipe({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'start 0.25'] })
  const topY = useTransform(scrollYProgress, [0, 1], ['0%', '-100%'])
  const bottomY = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const scale = useTransform(scrollYProgress, [0, 1], [1.08, 1])
  const blur = useTransform(scrollYProgress, [0, 1], [12, 0])
  const filter = useTransform(blur, (b) => `blur(${b}px)`)

  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ''}`}>
      <motion.div style={{ scale, filter }}>{children}</motion.div>
      <motion.div
        aria-hidden
        style={{ y: topY }}
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[#05070d]"
      />
      <motion.div
        aria-hidden
        style={{ y: bottomY }}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[#05070d]"
      />
    </div>
  )
}