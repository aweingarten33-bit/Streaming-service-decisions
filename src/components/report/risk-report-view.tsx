"use client";

import type { AnalysisReport } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { Reveal } from '@/components/fx/reveal'
import { cn } from '@/lib/utils'
import { AdvisorLetter, Bar, KpiCard, NextSteps, ReportHeader, SectionHeading, clamp01, grade } from './_shared'

/**
 * Risk Assessment — CRO's view of the bankroll. Register, matrix, stress.
 */
export function RiskReportView({ report }: { report: AnalysisReport }) {
  const b = report.bankroll
  const c = report.chess

  const risks = [
    {
      name: 'Too much money on one slate',
      likelihood: clamp01(b.peakSlateExposurePct / 25) * 100,
      impact: 90,
      evidence: `At your peak, ${b.peakSlateExposurePct.toFixed(1)}% of your bankroll was riding on a single slate.`,
      control: 'Never put more than 5% of your bankroll on any one slate.',
    },
    {
      name: 'Chasing losses',
      likelihood: clamp01(b.lossChasingPct / 100) * 100,
      impact: 80,
      evidence: `You bet ${b.lossChasingPct.toFixed(0)}% more, on average, the day after a losing day.`,
      control: 'Set a weekly entry budget on Sunday. It can only go down after a losing week — never up.',
    },
    {
      name: 'Everything in one format',
      likelihood: clamp01(b.formatConcentrationPct / 100) * 100,
      impact: 60,
      evidence: `${b.formatConcentrationPct.toFixed(0)}% of your money is going into ${b.concentratedFormat}.`,
      control: 'Spread your money across at least 3 formats. Cap any single format at 40% of your fees.',
    },
    {
      name: 'How deep the cold stretches go',
      likelihood: 100,
      impact: clamp01(c.criticalPosition.drawdown / Math.max(1, report.totalFees * 0.2)) * 100,
      evidence: c.criticalPosition.hasData
        ? `Your worst run cost ${fmtMoney(-c.criticalPosition.drawdown)} over ${c.criticalPosition.daysToTrough} days.`
        : 'Not enough dated history yet.',
      control: 'When your bankroll drops 20% from its high, stop and reset before playing again.',
    },
    {
      name: 'Wild bet sizing',
      likelihood: clamp01(c.consistency.dailyFeeCv / 2) * 100,
      impact: 55,
      evidence: `Your daily entry spend jumps around a lot — score ${c.consistency.dailyFeeCv.toFixed(2)} where 0 would be perfectly steady.`,
      control: 'Pick a daily entry budget. Cap your ceiling at 1.5× that number, no exceptions.',
    },
    {
      name: 'Losses that aren\'t bad luck',
      likelihood: clamp01(c.varianceAttribution.structuralSharePct / 100) * 100,
      impact: 85,
      evidence: `${c.varianceAttribution.structuralSharePct.toFixed(0)}% of your losses come from spots you've played enough to know you're not beating.`,
      control: 'If you have 20+ entries in a spot and it\'s clearly losing, stop putting money there.',
    },
  ]
  const scored = risks.map((r) => ({ ...r, score: Math.round((r.likelihood * r.impact) / 100) }))

  const overall = Math.round(avg(scored.map((r) => r.score)))
  const g = grade(100 - overall) // higher risk => worse grade

  return (
    <div className="space-y-12 sm:space-y-16">
      <AdvisorLetter
        signedBy="The Risk Desk"
        headline={
          overall >= 60
            ? "Your biggest problem right now is not what you're losing — it's what you could lose."
            : overall >= 30
              ? 'The bankroll is holding up, but a few risks are running close to policy.'
              : "Your risk posture is clean. Keep the rules; the results will keep themselves."
        }
        body={
          <>
            <p>
              A good risk officer doesn't ask "did you win?" — luck rewards bad risk often
              enough to be misleading. They ask "if you keep playing the way you played,
              what does the worst month look like?"
            </p>
            <p>
              Below is your risk register: every threat in your history, scored by how
              likely it is and how much it could cost. Next to each one is the single rule
              that would keep it inside safe limits. These rules are boring on purpose —
              boring rules are the ones you follow at 11pm on a losing Sunday.
            </p>
          </>
        }
      />

      <ReportHeader
        badge="△ RISK REVIEW"
        title="What could actually hurt you."
        epigraph="This isn't about what you already lost. It's about what could go wrong if the same pattern shows up on a worse day — and the simple rule that keeps it from mattering."
        report={report}
      />

      <Reveal>
        <div className="grid gap-3 sm:grid-cols-3">
          <KpiCard label="OVERALL RISK" value={`${overall}/100`} tone={overall >= 60 ? 'bad' : overall >= 30 ? 'warn' : 'good'} caption="Higher means more of your habits are running outside safe limits." />
          <KpiCard label="RISK GRADE" value={g.letter} tone={g.tone} caption="Your overall risk posture, on a school-report scale." />
          <KpiCard label="WORST STRETCH" value={fmtMoney(-c.criticalPosition.drawdown)} tone="bad" caption={c.criticalPosition.hasData ? `Your bankroll dropped this much over ${c.criticalPosition.daysToTrough} days.` : 'Not enough dated data yet.'} />
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="01" title="THE RISK LIST" subtitle="Every risk we found, scored by how often it shows up and how bad it could get." />
          <div className="space-y-3">
            {scored.sort((a, b) => b.score - a.score).map((r, i) => {
              const tone = r.score >= 60 ? 'bad' : r.score >= 30 ? 'warn' : 'good'
              return (
                <div key={i} className={cn('border p-4', tone === 'bad' ? 'border-hotred' : tone === 'warn' ? 'border-amber-500' : 'border-profit')}>
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
                      {r.name}
                    </div>
                    <div className="font-mono text-xs font-bold">Risk {r.score}/100</div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">HOW OFTEN</div>
                      <Bar pct={r.likelihood} tone={tone} />
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">HOW BAD</div>
                      <Bar pct={r.impact} tone={tone} />
                    </div>
                  </div>
                  <p className="mt-3 font-mono text-[11px] text-muted-foreground">{r.evidence}</p>
                  <p className="mt-1 font-serif text-sm text-ink">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ink/70">THE RULE · </span>
                    {r.control}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="02" title="THE STRESS TEST" subtitle="What happens if your worst week showed up back-to-back — how long until the bankroll runs out?" />
          <StressTest report={report} />
        </div>
      </Reveal>

      <Reveal>
        <NextSteps
          intro="Three rules to put in writing before your next Sunday slate."
          steps={[
            {
              do: scored[0]?.control ?? 'Cap any single slate at 5% of your bankroll.',
              because: scored[0]?.evidence ?? 'It\'s the biggest single risk in your history right now.',
            },
            {
              do: scored[1]?.control ?? 'Set a weekly entry budget on Sunday. Only lower it — never raise it mid-week.',
              because: scored[1]?.evidence ?? 'Your second-biggest risk. Small rule, big protection.',
            },
            {
              do: 'When your bankroll drops 20% from its high, stop playing for 48 hours.',
              because: 'The worst decisions happen in the middle of the worst weeks. A cooldown breaks the chain.',
            },
          ]}
        />
      </Reveal>
    </div>
  )
}

function StressTest({ report }: { report: AnalysisReport }) {
  const worstWeek = report.chess.criticalPosition.worstWeekNet
  const startingRoll = Math.max(500, report.totalFees * 0.15)
  const weeksToRuin = worstWeek < 0 ? Math.ceil(startingRoll / Math.abs(worstWeek)) : Infinity
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <KpiCard label="YOUR WORST WEEK" value={fmtMoney(worstWeek)} tone={worstWeek < 0 ? 'bad' : 'good'} caption={`Week of ${report.chess.criticalPosition.worstWeekLabel || '—'}.`} />
      <KpiCard label="ASSUMED BANKROLL" value={fmtMoney(startingRoll)} caption="A reasonable working bankroll based on your play volume." />
      <KpiCard
        label="WEEKS TO ZERO"
        value={Number.isFinite(weeksToRuin) ? String(weeksToRuin) : '∞'}
        tone={weeksToRuin <= 4 ? 'bad' : weeksToRuin <= 12 ? 'warn' : 'good'}
        caption="If your worst week repeated back-to-back until the bankroll ran out."
      />
    </div>
  )
}

function avg(xs: number[]) {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0
}