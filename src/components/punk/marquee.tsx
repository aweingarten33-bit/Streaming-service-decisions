"use client";


import { cn } from '@/lib/utils'
import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion'

interface MarqueeProps {
  items: string[]
  className?: string
  color?: 'lime' | 'red' | 'white' | 'orange'
}

const colors: Record<string, string> = {
  lime: 'bg-ink text-paper',
  red: 'bg-ink text-paper',
  white: 'bg-paper text-ink',
  orange: 'bg-ink text-paper',
}

export function Marquee({ items, className, color = 'lime' }: MarqueeProps) {
  const doubled = [...items, ...items]
  const ref = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const velocity = useVelocity(scrollY)
  const smooth = useSpring(velocity, { stiffness: 400, damping: 50 })
  const skew = useTransform(smooth, [-2000, 0, 2000], [-8, 0, 8])
  return (
    <div
      ref={ref}
      className={cn(
        'relative flex overflow-hidden border-y border-ink py-2.5 select-none',
        colors[color],
        className,
      )}
    >
      <motion.div
        style={{ skewX: skew }}
        className="marquee-track flex shrink-0 items-center gap-6 pr-6 font-mono text-xs uppercase tracking-[0.2em]"
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-6">
            {item}
            <span className="opacity-40 leading-none">/</span>
          </span>
        ))}
      </motion.div>
      <motion.div
        aria-hidden
        style={{ skewX: skew }}
        className="marquee-track flex shrink-0 items-center gap-6 pr-6 font-mono text-xs uppercase tracking-[0.2em]"
      >
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-6">
            {item}
            <span className="opacity-40 leading-none">/</span>
          </span>
        ))}
      </motion.div>
    </div>
  )
}
