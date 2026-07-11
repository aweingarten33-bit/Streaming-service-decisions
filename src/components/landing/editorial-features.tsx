"use client";

import { motion } from 'framer-motion'
import { SplitChars } from '@/components/fx/split-chars'
import { TiltCard } from '@/components/fx/tilt'
import { ease, stagger } from '@/lib/motion'

const FEATURES = [
  { tag: '01', title: 'Leak Detection', body: 'Every behavioral pattern costing you money — ranked by buy-in, format, sport, and entry style.' },
  { tag: '02', title: 'AI Coach Narrative', body: 'A blunt DFS coach reads your numbers and tells you where your edge leaks. Never invents stats.' },
  { tag: '03', title: 'Bankroll Risk Radar', body: 'Loss-chasing detection, peak exposure, format concentration. Tilt patterns flagged before they blow up.' },
  { tag: '04', title: 'Capital Discipline Score', body: 'A 0–100 grade for how well your money tracks the segments you can actually beat.' },
  { tag: '05', title: 'Reallocation Engine', body: 'What each losing segment cost you versus redeploying that capital into your winning pocket.' },
  { tag: '06', title: 'Grandmaster Review', body: 'A formal diagnostic — health scorecard, root causes, phased roadmap. Exportable PDF or Word.' },
]

export function EditorialFeatures() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-20 sm:px-10 lg:px-16">
      <div className="mb-10 max-w-3xl">
        <div className="mb-4 flex items-center gap-4 font-mono text-[11px] uppercase tracking-[0.35em] text-[#e8e6df]/60">
          <span className="h-px w-10 bg-[#e8e6df]/60" />
          The Sections
        </div>
        <h2 className="font-serif text-5xl font-black leading-[1.02] tracking-[-0.02em] text-[#e8e6df] sm:text-7xl">
          <SplitChars text="Six lenses" />
          <span className="italic text-[#f5d100]"> <SplitChars text="on your play." delay={0.3} /></span>
        </h2>
      </div>

      <div className="grid gap-px bg-[#e8e6df]/15 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.tag}
            initial={{ opacity: 0, y: 32, filter: 'blur(10px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.95, delay: stagger(i, 0.07), ease: ease.emphatic }}
          >
            <TiltCard className="group relative h-full overflow-hidden bg-[#0a0a10] p-10">
              {/* moving reflection — restrained */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                animate={{ x: ['0%', '400%'] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'linear', delay: i * 0.4 }}
              />
              <div className="relative">
                <div className="flex items-baseline justify-between">
                  <div className="font-mono text-[11px] uppercase tracking-[0.35em] text-[#f5d100]">
                    § {f.tag}
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#e8e6df]/40">
                    Sect.
                  </div>
                </div>
                <h3 className="mt-4 font-serif text-3xl font-black leading-tight text-[#e8e6df]">
                  {f.title}
                </h3>
                <p className="mt-4 font-serif text-base leading-[1.6] text-[#a8a69c]">{f.body}</p>
                <div className="mt-8 h-px w-10 origin-left scale-x-100 bg-[#e8e6df] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-[6]" />
              </div>
            </TiltCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}