"use client";

import type { AnalysisReport } from '@/lib/types'
import { synthesize, directionLabel, type Finding } from '@/lib/advisory-synthesis'
import { fmtMoney } from '@/lib/analysis'
import { BrutalCard } from '@/components/punk/brutal-card'
import { BrutalButton } from '@/components/punk/brutal-button'
import { Reveal } from '@/components/fx/reveal'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { downloadAdvisoryPdf } from '@/lib/pdf/advisory-pdf'

/**
 * AdvisoryOverview — the entire in-app report.
 *
 * Three sections plus a Highest-Confidence Findings block. Nothing else.
 * Depth belongs in the exportable PDF, not on this page.
 */
export function AdvisoryOverview({ report }: { report: AnalysisReport }) {
  const s = synthesize(report)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadAdvisoryPdf(report, s)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Cover */}
      <BrutalCard border="ink" className="p-5 sm:p-8">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
          ADVISORY OVERVIEW · {report.platform} · {report.dateRange.start} → {report.dateRange.end} · {report.rowCount} ENTRIES
        </div>
        <h1 className="font-display mt-3 text-4xl leading-none tracking-tight text-ink sm:text-6xl">
          Here&rsquo;s what your history says.
        </h1>
        <p className="mt-6 max-w-3xl border-l-2 border-ink pl-4 font-serif text-lg leading-relaxed text-ink sm:text-xl">
          {s.bottomLine}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <BrutalButton variant="lime" size="lg" onClick={handleDownload} disabled={downloading}>
            {downloading ? 'PREPARING PDF…' : 'DOWNLOAD FULL ADVISORY REPORT (PDF)'}
          </BrutalButton>
          <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground self-center">
            The PDF shows every number with the math behind it.
          </div>
        </div>
      </BrutalCard>

      {/* Highest-Confidence Findings */}
      {s.highestConfidence.length > 0 && (
        <Reveal>
          <section className="space-y-4">
            <SectionHeading
              tag="THE SIGNAL"
              title="Highest-Confidence Findings"
              subtitle="These are the reads where more than one independent check pointed to the same conclusion. They should get the most weight."
            />
            <div className="space-y-3">
              {s.highestConfidence.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* What Happened */}
      <Reveal>
        <NarrativeSection
          tag="THE FACTS"
          title="What actually happened."
          paragraphs={s.whatHappened}
        />
      </Reveal>

      {/* Why It Happened */}
      <Reveal>
        <NarrativeSection
          tag="THE CAUSE"
          title="Why it happened."
          paragraphs={s.whyItHappened}
        />
      </Reveal>

      {/* What To Do Next */}
      <Reveal>
        <section className="space-y-4">
          <SectionHeading
            tag="THE PLAN"
            title="What to do next."
            subtitle="Short list. Each item is directly supported by a check in the section above."
          />
          <ol className="space-y-2">
            {s.whatToDoNext.map((a, i) => (
              <li key={i} className="border border-ink p-4">
                <div className="flex items-baseline gap-4">
                  <div className="font-display text-3xl leading-none tracking-tighter text-ink sm:text-4xl">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <p className="font-serif text-base leading-relaxed text-ink sm:text-lg">{a}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      {/* Footer bar — one more nudge to grab the PDF */}
      <Reveal>
        <div className="border-t border-ink pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-display text-2xl leading-tight tracking-tight text-ink sm:text-3xl">
                Want the deep version?
              </div>
              <p className="mt-1 max-w-xl font-serif text-base leading-relaxed text-ink/80">
                The written advisory report explains every number, every check, and the math behind each conclusion.
              </p>
            </div>
            <BrutalButton variant="orange" size="lg" onClick={handleDownload} disabled={downloading}>
              {downloading ? 'PREPARING…' : 'DOWNLOAD PDF →'}
            </BrutalButton>
          </div>
        </div>
      </Reveal>
    </div>
  )
}

/* ============================================================
   Building blocks
   ============================================================ */

function SectionHeading({
  tag,
  title,
  subtitle,
}: {
  tag: string
  title: string
  subtitle?: string
}) {
  return (
    <div>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {tag}
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

function NarrativeSection({
  tag,
  title,
  paragraphs,
}: {
  tag: string
  title: string
  paragraphs: string[]
}) {
  return (
    <section className="space-y-4">
      <SectionHeading tag={tag} title={title} />
      <div className="space-y-4 border-l-2 border-ink pl-4 font-serif text-base leading-relaxed text-ink sm:text-lg">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  )
}

function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false)
  const tone = directionTone(finding.direction)
  return (
    <div className={cn('border', tone.border)}>
      <div className="flex flex-wrap items-baseline justify-between gap-3 p-5">
        <div className="min-w-0 flex-1">
          <div className={cn('font-mono text-[10px] font-bold uppercase tracking-widest', tone.text)}>
            {directionLabel[finding.direction]} · {finding.agreeingChecks.length} INDEPENDENT CHECKS AGREE
          </div>
          <h3 className="mt-2 font-display text-xl leading-tight tracking-tight text-ink sm:text-2xl">
            {finding.headline}
          </h3>
          <p className="mt-3 font-serif text-base leading-relaxed text-ink sm:text-lg">
            {finding.implication}
          </p>
          <p className="mt-3 border-l-2 border-ink pl-3 font-serif text-base italic leading-relaxed text-ink sm:text-lg">
            Do this: {finding.action}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setOpen((x) => !x)}
        className="w-full border-t border-ink/40 bg-ink/5 px-5 py-2 text-left font-mono text-[10px] font-bold uppercase tracking-widest text-ink hover:bg-ink/10"
      >
        {open ? '– HIDE THE MATH' : '+ SEE THE MATH'}
      </button>
      {open && (
        <div className="space-y-3 border-t border-ink/40 bg-paper p-5">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            AGREEING CHECKS
          </div>
          <ul className="font-mono text-xs text-ink">
            {finding.agreeingChecks.map((c) => (
              <li key={c}>· {c}</li>
            ))}
          </ul>
          <div className="mt-4 space-y-3">
            {finding.evidence.map((e, i) => (
              <div key={i} className="border border-ink/40 p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink">
                    {e.label}
                  </div>
                  <div className="font-display text-xl leading-none tracking-tighter text-ink">
                    {e.value}
                  </div>
                </div>
                <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  How this was computed: {e.math}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function directionTone(dir: Finding['direction']) {
  switch (dir) {
    case 'protect':
      return { border: 'border-profit', text: 'text-profit' }
    case 'reduce':
      return { border: 'border-hotred', text: 'text-hotred' }
    case 'stop':
      return { border: 'border-hotred', text: 'text-hotred' }
    case 'watch':
      return { border: 'border-amber-500', text: 'text-amber-500' }
  }
}

// Prevent tree-shaking from removing side-effect import above.
export { fmtMoney }
