"use client";

import type { AnalysisReport } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { Reveal } from '@/components/fx/reveal'
import { cn } from '@/lib/utils'
import { AdvisorLetter, KpiCard, NextSteps, ReportHeader, SectionHeading } from './_shared'

/**
 * Forensic Accounting Review — where did the money actually go?
 * Everything derived from buckets + reallocation + monthly trend.
 */
export function ForensicReportView({ report }: { report: AnalysisReport }) {
  const profitCenters = [
    ...report.sportBreakdown,
    ...report.contestTypeBreakdown,
    ...report.buyinBreakdown,
  ]
    .filter((b) => b.net > 0 && b.entries >= 10)
    .sort((a, b) => b.net - a.net)
    .slice(0, 6)

  const lossCenters = [
    ...report.sportBreakdown,
    ...report.contestTypeBreakdown,
    ...report.buyinBreakdown,
  ]
    .filter((b) => b.net < 0 && b.entries >= 10)
    .sort((a, b) => a.net - b.net)
    .slice(0, 6)

  const totalProfitCenter = profitCenters.reduce((s, b) => s + b.net, 0)
  const totalLossCenter = lossCenters.reduce((s, b) => s + b.net, 0)
  const leakagePct = report.totalFees > 0 ? Math.abs(totalLossCenter) / report.totalFees * 100 : 0

  const opportunityCost = report.reallocation.hasData ? report.reallocation.totalProjectedSwing : 0

  return (
    <div className="space-y-12 sm:space-y-16">
      <AdvisorLetter
        signedBy="The Forensic Desk"
        headline={
          report.netProfit >= 0
            ? 'You are making money — but you are handing some of it back in a few specific places.'
            : "The losses aren't spread evenly. They're coming from a short list of places."
        }
        body={
          <>
            <p>
              We opened your ledger the way an accountant would: not "how did you do
              overall," but "where exactly did every dollar come from, and where did every
              dollar go?" The interesting story is almost never in the total. It's in the
              rooms the money quietly walks out of.
            </p>
            <p>
              Below are your biggest earners, then your biggest bleeders. The gap between
              the two is where the whole game is decided. If you stopped funding the bottom
              of that list tomorrow, the same amount of play would look like a different
              bankroll.
            </p>
          </>
        }
      />

      <ReportHeader
        badge="₪ THE LEDGER"
        title="Where the money actually goes."
        epigraph="Money isn't lost in general — it's lost in specific places, and usually in the same places month after month. This report names them."
        report={report}
      />

      <Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="MONEY IN" value={fmtMoney(report.totalWinnings)} tone="good" caption="Every dollar you won." />
          <KpiCard label="MONEY OUT" value={fmtMoney(report.totalFees)} tone="bad" caption="Every dollar you paid in entry fees." />
          <KpiCard label="TAKE-HOME" value={fmtMoney(report.netProfit)} tone={report.netProfit >= 0 ? 'good' : 'bad'} caption="What you actually kept." />
          <KpiCard label="THE LEAK" value={`${leakagePct.toFixed(1)}%`} tone={leakagePct > 20 ? 'bad' : 'warn'} caption="Share of your entry fees that walked out through losing spots." />
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="01" title="WHERE YOU MAKE IT" subtitle="The spots that put money into the bankroll — ranked by how many actual dollars they added." />
          <Ledger rows={profitCenters} total={totalProfitCenter} tone="good" />
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="02" title="WHERE YOU LOSE IT" subtitle="The spots that quietly take money back. Ranked by dollars lost, not by percentage — because the dollars are what leave the bankroll." />
          <Ledger rows={lossCenters} total={totalLossCenter} tone="bad" />
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="03" title="COSTS YOU DON'T SEE ON THE P&L" subtitle="These don't show up as a line item, but they're real dollars." />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="border border-hotred p-4">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-hotred">THE COST OF THE COLD STRETCH</div>
              <div className="font-display text-4xl text-hotred">{fmtMoney(-report.chess.criticalPosition.drawdown)}</div>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                From your highest bankroll to your lowest — this is the money that was in play and then wasn't.
              </p>
            </div>
            <div className="border border-hotred p-4">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-hotred">NORMAL BAD LUCK</div>
              <div className="font-display text-4xl text-hotred">{fmtMoney(-report.chess.varianceAttribution.varianceLossDollars)}</div>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                Losses that fit inside what you should expect. Not a leak — the price of playing.
              </p>
            </div>
            <div className="border border-hotred p-4">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-hotred">REAL PROBLEMS</div>
              <div className="font-display text-4xl text-hotred">{fmtMoney(-report.chess.varianceAttribution.structuralLossDollars)}</div>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                Losses from spots you've played enough to know you're not beating. This is the number that changes when your rules change.
              </p>
            </div>
            <div className="border border-amber-500 p-4">
              <div className="font-mono text-xs font-bold uppercase tracking-widest text-amber-500">MONEY LEFT ON THE TABLE</div>
              <div className="font-display text-4xl text-amber-500">{fmtMoney(opportunityCost)}</div>
              <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                What the losing money would have earned if you'd put it into the spots you're already good at.
              </p>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="04" title="MONTH BY MONTH" />
          <div className="overflow-hidden border border-ink">
            <table className="w-full font-mono text-xs">
              <thead className="bg-ink text-paper">
                <tr>
                  <th className="p-2 text-left">PERIOD</th>
                  <th className="p-2 text-right">ENTRIES</th>
                  <th className="p-2 text-right">NET</th>
                  <th className="p-2 text-right">CUM</th>
                  <th className="p-2 text-right">ROI</th>
                </tr>
              </thead>
              <tbody>
                {report.monthly.map((m) => {
                  const col = m.net >= 0 ? 'text-profit' : 'text-hotred'
                  return (
                    <tr key={m.label} className="border-t border-ink/20">
                      <td className="p-2 text-ink">{m.label}</td>
                      <td className="p-2 text-right">{m.entries}</td>
                      <td className={cn('p-2 text-right font-bold', col)}>{fmtMoney(m.net)}</td>
                      <td className={cn('p-2 text-right', m.cumulative >= 0 ? 'text-profit' : 'text-hotred')}>{fmtMoney(m.cumulative)}</td>
                      <td className={cn('p-2 text-right', col)}>{m.roi.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <NextSteps
          intro="Two moves that change the ledger the fastest."
          steps={[
            {
              do: lossCenters[0]
                ? `For the next month, stop entering ${lossCenters[0].key}. Track what happens.`
                : 'Cut your entries in your worst-performing category by half for the next month.',
              because: lossCenters[0]
                ? `That single spot cost you ${fmtMoney(lossCenters[0].net)} across ${lossCenters[0].entries} entries.`
                : 'The bleeding is concentrated. Small cuts there beat big changes anywhere else.',
            },
            {
              do: profitCenters[0]
                ? `Move that saved entry money into ${profitCenters[0].key}, which is where you\'re already good.`
                : 'Move the saved entry money into your best-ROI category with at least 20 entries in your history.',
              because: profitCenters[0]
                ? `You\'ve made ${fmtMoney(profitCenters[0].net)} there. That\'s a real edge, not a hunch.`
                : 'Reinforce the spots your own history has already proven.',
            },
          ]}
        />
      </Reveal>
    </div>
  )
}

function Ledger({
  rows,
  total,
  tone,
}: {
  rows: { key: string; entries: number; fees: number; net: number; roi: number }[]
  total: number
  tone: 'good' | 'bad'
}) {
  if (!rows.length) {
    return <p className="border border-dashed border-ink/25 p-4 font-mono text-xs text-muted-foreground">No qualifying segments.</p>
  }
  const col = tone === 'good' ? 'text-profit' : 'text-hotred'
  return (
    <div className="overflow-hidden border border-ink">
      <table className="w-full font-mono text-xs">
        <thead className="bg-ink text-paper">
          <tr>
            <th className="p-2 text-left">ACCOUNT</th>
            <th className="p-2 text-right">ENTRIES</th>
            <th className="p-2 text-right">FEES</th>
            <th className="p-2 text-right">NET</th>
            <th className="p-2 text-right">ROI</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className="border-t border-ink/20">
              <td className="p-2 text-ink">{r.key}</td>
              <td className="p-2 text-right">{r.entries}</td>
              <td className="p-2 text-right text-muted-foreground">{fmtMoney(r.fees)}</td>
              <td className={cn('p-2 text-right font-bold', col)}>{fmtMoney(r.net)}</td>
              <td className={cn('p-2 text-right', col)}>{r.roi.toFixed(1)}%</td>
            </tr>
          ))}
          <tr className="border-t-2 border-ink bg-ink/5">
            <td className="p-2 font-bold text-ink">TOTAL</td>
            <td />
            <td />
            <td className={cn('p-2 text-right font-bold', col)}>{fmtMoney(total)}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  )
}