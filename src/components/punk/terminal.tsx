"use client";


import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TerminalProps {
  lines: string[]
  className?: string
  lineDelay?: number
  onComplete?: () => void
}

/** Prints terminal lines sequentially with a blinking cursor. */
export function Terminal({ lines, className, lineDelay = 420, onComplete }: TerminalProps) {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    if (visible >= lines.length) {
      onComplete?.()
      return
    }
    const t = setTimeout(() => setVisible((v) => v + 1), lineDelay)
    return () => clearTimeout(t)
  }, [visible, lines.length, lineDelay, onComplete])

  return (
    <div
      className={cn(
        'scanlines relative border border-lime bg-ink p-5 font-mono text-sm text-profit shadow-[0_6px_24px_-8px_rgba(18,18,18,0.18)]',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2 border-b-[2px] border-lime/30 pb-2 text-xs uppercase tracking-widest">
        <span className="h-2.5 w-2.5 bg-hotred" />
        <span className="h-2.5 w-2.5 bg-orange" />
        <span className="h-2.5 w-2.5 bg-lime" />
        <span className="ml-2 text-profit/60">dfs-analysis-engine://</span>
      </div>
      <div className="space-y-1">
        {lines.slice(0, visible).map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-2"
          >
            <span className="text-profit/50">$</span>
            <span className={line.startsWith('!') ? 'text-hotred' : ''}>
              {line.replace(/^!/, '')}
            </span>
          </motion.div>
        ))}
        {visible < lines.length && (
          <div className="flex gap-2">
            <span className="text-profit/50">$</span>
            <span className="cursor-blink" />
          </div>
        )}
      </div>
    </div>
  )
}
