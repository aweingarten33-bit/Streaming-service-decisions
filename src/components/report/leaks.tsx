"use client";


import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { Leak } from '@/lib/types'
import { cn } from '@/lib/utils'

const severityStyle: Record<Leak['severity'], { border: string; badge: string; text: string }> = {
  CRITICAL: { border: 'border-hotred', badge: 'bg-hotred text-paper', text: 'text-hotred' },
  HIGH: { border: 'border-orange', badge: 'bg-orange text-paper', text: 'text-ink' },
  MEDIUM: { border: 'border-ink', badge: 'bg-ink text-paper', text: 'text-ink' },
}

export function LeaksAccordion({ leaks }: { leaks: Leak[] }) {
  const [open, setOpen] = useState<string | null>(leaks[0]?.id ?? null)

  if (!leaks.length) {
    return (
      <div className="border border-profit p-6 font-mono text-sm text-profit">
        NO DOMINANT LEAK DETECTED. YOUR PROCESS IS TIGHT — KEEP THE VOLUME DISCIPLINED.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {leaks.map((leak, i) => {
        const s = severityStyle[leak.severity]
        const isOpen = open === leak.id
        return (
          <motion.div
            key={leak.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className={cn('border bg-card', s.border)}
          >
            <button
              onClick={() => setOpen(isOpen ? null : leak.id)}
              className="flex w-full items-center gap-4 p-4 text-left"
            >
              <span className="font-display text-4xl leading-none text-ink/25">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={cn('shrink-0 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-widest', s.badge)}>
                {leak.severity}
              </span>
              <span className="flex-1 font-display text-xl leading-tight tracking-tight text-ink sm:text-2xl">
                {leak.title}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                className={cn('font-mono text-2xl leading-none', s.text)}
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t-[2px] border-ink/10 p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
                      THE DATA
                    </p>
                    <p className="mt-1 font-mono text-sm text-ink">{leak.data}</p>
                    <p className="mt-4 font-mono text-xs uppercase tracking-widest text-profit">
                      THE FIX
                    </p>
                    <p className="mt-1 font-sans text-sm leading-relaxed text-ink">{leak.fix}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
