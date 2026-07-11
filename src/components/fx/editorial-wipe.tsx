"use client";

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef, type ReactNode } from 'react'

/**
 * Cinematic section transition — two ivory panels part vertically as the
 * section scrolls in, with the content anticipating (scale 1.06 → 1),
 * a de-focusing blur that resolves, and a settled hold. Every scene enters
 * the way a film cut resolves: anticipation → acceleration → settle.
 */
export function EditorialWipe({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.92', 'start 0.45'] })
  const topY = useTransform(scrollYProgress, [0, 1], ['0%', '-100%'])
  const bottomY = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const scale = useTransform(scrollYProgress, [0, 0.8, 1], [1.02, 1.002, 1])
  const blur = useTransform(scrollYProgress, [0, 1], [5, 0])
  const filter = useTransform(blur, (b) => `blur(${b}px)`)

  return (
    <div ref={ref} className={`relative overflow-hidden ${className ?? ''}`}>
      <motion.div style={{ scale, filter }}>{children}</motion.div>
      <motion.div aria-hidden style={{ y: topY }} className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-[#f6f2ea]" />
      <motion.div aria-hidden style={{ y: bottomY }} className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[#f6f2ea]" />
      {/* hairline rule reveals with the wipe */}
      <motion.div
        aria-hidden
        style={{ scaleX: scrollYProgress }}
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px origin-left bg-[#1a1512]/40"
      />
    </div>
  )
}