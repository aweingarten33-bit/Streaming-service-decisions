"use client";

import type { AnalysisReport } from '@/lib/types'
import type { ReactNode } from 'react'
import { BrutalCard } from '@/components/punk/brutal-card'
import { cn } from '@/lib/utils'

/**
 * Shared primitives for the specialist report templates. Every template
 * consumes the same AnalysisReport; these helpers keep the visual language
 * consistent across the "Advisory Board" so the reader knows they are
 * looking at different disciplines examining the same evidence.
 */

export function ReportHeader({
  badge,
  title,
  epigraph,
  report,
}: {
  badge: string
  title: string
  epigraph: string
  report: AnalysisReport
}) {
  return (
    <BrutalCard border="ink" className="p-5 sm:p-8">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
        {badge} · {report.platform} · {report.dateRange.start} → {report.dateRange.end} ·{' '}
        {report.rowCount} ENTRIES
      </div>
      <h1 className="font-display mt-1 text-3xl leading-none tracking-tight text-ink sm:text-5xl">
        {title}
      </h1>
      <p className="mt-6 border-l-2 border-ink pl-4 font-serif text-lg leading-relaxed text-ink">
        {epigraph}
      </p>
    </BrutalCard>
  )
}

/**
 * AdvisorLetter — narrative opener written in plain English. The voice is a
 * seasoned advisor writing directly to the player: no jargon, no hedging.
 *
 *   headline   — one-sentence read on what the data says.
 *   body       — 2–4 short paragraphs. What happened. Why it happened. What
 *                to do next.
 *   signedBy   — the specialist writing this letter (e.g. "The Investment Committee").
 */
export function AdvisorLetter({
  headline,
  body,
  signedBy,
}: {
  headline: string
  body: ReactNode
  signedBy: string
}) {
  return (
    <BrutalCard border="ink" className="p-5 sm:p-8">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        A LETTER FROM YOUR ADVISORY BOARD
      </div>
      <h2 className="font-display mt-2 text-2xl leading-tight tracking-tight text-ink sm:text-4xl">
        {headline}
      </h2>
      <div className="mt-5 space-y-4 border-l-2 border-ink pl-4 font-serif text-base leading-relaxed text-ink sm:text-lg">
        {body}
      </div>
      <div className="mt-6 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        — {signedBy}
      </div>
    </BrutalCard>
  )
}

/**
 * NextSteps — a numbered "what to do this week" close. Written like a plan
 * a person can actually follow, not a research summary.
 */
export function NextSteps({
  title = 'WHAT TO DO NEXT',
  intro,
  steps,
}: {
  title?: string
  intro?: string
  steps: { do: string; because?: string }[]
}) {
  return (
    <div>
      <div className="mb-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          CLOSING
        </div>
        <h2 className="font-display text-3xl leading-none tracking-tight text-ink sm:text-5xl">
          {title}
        </h2>
        {intro && (
          <p className="mt-2 max-w-2xl font-serif text-base leading-relaxed text-ink/70">
            {intro}
          </p>
        )}
      </div>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="border border-ink p-4">
            <div className="flex items-baseline gap-3">
              <div className="font-display text-3xl leading-none tracking-tighter text-ink">
                {String(i + 1).padStart(2, '0')}
              </div>
              <p className="font-serif text-base leading-relaxed text-ink sm:text-lg">
                {s.do}
              </p>
            </div>
            {s.because && (
              <p className="mt-2 pl-11 font-mono text-[11px] leading-relaxed text-muted-foreground">
                Because: {s.because}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  )
}

export function SectionHeading({
  n,
  title,
  subtitle,
}: {
  n: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        SECTION {n}
      </div>
      <h2 className="font-display text-3xl leading-none tracking-tight text-ink sm:text-5xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 max-w-2xl font-serif text-base leading-relaxed text-ink/70">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export function KpiCard({
  label,
  value,
  caption,
  tone = 'ink',
}: {
  label: string
  value: string
  caption?: string
  tone?: 'ink' | 'good' | 'bad' | 'warn'
}) {
  const border =
    tone === 'good'
      ? 'border-profit'
      : tone === 'bad'
        ? 'border-hotred'
        : tone === 'warn'
          ? 'border-amber-500'
          : 'border-ink'
  const color =
    tone === 'good'
      ? 'text-profit'
      : tone === 'bad'
        ? 'text-hotred'
        : tone === 'warn'
          ? 'text-amber-500'
          : 'text-ink'
  return (
    <div className={cn('border p-5', border)}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={cn('font-display text-5xl leading-none tracking-tighter', color)}>
        {value}
      </div>
      {caption && (
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {caption}
        </p>
      )}
    </div>
  )
}

export function Bar({ pct, tone = 'ink' }: { pct: number; tone?: 'ink' | 'good' | 'bad' | 'warn' }) {
  const bg =
    tone === 'good'
      ? 'bg-profit'
      : tone === 'bad'
        ? 'bg-hotred'
        : tone === 'warn'
          ? 'bg-amber-500'
          : 'bg-ink'
  return (
    <div className="h-2 w-full border border-ink/20">
      <div className={cn('h-full', bg)} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  )
}

export function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(1, x))
}

export function grade(score: number): { letter: 'A' | 'B' | 'C' | 'D' | 'F'; tone: 'good' | 'warn' | 'bad' } {
  if (score >= 85) return { letter: 'A', tone: 'good' }
  if (score >= 70) return { letter: 'B', tone: 'good' }
  if (score >= 55) return { letter: 'C', tone: 'warn' }
  if (score >= 40) return { letter: 'D', tone: 'warn' }
  return { letter: 'F', tone: 'bad' }
}