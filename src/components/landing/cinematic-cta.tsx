"use client";

import Link from 'next/link'
import { motion } from 'framer-motion'
import { SplitChars } from '@/components/fx/split-chars'
import { Magnetic } from '@/components/fx/magnetic'

export function CinematicCTA() {
  return (
    <section className="relative mx-auto max-w-5xl px-5 py-40 text-center sm:px-8">
      {/* orbiting ring */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      >
        <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 shadow-[0_0_20px_rgba(255,255,255,0.9)]" />
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-[45vh] w-[45vh] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
      >
        <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7f7fff] shadow-[0_0_16px_rgba(127,127,255,0.9)]" />
      </motion.div>

      <div className="relative z-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.32em] text-white/50">
          Begin
        </div>
        <h2 className="font-display mt-6 text-6xl font-bold leading-[0.98] tracking-[-0.02em] text-white sm:text-8xl">
          <SplitChars text="Run the audit." />
        </h2>
        <p className="mx-auto mt-8 max-w-xl font-serif text-lg leading-relaxed text-white/70 sm:text-xl">
          Ten seconds. Zero picks. A decision-intelligence report you&rsquo;ll actually reread.
        </p>
        <div className="mt-12 flex justify-center">
          <Magnetic>
            <Link
              href="/upload"
              className="group inline-flex items-center justify-center border border-white bg-white px-12 py-5 font-sans text-sm font-semibold uppercase tracking-[0.24em] text-black transition-colors"
            >
              Upload Your CSV
              <span className="ml-3 transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </Magnetic>
        </div>
      </div>
    </section>
  )
}