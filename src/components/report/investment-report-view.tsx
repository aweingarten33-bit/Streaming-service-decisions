"use client";

import type { AnalysisReport } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { Reveal } from '@/components/fx/reveal'
import { cn } from '@/lib/utils'
import { AdvisorLetter, Bar, KpiCard, NextSteps, ReportHeader, SectionHeading, clamp01, grade } from './_shared'

/**
 * Investment Committee Review — treats bankroll as a portfolio.
 * All figures derived from shared AnalysisReport buckets + trends.
 */
export function InvestmentReportView({ report }: { report: AnalysisReport }) {
  const buckets = report.sportBreakdown.concat(report.contestTypeBreakdown, report.buyinBreakdown)

  // Portfolio concentration (Herfindahl on fees across sport buckets).
  const totalFees = Math.max(1, report.totalFees)
  const hhi = report.sportBreakdown.reduce((s, b) => s + Math.pow(b.fees / totalFees, 2), 0) * 10000
  const diversificationScore = Math.round((1 - clamp01(hhi / 5000)) * 100)

  // Capital efficiency: winning-bucket fees / total fees.
  const winFees = report.sportBreakdown.filter((b) => b.roi > 0 && !b.smallSample)
    .reduce((s, b) => s + b.fees, 0)
  const efficiency = Math.round((winFees / totalFees) * 100)

  // Risk-adjusted return: ROI / sizing CV (Sharpe-ish).
  const cv = report.chess.consistency.dailyFeeCv || 1
  const rar = report.roi / Math.max(0.25, cv)

  // Rating letters.
  const gAlloc = grade(efficiency)
  const gDiv = grade(diversificationScore)
  const gEff = grade(Math.max(0, Math.min(100, 50 + rar)))
  const gRisk = grade(Math.max(0, 100 - clamp01(report.bankroll.peakSlateExposurePct / 25) * 100))

  const holdings = [...report.sportBreakdown]
    .filter((b) => b.entries >= 5)
    .sort((a, b) => b.fees - a.fees)
    .slice(0, 8)

  const votes = [
    { criterion: 'Capital allocation', letter: gAlloc.letter, tone: gAlloc.tone },
    { criterion: 'Diversification', letter: gDiv.letter, tone: gDiv.tone },
    { criterion: 'Capital efficiency', letter: gEff.letter, tone: gEff.tone },
    { criterion: 'Risk controls', letter: gRisk.letter, tone: gRisk.tone },
  ]
  const majorityInvest = votes.filter((v) => v.tone === 'good').length >= 3

  return (
    <div className="space-y-12 sm:space-y-16">
      <AdvisorLetter
        signedBy="The Investment Committee"
        headline={
          majorityInvest
            ? "If this were a fund, we'd keep our money in — with two conditions."
            : "If this were a fund, we'd pull our money out until a few things get fixed."
        }
        body={
          <>
            <p>
              We looked at your play the way we look at any fund we might invest in.
              Not "did it win last month," but "would we still write a check for the next
              month knowing everything we know?"
            </p>
            <p>
              A good bankroll spreads its money across several proven spots, sizes each
              one to fit, and doesn't bet the farm on any single day. Yours got graded on
              four things: where the money is, how spread out it is, whether the return
              is worth the swings, and how you handle your worst days.
            </p>
            <p>
              The verdict is below. So is the shopping list — the exact spots we'd move
              money out of and the exact spots we'd move money into.
            </p>
          </>
        }
      />

      <ReportHeader
        badge="₿ INVESTMENT REVIEW"
        title="Would we back this bankroll?"
        epigraph="We're grading your bankroll the way a fund manager would grade a portfolio. Where is the money? Is it spread out enough? Is the return worth the swings? And what does the worst day look like?"
        report={report}
      />

      <Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="MONEY AT WORK" value={fmtMoney(report.totalFees)} caption="Every dollar you've put into entries." />
          <KpiCard label="YOUR RETURN" value={`${report.roi.toFixed(1)}%`} tone={report.roi >= 0 ? 'good' : 'bad'} caption="What you've made back for every dollar you spent." />
          <KpiCard label="RETURN VS SWINGS" value={rar.toFixed(2)} tone={rar >= 0 ? 'good' : 'bad'} caption="How well the return holds up given how wild your day-to-day is. Higher is better." />
          <KpiCard label="HOW SPREAD OUT" value={`${diversificationScore}/100`} tone={diversificationScore >= 60 ? 'good' : 'warn'} caption="Higher means your money isn't all in one sport." />
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="01" title="YOUR HOLDINGS" subtitle="The spots you've put the most money into, ranked like a stock portfolio." />
          <div className="overflow-hidden border border-ink">
            <table className="w-full font-mono text-xs">
              <thead className="bg-ink text-paper">
                <tr>
                  <th className="p-2 text-left">SPOT</th>
                  <th className="p-2 text-right">WEIGHT</th>
                  <th className="p-2 text-right">ROI</th>
                  <th className="p-2 text-right">P&L</th>
                  <th className="p-2 text-right">RATING</th>
                </tr>
              </thead>
              <tbody>
                {holdings.map((h) => {
                  const weight = (h.fees / totalFees) * 100
                  const rating =
                    h.smallSample ? 'HOLD' : h.roi > 15 ? 'STRONG BUY' : h.roi > 0 ? 'BUY' : h.roi > -15 ? 'HOLD' : h.roi > -30 ? 'REDUCE' : 'SELL'
                  const col = h.roi >= 0 ? 'text-profit' : 'text-hotred'
                  return (
                    <tr key={h.key} className="border-t border-ink/20">
                      <td className="p-2 text-ink">{h.key}</td>
                      <td className="p-2 text-right">{weight.toFixed(1)}%</td>
                      <td className={cn('p-2 text-right font-bold', col)}>{h.roi.toFixed(1)}%</td>
                      <td className={cn('p-2 text-right', col)}>{fmtMoney(h.net)}</td>
                      <td className={cn('p-2 text-right font-bold', h.roi >= 0 ? 'text-profit' : 'text-hotred')}>{rating}</td>
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
          <SectionHeading n="02" title="WHAT WE'D MOVE" subtitle="If we ran this bankroll tomorrow morning, here's the money we'd shift and where we'd put it." />
          {report.reallocation.hasData ? (
            <div className="space-y-3">
              {report.reallocation.moves.slice(0, 4).map((m, i) => (
                <div key={i} className="border border-ink p-4">
                  <div className="font-mono text-xs font-bold uppercase tracking-widest text-hotred">
                    LESS MONEY IN · {m.fromSegment} (running {m.fromRoi.toFixed(1)}% ROI, costing you {fmtMoney(-m.capitalBled)})
                  </div>
                  <div className="mt-2 border-t border-ink/20 pt-2 font-mono text-xs font-bold uppercase tracking-widest text-profit">
                    MORE MONEY IN · {m.toSegment} (running {m.toRoi.toFixed(1)}% ROI)
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                    What the same dollars would have earned: <span className="text-profit">{fmtMoney(m.swing)}</span>
                  </p>
                </div>
              ))}
              <div className="border border-profit p-4">
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-profit">
                  TOTAL LEFT ON THE TABLE · {fmtMoney(report.reallocation.totalProjectedSwing)}
                </div>
              </div>
            </div>
          ) : (
            <p className="border border-dashed border-ink/25 p-4 font-serif text-sm text-ink/70">
              You haven't played enough contests in any one category yet for us to recommend a shift with confidence.
            </p>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="03" title="THE VOTE" subtitle="Four grades on four things any allocator would ask about first." />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {votes.map((v) => (
              <div key={v.criterion} className={cn('border p-5 text-center', v.tone === 'good' ? 'border-profit' : v.tone === 'bad' ? 'border-hotred' : 'border-amber-500')}>
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {v.criterion}
                </div>
                <div className={cn('font-display text-6xl leading-none tracking-tighter', v.tone === 'good' ? 'text-profit' : v.tone === 'bad' ? 'text-hotred' : 'text-amber-500')}>
                  {v.letter}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border border-ink p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              THE MOTION
            </div>
            <p className="mt-2 font-serif text-lg text-ink">
              {majorityInvest
                ? 'We vote to KEEP THE MONEY IN — with the shifts recommended above.'
                : 'We vote to PULL MONEY BACK until the failing grades are cleaned up. The playbook for how is below.'}
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="04" title="MONEY LEFT ON THE TABLE" subtitle="How much of your entry money is landing in the wrong bucket." />
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard label="YOUR BEST SPOT" value={`${report.reallocation.hasData ? report.reallocation.anchorRoi.toFixed(1) : '0.0'}%`} tone="good" caption={report.reallocation.hasData ? `That's your ROI in ${report.reallocation.anchorSegment} — the spot you've clearly proven.` : "Not enough winning-spot data yet."} />
            <KpiCard label="MONEY LOST TO BAD SPOTS" value={fmtMoney(-report.reallocation.totalBled)} tone="bad" caption="Real dollars gone in spots your own history says you shouldn't be in." />
            <KpiCard label="MONEY IN THE RIGHT SPOTS" value={`${efficiency}%`} tone={efficiency >= 60 ? 'good' : 'warn'} caption="Share of your entry fees that's landing in spots where you actually win." />
          </div>
          <div className="mt-4">
            <Bar pct={efficiency} tone={efficiency >= 60 ? 'good' : 'warn'} />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <NextSteps
          intro={
            majorityInvest
              ? 'You have a real edge. The next three moves compound it.'
              : 'The bankroll is fixable. The next three moves are the fastest route back.'
          }
          steps={[
            {
              do: report.reallocation.hasData
                ? `Shift the next month\'s entry budget out of ${report.reallocation.moves[0]?.fromSegment ?? 'your worst-performing spot'} and into ${report.reallocation.moves[0]?.toSegment ?? report.reallocation.anchorSegment}.`
                : 'Cut your entries in your worst-ROI category by half; add those dollars to your best-ROI category with 20+ entries.',
              because: 'The same money in a better spot is the single biggest lever you have.',
            },
            {
              do: `Cap any single sport at ${Math.max(40, Math.round((holdings[0]?.fees ?? 0) / totalFees * 100) - 10)}% of your monthly entry budget.`,
              because: 'Concentrated bankrolls die on one bad day. Diversified bankrolls only bleed slowly.',
            },
            {
              do: 'Write down your weekly entry budget on Sunday. Do not raise it during the week — for any reason.',
              because: 'Discipline is the difference between a profitable player and a fundable one.',
            },
          ]}
        />
      </Reveal>
    </div>
  )
}