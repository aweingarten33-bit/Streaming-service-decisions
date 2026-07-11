"use client";

import type { AnalysisReport } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { Reveal } from '@/components/fx/reveal'
import { cn } from '@/lib/utils'
import { AdvisorLetter, KpiCard, NextSteps, ReportHeader, SectionHeading } from './_shared'

/**
 * Pattern Recognition Analysis — Rain Man.
 * All numbers pulled from hiddenInteractions + monthly + positionConversion.
 */
export function PatternReportView({ report }: { report: AnalysisReport }) {
  const c = report.chess
  const interactions = c.hiddenInteractions.slice(0, 8)

  // Seasonality: month-of-year ROI aggregation from monthly.
  const monthAgg = new Map<string, { net: number; fees: number; entries: number }>()
  for (const m of report.monthly) {
    const key = m.label.slice(5) // MM
    const cur = monthAgg.get(key) ?? { net: 0, fees: 0, entries: 0 }
    cur.net += m.net
    cur.entries += m.entries
    // approximate fees from ROI + net; fine as ordering signal
    if (m.roi !== 0) cur.fees += Math.abs(m.net / (m.roi / 100))
    monthAgg.set(key, cur)
  }
  const seasons = [...monthAgg.entries()]
    .filter(([, v]) => v.entries >= 5)
    .map(([month, v]) => ({
      month,
      net: v.net,
      entries: v.entries,
      roi: v.fees > 0 ? (v.net / v.fees) * 100 : 0,
    }))
    .sort((a, b) => b.roi - a.roi)

  // Anomaly detection: months whose ROI is > 2 * stdev from the mean.
  const monthlyRois = report.monthly.map((m) => m.roi)
  const mean = avg(monthlyRois)
  const sd = stdev(monthlyRois)
  const anomalies = report.monthly.filter((m) => sd > 0 && Math.abs(m.roi - mean) > 2 * sd)

  return (
    <div className="space-y-12 sm:space-y-16">
      <AdvisorLetter
        signedBy="The Pattern Desk"
        headline={
          interactions.length + anomalies.length > 0
            ? "Your history has patterns. Some are worth acting on, and a few are worth explaining."
            : 'Your history is behaving the way normal noise behaves — which is its own kind of good news.'
        }
        body={
          <>
            <p>
              We looked at your play the way a pattern-spotter would: not "did you win,"
              but "what shows up again and again." Real patterns survive when you look at
              them from a different angle. Everything else is a story your brain wants to
              tell.
            </p>
            <p>
              Below you'll see three things: combinations that behave differently from
              what their pieces would suggest, months of the year where you reliably do
              better or worse, and any single month so far from your average that it
              probably had a specific cause. Each one is either a lever or a lesson.
            </p>
          </>
        }
      />

      <ReportHeader
        badge="◍ THE PATTERNS"
        title="What keeps happening — and what doesn't fit."
        epigraph="A real pattern shows up more than once. This report separates the things that repeat in your history from the things that just look interesting once. Repeatable patterns are actionable. Everything else is a story."
        report={report}
      />

      <Reveal>
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="SURPRISING COMBOS" value={String(interactions.length)} caption="Combinations that do noticeably better or worse than the pieces would suggest." />
          <KpiCard label="MONTHS TO WATCH" value={String(seasons.length)} caption="Months with enough entries to spot a seasonal pattern." />
          <KpiCard label="ODD MONTHS" value={String(anomalies.length)} tone={anomalies.length ? 'warn' : 'good'} caption="Months so far from your average they probably had a specific cause." />
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="01" title="SURPRISING COMBOS" subtitle="Where the combination behaves differently than the parts. That gap — up or down — is the pattern." />
          <div className="overflow-hidden border border-ink">
            <table className="w-full font-mono text-xs">
              <thead className="bg-ink text-paper">
                <tr>
                  <th className="p-2 text-left">SPOT</th>
                  <th className="p-2 text-right">ENTRIES</th>
                  <th className="p-2 text-right">YOUR ROI</th>
                  <th className="p-2 text-right">EXPECTED ROI</th>
                  <th className="p-2 text-right">GAP</th>
                  <th className="p-2 text-right">NET</th>
                </tr>
              </thead>
              <tbody>
                {interactions.map((h, i) => {
                  const col = h.interactionRoi >= 0 ? 'text-profit' : 'text-hotred'
                  return (
                    <tr key={i} className="border-t border-ink/20">
                      <td className="p-2 text-ink">{h.cell}</td>
                      <td className="p-2 text-right">{h.entries}</td>
                      <td className="p-2 text-right">{h.roi.toFixed(1)}%</td>
                      <td className="p-2 text-right text-muted-foreground">{h.expectedRoi.toFixed(1)}%</td>
                      <td className={cn('p-2 text-right font-bold', col)}>{h.interactionRoi >= 0 ? '+' : ''}{h.interactionRoi.toFixed(1)}</td>
                      <td className={cn('p-2 text-right', col)}>{fmtMoney(h.net)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="02" title="TIME OF YEAR" subtitle="Which months of the calendar have historically been your best and worst." />
          {seasons.length === 0 ? (
            <p className="border border-dashed border-ink/25 p-3 font-mono text-xs text-muted-foreground">Not enough per-month sample yet.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {seasons.map((s) => {
                const good = s.roi >= 0
                return (
                  <div key={s.month} className={cn('flex items-center justify-between border p-3', good ? 'border-profit' : 'border-hotred')}>
                    <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">MONTH {s.month}</div>
                    <div className="text-right">
                      <div className={cn('font-display text-2xl leading-none tracking-tighter', good ? 'text-profit' : 'text-hotred')}>
                        {s.roi >= 0 ? '+' : ''}{s.roi.toFixed(1)}%
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">{s.entries} entries · {fmtMoney(s.net)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="03" title="ODD MONTHS OUT" subtitle="These months are so far from your average that they probably had a specific cause. Each one is worth remembering — good or bad." />
          {anomalies.length === 0 ? (
            <p className="border border-dashed border-ink/25 p-3 font-mono text-xs text-muted-foreground">No months stand out. Your play is behaving the way normal ups and downs look.</p>
          ) : (
            <div className="space-y-2">
              {anomalies.map((a) => {
                const col = a.roi >= 0 ? 'text-profit' : 'text-hotred'
                return (
                  <div key={a.label} className={cn('flex items-center justify-between border p-3', a.roi >= 0 ? 'border-profit' : 'border-hotred')}>
                    <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">{a.label}</div>
                    <div className="text-right">
                      <div className={cn('font-display text-2xl leading-none tracking-tighter', col)}>{a.roi >= 0 ? '+' : ''}{a.roi.toFixed(1)}%</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{fmtMoney(a.net)} · your average is {mean.toFixed(1)}%</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="04" title="WHAT HAPPENS AFTER A STREAK" subtitle="Your ROI the day after a hot streak, a normal day, and a cold streak. A pattern here only counts if it repeats." />
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard label="AFTER 3+ WINS" value={`${c.positionConversion.hotStreakNextDayRoi.toFixed(1)}%`} tone={c.positionConversion.hotStreakNextDayRoi >= 0 ? 'good' : 'bad'} caption={`Across ${c.positionConversion.hotStreakNextDayEntries} entries after a 3-day win streak.`} />
            <KpiCard label="A NORMAL DAY" value={`${c.positionConversion.baselineNextDayRoi.toFixed(1)}%`} caption="Your ROI on any given day, no streak in play." />
            <KpiCard label="AFTER 3+ LOSSES" value={`${c.positionConversion.coldStreakNextDayRoi.toFixed(1)}%`} tone={c.positionConversion.coldStreakNextDayRoi >= c.positionConversion.baselineNextDayRoi ? 'good' : 'bad'} caption={`Across ${c.positionConversion.coldStreakNextDayEntries} entries after a 3-day losing streak.`} />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <NextSteps
          intro="What to actually do with the patterns above."
          steps={[
            {
              do: interactions[0]
                ? `Take your best-signal combination — ${interactions[0].cell} — and give it a permanent line in your weekly budget.`
                : "Keep playing. You don't have enough sample yet for a combination to stand up on its own.",
              because: interactions[0]
                ? "It's the pattern with the biggest gap between what happened and what should have happened."
                : "Patterns need repetition to trust. Sample first, act second.",
            },
            {
              do: seasons.length >= 2
                ? `Bank the extra entries for month ${seasons[0].month} and cut back in month ${seasons[seasons.length - 1].month}.`
                : 'Track your monthly ROI on a spreadsheet so seasonal patterns can build sample.',
              because: 'The calendar is one of the cheapest edges to act on because you already know when it happens.',
            },
            {
              do: 'Write a one-line note next to every odd month above. What was different that month?',
              because: 'The explanation is the pattern. Without it, the number is just noise.',
            },
          ]}
        />
      </Reveal>
    </div>
  )
}

function avg(xs: number[]) {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0
}
function stdev(xs: number[]) {
  if (xs.length < 2) return 0
  const m = avg(xs)
  const v = avg(xs.map((x) => (x - m) ** 2))
  return Math.sqrt(v)
}