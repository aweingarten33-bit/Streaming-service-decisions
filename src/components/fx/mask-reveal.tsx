"use client";


import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

/**
 * MaskReveal — the signature editorial reveal from the motion spec.
 * The child sits inside an overflow-hidden mask and rises from y:100% to 0
 * with a power4-style ease, so text/elements appear to slide up from behind
 * an invisible line. Restrained and premium, exactly the NYT/awwwards feel.
 */
export function MaskReveal({
  children,
  delay = 0,
  className,
  as = 'div',
  immediate = false,
}: {
  children: ReactNode
  delay?: number
  className?: string
  as?: 'div' | 'span'
  immediate?: boolean
}) {
  const Mask = as === 'span' ? 'span' : 'div'
  const motionProps = immediate
    ? { animate: { y: '0%' } }
    : {
        whileInView: { y: '0%' },
        viewport: { once: true, amount: 0.1 } as const,
      }
  return (
    <Mask className={`reveal-mask ${className ?? ''}`}>
      <motion.span
        style={{ display: 'block' }}
        initial={{ y: '110%' }}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay }}
        {...motionProps}
      >
        {children}
      </motion.span>
    </Mask>
  )
}

/**
 * Fade+rise reveal for blocks (cards, paragraphs) that don't need the hard mask.
 */
export function RiseReveal({
  children,
  delay = 0,
  y = 40,
  className,
  immediate = false,
}: {
  children: ReactNode
  delay?: number
  y?: number
  className?: string
  immediate?: boolean
}) {
  const motionProps = immediate
    ? { animate: { opacity: 1, y: 0 } }
    : {
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.1 } as const,
      }
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  )
}
