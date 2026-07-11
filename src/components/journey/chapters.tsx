"use client";

import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useRef } from 'react'

const CHAPTERS = [
  {
    n: '01',
    tag: 'Upload',
    title: 'Your history is the answer key.',
    body: 'Export your contest history from DraftKings or FanDuel and drop in the CSV. Every contest, every buy-in, every result — the raw record of how you actually play.',
    glyph: 'stream',
  },
  {
    n: '02',
    tag: 'Diagnose',
    title: 'See the whole board.',
    body: 'We break down every strategic pattern — buy-in sizing, contest selection, sport mix, late swap, tilt streaks — and show what each one is winning or losing you.',
    glyph: 'radar',
  },
  {
    n: '03',
    tag: 'Prescribe',
    title: 'Your next moves, mapped.',
    body: 'A clear plan for where to pull money out and where to redeploy it, built around the contests and formats you actually beat.',
    glyph: 'graph',
  },
  {
    n: '04',
    tag: 'Deliver',
    title: 'Grandmaster-level review.',
    body: 'Scorecard, root causes, and a phased roadmap for your next slates. Export to PDF or Word.',
    glyph: 'grid',
  },
]

export function JourneyChapters() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const progress = useSpring(scrollYProgress, { stiffness: 90, damping: 24, mass: 0.6 })

  return (
    <section ref={ref} id="journey" className="relative">
      {/* sticky stage */}
      <div className="sticky top-0 -z-0 flex h-[100svh] flex-col justify-between px-5 pb-24 pt-24">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.35em] text-neutral-500">
          <span>How It Works</span>
        </div>

        <div className="relative mx-auto grid h-[42svh] w-full max-w-md place-items-center">
          {CHAPTERS.map((c, i) => (
            <ChapterGlyph key={c.n} index={i} total={CHAPTERS.length} progress={progress} glyph={c.glyph} />
          ))}
        </div>

        <ProgressRail progress={progress} total={CHAPTERS.length} />
      </div>

      {/* text panels — one viewport each, drives the sticky stage */}
      <div className="relative -mt-[100svh]">
        {CHAPTERS.map((c) => (
          <div
            key={c.n}
            className="flex min-h-[100svh] items-end px-5 pb-16"
          >
            <motion.div
              initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ amount: 0.5, once: false }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.4em] text-[#7fe8ff]">
                <span>{c.tag}</span>
              </div>
              <h3 className="text-2xl font-black leading-tight tracking-tight text-white">
                {c.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-neutral-300">{c.body}</p>
            </motion.div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ProgressRail({
  progress,
  total,
}: {
  progress: ReturnType<typeof useSpring>
  total: number
}) {
  const width = useTransform(progress, [0, 1], ['0%', '100%'])
  return (
    <div className="relative">
      <div className="h-px w-full bg-white/10">
        <motion.div
          style={{ width }}
          className="h-px bg-gradient-to-r from-[#7fe8ff] via-[#b884ff] to-[#ff8ad6]"
        />
      </div>
    </div>
  )
}

function ChapterGlyph({
  index,
  total,
  progress,
  glyph,
}: {
  index: number
  total: number
  progress: ReturnType<typeof useSpring>
  glyph: string
}) {
  // Show each glyph in its own slice of scroll progress.
  const start = index / total
  const end = (index + 1) / total
  const opacity = useTransform(
    progress,
    [start - 0.06, start + 0.02, end - 0.02, end + 0.06],
    [0, 1, 1, 0],
  )
  const scale = useTransform(progress, [start, end], [0.9, 1.05])
  const rotate = useTransform(progress, [0, 1], [0, 45])

  return (
    <motion.div
      style={{ opacity, scale }}
      className="pointer-events-none absolute inset-0 grid place-items-center"
    >
      <motion.div
        style={{ rotate }}
        className="relative h-56 w-56 rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_30%,rgba(127,232,255,0.14),transparent_60%)] shadow-[0_0_40px_rgba(127,232,255,0.15)]"
      >
        <Glyph kind={glyph} />
      </motion.div>
    </motion.div>
  )
}

function Glyph({ kind }: { kind: string }) {
  if (kind === 'stream') {
    return (
      <svg viewBox="0 0 200 200" className="absolute inset-0">
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.path
            key={i}
            d={`M20 ${60 + i * 22} Q 100 ${20 + i * 22} 180 ${60 + i * 22}`}
            stroke="rgba(180,240,255,0.7)"
            strokeWidth="1"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </svg>
    )
  }
  if (kind === 'radar') {
    return (
      <svg viewBox="0 0 200 200" className="absolute inset-0">
        {[30, 60, 90].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(180,240,255,0.4)" strokeWidth="1" />
        ))}
        <motion.line
          x1="100" y1="100" x2="190" y2="100"
          stroke="url(#rg)" strokeWidth="1.5"
          style={{ transformOrigin: '100px 100px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />
        <defs>
          <linearGradient id="rg" x1="0" x2="1">
            <stop offset="0" stopColor="rgba(127,232,255,0)" />
            <stop offset="1" stopColor="rgba(127,232,255,1)" />
          </linearGradient>
        </defs>
      </svg>
    )
  }
  if (kind === 'graph') {
    const pts = 'M20 160 L60 120 L100 130 L140 70 L180 90'
    return (
      <svg viewBox="0 0 200 200" className="absolute inset-0">
        {[40, 80, 120, 160].map((y) => (
          <line key={y} x1="20" y1={y} x2="180" y2={y} stroke="rgba(255,255,255,0.08)" />
        ))}
        <motion.path
          d={pts}
          stroke="#b884ff"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
        />
      </svg>
    )
  }
  // grid
  return (
    <svg viewBox="0 0 200 200" className="absolute inset-0">
      {Array.from({ length: 6 }).map((_, r) =>
        Array.from({ length: 6 }).map((__, c) => (
          <motion.rect
            key={`${r}-${c}`}
            x={30 + c * 24}
            y={30 + r * 24}
            width="14"
            height="14"
            fill="rgba(127,232,255,0.4)"
            initial={{ opacity: 0.15 }}
            animate={{ opacity: [0.15, 0.9, 0.15] }}
            transition={{ duration: 3, repeat: Infinity, delay: ((r + c) % 6) * 0.15, ease: 'easeInOut' }}
          />
        )),
      )}
    </svg>
  )
}