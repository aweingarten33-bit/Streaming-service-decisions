"use client";

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { SplitChars } from '@/components/fx/split-chars'
import { Magnetic } from '@/components/fx/magnetic'
import { ThreeHeroScene } from '@/components/fx/three-hero-scene'
import { ease } from '@/lib/motion'

/**
 * Editorial hero — NYT typography, giant serif headline, live Three.js
 * glass artifact on the right. Multi-layer parallax on the left column,
 * character-by-character reveal on the headline, magnetic CTAs, and a
 * hand-drawn rule that draws itself as anticipation.
 */
export function EditorialHero() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  const yFar = useTransform(scrollYProgress, [0, 1], ['0%', '55%'])
  const yMid = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const yNear = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  return (
    <section
      ref={ref}
      className="relative min-h-[92svh] overflow-hidden px-6 py-14 sm:px-10 lg:px-16"
    >
      {/* far column ruler — parallax layer 1 */}
      <motion.div style={{ y: yFar }} className="pointer-events-none absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 bg-[#e8e6df]/10 lg:block" />

      {/* mid — masthead ornaments — parallax layer 2 */}
      <motion.div style={{ y: yMid }} className="pointer-events-none absolute inset-x-0 top-0">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-6 font-mono text-[10px] uppercase tracking-[0.4em] text-[#e8e6df]/60 sm:px-10 lg:px-16">
          <span>Vol. I — No. 01</span>
          <span>Decision Intelligence, Daily</span>
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
        </div>
      </motion.div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 pt-16 lg:grid-cols-12 lg:gap-14">
        {/* headline column — parallax layer 3 (near) */}
        <motion.div style={{ y: yNear, opacity }} className="relative z-10 lg:col-span-7">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: ease.emphatic, delay: 0.1 }}
            className="mb-8 h-px w-24 origin-left bg-[#e8e6df]"
          />

          <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.35em] text-[#e8e6df]/60">
            The DFS Audit
          </div>

          <h1 className="font-serif text-[11vw] font-black leading-[0.92] tracking-[-0.02em] text-[#e8e6df] sm:text-[6rem] lg:text-[6.75rem]">
            <div><SplitChars text="Stop guessing" /></div>
            <div className="mt-1 italic text-[#f5d100]">
              <SplitChars text="why you lose." delay={0.35} />
            </div>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.1, delay: 1.1, ease: ease.silk }}
            className="mt-8 max-w-xl font-serif text-lg leading-[1.55] text-[#a8a69c] sm:text-xl"
          >
            Upload your DraftKings or FanDuel history. We audit every entry, quantify what your
            leaks cost, and hand back a decision-intelligence report. No lineups. Just the findings.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 1.4, ease: ease.emphatic }}
            className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center"
          >
            <Magnetic>
              <Link
                href="/upload"
                className="group relative inline-flex items-center justify-center overflow-hidden bg-[#e8e6df] px-9 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.28em] text-[#050508] transition-colors"
              >
                <span className="relative z-10">Upload Your History</span>
                <span className="relative z-10 ml-3 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1.5">→</span>
                <span aria-hidden className="absolute inset-0 origin-left scale-x-0 bg-[#f5d100] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100" />
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/reports"
                className="story-link inline-flex items-center justify-center font-serif text-base italic text-[#e8e6df]"
              >
                See a sample report
              </Link>
            </Magnetic>
          </motion.div>

          {/* dropcap-esque byline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8, duration: 1 }}
            className="mt-10 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.4em] text-[#e8e6df]/50"
          >
            <span className="h-px w-10 bg-[#e8e6df]/40" />
            Scroll for the analysis
            <span className="h-px w-10 bg-[#e8e6df]/40" />
          </motion.div>
        </motion.div>

        {/* Three.js scene — right column, framed like a plate */}
        <div className="relative lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.6, ease: ease.silk, delay: 0.5 }}
            className="relative aspect-square w-full"
          >
            <div className="absolute inset-0 border border-[#e8e6df]/25" />
            <div className="absolute -left-2 -top-2 h-3 w-3 border-l border-t border-[#e8e6df]" />
            <div className="absolute -right-2 -top-2 h-3 w-3 border-r border-t border-[#e8e6df]" />
            <div className="absolute -bottom-2 -left-2 h-3 w-3 border-b border-l border-[#e8e6df]" />
            <div className="absolute -bottom-2 -right-2 h-3 w-3 border-b border-r border-[#e8e6df]" />
            <ThreeHeroScene />
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-between px-4 font-mono text-[9px] uppercase tracking-[0.35em] text-[#e8e6df]/60">
              <span>Fig. 01</span>
              <span>Refractive Index / Live</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}