"use client";


import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

type Variant = 'ink' | 'lime' | 'red' | 'orange' | 'ghost'

const variants: Record<Variant, string> = {
  ink: 'bg-ink text-paper border-ink hover:bg-paper hover:text-ink',
  lime: 'bg-ink text-paper border-ink hover:bg-paper hover:text-ink',
  red: 'bg-hotred text-paper border-hotred hover:bg-paper hover:text-hotred',
  orange: 'bg-paper text-ink border-ink hover:bg-ink hover:text-paper',
  ghost: 'bg-transparent text-ink border-ink hover:bg-ink hover:text-paper',
}

interface BrutalButtonProps extends HTMLMotionProps<'button'> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
}

export const BrutalButton = forwardRef<HTMLButtonElement, BrutalButtonProps>(
  ({ className, variant = 'ink', size = 'md', children, ...props }, ref) => {
    const sizes = {
      sm: 'px-4 py-2 text-xs min-h-[40px]',
      md: 'px-6 py-3 text-sm min-h-[48px]',
      lg: 'px-8 py-4 text-sm min-h-[56px]',
    }
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
        className={cn(
          'group relative inline-flex items-center justify-center gap-2 border-2 font-sans font-semibold uppercase tracking-wide transition-colors duration-200',
          'disabled:pointer-events-none disabled:opacity-40',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </motion.button>
    )
  },
)
BrutalButton.displayName = 'BrutalButton'
