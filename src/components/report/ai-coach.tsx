"use client";


import { useState } from 'react'
import { motion } from 'framer-motion'
import { Typewriter } from '@/components/punk/typewriter'
import { BrutalButton } from '@/components/punk/brutal-button'

export function AiCoach({ narrative }: { narrative: string }) {
  const [skip, setSkip] = useState(false)

  return (
    <div className="scanlines relative border border-lime bg-ink p-5 shadow-[0_6px_24px_-8px_rgba(18,18,18,0.18)] sm:p-6">
      <div className="mb-4 flex items-center justify-between border-b-[2px] border-lime/30 pb-3">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-profit">
          <span className="h-2 w-2 animate-pulse bg-lime" />
          AI COACH // VERDICT
        </div>
        {!skip && (
          <button
            onClick={() => setSkip(true)}
            className="font-mono text-[10px] uppercase tracking-widest text-profit/60 hover:text-profit"
          >
            [ skip animation ]
          </button>
        )}
      </div>
      <motion.pre
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-h-[520px] overflow-y-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-ink sm:text-sm"
      >
        {skip ? narrative : <Typewriter text={narrative} speed={6} />}
      </motion.pre>
      {!skip && (
        <div className="mt-4">
          <BrutalButton variant="lime" size="sm" onClick={() => setSkip(true)}>
            SHOW FULL VERDICT
          </BrutalButton>
        </div>
      )}
    </div>
  )
}
