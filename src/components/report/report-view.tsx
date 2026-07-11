"use client";


import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type {
  AnalysisReport,
  DisciplineScore,
  ScorecardMetric,
  Reallocation,
  Finding,
  PhasedRecommendation,
} from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { exportPdf, exportWord } from '@/lib/export'
import { CountUp } from '@/components/punk/count-up'
import { BrutalButton } from '@/components/punk/brutal-button'
import { BrutalCard } from '@/components/punk/brutal-card'
import { BucketTable } from './bucket-table'
import { AiCoach } from './ai-coach'
import { Reveal } from '@/components/fx/reveal'
import { cn } from '@/lib/utils'

const TABS = ['OVERVIEW', 'BY SPORT', 'CONTEST TYPE', 'BY BUY-IN', 'BANKROLL RISK', 'TRENDS'] as const
type Tab = (typeof TABS)[number]

export function ReportView({ report }: { report: AnalysisReport }) {
  const [tab, setTab] = useState<Tab>('OVERVIEW')
  const [exporting, setExporting] = useState<'pdf' | 'word' | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [shared, setShared] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)

  const profit = report.netProfit >= 0
  const dateStr = new Date(report.createdAt).toISOString().slice(0, 10)

  const handlePdf = async () => {
    setExporting('pdf')
    setExportError(null)
    try {
      await exportPdf(report, `dfs-analysis-report-${dateStr}.pdf`)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'PDF export failed. Try again.')
    } finally {
      setExporting(null)
    }
  }
  const handleWord = async () => {
    setExporting('word')
    setExportError(null)
    try {
      await exportWord(report, `dfs-analysis-report-${dateStr}.docx`)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Word export failed. Try again.')
    } finally {
      setExporting(null)
    }
  }
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(
        `My DFS Analysis Engine report: ${report.roi.toFixed(1)}% lifetime ROI over ${report.lifetimeEntries} entries. Biggest leak: ${report.biggestLeak}.`,
      )
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    } catch {
      /* noop */
    }
  }

  const monthlyBuckets = report.monthly.map((m) => ({
    key: m.label,
    entries: m.entries,
    fees: 0,
    winnings: 0,
    net: m.net,
    roi: m.roi,
    winRate: 0,
    smallSample: false,
  }))

  return (
    <div>
      {/* export bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <BrutalButton variant="ink" size="sm" onClick={handlePdf} disabled={exporting !== null}>
          {exporting === 'pdf' ? 'GENERATING…' : 'EXPORT PDF'}
        </BrutalButton>
        <BrutalButton variant="ghost" size="sm" onClick={handleWord} disabled={exporting !== null}>
          {exporting === 'word' ? 'GENERATING…' : 'EXPORT WORD'}
        </BrutalButton>
        <BrutalButton variant="ghost" size="sm" onClick={handleShare}>
          {shared ? 'COPIED!' : 'SHARE REPORT'}
        </BrutalButton>
      </div>

      {exportError && (
        <div className="mb-6 border border-hotred bg-hotred/5 p-3 font-mono text-xs text-hotred">
          {exportError} — if this keeps happening, tap the feedback button and tell us what device/browser
          you're on.
        </div>
      )}

      <AnimatePresence>
        {exporting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-paper/90 backdrop-blur"
          >
            <div className="border border-ink bg-paper p-8 text-center shadow-[8px_8px_0_0_var(--ink)]">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="mx-auto h-12 w-12 border-[4px] border-ink border-t-transparent"
              />
              <p className="mt-4 font-mono text-sm uppercase tracking-widest text-ink">
                GENERATING YOUR REPORT…
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={captureRef} className="space-y-12 bg-background sm:space-y-16">
        {/* executive summary */}
        <BrutalCard border={profit ? 'lime' : 'red'} className="p-5 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
                {report.platform} // {report.dateRange.start} → {report.dateRange.end} //{' '}
                {report.rowCount} ENTRIES
              </div>
              <h1 className="font-display mt-1 text-3xl leading-none tracking-tight text-ink sm:text-5xl">
                Lifetime Verdict
              </h1>
            </div>
            <div className="sm:text-right">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
                LIFETIME ROI
              </div>
              <div
                className={cn(
                  'font-display text-5xl leading-none tracking-tighter sm:text-8xl',
                  profit ? 'text-profit' : 'text-hotred',
                )}
              >
                <CountUp value={report.roi} decimals={1} suffix="%" prefix={profit ? '+' : ''} />
              </div>
            </div>
          </div>

          <p
            className={cn(
              'mt-6 border-l-2 pl-4 font-serif text-lg leading-relaxed text-ink',
              profit ? 'border-profit' : 'border-hotred',
            )}
          >
            {report.executiveSummary}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat label="TOTAL P&L" value={fmtMoney(report.netProfit)} color={profit ? 'profit' : 'red'} />
            <Stat label="TOTAL ENTRIES" value={report.lifetimeEntries.toLocaleString()} />
            <Stat label="WIN RATE" value={`${report.winRate.toFixed(1)}%`} />
            <Stat label="BEST SPORT" value={report.bestSport} color="profit" />
            <Stat label="WORST SPORT" value={report.worstSport} color="red" />
            <Stat label="BEST OPPORTUNITY" value={report.bestOpportunity} color="profit" />
          </div>

          <DisciplineScoreCard score={report.disciplineScore} />
        </BrutalCard>

        {/* health scorecard */}
        <Reveal>
          <ScorecardPanel metrics={report.scorecard} />
        </Reveal>

        {/* AI coach */}
        <Reveal>
          <AiCoach narrative={report.narrative} />
        </Reveal>

        {/* reallocation — the money section */}
        <Reveal>
          <ReallocationPanel reallocation={report.reallocation} />
        </Reveal>

        {/* tabs */}
        <div>
          <div className="flex flex-wrap gap-2 border-b-[3px] border-ink pb-3">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'border px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors sm:text-xs',
                  tab === t
                    ? 'border-ink bg-ink text-paper'
                    : 'border-ink/30 text-ink hover:border-ink',
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="pt-6"
            >
              {tab === 'OVERVIEW' && (
                <div className="space-y-6">
                  <BucketTable label="SPORT" buckets={report.sportBreakdown} />
                  <BucketTable label="BUY-IN" buckets={report.buyinBreakdown} />
                </div>
              )}
              {tab === 'BY SPORT' && (
                <BucketTable label="SPORT" buckets={report.sportBreakdown} />
              )}
              {tab === 'CONTEST TYPE' && (
                <div className="space-y-6">
                  <BucketTable label="TYPE" buckets={report.contestTypeBreakdown} />
                  <BucketTable label="ENTRY STYLE" buckets={report.entryTypeBreakdown} />
                </div>
              )}
              {tab === 'BY BUY-IN' && (
                <BucketTable label="BUY-IN" buckets={report.buyinBreakdown} />
              )}
              {tab === 'BANKROLL RISK' && <BankrollPanel report={report} />}
              {tab === 'TRENDS' && <BucketTable label="MONTH" buckets={monthlyBuckets} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* key findings (consulting flow) */}
        <Reveal>
          <div>
            <h2 className="font-display mb-4 text-3xl tracking-tight text-ink sm:text-5xl">
              KEY FINDINGS
            </h2>
            <FindingsPanel findings={report.findings} />
          </div>
        </Reveal>

        {/* prioritized roadmap */}
        <Reveal>
          <div>
            <h2 className="font-display mb-4 text-3xl tracking-tight text-ink sm:text-5xl">
              ACTION ROADMAP
            </h2>
            <RoadmapPanel plan={report.phasedPlan} />
          </div>
        </Reveal>

        {/* glossary */}
        <details className="border border-ink/30 p-4">
          <summary className="cursor-pointer font-mono text-xs font-bold uppercase tracking-widest text-ink">
            Glossary — what these terms mean
          </summary>
          <dl className="mt-4 space-y-3">
            {report.glossary.map((g) => (
              <div key={g.term}>
                <dt className="font-mono text-xs font-bold uppercase tracking-widest text-ink">{g.term}</dt>
                <dd className="mt-1 font-sans text-sm text-muted-foreground">{g.definition}</dd>
              </div>
            ))}
          </dl>
        </details>
      </div>
    </div>
  )
}

function DisciplineScoreCard({ score }: { score: DisciplineScore }) {
  if (score.provisional) {
    return (
      <div className="mt-4 border border-dashed border-ink/25 p-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          CAPITAL DISCIPLINE SCORE — PROVISIONAL
        </div>
        <p className="mt-2 font-sans text-sm text-ink/70">
          Not enough classified history yet to score reliably. This isn't a "you played well/badly"
          score — it's whether your money went where your own data says your edge actually is.
          Upload more history to unlock it.
        </p>
      </div>
    )
  }

  const s = score.score ?? 0
  const tier = s >= 70 ? 'profit' : s >= 45 ? 'amber' : 'red'
  const tierColor = tier === 'profit' ? 'text-profit' : tier === 'red' ? 'text-hotred' : 'text-amber-500'
  const borderColor = tier === 'profit' ? 'border-profit' : tier === 'red' ? 'border-hotred' : 'border-amber-500'

  return (
    <div className={cn('mt-4 border p-4', borderColor)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            CAPITAL DISCIPLINE SCORE
          </div>
          <p className="mt-1 max-w-md font-sans text-sm text-ink/70">
            % of your proven-sample capital that went to spots your own data shows you can beat, minus a
            penalty for overbetting, loss-chasing, and concentration.
          </p>
        </div>
        <div className={cn('font-display text-6xl leading-none tracking-tighter', tierColor)}>
          <CountUp value={s} decimals={0} suffix="/100" />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>ALLOCATION {score.allocationScore.toFixed(0)}%</span>
        <span>PENALTY -{score.penalty.toFixed(0)}</span>
        <span>CLASSIFIED {fmtMoney(score.classifiedCapital)}</span>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  color,
}: {
  label: string
  value: string
  color?: 'profit' | 'red'
}) {
  return (
    <div className="border border-ink/20 p-3">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'mt-1 font-mono text-lg font-bold',
          color === 'profit' && 'text-profit',
          color === 'red' && 'text-hotred',
          !color && 'text-ink',
        )}
      >
        {value}
      </div>
    </div>
  )
}

function BankrollPanel({ report }: { report: AnalysisReport }) {
  const b = report.bankroll
  const gauges = [
    {
      label: 'PEAK SLATE EXPOSURE',
      value: b.peakSlateExposurePct,
      suffix: '%',
      danger: b.peakSlateExposurePct > 10,
      note: 'Safe range: 2.5–5% of bankroll per slate.',
    },
    {
      label: 'TILT SIGNAL',
      value: b.lossChasingPct,
      suffix: '%',
      danger: b.lossChasingPct > 50,
      note: 'Entry inflation after cold days. Lower is better.',
    },
    {
      label: 'FORMAT CONCENTRATION',
      value: b.formatConcentrationPct,
      suffix: '%',
      danger: b.formatConcentrationPct > 60,
      note: `Most $ in: ${b.concentratedFormat}. Diversify formats.`,
    },
  ]
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {gauges.map((g) => (
        <div
          key={g.label}
          className={cn('border p-5', g.danger ? 'border-hotred' : 'border-ink')}
        >
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {g.label}
          </div>
          <div
            className={cn(
              'font-display text-5xl leading-none tracking-tighter sm:text-6xl',
              g.danger ? 'text-hotred' : 'text-profit',
            )}
          >
            <CountUp value={g.value} decimals={1} suffix={g.suffix} />
          </div>
          <div className="mt-3 h-2 w-full border border-ink/20">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, g.value)}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className={cn('h-full', g.danger ? 'bg-hotred' : 'bg-profit')}
            />
          </div>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {g.note}
          </p>
        </div>
      ))}
      <div className="border border-ink p-5 md:col-span-3">
        <p className="font-mono text-xs uppercase tracking-widest text-orange">
          DISTINCT FORMATS PLAYED
        </p>
        <p className="font-display text-4xl text-ink sm:text-5xl">{b.distinctContestTypes}</p>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Spreading across too many formats dilutes your edge. Master a few.
        </p>
      </div>
    </div>
  )
}

/* ---------- Health Scorecard ---------- */
function ScorecardPanel({ metrics }: { metrics: ScorecardMetric[] }) {
  if (!metrics?.length) return null
  const dot = (s: ScorecardMetric['status']) =>
    s === 'GREEN' ? 'bg-profit' : s === 'AMBER' ? 'bg-amber-500' : 'bg-hotred'
  const gradeColor = (s: ScorecardMetric['status']) =>
    s === 'GREEN' ? 'text-profit' : s === 'AMBER' ? 'text-amber-500' : 'text-hotred'
  return (
    <div>
      <h2 className="font-display mb-1 text-3xl tracking-tight text-ink sm:text-5xl">HEALTH SCORECARD</h2>
      <p className="mb-4 font-mono text-xs text-muted-foreground">
        GREEN = STRENGTH · AMBER = WATCH · RED = PRIORITY
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {metrics.map((m) => (
          <div key={m.label} className="border border-ink bg-card p-4 shadow-[0_4px_20px_-8px_rgba(18,18,18,0.15)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={cn('h-3 w-3 rounded-full', dot(m.status))} />
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
                  {m.label}
                </span>
              </div>
              <span className={cn('font-display text-3xl leading-none', gradeColor(m.status))}>{m.grade}</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-mono text-sm font-bold text-ink">{m.value}</span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Target: {m.target}
              </span>
            </div>
            <p className="mt-2 font-sans text-xs text-muted-foreground">{m.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Reallocation (the money section) ---------- */
function ReallocationPanel({ reallocation }: { reallocation: Reallocation }) {
  if (!reallocation?.hasData) return null
  return (
    <BrutalCard border="red" className="p-5 sm:p-8">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
        FINANCIAL IMPACT // WHAT MISALLOCATION COST YOU
      </div>
      <h2 className="font-display mt-1 text-3xl leading-none tracking-tight text-ink sm:text-4xl">
        THE REALLOCATION
      </h2>
      <p className="mt-3 font-sans text-sm leading-relaxed text-ink">
        Each losing segment below is measured against{' '}
        <span className="font-bold">{reallocation.anchorSegment}</span> — your strongest proven pocket at{' '}
        <span className="font-bold text-profit">+{reallocation.anchorRoi.toFixed(1)}% ROI</span>. The swing is
        what that same money would have returned there, based on your own history.
      </p>
      {/* Mobile: stacked cards. Desktop: table. */}
      <div className="mt-5 space-y-3 sm:hidden">
        {reallocation.moves.map((m, i) => (
          <div key={i} className="border border-ink/30 bg-card p-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-ink">{m.fromSegment}</span>
              <span className="text-hotred">{m.fromRoi.toFixed(1)}%</span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-ink/10 pt-2">
              <span className="text-muted-foreground">
                → {m.toSegment}
              </span>
              <span className="font-bold text-profit">{fmtMoney(m.swing)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 hidden sm:block">
        <table className="w-full border-collapse font-mono text-sm">
          <thead>
            <tr className="border-b-[2px] border-ink text-left">
              <th className="py-2 pr-2 font-bold uppercase tracking-widest">Move From</th>
              <th className="py-2 px-2 text-right font-bold uppercase tracking-widest">ROI</th>
              <th className="py-2 px-2 font-bold uppercase tracking-widest">Redeploy To</th>
              <th className="py-2 pl-2 text-right font-bold uppercase tracking-widest">Swing</th>
            </tr>
          </thead>
          <tbody>
            {reallocation.moves.map((m, i) => (
              <tr key={i} className="border-b border-ink/15">
                <td className="py-2 pr-2 font-bold text-ink">{m.fromSegment}</td>
                <td className="py-2 px-2 text-right text-hotred">{m.fromRoi.toFixed(1)}%</td>
                <td className="py-2 px-2 text-ink">{m.toSegment}</td>
                <td className="py-2 pl-2 text-right font-bold text-profit">{fmtMoney(m.swing)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 border-l-[3px] border-hotred pl-3 font-sans text-sm text-ink">
        Estimated opportunity cost of misallocation:{' '}
        <span className="font-bold">{fmtMoney(reallocation.totalProjectedSwing)}</span>. This is a
        counterfactual from your own past ROI — opportunity cost, not a forecast. Variance still applies.
      </p>
    </BrutalCard>
  )
}

/* ---------- Findings (consulting flow) ---------- */
function FindingsPanel({ findings }: { findings: Finding[] }) {
  if (!findings?.length) return null
  const sevColor = (s: Finding['severity']) =>
    s === 'CRITICAL' ? 'text-hotred' : s === 'HIGH' ? 'text-amber-500' : 'text-muted-foreground'
  return (
    <div className="space-y-4">
      {findings.map((f, i) => (
        <div key={f.id} className="border border-ink bg-card p-4 shadow-[0_4px_20px_-8px_rgba(18,18,18,0.15)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-sans text-lg font-bold leading-tight text-ink">
              {i + 1}. {f.title}
            </h3>
            <span className={cn('font-mono text-[10px] font-bold uppercase tracking-widest', sevColor(f.severity))}>
              {f.severity}
            </span>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            <FindingRow label="What we found" text={f.whatWeFound} />
            <FindingRow label="Why it matters" text={f.whyItMatters} />
            <FindingRow label="Root cause" text={f.rootCause} />
            <FindingRow label="Fix" text={f.recommendation} accent />
          </dl>
        </div>
      ))}
    </div>
  )
}

function FindingRow({ label, text, accent }: { label: string; text: string; accent?: boolean }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2">
      <dt className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </dt>
      <dd className={cn('font-sans', accent ? 'font-bold text-profit' : 'text-ink')}>{text}</dd>
    </div>
  )
}

/* ---------- Phased Roadmap ---------- */
function RoadmapPanel({ plan }: { plan: PhasedRecommendation[] }) {
  if (!plan?.length) return null
  const phases: { key: PhasedRecommendation['phase']; label: string }[] = [
    { key: 'QUICK_WIN', label: 'QUICK WINS — BEFORE YOUR NEXT SLATE' },
    { key: 'MEDIUM', label: 'MEDIUM-TERM — THIS MONTH' },
    { key: 'LONG_TERM', label: 'LONG-TERM — NEXT 3–6 MONTHS' },
  ]
  const prColor = (p: PhasedRecommendation['priority']) =>
    p === 'HIGH' ? 'text-hotred' : p === 'MEDIUM' ? 'text-amber-500' : 'text-muted-foreground'
  return (
    <div className="space-y-6">
      {phases.map(({ key, label }) => {
        const items = plan.filter((p) => p.phase === key)
        if (!items.length) return null
        return (
          <div key={key}>
            <div className="mb-3 border-b-[2px] border-ink pb-2 font-mono text-xs font-bold uppercase tracking-widest text-ink">
              {label}
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="border border-ink/40 bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-sans text-base font-bold leading-tight text-ink">{item.action}</p>
                    <span className={cn('font-mono text-[10px] font-bold uppercase tracking-widest', prColor(item.priority))}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{item.rationale}</p>
                  <p className="mt-2 font-sans text-sm font-medium text-profit">
                    Expected benefit: {item.expectedBenefit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
