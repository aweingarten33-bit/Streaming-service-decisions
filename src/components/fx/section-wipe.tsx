"use client";

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

/**
 * SectionWipe — wraps a section with a clip-path reveal. As the top of the
 * section enters the viewport, the clip-path opens from an inset rectangle
 * to full, revealing the content from behind an editorial mask.
 */
export function SectionWipe({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.9', 'start 0.4'],
  })
  const inset = useTransform(scrollYProgress, [0, 1], [6, 0])
  const clipPath = useTransform(
    inset,
    (v) => `inset(${v}% ${v}% ${v}% ${v}%)`,
  )
  return (
    <motion.div ref={ref} style={{ clipPath }} className={className}>
      {children}
    </motion.div>
  )
}