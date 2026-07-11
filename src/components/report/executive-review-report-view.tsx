"use client";

import type { AnalysisReport, Bucket } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { Reveal } from '@/components/fx/reveal'
import { BrutalCard } from '@/components/punk/brutal-card'
import { cn } from '@/lib/utils'

/**
 * ExecutiveReviewReportView — the "Quarterly Performance Review."
 *
 * Sections:
 *   I.    Cover
 *   II.   The Hiring Question — verdict
 *   III.  Investments & Liabilities
 *   IV.   Opportunity Cost
 *   V.    Decision Quality Index (8 sub-scores)
 *   VI.   What Surprised Us
 *   VII.  Biggest Misconception
 *   VIII. False Positives & False Negatives
 *   IX.   The Investment Committee (panel)
 *   X.    Executive Conclusion (Increase/Maintain/Reduce/Stop/Monitor/Investigate)
 */
export function ExecutiveReviewReportView({ report }: { report: AnalysisReport }) {
  const a = derive(report)
  return (
    <div className="space-y-14 sm:space-y-20">
      <Cover report={report} a={a} />
      <Reveal><HiringQuestion report={report} a={a} /></Reveal>
      <Reveal><InvestmentsAndLiabilities report={report} a={a} /></Reveal>
      <Reveal><OpportunityCost report={report} a={a} /></Reveal>
      <Reveal><DecisionQualityIndex report={report} a={a} /></Reveal>
      <Reveal><Surprises report={report} a={a} /></Reveal>
      <Reveal><Misconception report={report} a={a} /></Reveal>
      <Reveal><FalsePositiveNegative report={report} a={a} /></Reveal>
      <Reveal><InvestmentCommittee report={report} a={a} /></Reveal>
      <Reveal><ExecutiveConclusion report={report} a={a} /></Reveal>
      <Reveal><SignOff report={report} /></Reveal>
    </div>
  )
}

/* ============================================================
   Sections
   ============================================================ */

function Cover({ report }: Props) {
  const quarter = quarterLabel(report.dateRange.end)
  return (
    <BrutalCard border="ink" className="p-5 sm:p-10">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
        {quarter} · {report.platform} · {report.dateRange.start} → {report.dateRange.end} · {report.rowCount} ENTRIES
      </div>
      <h1 className="font-display mt-4 text-5xl leading-none tracking-tight text-ink sm:text-7xl">
        Quarterly
        <br />
        Performance
        <br />
        Review.
      </h1>
      <div className="mt-10 grid gap-6 border-t border-ink pt-6 sm:grid-cols-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            PREPARED FOR
          </div>
          <div className="mt-1 font-display text-xl leading-tight tracking-tight text-ink sm:text-2xl">
            The Principal
          </div>
          <div className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            SOLE OPERATOR · {report.platform}
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            PREPARED BY
          </div>
          <div className="mt-1 font-display text-xl leading-tight tracking-tight text-ink sm:text-2xl">
            DFS Strategy Auditor
          </div>
          <div className="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            INDEPENDENT PERFORMANCE REVIEW
          </div>
        </div>
      </div>
    </BrutalCard>
  )
}

function HiringQuestion({ a }: Props) {
  return (
    <Section
      n="I"
      title="The Hiring Question"
      question="If you were hiring a professional DFS manager to run your bankroll — would you hire the person described by this report?"
    >
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="border border-ink p-6 sm:p-8">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            VERDICT
          </div>
          <div
            className={cn(
              'mt-2 font-display text-5xl leading-none tracking-tighter sm:text-7xl',
              a.hireTone === 'good' ? 'text-profit' : a.hireTone === 'warn' ? 'text-amber-500' : 'text-hotred',
            )}
          >
            {a.hireVerdict}
          </div>
          <p className="mt-6 border-l-2 border-ink pl-4 font-serif text-base leading-relaxed text-ink sm:text-lg">
            {a.hireRationale}
          </p>
        </div>
        <div className="space-y-3">
          {a.hireConditions.map((c, i) => (
            <div key={i} className="border border-ink p-4">
              <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                CONDITION {i + 1}
              </div>
              <p className="mt-1 font-serif text-base leading-relaxed text-ink">{c}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

function InvestmentsAndLiabilities({ a }: Props) {
  return (
    <Section
      n="II"
      title="Investments & Liabilities"
      question="Which parts of the book are earning capital, and which parts are consuming it?"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <PortfolioColumn label="INVESTMENTS" sub="earning capital" tone="good" buckets={a.investments} empty="No segment yet meets the sample floor for classification as an investment." />
        <PortfolioColumn label="LIABILITIES" sub="consuming capital" tone="bad" buckets={a.liabilities} empty="No segment currently meets the threshold to be classified as a material liability." />
      </div>
    </Section>
  )
}

function PortfolioColumn({
  label,
  sub,
  tone,
  buckets,
  empty,
}: {
  label: string
  sub: string
  tone: 'good' | 'bad'
  buckets: Bucket[]
  empty: string
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <div className={cn('font-mono text-[11px] font-bold uppercase tracking-widest', tone === 'good' ? 'text-profit' : 'text-hotred')}>
          {label}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {sub}
        </div>
      </div>
      <div className="space-y-2">
        {buckets.length === 0 && (
          <div className="border border-ink/40 p-4 font-serif text-sm text-muted-foreground">
            {empty}
          </div>
        )}
        {buckets.map((b) => (
          <PortfolioRow key={`${label}-${b.key}`} bucket={b} tone={tone} />
        ))}
      </div>
    </div>
  )
}

function PortfolioRow({ bucket, tone }: { bucket: Bucket; tone: 'good' | 'bad' }) {
  const conf = confidenceOf(bucket)
  const stable = tone === 'good' ? 'Stable · Repeatable' : 'High variance · Historically unprofitable'
  return (
    <div className={cn('border p-4', tone === 'good' ? 'border-profit' : 'border-hotred')}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="font-display text-lg leading-tight tracking-tight text-ink sm:text-xl">
          {bucket.key}
        </div>
        <div className={cn('font-display text-xl tracking-tighter sm:text-2xl', tone === 'good' ? 'text-profit' : 'text-hotred')}>
          {fmtMoney(bucket.net)}
        </div>
      </div>
      <div className="mt-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        {bucket.entries} ENTRIES · {bucket.roi >= 0 ? '+' : ''}{bucket.roi.toFixed(1)}% ROI · {stable}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-widest">
        <span className="text-muted-foreground">CONFIDENCE:</span>{' '}
        <span className={cn('font-bold', conf.tone === 'good' ? 'text-profit' : conf.tone === 'warn' ? 'text-amber-500' : 'text-hotred')}>
          {conf.label}
        </span>
      </div>
    </div>
  )
}

function OpportunityCost({ a }: Props) {
  return (
    <Section
      n="III"
      title="Opportunity Cost"
      question="What would the same capital have earned if it had been deployed to your proven edge?"
    >
      {!a.oppCost ? (
        <p className="font-serif text-base leading-relaxed text-ink sm:text-lg">
          Insufficient contrast between segments to compute a defensible opportunity cost.
        </p>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <StatBlock label="ACTUAL RESULT" value={fmtMoney(a.oppCost.actualNet)} caption={`${a.oppCost.fromSegment}`} tone="bad" big />
            <StatBlock label="ESTIMATED RESULT" value={fmtMoney(a.oppCost.projected)} caption={`Same capital deployed to ${a.oppCost.toSegment}`} tone="good" big />
            <StatBlock label="COST OF DECISION" value={fmtMoney(a.oppCost.swing)} caption="Difference between what happened and what could have." tone="bad" big />
          </div>
          <div className="mt-6 border-l-2 border-ink pl-4 font-serif text-base leading-relaxed text-ink sm:text-lg">
            {a.oppCost.narrative}
          </div>
        </>
      )}
    </Section>
  )
}

function DecisionQualityIndex({ a }: Props) {
  return (
    <Section
      n="IV"
      title="Decision Quality Index"
      question="Setting outcomes aside — how good are the decisions themselves?"
    >
      <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="border-2 border-ink p-6 sm:p-8">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            DQI · COMPOSITE
          </div>
          <div className={cn('mt-2 font-display text-7xl leading-none tracking-tighter sm:text-8xl', dqiTone(a.dqi.composite))}>
            {a.dqi.composite}
          </div>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            / 100
          </div>
          <p className="mt-6 border-l-2 border-ink pl-4 font-serif text-base leading-relaxed text-ink">
            {a.dqi.narrative}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {a.dqi.parts.map((p) => (
            <div key={p.label} className="border border-ink p-4">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink">
                  {p.label}
                </div>
                <div className={cn('font-display text-2xl tracking-tighter', dqiTone(p.score))}>
                  {p.score}
                </div>
              </div>
              <div className="mt-2 h-1.5 w-full border border-ink/20">
                <div className={cn('h-full', dqiBar(p.score))} style={{ width: `${p.score}%` }} />
              </div>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                {p.caption}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  )
}

function Surprises({ a }: Props) {
  return (
    <Section
      n="V"
      title="What Surprised Us"
      question="If we set aside what you already know about your play — what does the data quietly show?"
    >
      <ol className="space-y-3">
        {a.surprises.map((s, i) => (
          <li key={i} className="border border-ink p-5">
            <div className="flex items-baseline gap-4">
              <div className="font-display text-3xl leading-none tracking-tighter text-ink sm:text-4xl">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <h3 className="font-display text-lg leading-tight tracking-tight text-ink sm:text-2xl">
                  {s.title}
                </h3>
                <p className="mt-2 font-serif text-base leading-relaxed text-ink sm:text-lg">
                  {s.body}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function Misconception({ a }: Props) {
  return (
    <Section
      n="VI"
      title="Biggest Misconception"
      question="What do the results appear to say — and what does the data actually say?"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border border-hotred p-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-hotred">
            WHAT THE RESULTS APPEAR TO SAY
          </div>
          <p className="mt-3 font-display text-xl leading-snug tracking-tight text-ink sm:text-3xl">
            &ldquo;{a.misconception.appears}&rdquo;
          </p>
        </div>
        <div className="border border-profit p-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-profit">
            WHAT THE DATA ACTUALLY SAYS
          </div>
          <p className="mt-3 font-display text-xl leading-snug tracking-tight text-ink sm:text-3xl">
            {a.misconception.reality}
          </p>
        </div>
      </div>
      <p className="mt-4 border-l-2 border-ink pl-4 font-serif text-base leading-relaxed text-ink sm:text-lg">
        {a.misconception.body}
      </p>
    </Section>
  )
}

function FalsePositiveNegative({ a }: Props) {
  return (
    <Section
      n="VII"
      title="False Positives & False Negatives"
      question="Which results are you celebrating too early — and which ones are you underrating?"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border border-amber-500 p-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-500">
            BIGGEST FALSE POSITIVE
          </div>
          <h3 className="mt-2 font-display text-2xl leading-tight tracking-tight text-ink sm:text-3xl">
            {a.falsePositive?.title ?? 'None flagged.'}
          </h3>
          {a.falsePositive && (
            <p className="mt-3 font-serif text-base leading-relaxed text-ink sm:text-lg">
              {a.falsePositive.body}
            </p>
          )}
        </div>
        <div className="border border-profit p-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-profit">
            BIGGEST FALSE NEGATIVE
          </div>
          <h3 className="mt-2 font-display text-2xl leading-tight tracking-tight text-ink sm:text-3xl">
            {a.falseNegative?.title ?? 'None flagged.'}
          </h3>
          {a.falseNegative && (
            <p className="mt-3 font-serif text-base leading-relaxed text-ink sm:text-lg">
              {a.falseNegative.body}
            </p>
          )}
        </div>
      </div>
    </Section>
  )
}

function InvestmentCommittee({ a }: Props) {
  return (
    <Section
      n="VIII"
      title="The Investment Committee"
      question="An independent panel reviewed your historical performance. Here is what each committee member wrote."
    >
      <div className="space-y-2">
        {a.committee.map((m) => (
          <div key={m.role} className="grid grid-cols-1 border border-ink sm:grid-cols-[220px_1fr]">
            <div className="border-b border-ink/40 bg-ink/5 p-4 font-mono text-[11px] font-bold uppercase tracking-widest text-ink sm:border-b-0 sm:border-r sm:border-ink/40">
              {m.role}
            </div>
            <div className="p-4 font-serif text-base leading-relaxed text-ink sm:text-lg">
              &ldquo;{m.note}&rdquo;
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 border-2 border-ink p-6 sm:p-8">
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
          CHAIRPERSON&rsquo;S CONCLUSION
        </div>
        <p className="mt-3 font-display text-xl leading-snug tracking-tight text-ink sm:text-3xl">
          {a.chairConclusion}
        </p>
      </div>
    </Section>
  )
}

function ExecutiveConclusion({ a }: Props) {
  return (
    <Section
      n="IX"
      title="Executive Conclusion"
      question="If we were managing your bankroll on your behalf — here is what we would do."
    >
      <div className="border border-ink">
        {a.decisions.map((d, i) => (
          <div
            key={d.verb}
            className={cn(
              'grid grid-cols-[130px_1fr] items-start',
              i < a.decisions.length - 1 && 'border-b border-ink/40',
            )}
          >
            <div className={cn('border-r border-ink/40 p-4 font-display text-2xl tracking-tighter', decisionTone(d.verb))}>
              {d.verb}
            </div>
            <div className="p-4 font-serif text-base leading-relaxed text-ink sm:text-lg">
              {d.what}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function SignOff({ report }: { report: AnalysisReport }) {
  return (
    <div className="border-t border-ink pt-6">
      <p className="font-serif text-base leading-relaxed text-ink sm:text-lg">
        This review covered {report.rowCount.toLocaleString()} entries and{' '}
        {fmtMoney(report.totalFees)} of deployed capital between {report.dateRange.start} and{' '}
        {report.dateRange.end}. The committee reconvenes on the next data upload.
      </p>
      <div className="mt-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        — DFS STRATEGY AUDITOR · INVESTMENT COMMITTEE
      </div>
    </div>
  )
}

/* ============================================================
   Building blocks
   ============================================================ */

function Section({
  n,
  title,
  question,
  children,
}: {
  n: string
  title: string
  question: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-5">
      <header className="border-b border-ink pb-4">
        <div className="flex flex-wrap items-baseline gap-4">
          <span className="font-display text-4xl leading-none tracking-tighter text-ink sm:text-6xl">
            {n}
          </span>
          <h2 className="font-display text-2xl leading-tight tracking-tight text-ink sm:text-4xl">
            {title}
          </h2>
        </div>
        <p className="mt-3 max-w-3xl font-serif text-base italic leading-relaxed text-ink/70 sm:text-lg">
          {question}
        </p>
      </header>
      {children}
    </section>
  )
}

function StatBlock({
  label,
  value,
  caption,
  tone,
  big = false,
}: {
  label: string
  value: string
  caption?: string
  tone: 'good' | 'bad' | 'warn' | 'ink'
  big?: boolean
}) {
  const border =
    tone === 'good' ? 'border-profit' : tone === 'bad' ? 'border-hotred' : tone === 'warn' ? 'border-amber-500' : 'border-ink'
  const color =
    tone === 'good' ? 'text-profit' : tone === 'bad' ? 'text-hotred' : tone === 'warn' ? 'text-amber-500' : 'text-ink'
  return (
    <div className={cn('border p-5', border)}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className={cn('font-display leading-none tracking-tighter', color, big ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-4xl')}>
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

/* ============================================================
   Derivations
   ============================================================ */

interface CommitteeNote { role: string; note: string }
interface OppCost {
  fromSegment: string
  toSegment: string
  actualNet: number
  projected: number
  swing: number
  narrative: string
}
interface DqiPart { label: string; score: number; caption: string }
interface Dqi { composite: number; parts: DqiPart[]; narrative: string }

interface Derived {
  hireVerdict: 'YES' | 'YES, WITH CONDITIONS' | 'NOT YET'
  hireTone: 'good' | 'warn' | 'bad'
  hireRationale: string
  hireConditions: string[]
  investments: Bucket[]
  liabilities: Bucket[]
  oppCost: OppCost | null
  dqi: Dqi
  surprises: { title: string; body: string }[]
  misconception: { appears: string; reality: string; body: string }
  falsePositive: { title: string; body: string } | null
  falseNegative: { title: string; body: string } | null
  committee: CommitteeNote[]
  chairConclusion: string
  decisions: { verb: 'INCREASE' | 'MAINTAIN' | 'REDUCE' | 'STOP' | 'MONITOR' | 'INVESTIGATE'; what: string }[]
  bestBucket: Bucket | null
  worstBucket: Bucket | null
}

interface Props {
  report: AnalysisReport
  a: Derived
}

function derive(report: AnalysisReport): Derived {
  const all = [
    ...report.contestTypeBreakdown,
    ...report.buyinBreakdown,
    ...report.sportBreakdown,
  ]
  const eligible = all.filter((b) => b.entries >= 10)

  const investments = [...eligible]
    .filter((b) => b.roi > 0 && b.net > 0)
    .sort((x, y) => y.net - x.net)
    .slice(0, 4)
  const liabilities = [...eligible]
    .filter((b) => b.roi < 0 && b.net < 0)
    .sort((x, y) => x.net - y.net)
    .slice(0, 4)

  const bestBucket = eligible.length ? [...eligible].sort((x, y) => y.roi - x.roi)[0] : null
  const worstBucket = eligible.length ? [...eligible].sort((x, y) => x.roi - y.roi)[0] : null

  const disc = report.disciplineScore.score ?? 40
  let hireVerdict: Derived['hireVerdict'] = 'NOT YET'
  let hireTone: Derived['hireTone'] = 'bad'
  if (report.roi >= 5 && disc >= 65) {
    hireVerdict = 'YES'
    hireTone = 'good'
  } else if ((report.roi >= 0 || (bestBucket && bestBucket.roi >= 5)) && disc >= 45) {
    hireVerdict = 'YES, WITH CONDITIONS'
    hireTone = 'warn'
  }
  const hireRationale = buildHireRationale(report, hireVerdict, bestBucket, worstBucket)
  const hireConditions = buildHireConditions(report, worstBucket)

  const oppCost = buildOppCost(report, bestBucket, worstBucket)
  const dqi = buildDqi(report)
  const surprises = buildSurprises(report, bestBucket, worstBucket)
  const misconception = buildMisconception(report, bestBucket, worstBucket)
  const falsePositive = buildFalsePositive(report)
  const falseNegative = buildFalseNegative(report, bestBucket)
  const committee = buildCommittee(report, dqi, bestBucket, worstBucket)
  const chairConclusion = buildChairConclusion(bestBucket, worstBucket)
  const decisions = buildDecisions(report, bestBucket, worstBucket)

  return {
    hireVerdict,
    hireTone,
    hireRationale,
    hireConditions,
    investments,
    liabilities,
    oppCost,
    dqi,
    surprises,
    misconception,
    falsePositive,
    falseNegative,
    committee,
    chairConclusion,
    decisions,
    bestBucket,
    worstBucket,
  }
}

function buildHireRationale(
  report: AnalysisReport,
  verdict: Derived['hireVerdict'],
  best: Bucket | null,
  worst: Bucket | null,
): string {
  const bestFrag = best
    ? `a demonstrable edge in ${best.key} (${best.roi >= 0 ? '+' : ''}${best.roi.toFixed(1)}% ROI over ${best.entries} entries)`
    : 'promising but under-sampled segments of edge'
  const worstFrag = worst && worst.roi < -5
    ? ` The counter-argument is ${worst.key} at ${worst.roi.toFixed(1)}% ROI, which is currently unfunded by the results.`
    : ''
  if (verdict === 'YES') {
    return `The manager posts positive career ROI (${report.roi.toFixed(1)}%) with a disciplined allocation profile and ${bestFrag}. On this record, a professional operator would be retained.${worstFrag}`
  }
  if (verdict === 'YES, WITH CONDITIONS') {
    return `The manager is not yet a hire on the aggregate number, but the record shows ${bestFrag}. The book is hireable if the specific conditions listed alongside are enforced in writing.${worstFrag}`
  }
  return `On today's file, the aggregate result does not meet the bar for a professional retention decision. That is not a talent judgment — it is a process judgment. The path back to a "yes" runs through the conditions listed alongside, not through a bigger swing.${worstFrag}`
}

function buildHireConditions(report: AnalysisReport, worst: Bucket | null): string[] {
  const cs: string[] = []
  if (worst && worst.roi < -5) {
    cs.push(`Reduce exposure to ${worst.key} by at least half until it clears a larger sample.`)
  }
  if (report.bankroll.formatConcentrationPct > 50) {
    cs.push(`Cap ${report.bankroll.concentratedFormat} at 40% or less of monthly fees; today it is ${report.bankroll.formatConcentrationPct.toFixed(0)}%.`)
  }
  if (report.bankroll.lossChasingPct > 15) {
    cs.push(`Freeze next-day entry budget at the prior-day level after any losing session (currently +${report.bankroll.lossChasingPct.toFixed(0)}%).`)
  }
  if (report.chess.consistency.afterBigWinInflationPct > 20) {
    cs.push(`No mid-week upward budget revision after a top-decile winning day (currently +${report.chess.consistency.afterBigWinInflationPct.toFixed(0)}%).`)
  }
  if (cs.length < 3) {
    cs.push('Adopt a written weekly allocation policy, revised only on scheduled review dates.')
  }
  if (cs.length < 3) {
    cs.push('Report performance by contest type, not aggregate P&L, at weekly cadence.')
  }
  return cs.slice(0, 4)
}

function buildOppCost(report: AnalysisReport, best: Bucket | null, worst: Bucket | null): OppCost | null {
  const move = report.reallocation.hasData ? report.reallocation.moves[0] : null
  if (move) {
    const actualNet = -move.capitalBled
    const swing = move.projectedReturn - actualNet
    return {
      fromSegment: move.fromSegment,
      toSegment: move.toSegment,
      actualNet,
      projected: move.projectedReturn,
      swing,
      narrative: `Capital placed in ${move.fromSegment} generated ${fmtMoney(actualNet)}. The same capital deployed to ${move.toSegment} at its historical ${move.toRoi.toFixed(1)}% ROI would have generated approximately ${fmtMoney(move.projectedReturn)}. The gap of ${fmtMoney(swing)} is not a loss on the ledger — it is the cost of the allocation decision itself. This is the single largest lever in the review.`,
    }
  }
  if (!best || !worst || best.roi <= worst.roi) return null
  const actualNet = worst.net
  const projected = (worst.fees * best.roi) / 100
  const swing = projected - actualNet
  return {
    fromSegment: worst.key,
    toSegment: best.key,
    actualNet,
    projected,
    swing,
    narrative: `Capital placed in ${worst.key} generated ${fmtMoney(actualNet)}. The same capital deployed to ${best.key} at its historical ${best.roi.toFixed(1)}% ROI would have generated approximately ${fmtMoney(projected)}. The difference of ${fmtMoney(swing)} is the cost of the allocation decision, independent of any lineup call.`,
  }
}

function buildDqi(report: AnalysisReport): Dqi {
  const b = report.bankroll
  const c = report.chess
  const clamp = (x: number) => Math.max(0, Math.min(100, Math.round(x)))

  const contestSelection = clamp(c.strategicAccuracy.bestMovePct)
  const capitalAllocation = clamp(report.disciplineScore.allocationScore)
  const riskManagement = clamp(
    100 -
      ((b.peakSlateExposurePct / 25) * 40 +
        (b.formatConcentrationPct / 100) * 30 +
        (c.varianceAttribution.structuralSharePct / 100) * 30),
  )
  const discipline = clamp(report.disciplineScore.score ?? 50)
  const consistency = clamp(c.consistency.score)
  const process = clamp((contestSelection + capitalAllocation + discipline) / 3)
  const varianceMgmt = clamp(100 - c.varianceAttribution.structuralSharePct)
  const sampleReliability = clamp(
    c.overallConfidence.level === 'HIGH' ? 90 : c.overallConfidence.level === 'MEDIUM' ? 65 : 35,
  )

  const parts: DqiPart[] = [
    { label: 'Contest Selection', score: contestSelection, caption: 'Share of capital sent to segments with a positive, real-sample record.' },
    { label: 'Capital Allocation', score: capitalAllocation, caption: 'Match between where money goes and where the edge lives.' },
    { label: 'Risk Management', score: riskManagement, caption: 'Concentration, single-slate exposure, and drawdown control.' },
    { label: 'Discipline', score: discipline, caption: 'Adherence to allocation rules under pressure.' },
    { label: 'Consistency', score: consistency, caption: 'How similar day-to-day and week-to-week sizing looks.' },
    { label: 'Process', score: process, caption: 'Blended read on how decisions get made, not just what happened.' },
    { label: 'Variance Management', score: varianceMgmt, caption: 'Losses attributable to structural leak vs. normal variance.' },
    { label: 'Sample Reliability', score: sampleReliability, caption: 'How much statistical weight the current results carry.' },
  ]
  const composite = Math.round(parts.reduce((s, p) => s + p.score, 0) / parts.length)
  const narrative = composite >= 75
    ? 'The decisions themselves are strong. Sustained results should follow if the process holds.'
    : composite >= 55
      ? 'The decisions are competent. Two or three sub-scores below are dragging the composite down and are the highest-leverage places to work.'
      : 'The decision process is currently the bottleneck, not the lineups. Improvement in any single low-scoring dimension below will move results more than any individual pick.'
  return { composite, parts, narrative }
}

function buildSurprises(report: AnalysisReport, best: Bucket | null, worst: Bucket | null): { title: string; body: string }[] {
  const out: { title: string; body: string }[] = []

  const hidden = report.chess.hiddenInteractions.find((h) => Math.abs(h.interactionRoi) >= 5 && h.entries >= 15)
  if (hidden) {
    out.push({
      title: `${hidden.cell} performs ${hidden.interactionRoi >= 0 ? 'better' : 'worse'} than the sum of its parts.`,
      body: `In isolation, each of the dimensions in ${hidden.cell} is unremarkable. In combination, this cell runs at ${hidden.roi.toFixed(1)}% ROI over ${hidden.entries} entries — a ${Math.abs(hidden.interactionRoi).toFixed(1)}-point gap from what its ingredients would predict. This is the kind of pattern that goes unnoticed for years because no single dimension flags it.`,
    })
  }

  if (report.roi < 0 && best && best.roi > 5) {
    out.push({
      title: `Overall ROI is ${report.roi.toFixed(1)}%, yet ${best.key} is genuinely profitable.`,
      body: `The headline number reads as a losing player. The segment-level truth is that ${best.key} has produced ${best.roi.toFixed(1)}% ROI across ${best.entries} entries. Most operators looking at the top line would never notice this — and would therefore never protect it.`,
    })
  }

  const conv = report.chess.positionConversion
  if (conv.hasData && conv.coldStreakNextDayEntries >= 20) {
    const delta = conv.coldStreakNextDayRoi - conv.baselineNextDayRoi
    if (Math.abs(delta) >= 5) {
      out.push({
        title: delta < 0
          ? 'The day after a cold streak is materially worse than an average day.'
          : 'The day after a cold streak is not the disaster it feels like.',
        body: `Following three consecutive losing days, next-day ROI averages ${conv.coldStreakNextDayRoi.toFixed(1)}% against a baseline of ${conv.baselineNextDayRoi.toFixed(1)}%. That is ${Math.abs(delta).toFixed(1)} points ${delta < 0 ? 'below' : 'above'} normal — a real behavioral signal, not a coincidence.`,
      })
    }
  }

  if (out.length < 3 && report.bankroll.formatConcentrationPct > 45) {
    out.push({
      title: `${report.bankroll.formatConcentrationPct.toFixed(0)}% of capital sits in one format.`,
      body: `Most operators believe they diversify more than they do. Here the largest single format (${report.bankroll.concentratedFormat}) carries an unusually high share of the deployed capital. That single fact drives more of the variance in this book than any lineup decision does.`,
    })
  }

  if (out.length < 3 && worst && worst.roi < -20) {
    out.push({
      title: `${worst.key} is losing capital at a rate that would not survive a formal review.`,
      body: `At ${worst.roi.toFixed(1)}% ROI over ${worst.entries} entries, ${worst.key} is not an unlucky segment — it is a segment where the record does not support continued funding. Most operators keep funding it because losses feel like variance until someone counts them separately.`,
    })
  }

  if (out.length < 3) {
    out.push({
      title: 'The book is more legible than the aggregate ROI suggests.',
      body: 'Segment-level results are more differentiated than a single ROI number can convey. That differentiation is opportunity: the strongest and weakest segments are far enough apart that reallocation is a lever, not a rounding error.',
    })
  }

  return out.slice(0, 3)
}

function buildMisconception(report: AnalysisReport, best: Bucket | null, worst: Bucket | null): Derived['misconception'] {
  if (report.roi < 0 && best && best.roi > 5 && worst && worst.roi < -10) {
    return {
      appears: 'I am bad at DFS.',
      reality: `No. You are profitable at ${best.key}. You are bad at ${worst.key}.`,
      body: `Aggregating a positive segment and a negative segment into a single ROI number produces a story that is not actually true at any level of the book. The correct read is not "unprofitable player" — it is "profitable player subsidizing a losing side business."`,
    }
  }
  if (report.roi >= 5 && worst && worst.roi < -10) {
    return {
      appears: 'The whole book is working.',
      reality: `No. The book is working because a few segments — chiefly ${best?.key ?? 'your strongest categories'} — are quietly financing ${worst.key}.`,
      body: `A positive aggregate ROI hides the fact that a specific loss center is being carried by the profit centers. Trimming the loss center is not a defensive move; it is what makes the profit centers show their true size.`,
    }
  }
  if (report.bankroll.formatConcentrationPct > 55) {
    return {
      appears: 'The results are about picks.',
      reality: `No. The results are about concentration. ${report.bankroll.formatConcentrationPct.toFixed(0)}% of the book sits in ${report.bankroll.concentratedFormat}.`,
      body: `When one format carries this much of the capital, its variance dominates every reported number. Improving lineups is a rounding error compared to redistributing the capital.`,
    }
  }
  return {
    appears: 'The scoreboard is the story.',
    reality: 'No. The process is the story. The scoreboard is a lagging indicator of it.',
    body: 'Over any short horizon, results reflect variance more than skill. The durable read on this book comes from the decision quality index and the segment-level pattern, not from the current ROI figure.',
  }
}

function buildFalsePositive(report: AnalysisReport): { title: string; body: string } | null {
  const all = [
    ...report.contestTypeBreakdown,
    ...report.buyinBreakdown,
    ...report.sportBreakdown,
  ]
  const candidate = [...all]
    .filter((b) => b.roi > 15 && b.entries < 25)
    .sort((x, y) => y.roi - x.roi)[0]
  if (!candidate) return null
  return {
    title: `${candidate.key} at ${candidate.roi >= 0 ? '+' : ''}${candidate.roi.toFixed(1)}% ROI.`,
    body: `The result looks like a strong edge — but it is built on only ${candidate.entries} entries. That is inside the range where variance can produce this number by chance. Do not up-fund this segment based on the current ROI. Keep the sample growing before drawing a conclusion.`,
  }
}

function buildFalseNegative(report: AnalysisReport, best: Bucket | null): { title: string; body: string } | null {
  const all = [
    ...report.contestTypeBreakdown,
    ...report.buyinBreakdown,
    ...report.sportBreakdown,
  ]
  const candidate = [...all]
    .filter((b) => b.roi > 3 && b.entries >= 50)
    .sort((x, y) => y.entries - x.entries)[0] ?? best
  if (!candidate || report.roi >= 0) return null
  return {
    title: `${candidate.key} at ${candidate.roi >= 0 ? '+' : ''}${candidate.roi.toFixed(1)}% across ${candidate.entries} entries.`,
    body: `The headline ROI is negative, so this segment gets overlooked. It should not be. A positive number across ${candidate.entries} entries is a real signal — this is where the business lives. It deserves protection and expansion, not the same treatment as the rest of the book.`,
  }
}

function buildCommittee(report: AnalysisReport, dqi: Dqi, best: Bucket | null, worst: Bucket | null): CommitteeNote[] {
  const notes: CommitteeNote[] = []
  notes.push({
    role: 'Chief Strategy Officer',
    note: worst
      ? `Contest selection needs to improve. Continued participation in ${worst.key} at current volume is not defensible.`
      : 'Contest selection is directionally correct; the next gain comes from tighter execution, not new formats.',
  })
  notes.push({
    role: 'Chief Investment Officer',
    note: report.reallocation.hasData && report.reallocation.moves[0]
      ? `Capital allocation is inefficient. Approximately ${fmtMoney(report.reallocation.totalProjectedSwing)} of expected return is being left on the table by the current split.`
      : 'Capital allocation is broadly reasonable; expect returns to track process quality rather than allocation shifts.',
  })
  notes.push({
    role: 'Head of Risk',
    note: report.bankroll.formatConcentrationPct > 50 || report.bankroll.peakSlateExposurePct > 10
      ? `Volatility is too high. Concentration (${report.bankroll.formatConcentrationPct.toFixed(0)}% in one format) and peak-slate exposure (${report.bankroll.peakSlateExposurePct.toFixed(1)}%) both sit outside a professional risk envelope.`
      : 'Volatility is inside policy limits. Continue the current risk posture and revisit after material size changes.',
  })
  notes.push({
    role: 'Behavioral Analyst',
    note: report.bankroll.lossChasingPct > 15 || report.chess.consistency.afterBigWinInflationPct > 20
      ? `Emotional decisions increase after both winning and losing streaks. Post-loss sizing +${report.bankroll.lossChasingPct.toFixed(0)}%, post-big-win sizing +${report.chess.consistency.afterBigWinInflationPct.toFixed(0)}%. The budget is being written by the last result, not the plan.`
      : 'No material tilt or escalation pattern visible. Cadence of decisions is clean.',
  })
  const sr = dqi.parts.find((p) => p.label === 'Sample Reliability')?.score ?? 50
  notes.push({
    role: 'Lead Statistician',
    note: `Two of the loudest-looking problems in this file are within the range of ordinary variance. Sample reliability of the composite is currently ${sr}/100 — treat single-week swings with corresponding skepticism.`,
  })
  notes.push({
    role: 'Professional DFS Advisor',
    note: best
      ? `You are closer than the overall ROI suggests. ${best.key} is a real edge; the aggregate number is being pulled down by fixable allocation, not talent.`
      : `You are closer than the overall ROI suggests, but the record needs more disciplined sample before we can locate the edge with confidence.`,
  })
  return notes
}

function buildChairConclusion(best: Bucket | null, worst: Bucket | null): string {
  const bestFrag = best ? `protect ${best.key}` : 'protect your highest-conviction segment'
  const worstFrag = worst && worst.roi < -5 ? `reduce ${worst.key} exposure` : 'trim exposure to the segment with the weakest track record'
  return `The committee unanimously recommends ${worstFrag}, ${bestFrag}, and evaluating success based on decision quality rather than short-term outcomes.`
}

function buildDecisions(report: AnalysisReport, best: Bucket | null, worst: Bucket | null): Derived['decisions'] {
  const out: Derived['decisions'] = []
  if (best) out.push({ verb: 'INCREASE', what: `Allocation to ${best.key}. The record supports the size; the current split does not reflect the edge.` })
  if (best && best.entries >= 30) out.push({ verb: 'MAINTAIN', what: `Format discipline in ${best.key}. Do not experiment with new buy-in tiers inside this segment for the next 30 days.` })
  if (worst && worst.roi < -5) out.push({ verb: 'REDUCE', what: `Exposure to ${worst.key} by at least 50% until ROI clears zero over a larger sample.` })
  if (report.bankroll.lossChasingPct > 15) out.push({ verb: 'STOP', what: 'Increasing entry fees on the day after a losing session. Cap next-day fees at the prior day\'s amount.' })
  out.push({ verb: 'MONITOR', what: 'Weekly ROI by contest type, buy-in tier, sport, and field size — not aggregate P&L.' })
  const fp = [...report.contestTypeBreakdown, ...report.buyinBreakdown, ...report.sportBreakdown]
    .find((b) => b.roi > 15 && b.entries < 25)
  if (fp) out.push({ verb: 'INVESTIGATE', what: `${fp.key} is currently at ${fp.roi.toFixed(1)}% ROI on only ${fp.entries} entries. Grow the sample before treating it as an edge.` })
  else out.push({ verb: 'INVESTIGATE', what: 'The largest single loss finding in the audit. Confirm whether the pattern is structural or a variance cluster before the next cycle.' })
  return out
}

/* ============================================================
   Utils
   ============================================================ */

function dqiTone(score: number) {
  if (score >= 75) return 'text-profit'
  if (score >= 55) return 'text-ink'
  if (score >= 40) return 'text-amber-500'
  return 'text-hotred'
}
function dqiBar(score: number) {
  if (score >= 75) return 'bg-profit'
  if (score >= 55) return 'bg-ink'
  if (score >= 40) return 'bg-amber-500'
  return 'bg-hotred'
}

function decisionTone(verb: string) {
  switch (verb) {
    case 'INCREASE':
    case 'MAINTAIN':
      return 'text-profit'
    case 'REDUCE':
    case 'STOP':
      return 'text-hotred'
    case 'MONITOR':
      return 'text-ink'
    case 'INVESTIGATE':
      return 'text-amber-500'
    default:
      return 'text-ink'
  }
}

function confidenceOf(b: Bucket): { label: 'High' | 'Medium' | 'Low'; tone: 'good' | 'warn' | 'bad' } {
  if (b.entries >= 100) return { label: 'High', tone: 'good' }
  if (b.entries >= 30) return { label: 'Medium', tone: 'warn' }
  return { label: 'Low', tone: 'bad' }
}

function quarterLabel(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return 'QUARTERLY REVIEW'
  const q = Math.floor(d.getUTCMonth() / 3) + 1
  return `Q${q} ${d.getUTCFullYear()} PERFORMANCE REVIEW`
}
