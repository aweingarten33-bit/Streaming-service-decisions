"use client";

import type { AnalysisReport, ChessMetrics, ConfidenceRead } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { BrutalCard } from '@/components/punk/brutal-card'
import { Reveal } from '@/components/fx/reveal'
import { cn } from '@/lib/utils'

/**
 * Chess Grandmaster Strategy Audit & Review.
 * Every number rendered here comes from report.chess (pure CSV math in
 * src/lib/chess-metrics.ts). The prose around the numbers is a fixed
 * ~10% philosophical frame — no AI, no invented figures.
 */
export function ChessReportView({ report }: { report: AnalysisReport }) {
  const c: ChessMetrics = report.chess

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Header + why chess */}
      <BrutalCard border="ink" className="p-5 sm:p-8">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
          ♟ CHESS GRANDMASTER STRATEGY AUDIT
        </div>
        <h1 className="font-display mt-1 text-3xl leading-none tracking-tight text-ink sm:text-5xl">
          Decisions, not outcomes.
        </h1>
        <p className="mt-6 border-l-2 border-ink pl-4 font-serif text-lg leading-relaxed text-ink">
          Grandmasters review lost games and won games the same way. They aren't looking for the
          scoreboard — they already know it. They're looking for the exact move where the position
          started to deteriorate, the candidate moves they didn't play, and the pattern that keeps
          repeating across games. That is the framework this report applies to your DFS history:
          position evaluation, candidate moves, inaccuracies and blunders, strategic accuracy, and
          conversion. The rest of this document is your data, graded against those ideas.
        </p>
        <ConfidenceStrip read={c.overallConfidence} label="Confidence in your overall ROI figure" />
      </BrutalCard>

      {/* Strategic Accuracy */}
      <Reveal>
        <StrategicAccuracyPanel c={c} />
      </Reveal>

      {/* Critical Position */}
      <Reveal>
        <CriticalPositionPanel c={c} />
      </Reveal>

      {/* Candidate Moves */}
      <Reveal>
        <CandidateMovesPanel c={c} />
      </Reveal>

      {/* Phases */}
      <Reveal>
        <PhasesPanel c={c} />
      </Reveal>

      {/* Position Conversion */}
      <Reveal>
        <ConversionPanel c={c} />
      </Reveal>

      {/* Conditional splits */}
      <Reveal>
        <ConditionalPanel c={c} />
      </Reveal>

      {/* Hidden Interactions */}
      <Reveal>
        <InteractionsPanel c={c} />
      </Reveal>

      {/* Variance vs structural */}
      <Reveal>
        <VariancePanel c={c} />
      </Reveal>

      {/* Consistency */}
      <Reveal>
        <ConsistencyPanel c={c} />
      </Reveal>
    </div>
  )
}

/* ---------- helpers ---------- */

function ConfidenceStrip({ read, label }: { read: ConfidenceRead; label: string }) {
  const color =
    read.level === 'HIGH' ? 'text-profit' : read.level === 'MEDIUM' ? 'text-amber-500' : 'text-hotred'
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink/20 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
      <span>{label}:</span>
      <span className={cn('font-bold', color)}>{read.level}</span>
      <span>N={read.sampleSize}</span>
      <span>SE={read.standardError.toFixed(2)}</span>
      <span>Z={read.zScore.toFixed(2)}</span>
    </div>
  )
}

function SectionHeading({ n, title, subtitle }: { n: string; title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        MOVE {n}
      </div>
      <h2 className="font-display text-3xl leading-none tracking-tight text-ink sm:text-5xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl font-serif text-base leading-relaxed text-ink/70">{subtitle}</p>
    </div>
  )
}

/* ---------- Strategic Accuracy ---------- */
function StrategicAccuracyPanel({ c }: { c: ChessMetrics }) {
  const s = c.strategicAccuracy
  const tier = s.score >= 70 ? 'text-profit' : s.score >= 45 ? 'text-amber-500' : 'text-hotred'
  const bandColor: Record<string, string> = {
    'Best Move': 'bg-profit',
    Inaccuracy: 'bg-amber-500',
    Mistake: 'bg-orange',
    Blunder: 'bg-hotred',
  }
  return (
    <div>
      <SectionHeading
        n="01"
        title="STRATEGIC ACCURACY"
        subtitle="Every dollar you entered is classified against your own segment ROI. Best Move: positive-ROI cells. Inaccuracy: 0 to -15%. Mistake: -15 to -40%. Blunder: worse than -40%."
      />
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="border border-ink p-5 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            ACCURACY SCORE
          </div>
          <div className={cn('font-display text-7xl leading-none tracking-tighter', tier)}>
            {s.score.toFixed(0)}
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            / 100
          </div>
          <div className="mt-4 border-t border-ink/20 pt-3 font-mono text-[11px] text-ink">
            {s.bestMovePct.toFixed(1)}% of graded capital was a Best Move
          </div>
        </div>
        <div className="space-y-3">
          {s.bands.map((b) => (
            <div key={b.label} className="border border-ink/40 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-ink">
                  <span className={cn('h-3 w-3', bandColor[b.label])} />
                  {b.label}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {b.entries} entries · {fmtMoney(b.fees)} deployed · {fmtMoney(b.net)} net
                </div>
              </div>
              <div className="mt-2 h-2 w-full border border-ink/20">
                <div
                  className={cn('h-full', bandColor[b.label])}
                  style={{ width: `${Math.min(100, b.share)}%` }}
                />
              </div>
              <div className="mt-1 font-mono text-[10px] text-muted-foreground">
                {b.share.toFixed(1)}% of graded fees
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ---------- Critical Position ---------- */
function CriticalPositionPanel({ c }: { c: ChessMetrics }) {
  const cp = c.criticalPosition
  if (!cp.hasData) return null
  return (
    <div>
      <SectionHeading
        n="02"
        title="CRITICAL POSITION"
        subtitle="Where did the position start to deteriorate? This is your worst peak-to-trough run and your single worst calendar week — the games a coach would want to review first."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="border border-hotred p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            LARGEST DRAWDOWN
          </div>
          <div className="font-display text-5xl leading-none tracking-tighter text-hotred">
            {fmtMoney(-cp.drawdown)}
          </div>
          <div className="mt-3 font-mono text-xs text-ink">
            Peak {fmtMoney(cp.peakNet)} on {cp.peakDate}
          </div>
          <div className="font-mono text-xs text-ink">
            Trough {fmtMoney(cp.troughNet)} on {cp.troughDate}
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {cp.daysToTrough} days to bottom
          </div>
        </div>
        <div className="border border-ink p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            WORST CALENDAR WEEK
          </div>
          <div className="font-display text-5xl leading-none tracking-tighter text-hotred">
            {fmtMoney(cp.worstWeekNet)}
          </div>
          <div className="mt-3 font-mono text-xs text-ink">Week {cp.worstWeekLabel}</div>
          <div className="font-mono text-xs text-muted-foreground">
            {cp.worstWeekEntries} entries that week
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Candidate Moves ---------- */
function CandidateMovesPanel({ c }: { c: ChessMetrics }) {
  if (!c.candidateMoves.length) return null
  return (
    <div>
      <SectionHeading
        n="03"
        title="CANDIDATE MOVES"
        subtitle="For your worst-graded situations, here is the move you actually played versus the best alternative your own data supports for the same capital."
      />
      <div className="space-y-3">
        {c.candidateMoves.map((m, i) => (
          <div key={i} className="border border-ink p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
                MOVE PLAYED · {m.situation}
              </div>
              <div className="font-mono text-xs text-hotred">
                {m.historicalRoi.toFixed(1)}% ROI · {fmtMoney(m.historicalNet)} net · {m.historicalEntries} entries
              </div>
            </div>
            <div className="mt-2 border-t border-ink/20 pt-2">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-profit">
                  CANDIDATE · {m.alternative}
                </div>
                <div className="font-mono text-xs text-profit">
                  {m.alternativeRoi.toFixed(1)}% ROI
                </div>
              </div>
              <div className="mt-2 font-mono text-[11px] text-muted-foreground">
                EV gap: {m.evGap >= 0 ? '+' : ''}
                {m.evGap.toFixed(1)} ROI points · projected swing on the same capital:{' '}
                <span className={m.dollarSwing >= 0 ? 'text-profit' : 'text-hotred'}>
                  {fmtMoney(m.dollarSwing)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Phases ---------- */
function PhasesPanel({ c }: { c: ChessMetrics }) {
  if (!c.phases.length) return null
  return (
    <div>
      <SectionHeading
        n="04"
        title="OPENING · MIDDLEGAME · ENDGAME"
        subtitle="Your history split into thirds by date. Coaches use this to see whether you are improving, plateauing, or leaking edge as the sample matures."
      />
      <div className="grid gap-3 md:grid-cols-3">
        {c.phases.map((p) => {
          const good = p.roi >= 0
          return (
            <div key={p.phase} className={cn('border p-5', good ? 'border-profit' : 'border-hotred')}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {p.phase}
              </div>
              <div className={cn('font-display text-5xl leading-none tracking-tighter', good ? 'text-profit' : 'text-hotred')}>
                {p.roi >= 0 ? '+' : ''}
                {p.roi.toFixed(1)}%
              </div>
              <div className="mt-2 font-mono text-xs text-ink">{fmtMoney(p.net)} net</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {p.entries} entries · {fmtMoney(p.fees)} deployed
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ---------- Conversion ---------- */
function ConversionPanel({ c }: { c: ChessMetrics }) {
  const pc = c.positionConversion
  if (!pc.hasData) return null
  return (
    <div>
      <SectionHeading
        n="05"
        title="POSITION CONVERSION"
        subtitle="A grandmaster's job in a winning position is to convert. In a losing position, the job is to hold ground, not to compound the mistake. This is how you handled both."
      />
      <div className="grid gap-3 md:grid-cols-3">
        <ConvCard
          label="AFTER 3+ WINNING DAYS"
          roi={pc.hotStreakNextDayRoi}
          n={pc.hotStreakNextDayEntries}
          baseline={pc.baselineNextDayRoi}
          verdict="conversion"
        />
        <ConvCard
          label="BASELINE NEXT-DAY"
          roi={pc.baselineNextDayRoi}
          n={0}
          baseline={pc.baselineNextDayRoi}
          verdict="baseline"
        />
        <ConvCard
          label="AFTER 3+ LOSING DAYS"
          roi={pc.coldStreakNextDayRoi}
          n={pc.coldStreakNextDayEntries}
          baseline={pc.baselineNextDayRoi}
          verdict="tilt"
        />
      </div>
    </div>
  )
}
function ConvCard({
  label, roi, n, baseline, verdict,
}: { label: string; roi: number; n: number; baseline: number; verdict: 'conversion' | 'tilt' | 'baseline' }) {
  const delta = roi - baseline
  const good = verdict === 'baseline' ? null : verdict === 'conversion' ? delta >= 0 : delta >= 0
  const border = good === null ? 'border-ink' : good ? 'border-profit' : 'border-hotred'
  const col = good === null ? 'text-ink' : good ? 'text-profit' : 'text-hotred'
  return (
    <div className={cn('border p-5', border)}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn('font-display text-5xl leading-none tracking-tighter', col)}>
        {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
      </div>
      {verdict !== 'baseline' && (
        <div className="mt-2 font-mono text-[11px] text-muted-foreground">
          {delta >= 0 ? '+' : ''}{delta.toFixed(1)} vs baseline · {n} entries
        </div>
      )}
    </div>
  )
}

/* ---------- Conditional splits ---------- */
function ConditionalPanel({ c }: { c: ChessMetrics }) {
  if (!c.conditionalSplits.length) return null
  return (
    <div>
      <SectionHeading
        n="06"
        title="POSITIONAL SPLITS"
        subtitle="Chess coaches obsess over conditions: same opening, different results. These splits show your ROI under specific real-world conditions in your data, with a confidence read on each."
      />
      <div className="overflow-hidden border border-ink">
        <table className="w-full font-mono text-xs">
          <thead className="bg-ink text-paper">
            <tr>
              <th className="p-2 text-left">CONDITION</th>
              <th className="p-2 text-right">ENTRIES</th>
              <th className="p-2 text-right">ROI</th>
              <th className="p-2 text-right">Δ vs OVERALL</th>
              <th className="p-2 text-right">NET</th>
              <th className="p-2 text-right">CONF</th>
            </tr>
          </thead>
          <tbody>
            {c.conditionalSplits.map((s, i) => {
              const col = s.roi >= 0 ? 'text-profit' : 'text-hotred'
              const confCol =
                s.confidence.level === 'HIGH' ? 'text-profit' : s.confidence.level === 'MEDIUM' ? 'text-amber-500' : 'text-muted-foreground'
              return (
                <tr key={i} className="border-t border-ink/20">
                  <td className="p-2 text-ink">{s.condition}</td>
                  <td className="p-2 text-right">{s.entries}</td>
                  <td className={cn('p-2 text-right font-bold', col)}>{s.roi.toFixed(1)}%</td>
                  <td className={cn('p-2 text-right', col)}>{s.vsBaselineRoiDelta >= 0 ? '+' : ''}{s.vsBaselineRoiDelta.toFixed(1)}</td>
                  <td className={cn('p-2 text-right', col)}>{fmtMoney(s.net)}</td>
                  <td className={cn('p-2 text-right', confCol)}>{s.confidence.level}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------- Hidden Interactions ---------- */
function InteractionsPanel({ c }: { c: ChessMetrics }) {
  if (!c.hiddenInteractions.length) return null
  return (
    <div>
      <SectionHeading
        n="07"
        title="HIDDEN INTERACTIONS"
        subtitle="A position is more than the sum of its pieces. These are cells where the combination of factors performs very differently from what the individual factors would predict — a real interaction effect, positive or negative."
      />
      <div className="overflow-hidden border border-ink">
        <table className="w-full font-mono text-xs">
          <thead className="bg-ink text-paper">
            <tr>
              <th className="p-2 text-left">CELL</th>
              <th className="p-2 text-right">ENTRIES</th>
              <th className="p-2 text-right">ACTUAL ROI</th>
              <th className="p-2 text-right">EXPECTED</th>
              <th className="p-2 text-right">INTERACTION</th>
              <th className="p-2 text-right">NET</th>
            </tr>
          </thead>
          <tbody>
            {c.hiddenInteractions.map((h, i) => {
              const col = h.interactionRoi >= 0 ? 'text-profit' : 'text-hotred'
              return (
                <tr key={i} className="border-t border-ink/20">
                  <td className="p-2 text-ink">{h.cell}</td>
                  <td className="p-2 text-right">{h.entries}</td>
                  <td className="p-2 text-right">{h.roi.toFixed(1)}%</td>
                  <td className="p-2 text-right text-muted-foreground">{h.expectedRoi.toFixed(1)}%</td>
                  <td className={cn('p-2 text-right font-bold', col)}>
                    {h.interactionRoi >= 0 ? '+' : ''}{h.interactionRoi.toFixed(1)}
                  </td>
                  <td className={cn('p-2 text-right', h.net >= 0 ? 'text-profit' : 'text-hotred')}>
                    {fmtMoney(h.net)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------- Variance vs Structural ---------- */
function VariancePanel({ c }: { c: ChessMetrics }) {
  const v = c.varianceAttribution
  const total = v.structuralLossDollars + v.varianceLossDollars
  if (total <= 0) return null
  return (
    <div>
      <SectionHeading
        n="08"
        title="VARIANCE VS STRUCTURAL LOSS"
        subtitle="Not every loss is a mistake. Large-field GPPs have wide natural swings. This attributes your losses between structural leaks (segments with statistically negative ROI) and expected variance."
      />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="border border-hotred p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            STRUCTURAL LEAK
          </div>
          <div className="font-display text-5xl leading-none tracking-tighter text-hotred">
            {fmtMoney(-v.structuralLossDollars)}
          </div>
          <div className="mt-2 font-mono text-[11px] text-muted-foreground">
            {v.structuralSharePct.toFixed(0)}% of losses come from negative-EV segments.
          </div>
        </div>
        <div className="border border-ink p-5">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            EXPECTED VARIANCE
          </div>
          <div className="font-display text-5xl leading-none tracking-tighter text-ink">
            {fmtMoney(-v.varianceLossDollars)}
          </div>
          <div className="mt-2 font-mono text-[11px] text-muted-foreground">
            {(100 - v.structuralSharePct).toFixed(0)}% is variance within expected bounds.
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- Consistency ---------- */
function ConsistencyPanel({ c }: { c: ChessMetrics }) {
  const s = c.consistency
  const tier = s.score >= 70 ? 'text-profit' : s.score >= 45 ? 'text-amber-500' : 'text-hotred'
  return (
    <div>
      <SectionHeading
        n="09"
        title="STRATEGIC CONSISTENCY"
        subtitle="Grandmasters play the position, not the scoreboard. This tracks whether your bet sizing stays disciplined across winning and losing days, or escalates emotionally."
      />
      <div className="grid gap-3 md:grid-cols-[240px_1fr]">
        <div className="border border-ink p-5 text-center">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            CONSISTENCY SCORE
          </div>
          <div className={cn('font-display text-7xl leading-none tracking-tighter', tier)}>
            {s.score.toFixed(0)}
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            / 100
          </div>
        </div>
        <div className="space-y-3">
          <MetricRow label="DAILY FEE VARIABILITY (CV)" value={s.dailyFeeCv.toFixed(2)} note="Lower is more consistent." />
          <MetricRow
            label="ESCALATION AFTER A BIG WIN"
            value={`${s.afterBigWinInflationPct >= 0 ? '+' : ''}${s.afterBigWinInflationPct.toFixed(1)}%`}
            note="Positive = you press bigger after winning days."
            bad={s.afterBigWinInflationPct > 20}
          />
          <MetricRow
            label="CHASING AFTER A BIG LOSS"
            value={`${s.afterBigLossInflationPct >= 0 ? '+' : ''}${s.afterBigLossInflationPct.toFixed(1)}%`}
            note="Positive = you press bigger after losing days (tilt)."
            bad={s.afterBigLossInflationPct > 20}
          />
        </div>
      </div>
    </div>
  )
}

function MetricRow({ label, value, note, bad }: { label: string; value: string; note: string; bad?: boolean }) {
  return (
    <div className={cn('border p-3', bad ? 'border-hotred' : 'border-ink/40')}>
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className={cn('font-display text-2xl leading-none', bad ? 'text-hotred' : 'text-ink')}>{value}</div>
      </div>
      <div className="mt-1 font-mono text-[11px] text-muted-foreground">{note}</div>
    </div>
  )
}