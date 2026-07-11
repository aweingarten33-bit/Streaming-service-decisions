"use client";


import { motion } from 'framer-motion'
import { SectionHeader } from '@/components/punk/section-header'

const LINES = [
  'Every lineup you build\u2014and every lineup you lose to\u2014is data.',
]

const CLOSERS = [
  'The goal isn\u2019t to predict exactly what will happen.',
  'The goal is to make the decision that gives you the greatest long-term edge.',
  'Because championships aren\u2019t won by being right once.',
  'They\u2019re won by making better decisions than everyone else\u2014again and again.',
]

export function Manifesto() {
  return (
    <section className="relative overflow-hidden border-y-2 border-ink bg-secondary text-ink">
      <div className="grid-dots pointer-events-none absolute inset-0 opacity-[0.5]" />
      <div className="relative mx-auto max-w-4xl px-4 py-24 md:py-32">
        <div className="edu-rule mb-3 w-full" />
        <div className="mb-10 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>The Philosophy</span>
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display text-5xl font-bold leading-[1.02] tracking-[-0.01em] text-balance sm:text-7xl"
        >
          Poker meets chess.
          <br />
          <span className="italic">Built for DFS.</span>
        </motion.h2>

        <div className="mt-12 space-y-4">
          {LINES.map((line, i) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="border-l-2 border-ink pl-5 font-serif text-lg leading-relaxed text-ink/85 sm:text-xl"
            >
              {line}
            </motion.p>
          ))}
        </div>

        <div className="mt-12 space-y-5 font-serif text-lg leading-relaxed text-ink/75 sm:text-xl">
          {CLOSERS.map((line, i) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className="text-pretty"
            >
              {line}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 border-t-2 border-ink pt-8"
        >
          <p className="edu-kicker">
            Most DFS tools stop at optimizing lineups.
          </p>
          <p className="font-display mt-3 text-4xl font-bold leading-[1.05] tracking-[-0.01em] sm:text-6xl">
            This one optimizes <span className="italic">you.</span>
          </p>
          <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-ink/80 text-pretty">
            This is the tool that analyzes your actual game history, runs the math, pinpoints
            exactly where you&apos;re leaking expected value, uncovers the patterns separating your
            decisions from winning ones, and shows you exactly how to improve. It tells you what to
            change&mdash;so every slate becomes another opportunity to make smarter, more profitable
            decisions.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
