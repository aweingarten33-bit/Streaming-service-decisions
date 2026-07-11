"use client";


import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface BrutalCardProps extends HTMLMotionProps<'div'> {
  border?: 'ink' | 'lime' | 'red' | 'orange'
  hover?: boolean
}

const borders: Record<string, string> = {
  ink: 'border-ink/15',
  lime: 'border-l-2 border-l-profit border-y border-r border-ink/15',
  red: 'border-l-2 border-l-hotred border-y border-r border-ink/15',
  orange: 'border-l-2 border-l-accent border-y border-r border-ink/15',
}

export const BrutalCard = forwardRef<HTMLDivElement, BrutalCardProps>(
  ({ className, border = 'ink', hover = false, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hover ? { y: -2 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        className={cn(
          'relative border bg-card',
          borders[border],
          hover && 'cursor-pointer transition-shadow hover:shadow-[0_6px_24px_-8px_rgba(18,18,18,0.18)]',
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    )
  },
)
BrutalCard.displayName = 'BrutalCard'
