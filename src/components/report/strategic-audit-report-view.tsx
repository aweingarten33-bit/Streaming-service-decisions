"use client";

import type { AnalysisReport, Bucket, Finding, Leak } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { Reveal } from '@/components/fx/reveal'
import { BrutalCard } from '@/components/punk/brutal-card'
import { cn } from '@/lib/utils'

/**
 * StrategicAuditReportView — Huron-style consulting audit.
 *
 * A single, disciplined document in seven sections:
 *   1. Executive Summary
 *   2. Executive Scorecard
 *   3. Key Findings
 *   4. What's Working
 *   5. Audit Findings / Top Leaks
 *   6. Recommendations
 *   7. 30-Day Action Plan
 *
 * Voice: professional, blunt, data-driven, balanced, action-oriented.
 * Every number is pulled from the same AnalysisReport all templates share.
 */
export function StrategicAuditReportView({ report }: { report: AnalysisReport }) {
  const a = derive(report)

  return (
    <div className="space-y-14 sm:space-y-20">
      <Cover report={report} a={a} />
      <Reveal>
        <ExecutiveSummary report={report} a={a} />
      </Reveal>
      <Reveal>
        <ExecutiveScorecard report={report} a={a} />
      </Reveal>
      <Reveal>
        <KeyFindings report={report} a={a} />
      </Reveal>
      <Reveal>
        <WhatsWorking report={report} a={a} />
      </Reveal>
      <Reveal>
        <TopLeaks report={report} a={a} />
      </Reveal>
      <Reveal>
        <Recommendations report={report} a={a} />
      </Reveal>
      <Reveal>
        <ThirtyDayActionPlan report={report} a={a} />
      </Reveal>
      <Reveal>
        <SignOff report={report} />
      </Reveal>
    </div>
  )
}

/* ============================================================
   Sections
   ============================================================ */

function Cover({ report, a }: Props) {
  return (
    <BrutalCard border="ink" className="p-5 sm:p-10">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
        STRATEGIC ADVISORY · {report.platform} · {report.dateRange.start} → {report.dateRange.end} · {report.rowCount} ENTRIES
      </div>
      <h1 className="font-display mt-3 text-4xl leading-none tracking-tight text-ink sm:text-6xl">
        Daily Fantasy Sports
        <br />
        Strategy &amp; Decision-Making Audit
      </h1>
      <div className="mt-8 grid gap-6 border-t border-ink pt-6 sm:grid-cols-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            PREPARED FOR
          </div>
          <div className="mt-1 font-display text-xl leading-tight tracking-tight text-ink sm:text-2xl">
            The Client · Professional DFS Player
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            PREPARED BY
          </div>
          <div className="mt-1 font-display text-xl leading-tight tracking-tight text-ink sm:text-2xl">
            Strategic Advisory Team
          </div>
        </div>
      </div>
      <p className="mt-8 max-w-3xl border-l-2 border-ink pl-4 font-serif text-lg leading-relaxed text-ink">
        The following review examines the client&rsquo;s DFS results, contest
        selection, bankroll deployment, and behavioral patterns across{' '}
        <B>{report.rowCount.toLocaleString()}</B> entries and{' '}
        <B>{fmtMoney(report.totalFees)}</B> of entry fees. The engagement objective
        is not to grade a slate; it is to assess whether the client&rsquo;s current
        approach is producing a repeatable, long-term positive return &mdash; and,
        where it is not, to isolate the cause.
      </p>
    </BrutalCard>
  )
}

function ExecutiveSummary({ report, a }: Props) {
  return (
    <Section n="1" title="Executive Summary">
      <div className="space-y-4 font-serif text-base leading-relaxed text-ink sm:text-lg">
        <p>
          Over the reviewed period, the client generated{' '}
          <B>{report.roi >= 0 ? 'positive' : 'negative'} overall ROI of{' '}
          {report.roi >= 0 ? '+' : ''}{report.roi.toFixed(1)}%</B> on{' '}
          <B>{fmtMoney(report.totalFees)}</B> of entry fees, for a net result of{' '}
          <B className={report.netProfit >= 0 ? 'text-profit' : 'text-hotred'}>
            {fmtMoney(report.netProfit)}
          </B>
          . Results are <B>not evenly distributed</B> across the book:
          {a.bestBucket && (
            <>
              {' '}the client is materially profitable in <B>{a.bestBucket.key}</B>{' '}
              ({a.bestBucket.roi >= 0 ? '+' : ''}{a.bestBucket.roi.toFixed(1)}% ROI over{' '}
              {a.bestBucket.entries} entries),
            </>
          )}
          {a.worstBucket && (
            <>
              {' '}and materially unprofitable in <B>{a.worstBucket.key}</B>{' '}
              ({a.worstBucket.roi.toFixed(1)}% ROI over {a.worstBucket.entries} entries).
            </>
          )}
        </p>
        <p>
          The analysis indicates the client&rsquo;s core edge exists in{' '}
          <B>{a.edgeDescription}</B>, but that edge is being{' '}
          {a.edgeIsDiluted ? 'diluted' : 'preserved'} by capital allocation into{' '}
          <B>{a.dilutionDescription}</B>. Behavioral indicators point to{' '}
          <B>
            {report.bankroll.lossChasingPct > 20 ? 'post-loss buy-in escalation' : 'controlled response to losing days'}
          </B>
          {' '}and{' '}
          <B>
            {report.chess.consistency.afterBigWinInflationPct > 25
              ? 'aggressive sizing after winning days'
              : 'measured sizing after winning days'}
          </B>
          . These are process signals, not results signals, and are the highest-leverage
          items in this report.
        </p>
        <div className="mt-6 border-2 border-ink p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            PRIMARY CONCLUSION
          </div>
          <p className="mt-2 font-display text-xl leading-snug tracking-tight text-ink sm:text-3xl">
            {a.primaryConclusion}
          </p>
        </div>
      </div>
    </Section>
  )
}

function ExecutiveScorecard({ report, a }: Props) {
  const rows: { category: string; result: string; interpretation: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }[] = [
    {
      category: 'Overall ROI',
      result: `${report.roi >= 0 ? '+' : ''}${report.roi.toFixed(1)}%`,
      interpretation: report.roi >= 5 ? 'Positive long-term performance' : report.roi >= 0 ? 'Marginally positive; within noise' : 'Negative overall performance',
      tone: report.roi >= 5 ? 'good' : report.roi >= 0 ? 'warn' : 'bad',
    },
    {
      category: 'Net P/L',
      result: fmtMoney(report.netProfit),
      interpretation: report.netProfit >= 0
        ? 'Profits concentrated in limited categories'
        : 'Losses concentrated in limited categories',
      tone: report.netProfit >= 0 ? 'good' : 'bad',
    },
    {
      category: 'Best Format',
      result: a.bestBucket?.key ?? '—',
      interpretation: a.bestBucket ? 'Strongest repeatable edge' : 'Insufficient sample to isolate',
      tone: a.bestBucket ? 'good' : 'neutral',
    },
    {
      category: 'Worst Format',
      result: a.worstBucket?.key ?? '—',
      interpretation: a.worstBucket ? 'Largest bankroll drain' : 'No single format flagged',
      tone: a.worstBucket ? 'bad' : 'neutral',
    },
    {
      category: 'Biggest Strength',
      result: a.bestBucket ? `${a.bestBucket.key}` : '—',
      interpretation: a.bestBucket
        ? `Profitable over ${a.bestBucket.entries} entries`
        : 'Continue building sample',
      tone: a.bestBucket ? 'good' : 'neutral',
    },
    {
      category: 'Biggest Risk',
      result: report.bankroll.concentratedFormat,
      interpretation: report.bankroll.formatConcentrationPct > 50
        ? 'Excess concentration and variance exposure'
        : 'Concentration within tolerance',
      tone: report.bankroll.formatConcentrationPct > 50 ? 'bad' : 'warn',
    },
    {
      category: 'Bankroll Discipline',
      result: a.disciplineLabel,
      interpretation: a.disciplineInterpretation,
      tone: a.disciplineTone,
    },
    {
      category: 'Worst Drawdown',
      result: fmtMoney(-report.chess.criticalPosition.drawdown),
      interpretation: report.chess.criticalPosition.hasData
        ? `Peak-to-trough over ${report.chess.criticalPosition.daysToTrough} days`
        : 'Insufficient dated data',
      tone: report.chess.criticalPosition.drawdown > report.totalFees * 0.15 ? 'bad' : 'warn',
    },
  ]

  return (
    <Section n="2" title="Executive Scorecard">
      <div className="overflow-hidden border border-ink">
        <div className="grid grid-cols-[1.1fr_1fr_1.6fr] border-b border-ink bg-ink/5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink">
          <div className="border-r border-ink p-3">Category</div>
          <div className="border-r border-ink p-3">Result</div>
          <div className="p-3">Interpretation</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.category}
            className={cn(
              'grid grid-cols-[1.1fr_1fr_1.6fr] font-serif text-sm text-ink sm:text-base',
              i < rows.length - 1 && 'border-b border-ink/40',
            )}
          >
            <div className="border-r border-ink/40 p-3 font-mono text-xs font-bold uppercase tracking-widest">
              {r.category}
            </div>
            <div
              className={cn(
                'border-r border-ink/40 p-3 font-display text-lg leading-tight tracking-tight sm:text-xl',
                toneText(r.tone),
              )}
            >
              {r.result}
            </div>
            <div className="p-3">{r.interpretation}</div>
          </div>
        ))}
      </div>
    </Section>
  )
}

function KeyFindings({ report, a }: Props) {
  const findings = buildKeyFindings(report, a)
  return (
    <Section n="3" title="Key Findings">
      <ol className="space-y-4">
        {findings.map((f, i) => (
          <li key={i} className="border border-ink p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              FINDING {i + 1}
            </div>
            <h3 className="mt-1 font-display text-xl leading-tight tracking-tight text-ink sm:text-2xl">
              {f.title}
            </h3>
            <p className="mt-3 font-serif text-base leading-relaxed text-ink sm:text-lg">
              {f.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function WhatsWorking({ report, a }: Props) {
  const strengths = buildStrengths(report, a)
  return (
    <Section n="4" title="What's Working">
      <div className="grid gap-4 md:grid-cols-2">
        {strengths.map((s, i) => (
          <div key={i} className="border border-profit p-5">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-profit">
              STRENGTH · {String(i + 1).padStart(2, '0')}
            </div>
            <h4 className="mt-1 font-display text-xl leading-tight tracking-tight text-ink">
              {s.title}
            </h4>
            <p className="mt-2 font-serif text-base leading-relaxed text-ink">
              {s.body}
            </p>
            {s.recommendation && (
              <p className="mt-3 border-t border-profit/40 pt-3 font-mono text-[11px] uppercase tracking-widest text-profit">
                RECOMMENDED ACTION: <span className="font-serif text-sm normal-case text-ink">{s.recommendation}</span>
              </p>
            )}
          </div>
        ))}
      </div>
    </Section>
  )
}

function TopLeaks({ report, a }: Props) {
  const items = buildLeakList(report, a)
  if (!items.length) {
    return (
      <Section n="5" title="Audit Findings / Top Leaks">
        <p className="font-serif text-base leading-relaxed text-ink">
          No material leaks isolated at current sample sizes. Continue uploading
          data so patterns can be tested against a wider baseline.
        </p>
      </Section>
    )
  }
  return (
    <Section n="5" title="Audit Findings / Top Leaks">
      <ol className="space-y-4">
        {items.map((f, i) => (
          <li key={i} className="border border-hotred p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-hotred">
                  AUDIT FINDING · {String(i + 1).padStart(2, '0')}
                </div>
                <h4 className="mt-1 font-display text-xl leading-tight tracking-tight text-ink sm:text-2xl">
                  {f.title}
                </h4>
              </div>
              {f.impact != null && (
                <div className="text-right">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    ESTIMATED IMPACT
                  </div>
                  <div className="font-display text-2xl leading-none tracking-tighter text-hotred">
                    {fmtMoney(f.impact)}
                  </div>
                </div>
              )}
            </div>
            <p className="mt-3 font-serif text-base leading-relaxed text-ink sm:text-lg">
              {f.body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function Recommendations({ report, a }: Props) {
  const recs = buildRecommendations(report, a)
  return (
    <Section n="6" title="Recommendations">
      <ol className="space-y-3">
        {recs.map((r, i) => (
          <li key={i} className="border border-ink p-5">
            <div className="flex items-baseline gap-4">
              <div className="font-display text-3xl leading-none tracking-tighter text-ink sm:text-4xl">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <h4 className="font-display text-lg leading-tight tracking-tight text-ink sm:text-2xl">
                  {r.title}
                </h4>
                <p className="mt-2 font-serif text-base leading-relaxed text-ink sm:text-lg">
                  {r.body}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function ThirtyDayActionPlan({ report, a }: Props) {
  const rows: { label: 'STOP' | 'KEEP' | 'REDUCE' | 'TRACK' | 'REVIEW'; text: string; tone: 'bad' | 'good' | 'warn' | 'neutral' }[] = [
    {
      label: 'STOP',
      text: report.bankroll.lossChasingPct > 20
        ? 'Increasing entry fees on the day after a losing day. Cap the next-day budget at the previous day\'s size.'
        : 'Making mid-week discretionary buy-in increases. Set the weekly budget on Sunday and hold it.',
      tone: 'bad',
    },
    {
      label: 'KEEP',
      text: a.bestBucket
        ? `Playing profitable ${a.bestBucket.key} at current volume. This is the client's proven edge and should be defended before anything else changes.`
        : 'Playing the client\'s highest-conviction, most-repeated format. Consistency of format is a prerequisite for a readable ROI.',
      tone: 'good',
    },
    {
      label: 'REDUCE',
      text: a.worstBucket
        ? `Exposure to ${a.worstBucket.key} by at least 50% until ROI improves over a larger sample.`
        : 'Exposure to any single format that exceeds 40% of monthly fees. Diversify contest allocation.',
      tone: 'warn',
    },
    {
      label: 'TRACK',
      text: 'ROI by contest type, buy-in tier, sport, and field size — weekly, not just monthly. Aggregate P/L hides the underlying story.',
      tone: 'neutral',
    },
    {
      label: 'REVIEW',
      text: 'Weekly: did the client follow the allocation plan? Deviations are more informative than results — they show where discipline is breaking down before the bankroll does.',
      tone: 'neutral',
    },
  ]
  return (
    <Section
      n="7"
      title="30-Day Action Plan"
      subtitle="Five directives. One review cycle. Upload fresh data at day 30 to measure whether the plan moved the numbers."
    >
      <div className="border border-ink">
        {rows.map((r, i) => (
          <div
            key={r.label}
            className={cn(
              'grid grid-cols-[110px_1fr] items-start',
              i < rows.length - 1 && 'border-b border-ink/40',
            )}
          >
            <div className={cn('border-r border-ink/40 p-4 font-display text-2xl tracking-tighter', toneText(r.tone))}>
              {r.label}
            </div>
            <div className="p-4 font-serif text-base leading-relaxed text-ink sm:text-lg">
              {r.text}
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
        This report was prepared using the client&rsquo;s complete transaction
        history from {report.dateRange.start} through {report.dateRange.end}. The
        engagement recommends a re-audit at 30 days to test whether the directives
        above materially changed the underlying numbers &mdash; the only measure
        that matters.
      </p>
      <div className="mt-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
        — Strategic Advisory Team
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
  subtitle,
  children,
}: {
  n: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-5">
      <header className="border-b border-ink pb-4">
        <div className="flex flex-wrap items-baseline gap-4">
          <span className="font-display text-5xl leading-none tracking-tighter text-ink sm:text-7xl">
            {n}
          </span>
          <h2 className="font-display text-2xl leading-tight tracking-tight text-ink sm:text-4xl">
            {title}
          </h2>
        </div>
        {subtitle && (
          <p className="mt-3 max-w-2xl font-serif text-base italic leading-relaxed text-ink/70 sm:text-lg">
            {subtitle}
          </p>
        )}
      </header>
      {children}
    </section>
  )
}

function B({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('font-bold text-ink', className)}>{children}</span>
}

/* ============================================================
   Derivations
   ============================================================ */

interface Derived {
  bestBucket: Bucket | null
  worstBucket: Bucket | null
  bestSport: Bucket | null
  worstSport: Bucket | null
  bestContest: Bucket | null
  worstContest: Bucket | null
  bestBuyin: Bucket | null
  worstBuyin: Bucket | null
  disciplineLabel: string
  disciplineInterpretation: string
  disciplineTone: 'good' | 'warn' | 'bad' | 'neutral'
  edgeDescription: string
  edgeIsDiluted: boolean
  dilutionDescription: string
  primaryConclusion: string
  materialLeaks: Leak[]
  materialFindings: Finding[]
}

interface Props {
  report: AnalysisReport
  a: Derived
}

function derive(report: AnalysisReport): Derived {
  const rankable = (buckets: Bucket[]) => buckets.filter((b) => b.entries >= 10)

  const rankableAll = [
    ...rankable(report.contestTypeBreakdown),
    ...rankable(report.buyinBreakdown),
    ...rankable(report.sportBreakdown),
  ]
  const bestBucket = rankableAll.length
    ? [...rankableAll].sort((a, b) => b.roi - a.roi)[0]
    : null
  const worstBucket = rankableAll.length
    ? [...rankableAll].sort((a, b) => a.roi - b.roi)[0]
    : null

  const pickBest = (buckets: Bucket[]) =>
    rankable(buckets).sort((a, b) => b.roi - a.roi)[0] ?? null
  const pickWorst = (buckets: Bucket[]) =>
    rankable(buckets).sort((a, b) => a.roi - b.roi)[0] ?? null

  const bestSport = pickBest(report.sportBreakdown)
  const worstSport = pickWorst(report.sportBreakdown)
  const bestContest = pickBest(report.contestTypeBreakdown)
  const worstContest = pickWorst(report.contestTypeBreakdown)
  const bestBuyin = pickBest(report.buyinBreakdown)
  const worstBuyin = pickWorst(report.buyinBreakdown)

  const d = report.disciplineScore
  const disciplineLabel = d.provisional || d.score == null
    ? 'Provisional'
    : `${d.score}/100`
  const disciplineTone: Derived['disciplineTone'] =
    d.provisional || d.score == null ? 'neutral'
      : d.score >= 70 ? 'good'
        : d.score >= 45 ? 'warn'
          : 'bad'
  const disciplineInterpretation = d.provisional || d.score == null
    ? 'Insufficient classified capital to grade'
    : d.score >= 70 ? 'Capital deployed to proven edges'
      : d.score >= 45 ? 'Mixed allocation; specific leaks below'
        : 'Capital flowing to unprofitable segments'

  const edgeDescription =
    bestBucket
      ? `${bestBucket.key}, which returned ${bestBucket.roi >= 0 ? '+' : ''}${bestBucket.roi.toFixed(1)}% ROI across ${bestBucket.entries} entries`
      : 'the segments with the largest positive sample'
  const edgeIsDiluted = !!worstBucket && worstBucket.roi < -10 && worstBucket.fees > report.totalFees * 0.1
  const dilutionDescription = worstBucket
    ? `${worstBucket.key} (${worstBucket.roi.toFixed(1)}% ROI over ${worstBucket.entries} entries)`
    : 'higher-variance formats without a proven positive track record'

  const primaryConclusion = buildPrimaryConclusion(report, bestBucket, worstBucket)

  const materialLeaks = [...report.leaks].sort((a, b) => a.metric - b.metric).slice(0, 5)
  const materialFindings = [...report.findings]
    .filter((f) => f.dollarImpact < 0)
    .sort((a, b) => a.dollarImpact - b.dollarImpact)
    .slice(0, 5)

  return {
    bestBucket,
    worstBucket,
    bestSport,
    worstSport,
    bestContest,
    worstContest,
    bestBuyin,
    worstBuyin,
    disciplineLabel,
    disciplineInterpretation,
    disciplineTone,
    edgeDescription,
    edgeIsDiluted,
    dilutionDescription,
    primaryConclusion,
    materialLeaks,
    materialFindings,
  }
}

function buildPrimaryConclusion(
  report: AnalysisReport,
  best: Bucket | null,
  worst: Bucket | null,
): string {
  if (best && worst && worst.roi < -5 && best.roi > 5) {
    return 'The client does not have a lineup-quality problem. The client has a contest-allocation and risk-concentration problem.'
  }
  if (report.roi >= 5) {
    return 'The client is running a genuinely profitable operation. Priority now shifts from finding edge to protecting it against variance and behavioral drift.'
  }
  if (report.roi >= 0) {
    return 'Results are within noise of break-even. The path to a repeatable positive ROI runs through allocation discipline, not lineup discovery.'
  }
  if (report.bankroll.formatConcentrationPct > 60) {
    return 'The most urgent issue is concentration, not skill. A single format is carrying too much of the bankroll for the results to be readable.'
  }
  return 'Losses are traceable to specific segments and specific behaviors, not to a broad talent gap. The corrective actions in Section 6 are the highest-leverage moves.'
}

function buildKeyFindings(report: AnalysisReport, a: Derived): { title: string; body: string }[] {
  const findings: { title: string; body: string }[] = []

  if (a.bestBucket && a.worstBucket && a.bestBucket.roi - a.worstBucket.roi > 15) {
    findings.push({
      title: `${a.worstBucket.key} is erasing profitable ${a.bestBucket.key} performance.`,
      body: `The client produced ${a.bestBucket.roi >= 0 ? '+' : ''}${a.bestBucket.roi.toFixed(1)}% ROI in ${a.bestBucket.key} but ${a.worstBucket.roi.toFixed(1)}% ROI in ${a.worstBucket.key}. Same player, same period. The evidence suggests that presence in ${a.worstBucket.key} does not carry a demonstrable edge and is diluting a category where an edge clearly exists.`,
    })
  }

  findings.push({
    title: 'Contest selection is a bigger driver of results than lineup construction.',
    body: `Results vary far more across contest categories than they do across weeks within any single category. This suggests the primary lever is not what the client plays but where the client plays. Correcting misalignment between lineup style, bankroll size, and contest environment is a higher-return activity than any individual lineup optimization.`,
  })

  if (report.bankroll.formatConcentrationPct > 40) {
    findings.push({
      title: 'Bankroll allocation is overconcentrated in high-variance formats.',
      body: `${report.bankroll.formatConcentrationPct.toFixed(0)}% of total entry fees have been allocated to ${report.bankroll.concentratedFormat}. Concentration of this magnitude creates elevated drawdown risk (the worst peak-to-trough on file is ${fmtMoney(-report.chess.criticalPosition.drawdown)}) and reduces the statistical reliability of any long-term ROI read. The concentration is a structural risk independent of lineup quality.`,
    })
  }

  if (report.bankroll.lossChasingPct > 15) {
    findings.push({
      title: 'Post-loss buy-in escalation is present in the record.',
      body: `On days following a losing day, the client\'s entry fees rise by an average of ${report.bankroll.lossChasingPct.toFixed(0)}%. This is a behavioral pattern, not a strategic one. It historically increases the size of downswings without changing expected value, and it is one of the highest-leverage behaviors to correct.`,
    })
  }

  if (report.chess.consistency.afterBigWinInflationPct > 20) {
    findings.push({
      title: 'Buy-ins escalate after winning days as well as losing ones.',
      body: `Following a top-decile winning day, entry sizing increases by ${report.chess.consistency.afterBigWinInflationPct.toFixed(0)}%. This is emotional rather than analytical and, over time, has not been supported by a corresponding lift in ROI. Sizing decisions should be a function of bankroll and edge, not of the last result.`,
    })
  }

  if (findings.length < 3 && report.roi < 0) {
    findings.push({
      title: 'Aggregate ROI is negative but broad rather than acute.',
      body: `No single segment accounts for the bulk of the loss. The pattern is a series of smaller leaks across categories, which suggests a process issue (allocation, consistency) rather than a single blown format. The recommendations below prioritize protecting the segments that have shown a positive number over any given sample.`,
    })
  }

  return findings.slice(0, 5)
}

function buildStrengths(report: AnalysisReport, a: Derived): { title: string; body: string; recommendation?: string }[] {
  const strengths: { title: string; body: string; recommendation?: string }[] = []

  if (a.bestBucket) {
    strengths.push({
      title: `Demonstrated edge in ${a.bestBucket.key}.`,
      body: `Results show ${a.bestBucket.roi >= 0 ? '+' : ''}${a.bestBucket.roi.toFixed(1)}% ROI across ${a.bestBucket.entries} entries and ${fmtMoney(a.bestBucket.net)} net. The sample is meaningful. This is the client\'s clearest area of edge.`,
      recommendation: 'Maintain or cautiously increase volume in this category without changing buy-in tier.',
    })
  }

  if (a.bestSport && (!a.bestBucket || a.bestSport.key !== a.bestBucket.key)) {
    strengths.push({
      title: `Sport specialization in ${a.bestSport.key}.`,
      body: `The client\'s ${a.bestSport.key} entries return ${a.bestSport.roi >= 0 ? '+' : ''}${a.bestSport.roi.toFixed(1)}% ROI. Sport-level edges are typically the most transferable across seasons and formats.`,
      recommendation: `Protect ${a.bestSport.key} as an anchor of the annual plan.`,
    })
  }

  if (report.disciplineScore.score != null && report.disciplineScore.score >= 55) {
    strengths.push({
      title: 'Process discipline is meaningfully above average.',
      body: `The client scores ${report.disciplineScore.score}/100 on capital allocation to proven segments. That is a real, measurable behavioral asset — the kind of quality that compounds over time.`,
      recommendation: 'Codify the current process into a written weekly ritual so it survives losing stretches.',
    })
  }

  if (a.bestBuyin) {
    strengths.push({
      title: `Buy-in tier fit at ${a.bestBuyin.key}.`,
      body: `Entries at the ${a.bestBuyin.key} tier return ${a.bestBuyin.roi >= 0 ? '+' : ''}${a.bestBuyin.roi.toFixed(1)}% ROI across ${a.bestBuyin.entries} entries. This is the tier where the client\'s edge is most visible.`,
      recommendation: 'Use this tier as the default; departures from it should require a written justification.',
    })
  }

  if (!strengths.length) {
    strengths.push({
      title: 'Willingness to submit the book to independent review.',
      body: 'The strongest signal in the file is behavioral: the client is voluntarily engaging with a structured, adversarial audit of their own work. This is uncommon and is a prerequisite for any long-term improvement.',
      recommendation: 'Continue quarterly re-audits regardless of results.',
    })
  }

  return strengths.slice(0, 4)
}

function buildLeakList(report: AnalysisReport, a: Derived): { title: string; body: string; impact: number | null }[] {
  const out: { title: string; body: string; impact: number | null }[] = []

  for (const f of a.materialFindings) {
    out.push({
      title: f.title,
      body: `${f.whatWeFound} ${f.whyItMatters} Likely root cause: ${f.rootCause.toLowerCase()}.`,
      impact: f.dollarImpact,
    })
  }

  if (out.length < 3) {
    for (const l of a.materialLeaks) {
      if (out.some((o) => o.title === l.title)) continue
      out.push({
        title: l.title,
        body: `${l.data} ${l.fix}`,
        impact: l.metric,
      })
    }
  }

  return out.slice(0, 5)
}

function buildRecommendations(report: AnalysisReport, a: Derived): { title: string; body: string }[] {
  const recs: { title: string; body: string }[] = []

  if (a.worstBucket && a.worstBucket.roi < -5) {
    recs.push({
      title: `Reduce ${a.worstBucket.key} exposure immediately.`,
      body: `Cap this category at no more than 10% of monthly entry fees until ROI improves over a larger, dated sample. Historical performance does not currently justify current allocation.`,
    })
  }

  if (a.bestBucket) {
    recs.push({
      title: `Reallocate volume toward ${a.bestBucket.key}.`,
      body: `Prioritize the segment where results, sample size, and process alignment all point in the same direction. Growth should come from doing more of what already works, not from expanding into unproven categories.`,
    })
  }

  recs.push({
    title: 'Adopt a written contest-allocation policy.',
    body: 'Define fixed percentages by format, buy-in level, and sport before each slate. A written rule beats a discretionary judgment made in the moment, especially during losing weeks.',
  })

  recs.push({
    title: 'Institute a weekly post-slate review discipline.',
    body: 'Review every week by contest type, not just total profit and loss. Aggregate results hide the segment-level story; segment-level reviews expose leaks while they are still small.',
  })

  if (report.bankroll.formatConcentrationPct > 50) {
    recs.push({
      title: 'Separate speculative allocation from core bankroll.',
      body: 'If the client wants to take shots in higher-variance formats, cap that spend as a defined percentage of monthly fees and account for it separately. The professional bankroll should not subsidize the speculative one.',
    })
  }

  if (report.bankroll.lossChasingPct > 20 || report.chess.consistency.afterBigWinInflationPct > 25) {
    recs.push({
      title: 'Freeze the weekly entry budget in advance.',
      body: 'Set the weekly budget on a quiet day, in writing. Do not revise it mid-week regardless of results. This is the single highest-leverage behavioral change available in the file.',
    })
  }

  return recs.slice(0, 6)
}

/* ============================================================
   Utils
   ============================================================ */

function toneText(tone: 'good' | 'warn' | 'bad' | 'neutral') {
  return tone === 'good'
    ? 'text-profit'
    : tone === 'bad'
      ? 'text-hotred'
      : tone === 'warn'
        ? 'text-amber-500'
        : 'text-ink'
}