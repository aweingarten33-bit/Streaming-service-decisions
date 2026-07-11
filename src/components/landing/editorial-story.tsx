"use client";

import { motion } from 'framer-motion'
import { ParticleMorph } from '@/components/fx/particle-morph'
import { ease, stagger } from '@/lib/motion'

const CHAPTERS = [
  { n: '01', k: 'Upload', b: 'Your entire DraftKings or FanDuel history — every entry, every sport, every buy-in — arrives as a single CSV. We never ask for lineups.' },
  { n: '02', k: 'Audit', b: 'The engine reconstructs every decision: entry sizing, format concentration, late swap discipline, tilt cadence. Nothing is smoothed away.' },
  { n: '03', k: 'Findings', b: 'Leaks are ranked by dollars lost, not vanity metrics. Each has a root cause and a specific, phased remedy — not a lecture.' },
]

/**
 * Scroll-driven storytelling. A sticky Three.js particle field morphs
 * between shapes as three chapters read past on the right rail. Editorial
 * cadence: each chapter enters with anticipation, holds, then defocuses
 * before the next takes the stage.
 */
export function EditorialStory() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-12 sm:px-10 lg:px-16 lg:py-14">
      <div className="mb-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.4em] text-[#e8e6df]/70">
        <span>The Pipeline</span>
        <span className="tabular-nums">0.00 → 1.00</span>
      </div>

      <div className="grid gap-10 border-y border-[#e8e6df]/15 py-8 lg:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-14">
        <div className="relative h-[320px] overflow-hidden border border-[#e8e6df]/15 sm:h-[380px] lg:sticky lg:top-24 lg:h-[440px]">
          <ParticleMorph />
        </div>

        <div className="grid gap-8 sm:gap-10">
          {CHAPTERS.map((c, i) => (
            <Chapter key={c.n} c={c} i={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Chapter({ c, i }: { c: (typeof CHAPTERS)[number]; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.8, delay: stagger(i, 0.08), ease: ease.emphatic }}
      className="border-b border-[#e8e6df]/12 pb-8 last:border-b-0 last:pb-0"
    >
      <motion.div
        className={`w-full ${i % 2 === 0 ? 'text-left' : 'text-left lg:text-right'}`}
      >
        <div className={`max-w-xl ${i % 2 === 0 ? '' : 'lg:ml-auto'}`}>
          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.4em] text-[#f5d100]">
            Chapter {c.n}
          </div>
          <motion.h3
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.6 }}
            transition={{ duration: 0.9, ease: ease.emphatic }}
            className="font-serif text-5xl font-black leading-[0.95] tracking-[-0.02em] text-[#e8e6df] sm:text-6xl"
          >
            {c.k}
          </motion.h3>
          <p className="mt-6 font-serif text-lg leading-relaxed text-[#a8a69c] sm:text-xl">
            {c.b}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}