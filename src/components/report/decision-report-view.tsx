"use client";

import type { AnalysisReport } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { Reveal } from '@/components/fx/reveal'
import { cn } from '@/lib/utils'
import { AdvisorLetter, Bar, KpiCard, NextSteps, ReportHeader, SectionHeading, clamp01, grade } from './_shared'

/**
 * Decision Science Review — audits decision quality independent of outcome.
 */
export function DecisionReportView({ report }: { report: AnalysisReport }) {
  const c = report.chess
  const acc = c.strategicAccuracy

  // Decision quality: % of fees deployed to "Best Move" (positive-ROI real-sample cells).
  const quality = clamp01(acc.bestMovePct / 100) * 100
  // Decision consistency: inverted CV.
  const consistency = clamp01(1 - c.consistency.dailyFeeCv / 2) * 100
  // Process quality: inverted post-loss inflation.
  const process = clamp01(1 - report.bankroll.lossChasingPct / 100) * 100
  // Efficiency: signal-to-noise from variance attribution.
  const efficiency = clamp01(1 - c.varianceAttribution.varianceLossDollars /
    Math.max(1, c.varianceAttribution.varianceLossDollars + Math.abs(c.varianceAttribution.structuralLossDollars))) * 100

  const composite = Math.round((quality + consistency + process + efficiency) / 4)
  const g = grade(composite)

  return (
    <div className="space-y-12 sm:space-y-16">
      <AdvisorLetter
        signedBy="The Decision Desk"
        headline={
          composite >= 70
            ? 'You are making the right calls. The results will follow.'
            : composite >= 45
              ? 'The results are noisy, but the process has fixable gaps.'
              : 'The outcomes are hiding the real problem — the calls themselves.'
        }
        body={
          <>
            <p>
              A good decision is one that made sense with the information you had at the
              time — even if it lost. A bad decision is one that ignored what you already
              knew — even if it won. We graded the calls, not the coin flips.
            </p>
            <p>
              Your process scored <span className="font-bold">{composite}/100</span>. The
              biggest gap is between how much money you put into your best spots versus
              your worst. Fix the sizing rules and the ROI takes care of itself over time.
            </p>
          </>
        }
      />

      <ReportHeader
        badge="⌬ DECISION REVIEW"
        title="Did you make the right call?"
        epigraph="We're grading the decisions, not the results. Good decisions lose sometimes. Bad decisions win sometimes. Over a career, the decisions win — which is why we're going to talk about them and not the box score."
        report={report}
      />

      <Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QualityGauge label="RIGHT SPOTS" pct={quality} caption="How much of your money went to the spots that actually pay off for you." />
          <QualityGauge label="STEADINESS" pct={consistency} caption="How similar your bet sizes look from one day to the next." />
          <QualityGauge label="COOL HEAD" pct={process} caption="How well you avoid throwing more money at a losing day." />
          <QualityGauge label="CLEAN LOSSES" pct={efficiency} caption="How much of your losing comes from real problems you can fix versus normal bad luck." />
        </div>
      </Reveal>

      <Reveal>
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="DECISION SCORE" value={`${composite}/100`} tone={g.tone} caption="Your overall decision quality." />
          <KpiCard label="LETTER GRADE" value={g.letter} tone={g.tone} />
          <KpiCard label="YOUR RESULTS" value={`${report.roi.toFixed(1)}% ROI`} tone={report.roi >= 0 ? 'good' : 'bad'} caption="For comparison only. Not part of the score." />
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="01" title="HOW YESTERDAY CHANGES TODAY" subtitle="A steady player bets the same amount today whether yesterday was a win or a loss. Yesterday shouldn't get a vote." />
          <div className="grid gap-3 sm:grid-cols-3">
            <Branch label="AFTER A BIG WIN" value={`${c.consistency.afterBigWinInflationPct >= 0 ? '+' : ''}${c.consistency.afterBigWinInflationPct.toFixed(0)}%`} caption="How much more you bet the day after a big win." bad={c.consistency.afterBigWinInflationPct > 25} />
            <Branch label="AFTER A BIG LOSS" value={`${c.consistency.afterBigLossInflationPct >= 0 ? '+' : ''}${c.consistency.afterBigLossInflationPct.toFixed(0)}%`} caption="How much more you bet the day after a big loss." bad={c.consistency.afterBigLossInflationPct > 25} />
            <Branch label="WHERE YOU WANT TO BE" value="0%" caption="A player following a written plan sits right here — yesterday doesn't move the number." bad={false} />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="02" title="WHAT IF" subtitle="If you had put the same money into the spots you're already good at, here's what the P&L would look like." />
          {report.reallocation.hasData ? (
            <div className="border border-profit p-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">MONEY LEFT ON THE TABLE</div>
              <div className="font-display text-6xl leading-none tracking-tighter text-profit">{fmtMoney(report.reallocation.totalProjectedSwing)}</div>
              <p className="mt-3 font-mono text-[11px] text-muted-foreground">
                Your best spot: {report.reallocation.anchorSegment} at {report.reallocation.anchorRoi.toFixed(1)}% ROI.
              </p>
            </div>
          ) : (
            <p className="border border-dashed border-ink/25 p-3 font-mono text-xs text-muted-foreground">You haven't played enough in any one spot yet for us to run this comparison.</p>
          )}
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="03" title="EVERY ENTRY, GRADED" subtitle="We looked at each entry and asked one question: was that a spot you've proven you can beat?" />
          <div className="space-y-2">
            {acc.bands.map((b) => {
              const barTone = b.label === 'Best Move' ? 'good' : b.label === 'Inaccuracy' ? 'warn' : 'bad'
              return (
                <div key={b.label} className="border border-ink p-3">
                  <div className="flex items-baseline justify-between font-mono text-xs">
                    <span className={cn('font-bold uppercase tracking-widest', b.label === 'Best Move' ? 'text-profit' : b.label === 'Inaccuracy' ? 'text-amber-500' : 'text-hotred')}>{b.label}</span>
                    <span className="text-muted-foreground">{b.entries} entries · {fmtMoney(b.fees)} · {b.share.toFixed(1)}%</span>
                  </div>
                  <div className="mt-2"><Bar pct={b.share} tone={barTone} /></div>
                </div>
              )
            })}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <NextSteps
          intro="Three moves that will show up in the next report."
          steps={[
            {
              do: 'Before Sunday night, write down your total entry-fee budget for the week. Do not raise it after a losing day.',
              because: 'Yesterday should not get a vote in today\'s sizing.',
            },
            {
              do: `Shift more of your weekly budget to the spot you\'ve already proven — ${report.reallocation.hasData ? report.reallocation.anchorSegment : 'your best contest type by ROI'}.`,
              because: 'You\'re already good at it. That\'s where good decisions compound.',
            },
            {
              do: 'Stop entering anything where you have fewer than 20 entries in your history until you\'ve chosen it on purpose.',
              because: 'Small-sample spots masquerade as edges. Most of them are noise.',
            },
          ]}
        />
      </Reveal>
    </div>
  )
}

function QualityGauge({ label, pct, caption }: { label: string; pct: number; caption: string }) {
  const tone = pct >= 70 ? 'good' : pct >= 45 ? 'warn' : 'bad'
  return (
    <div className={cn('border p-4', tone === 'good' ? 'border-profit' : tone === 'warn' ? 'border-amber-500' : 'border-hotred')}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn('font-display text-5xl leading-none tracking-tighter', tone === 'good' ? 'text-profit' : tone === 'warn' ? 'text-amber-500' : 'text-hotred')}>
        {pct.toFixed(0)}
      </div>
      <div className="mt-2"><Bar pct={pct} tone={tone} /></div>
      <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted-foreground">{caption}</p>
    </div>
  )
}

function Branch({ label, value, caption, bad }: { label: string; value: string; caption: string; bad: boolean }) {
  return (
    <div className={cn('border p-4', bad ? 'border-hotred' : 'border-ink')}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn('font-display text-4xl leading-none tracking-tighter', bad ? 'text-hotred' : 'text-ink')}>{value}</div>
      <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted-foreground">{caption}</p>
    </div>
  )
}