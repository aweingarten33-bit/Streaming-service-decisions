"use client";


import { motion } from 'framer-motion'
import { BrutalCard } from '@/components/punk/brutal-card'
import { SectionHeader } from '@/components/punk/section-header'
import { stagger, staggerItem } from '@/components/punk/page-transition'
import { TiltCard } from '@/components/fx/tilt'

const FEATURES = [
  {
    tag: '01',
    title: 'LEAK DETECTION',
    body: 'We scan every contest you ever entered and rank the behavioral patterns costing you the most money — by buy-in, format, sport, and entry style.',
    accent: 'text-hotred',
  },
  {
    tag: '02',
    title: 'AI COACH NARRATIVE',
    body: 'A blunt, experienced DFS coach reads your numbers and tells you exactly where your edge leaks. Never invents stats. Never recommends players.',
    accent: 'text-profit',
  },
  {
    tag: '03',
    title: 'BANKROLL RISK RADAR',
    body: 'Loss-chasing detection, peak slate exposure, and format concentration. We flag the tilt patterns before they blow up your roll.',
    accent: 'text-orange',
  },
  {
    tag: '04',
    title: 'CAPITAL DISCIPLINE SCORE',
    body: 'A 0–100 health grade for how well your money tracks the segments you can actually beat — net of penalties for overbetting, loss-chasing, and concentration.',
    accent: 'text-profit',
  },
  {
    tag: '05',
    title: 'REALLOCATION ENGINE',
    body: 'The money question answered: what each losing segment cost you versus redeploying that capital into your proven-winning pocket, quantified from your own history.',
    accent: 'text-hotred',
  },
  {
    tag: '06',
    title: 'CONSULTING-GRADE REPORT',
    body: 'A formal diagnostic — health scorecard, root-cause findings, and a phased action roadmap — exportable to a styled PDF or Word doc. Keep the receipts.',
    accent: 'text-orange',
  },
]

export function Features() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <SectionHeader index="01" label="What It Does" title="Six ways it sharpens your play." />
      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-80px' }}
        className="grid gap-x-10 gap-y-10 sm:grid-cols-2"
      >
        {FEATURES.map((f) => (
          <motion.div key={f.tag} variants={staggerItem}>
            <TiltCard className="relative border-t border-ink/15 pt-5 will-change-transform">
              <div className="edu-kicker">{f.tag}</div>
              <h3 className="font-display mt-2 text-2xl font-bold leading-tight text-ink">
                {f.title}
              </h3>
              <p className="mt-2 font-serif text-base leading-relaxed text-ink/75">{f.body}</p>
            </TiltCard>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
