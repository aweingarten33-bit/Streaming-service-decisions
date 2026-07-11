"use client";

import type { AnalysisReport } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { Reveal } from '@/components/fx/reveal'
import { cn } from '@/lib/utils'
import { AdvisorLetter, KpiCard, NextSteps, ReportHeader, SectionHeading } from './_shared'

/**
 * Intelligence Assessment — reframes the same evidence as a briefing:
 * threats, opportunities, blind spots, indicators. All figures pulled from
 * the shared AnalysisReport (hidden interactions, conditional splits,
 * monthly trend, buckets).
 */
export function IntelligenceReportView({ report }: { report: AnalysisReport }) {
  const c = report.chess

  const threats = c.hiddenInteractions
    .filter((h) => h.interactionRoi < -10 && h.entries >= 10)
    .slice(0, 4)
  const opportunities = c.hiddenInteractions
    .filter((h) => h.interactionRoi > 10 && h.entries >= 10)
    .slice(0, 4)

  // Momentum from monthly trend — recent 3 vs prior 3.
  const m = report.monthly
  const recent = m.slice(-3)
  const prior = m.slice(-6, -3)
  const recentRoi = avg(recent.map((r) => r.roi))
  const priorRoi = avg(prior.map((r) => r.roi))
  const momentum = recentRoi - priorRoi

  const blindSpots = report.sportBreakdown
    .filter((b) => b.entries > 0 && b.entries < 20)
    .sort((a, b) => b.fees - a.fees)
    .slice(0, 4)

  const priorityLevel =
    threats.length >= 3 || report.bankroll.peakSlateExposurePct > 15
      ? { label: 'ELEVATED', tone: 'bad' as const }
      : threats.length >= 1
        ? { label: 'GUARDED', tone: 'warn' as const }
        : { label: 'ROUTINE', tone: 'good' as const }

  return (
    <div className="space-y-12 sm:space-y-16">
      <AdvisorLetter
        signedBy="The Intelligence Desk"
        headline={
          priorityLevel.label === 'ELEVATED'
            ? 'There are things in your history you\'ve stopped noticing. They are expensive.'
            : priorityLevel.label === 'GUARDED'
              ? "A few soft spots in the sample deserve a closer look this week."
              : "No red flags today — which is exactly when to widen the aperture."
        }
        body={
          <>
            <p>
              This desk reads your history the way an analyst reads a briefing — looking
              for the pattern hiding in plain sight, the corner of the map with no coverage,
              and the trend that changed while nobody was watching.
            </p>
            <p>
              We flagged your top threat, your top opportunity, and the spots where you
              have real money in play but not enough entries to know if you're any good
              there yet. Those "unknown" spots are the ones that most quietly move a
              bankroll year over year.
            </p>
          </>
        }
      />

      <ReportHeader
        badge="⌖ THE BRIEFING"
        title="What your own data already knows."
        epigraph="This isn't a prediction. It's a scan of your history for the things you're likely to miss on your own — quiet threats, real opportunities, and the spots you don't have enough data on yet."
        report={report}
      />

      <Reveal>
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="THREAT LEVEL" value={priorityLevel.label} tone={priorityLevel.tone} caption="How many active leaks are eating into your bankroll right now." />
          <KpiCard label="RECENT TREND" value={`${momentum >= 0 ? '+' : ''}${momentum.toFixed(1)}pp`} tone={momentum >= 0 ? 'good' : 'bad'} caption="Your ROI in the last 3 months compared to the 3 months before that." />
          <KpiCard label="STRONG SIGNALS" value={String(c.conditionalSplits.filter((s) => s.confidence.level !== 'LOW').length)} caption="Patterns we found where the sample is big enough to trust." />
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="01" title="THE THREE-LINE READ" subtitle="Top threat, top opportunity, and where the trend is heading." />
          <ul className="space-y-2 border border-ink p-5 font-serif text-base leading-relaxed text-ink">
            <li>
              <span className="font-mono text-[10px] uppercase tracking-widest text-hotred">BIGGEST THREAT · </span>
              {threats[0]
                ? `${threats[0].cell} is performing ${Math.abs(threats[0].interactionRoi).toFixed(1)} points worse than it should. Total damage so far: ${fmtMoney(threats[0].net)}.`
                : `${report.biggestLeak}.`}
            </li>
            <li>
              <span className="font-mono text-[10px] uppercase tracking-widest text-profit">BIGGEST OPPORTUNITY · </span>
              {opportunities[0]
                ? `${opportunities[0].cell} is quietly outperforming by ${opportunities[0].interactionRoi.toFixed(1)} points. That's real.`
                : `${report.bestOpportunity}.`}
            </li>
            <li>
              <span className="font-mono text-[10px] uppercase tracking-widest text-amber-500">WHERE IT'S HEADING · </span>
              {momentum >= 5
                ? 'The last three months are clearly better than the three before. Keep doing whatever you changed.'
                : momentum <= -5
                  ? 'The last three months are clearly worse than the three before. Something changed — figure out what.'
                  : "The last three months look about the same as the three before. Steady, for better or worse."}
            </li>
          </ul>
        </div>
      </Reveal>

      <Reveal>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <SectionHeading n="02" title="THREATS" subtitle="Spots that are quietly costing you more than they should." />
            <div className="space-y-2">
              {threats.length === 0 && (
                <p className="border border-dashed border-ink/25 p-3 font-mono text-xs text-muted-foreground">Nothing serious to flag on this front.</p>
              )}
              {threats.map((t, i) => (
                <div key={i} className="border border-hotred p-3">
                  <div className="font-mono text-xs font-bold uppercase tracking-widest text-hotred">{t.cell}</div>
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Your ROI here: {t.roi.toFixed(1)}%. Where it should be: {t.expectedRoi.toFixed(1)}%. Across {t.entries} entries and {fmtMoney(t.net)}.
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading n="03" title="OPPORTUNITIES" subtitle="Spots you're beating that deserve more of your money." />
            <div className="space-y-2">
              {opportunities.length === 0 && (
                <p className="border border-dashed border-ink/25 p-3 font-mono text-xs text-muted-foreground">Nothing stands out clearly yet. Keep building sample.</p>
              )}
              {opportunities.map((t, i) => (
                <div key={i} className="border border-profit p-3">
                  <div className="font-mono text-xs font-bold uppercase tracking-widest text-profit">{t.cell}</div>
                  <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                    Your ROI here: {t.roi.toFixed(1)}%. Where it "should" be: {t.expectedRoi.toFixed(1)}%. Across {t.entries} entries and {fmtMoney(t.net)}.
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="04" title="BLIND SPOTS" subtitle="You've put real money into these spots, but you haven't played enough entries to know if you're any good there. That's how expensive habits start." />
          <div className="grid gap-3 sm:grid-cols-2">
            {blindSpots.map((b) => (
              <div key={b.key} className="border border-ink p-4">
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">{b.key}</div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  Only {b.entries} entries. {fmtMoney(b.fees)} spent. ROI {b.roi.toFixed(1)}% — but the sample is too small to trust yet.
                </div>
                <p className="mt-2 font-serif text-sm text-ink/75">
                  You need more entries here to know if it's an edge — or you need to stop putting money in until you do.
                </p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="05" title="TELLTALE SIGNS" subtitle="Specific conditions where your ROI reliably breaks from your average — good and bad." />
          <div className="grid gap-3 sm:grid-cols-2">
            {c.conditionalSplits.slice(0, 6).map((s, i) => {
              const good = s.roi >= 0
              return (
                <div key={i} className={cn('border p-4', good ? 'border-profit' : 'border-hotred')}>
                  <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">{s.condition}</div>
                  <div className={cn('font-display text-3xl leading-none tracking-tighter', good ? 'text-profit' : 'text-hotred')}>
                    {s.roi >= 0 ? '+' : ''}{s.roi.toFixed(1)}%
                  </div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {s.vsBaselineRoiDelta >= 0 ? '+' : ''}{s.vsBaselineRoiDelta.toFixed(1)} points vs your average · {s.confidence.level === 'HIGH' ? 'strong signal' : s.confidence.level === 'MEDIUM' ? 'decent signal' : 'weak signal'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <NextSteps
          intro="Two moves for this week, based on the briefing above."
          steps={[
            {
              do: threats[0]
                ? `Cut your exposure to ${threats[0].cell} in half for the next 30 days.`
                : 'Pick your single worst-performing spot and cut your entries there in half for the next 30 days.',
              because: threats[0]
                ? `It's underperforming by ${Math.abs(threats[0].interactionRoi).toFixed(1)} points vs where it should be.`
                : 'You have to test whether the leak follows you when you leave.',
            },
            {
              do: opportunities[0]
                ? `Move that entry budget into ${opportunities[0].cell}, where you're quietly beating your own baseline.`
                : 'Move that entry budget into your best-ROI category with 20+ entries.',
              because: opportunities[0]
                ? "It's an outlier in the right direction. Reinforce it while it's real."
                : 'Reinforce the spots your own history has already proven.',
            },
          ]}
        />
      </Reveal>
    </div>
  )
}

function avg(xs: number[]): number {
  if (!xs.length) return 0
  return xs.reduce((s, x) => s + x, 0) / xs.length
}