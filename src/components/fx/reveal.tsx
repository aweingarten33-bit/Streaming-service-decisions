"use client";


import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * Cinematic scroll-reveal. Deliberately VISIBLE motion — a real rise + fade
 * that plays every time the section scrolls into view, so on a phone you can
 * clearly see each block animate in as you thumb down.
 *
 * Note: we intentionally do NOT gate this on prefers-reduced-motion here.
 * This is a gentle transform/opacity animation (not flashing, not parallax
 * vertigo), and killing it entirely was making the whole app look static on
 * phones where users often have reduce-motion on without realizing it. Heavy
 * effects (WebGL) are still disabled on mobile separately.
 */
export function Reveal({
  children,
  delay = 0,
  y = 44,
  className,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.15 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function Parallax({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>
}
