"use client";

import type { AnalysisReport } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { Reveal } from '@/components/fx/reveal'
import { cn } from '@/lib/utils'
import { AdvisorLetter, KpiCard, NextSteps, ReportHeader, SectionHeading, clamp01 } from './_shared'

/**
 * Professional Scouting Report — NFL-style grades on a 0-100 scale.
 * Every grade derives from an existing measurable in the AnalysisReport.
 */
export function ScoutingReportView({ report }: { report: AnalysisReport }) {
  const c = report.chess

  const grades: GradeRow[] = [
    { trait: 'Decision making', score: c.strategicAccuracy.score, note: 'Weighted by segment-ROI accuracy.' },
    { trait: 'Contest selection', score: bestBucketScore(report), note: 'Fee weighting toward positive-ROI formats.' },
    { trait: 'Risk management', score: Math.round((1 - clamp01(report.bankroll.peakSlateExposurePct / 25)) * 100), note: 'Distance from safe single-slate exposure.' },
    { trait: 'Discipline', score: report.disciplineScore.score ?? 40, note: report.disciplineScore.provisional ? 'Provisional' : 'Capital-discipline score.' },
    { trait: 'Consistency', score: c.consistency.score, note: 'Inverse of daily-fee CV plus streak-inflation penalty.' },
    { trait: 'Strategic thinking', score: Math.round((1 - clamp01(c.varianceAttribution.structuralSharePct / 100)) * 100), note: 'Share of losses NOT structural.' },
    { trait: 'Adaptability', score: Math.round(clamp01((c.phases[2]?.roi ?? 0) - (c.phases[0]?.roi ?? 0) + 30) / 60 * 100), note: 'ROI improvement from opening to endgame phase.' },
    { trait: 'Bankroll management', score: Math.round((1 - clamp01(report.bankroll.lossChasingPct / 100)) * 100), note: 'Freedom from loss-chasing behavior.' },
  ]

  const overall = Math.round(avg(grades.map((g) => g.score)))
  const upside = Math.min(99, overall + 12)
  const floor = Math.max(1, overall - 20)
  const ceiling = Math.min(99, overall + 20)

  const comp = playerComparison(report)

  return (
    <div className="space-y-12 sm:space-y-16">
      <AdvisorLetter
        signedBy="The Scouting Desk"
        headline={
          overall >= 70
            ? "You're a good player with real strengths. Here's what turns good into great."
            : overall >= 55
              ? "You have the raw ingredients. A few habits are holding the grade down."
              : "The tools are there. The report card says: work on the fundamentals before the flourishes."
        }
        body={
          <>
            <p>
              A scouting report doesn't grade wins and losses. It grades the traits that
              produce wins and losses over a long career: how you make decisions, how you
              pick your spots, how you handle a bad week, how you stay steady.
            </p>
            <p>
              Your overall grade is <span className="font-bold">{overall}/100</span>. Your
              strongest trait is{' '}
              <span className="font-bold">{grades.slice().sort((a, b) => b.score - a.score)[0].trait.toLowerCase()}</span>.
              The one holding you back most is{' '}
              <span className="font-bold">{grades.slice().sort((a, b) => a.score - b.score)[0].trait.toLowerCase()}</span>.
              That's where a good coach would spend the practice time this month.
            </p>
          </>
        }
      />

      <ReportHeader
        badge="⌘ THE SCOUTING REPORT"
        title="Grading the player, not the box score."
        epigraph="Wins and losses come and go. Traits stick. This report grades the traits that decide whether you're profitable over years — and names the archetype your play looks most like."
        report={report}
      />

      <Reveal>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="OVERALL GRADE" value={String(overall)} tone={overall >= 70 ? 'good' : overall >= 55 ? 'warn' : 'bad'} caption="Your all-around grade across every trait below." />
          <KpiCard label="FLOOR" value={String(floor)} caption="Where you land if the bad habits stick around." />
          <KpiCard label="CEILING" value={String(ceiling)} tone="good" caption="Where you could land if you close the gaps below." />
          <KpiCard label="ONE-YEAR OUTLOOK" value={String(upside)} tone="good" caption="Realistic 12-month grade if you fix the top two development areas." />
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="01" title="THE TRAITS" subtitle="Nine grades from your own history. Each one is a trait a good coach would talk to you about." />
          <div className="grid gap-2 sm:grid-cols-2">
            {grades.map((g) => (
              <GradeCard key={g.trait} row={g} />
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="02" title="WHERE TO WORK" subtitle="Your three lowest traits, with the specific coaching cue that would move each one." />
          <div className="space-y-2">
            {grades.slice().sort((a, b) => a.score - b.score).slice(0, 3).map((g) => (
              <div key={g.trait} className="border border-hotred p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">{g.trait}</div>
                  <div className="font-mono text-xs font-bold text-hotred">{g.score}/100</div>
                </div>
                <p className="mt-2 font-serif text-sm text-ink">{coachingCue(g.trait, report)}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="03" title="YOUR ARCHETYPE" subtitle="The kind of player your history most looks like — including the strengths and the traps that come with it." />
          <div className={cn('border p-5', comp.tone === 'good' ? 'border-profit' : comp.tone === 'bad' ? 'border-hotred' : 'border-amber-500')}>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">YOU PLAY LIKE</div>
            <div className={cn('font-display text-4xl leading-none tracking-tight sm:text-6xl', comp.tone === 'good' ? 'text-profit' : comp.tone === 'bad' ? 'text-hotred' : 'text-amber-500')}>
              {comp.name}
            </div>
            <p className="mt-3 font-serif text-base leading-relaxed text-ink">{comp.description}</p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="04" title="THE SCOUT'S TAKE" />
          <div className="border border-ink p-5">
            <p className="font-serif text-lg leading-relaxed text-ink">
              Overall grade of {overall}/100 across {report.rowCount} entries. You're best at{' '}
              <span className="font-bold">{grades.slice().sort((a, b) => b.score - a.score)[0].trait.toLowerCase()}</span>{' '}
              ({grades.slice().sort((a, b) => b.score - a.score)[0].score}/100). Weakest at{' '}
              <span className="font-bold">{grades.slice().sort((a, b) => a.score - b.score)[0].trait.toLowerCase()}</span>{' '}
              ({grades.slice().sort((a, b) => a.score - b.score)[0].score}/100) — that's where practice pays off first. Career to date: {fmtMoney(report.netProfit)} at {report.roi.toFixed(1)}% ROI.
            </p>
          </div>
        </div>
      </Reveal>

      <Reveal>
        <NextSteps
          intro="Three drills for the next 30 days, based on your lowest traits."
          steps={grades
            .slice()
            .sort((a, b) => a.score - b.score)
            .slice(0, 3)
            .map((g) => ({
              do: `Work on ${g.trait.toLowerCase()} — pick one habit this week and stick to it.`,
              because: `Currently graded ${g.score}/100. ${g.note}`,
            }))}
        />
      </Reveal>
    </div>
  )
}

interface GradeRow { trait: string; score: number; note: string }

function GradeCard({ row }: { row: GradeRow }) {
  const tone = row.score >= 70 ? 'good' : row.score >= 50 ? 'warn' : 'bad'
  return (
    <div className={cn('border p-4', tone === 'good' ? 'border-profit' : tone === 'warn' ? 'border-amber-500' : 'border-hotred')}>
      <div className="flex items-baseline justify-between">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">{row.trait}</div>
        <div className={cn('font-display text-4xl leading-none tracking-tighter', tone === 'good' ? 'text-profit' : tone === 'warn' ? 'text-amber-500' : 'text-hotred')}>
          {row.score}
        </div>
      </div>
      <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted-foreground">{row.note}</p>
    </div>
  )
}

function bestBucketScore(report: AnalysisReport): number {
  const total = Math.max(1, report.totalFees)
  const goodFees = report.contestTypeBreakdown
    .filter((b) => !b.smallSample && b.roi > 0)
    .reduce((s, b) => s + b.fees, 0)
  return Math.round((goodFees / total) * 100)
}

function playerComparison(report: AnalysisReport): { name: string; description: string; tone: 'good' | 'warn' | 'bad' } {
  const roi = report.roi
  const cv = report.chess.consistency.dailyFeeCv
  const chase = report.bankroll.lossChasingPct
  if (roi > 5 && cv < 0.8 && chase < 25) {
    return { name: 'CONSISTENT GRINDER', description: 'Positive ROI with disciplined sizing and controlled tilt. This is the archetype online cardrooms and casino risk desks flag as long-term dangerous.', tone: 'good' }
  }
  if (roi > 0 && cv < 1) {
    return { name: 'DEVELOPING PLAYER', description: 'Net positive with room to systematize. Sizing and format concentration are the next unlocks.', tone: 'good' }
  }
  if (chase > 50 || cv > 1.2) {
    return { name: 'HIGH-VARIANCE PLAYER', description: 'Book classification: recreational-with-swings. Bankroll survival is being decided by variance more than by process.', tone: 'bad' }
  }
  if (roi < -15) {
    return { name: 'RECREATIONAL', description: 'Consistent losses, low process rigor. This is the profile that funds the ecosystem.', tone: 'bad' }
  }
  return { name: 'IMPROVING PLAYER', description: 'Mixed signals. There is a real edge somewhere in this history — the report exists to find and protect it.', tone: 'warn' }
}

function coachingCue(trait: string, r: AnalysisReport): string {
  switch (trait) {
    case 'Decision making':
      return 'Increase the share of capital flowing to Best-Move cells. Every entry outside a positive-ROI segment is a decision waiting to be re-graded.'
    case 'Contest selection':
      return 'Concentrate volume into the two contest formats where your own history shows positive ROI at real sample. Ignore the rest for 30 days.'
    case 'Risk management':
      return `Peak single-slate exposure hit ${r.bankroll.peakSlateExposurePct.toFixed(1)}%. Cap every slate at 5% of rolling bankroll.`
    case 'Discipline':
      return 'Write down the weekly entry budget in advance. The moment the budget moves after a losing week, the score resets.'
    case 'Consistency':
      return `Sizing volatility (CV ${r.chess.consistency.dailyFeeCv.toFixed(2)}) is above what a rule-based sizer would produce. Fix the daily target.`
    case 'Strategic thinking':
      return 'Stop attributing structural losses to variance. Any losing segment above 20 entries has already collected enough evidence to be re-classified.'
    case 'Adaptability':
      return 'The endgame-vs-opening delta shows how much the process has evolved. Deliberately change one variable per month and measure.'
    case 'Bankroll management':
      return `Loss-chasing signal is +${r.bankroll.lossChasingPct.toFixed(0)}%. Weekly budget only moves down after losses, never up.`
    default:
      return ''
  }
}

function avg(xs: number[]) {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0
}