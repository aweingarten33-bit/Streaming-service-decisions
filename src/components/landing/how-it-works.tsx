"use client";


import Link from 'next/link'
import { motion } from 'framer-motion'
import { SectionHeader } from '@/components/punk/section-header'
import { BrutalButton } from '@/components/punk/brutal-button'
import { stagger, staggerItem } from '@/components/punk/page-transition'

const STEPS = [
  {
    n: '01',
    title: 'DROP YOUR CSV',
    body: 'Export your contest history from DraftKings or FanDuel and drag it in. Header-tolerant parsing handles format drift and multi-file splits.',
  },
  {
    n: '02',
    title: 'WE RUN THE MATH',
    body: 'Every stat is computed in JavaScript — ROI, win rate, buckets, bankroll risk, trends. The numbers never touch an LLM.',
  },
  {
    n: '03',
    title: 'GET THE DIAGNOSIS',
    body: 'Read your health scorecard, work through root-cause findings, and follow the phased action roadmap. Export it to PDF or Word. Fix it. Re-upload. Repeat.',
  },
]

export function HowItWorks() {
  return (
    <section className="relative border-y border-ink/15 bg-secondary">
      <div className="relative mx-auto max-w-5xl px-5 py-20 sm:px-8">
        <SectionHeader index="02" label="The Process" title="Three steps to stop the bleeding." />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-x-10 gap-y-8 md:grid-cols-3"
        >
          {STEPS.map((s) => (
            <motion.div key={s.n} variants={staggerItem} className="border-t-2 border-ink pt-5">
              <div className="font-display text-5xl font-bold leading-none text-ink">{s.n}</div>
              <h3 className="font-display mt-3 text-xl font-bold tracking-tight text-ink">{s.title}</h3>
              <p className="mt-2 font-serif text-base leading-relaxed text-ink/75">{s.body}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-12 flex justify-center">
          <Link href="/upload">
            <BrutalButton variant="ink" size="lg">
              Start Now — It&apos;s Free →
            </BrutalButton>
          </Link>
        </div>
      </div>
    </section>
  )
}
