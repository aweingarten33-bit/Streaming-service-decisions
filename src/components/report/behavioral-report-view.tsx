"use client";

import type { AnalysisReport } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { BrutalCard } from '@/components/punk/brutal-card'
import { Reveal } from '@/components/fx/reveal'
import { cn } from '@/lib/utils'
import { AdvisorLetter, NextSteps } from './_shared'

/**
 * Behavioral Psychology Assessment.
 *
 * Every number here is derived from data already computed in the shared
 * AnalysisReport (bankroll signals, chess.consistency, chess.positionConversion,
 * chess.criticalPosition, chess.varianceAttribution, disciplineScore, monthly
 * trends). No new analysis engine — this template reframes the same evidence
 * through a behavioral-economics / decision-psychology lens.
 *
 * Rule: measurable behavior, not therapy. Every claim is tied to a number
 * that came out of the CSV.
 */
export function BehavioralReportView({ report }: { report: AnalysisReport }) {
  const b = report.bankroll
  const c = report.chess
  const d = report.disciplineScore

  // ---- Bias scoring (0-100, higher = MORE severe pattern) ---------------
  // Each score is a bounded, well-defined function of ONE existing metric.
  const lossChasing = clamp01(b.lossChasingPct / 100) * 100 // 100% inflation => 100 score
  const escalationAfterWin = clamp01(c.consistency.afterBigWinInflationPct / 100) * 100
  const concentration = clamp01(b.formatConcentrationPct / 100) * 100
  const overExposure = clamp01(b.peakSlateExposurePct / 25) * 100 // 25% of roll => max
  const inconsistency = clamp01(c.consistency.dailyFeeCv / 2) * 100 // CV of 2 => max chaos
  const overconfidence = clamp01(c.varianceAttribution.varianceLossDollars > 0
    ? c.varianceAttribution.varianceLossDollars /
      Math.max(1, Math.abs(c.varianceAttribution.structuralLossDollars) +
        c.varianceAttribution.varianceLossDollars)
    : 0) * 100

  // Post-loss ROI collapse vs baseline = classic tilt signature.
  const pc = c.positionConversion
  const tiltRoiDelta = pc.hasData ? pc.baselineNextDayRoi - pc.coldStreakNextDayRoi : 0
  const tiltSeverity = clamp01(tiltRoiDelta / 40) * 100 // 40 ROI-pt collapse => max

  // Discipline is a positive framing of the same evidence.
  const disciplineScore = d.provisional ? null : (d.score ?? 0)

  const biases: BiasCardProps[] = [
    {
      id: 'chasing',
      name: 'Loss chasing',
      score: lossChasing,
      evidence: `${b.lossChasingPct.toFixed(0)}% average entry-fee inflation on days that follow a losing day.`,
      implication:
        'Wagering more when you are cold turns normal variance into ruin. The math is unambiguous — chasing does not recover losses, it accelerates them.',
      remedy: 'Fix a weekly entry budget in advance. It only moves down after a losing week, never up.',
    },
    {
      id: 'tilt',
      name: 'Tilt (post-loss decision degradation)',
      score: tiltSeverity,
      evidence: pc.hasData
        ? `After 3+ consecutive losing days, next-day ROI is ${pc.coldStreakNextDayRoi.toFixed(1)}% vs a ${pc.baselineNextDayRoi.toFixed(1)}% baseline (${pc.coldStreakNextDayEntries} entries).`
        : 'Not enough sequential-day data to score tilt yet.',
      implication:
        'Decision quality is deteriorating specifically in the moments after losses — the same moments emotion is highest.',
      remedy: 'Hard-code a 24-hour cooldown after any 3-day losing streak. No new entries, no size changes.',
    },
    {
      id: 'overconf',
      name: 'Overconfidence after wins',
      score: escalationAfterWin,
      evidence: `${c.consistency.afterBigWinInflationPct >= 0 ? '+' : ''}${c.consistency.afterBigWinInflationPct.toFixed(0)}% entry-fee inflation the day after a top-decile winning day.`,
      implication:
        'You size up after wins as if the win proved a persistent edge. A single hot day is variance until many hot days repeat under the same conditions.',
      remedy: 'Freeze buy-in sizing for 7 days after any single-day P&L spike, positive or negative.',
    },
    {
      id: 'inconsist',
      name: 'Inconsistency (decision noise)',
      score: inconsistency,
      evidence: `Coefficient of variation of daily entry fees = ${c.consistency.dailyFeeCv.toFixed(2)} (0 = perfectly steady, 1+ = high-variance sizing).`,
      implication:
        'Wildly variable sizing means bankroll survival is being decided by day-to-day mood, not a written rule.',
      remedy: 'Set a target daily entry budget and a hard ceiling (e.g., 1.5× target). Log every session that exceeds it.',
    },
    {
      id: 'concentration',
      name: 'Concentration bias',
      score: concentration,
      evidence: `${b.formatConcentrationPct.toFixed(0)}% of all fees deployed into a single format (${b.concentratedFormat}).`,
      implication:
        'Heavy concentration is only rational if that format is your proven-edge format. Anywhere else, it is undiversified exposure to variance.',
      remedy: 'Cap any single format at 40% of monthly fees unless its ROI is positive at HIGH confidence.',
    },
    {
      id: 'exposure',
      name: 'Excessive single-slate exposure',
      score: overExposure,
      evidence: `Peak single-slate exposure hit ${b.peakSlateExposurePct.toFixed(1)}% of rolling bankroll (safe range: 2.5–5%).`,
      implication:
        'Any one slate can end a bankroll if exposure is high enough. This is a survivability issue before it is a strategy issue.',
      remedy: 'Cap every slate at 5% of rolling bankroll. Split larger sessions across days rather than doubling up.',
    },
    {
      id: 'attribution',
      name: 'Self-serving attribution',
      score: overconfidence,
      evidence: `${c.varianceAttribution.structuralSharePct.toFixed(0)}% of your losses are structural (high-confidence negative segments) vs. ${(100 - c.varianceAttribution.structuralSharePct).toFixed(0)}% attributable to variance.`,
      implication:
        'Attributing structural losses to "bad luck" preserves the strategy that is causing them. The evidence says the roles are flipped in your data.',
      remedy: 'Any losing segment above 20 entries stops being "variance" — it is a rejected hypothesis. Cut the capital, not the excuse.',
    },
  ]

  const composite = Math.round(
    biases.reduce((s, x) => s + x.score, 0) / biases.length,
  )

  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Advisor's letter — plain-English opener */}
      <AdvisorLetter
        signedBy="The Behavioral Desk"
        headline={
          `The story your play tells is about ${biases.slice().sort((a, b) => b.score - a.score)[0].name.toLowerCase()}.`
        }
        body={
          <>
            <p>
              We read your history the way a coach reads game film — not to grade you,
              but to spot the moments your decisions stopped following your own plan.
              Every point below comes straight from your entries. Nothing is guessed.
            </p>
            <p>
              The single most expensive habit in this sample is{' '}
              <span className="font-bold">
                {biases.slice().sort((a, b) => b.score - a.score)[0].name.toLowerCase()}
              </span>
              . It shows up over and over, and it's the one that responds fastest to a
              simple written rule. Fix that one first and most of the other numbers move
              with it.
            </p>
            <p>
              Read the seven cards below like a checklist. You don't need to solve all of
              them — you need to close the top two. Then upload fresh data in 30 days and
              we'll show you exactly what moved.
            </p>
          </>
        }
      />

      {/* Header */}
      <BrutalCard border="ink" className="p-5 sm:p-8">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
          🧠 BEHAVIORAL REVIEW
        </div>
        <h1 className="font-display mt-1 text-3xl leading-none tracking-tight text-ink sm:text-5xl">
          The habits behind the results.
        </h1>
        <p className="mt-6 border-l-2 border-ink pl-4 font-serif text-lg leading-relaxed text-ink">
          This is not personality analysis. It's the seven habits that show up in your own
          entries — sized up after wins, chased after losses, doubled up on the wrong day.
          Each one has a number, and each one has a rule you can write down today.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="border border-ink p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              BAD-HABIT SCORE
            </div>
            <div className={cn('font-display text-6xl leading-none tracking-tighter',
              composite >= 60 ? 'text-hotred' : composite >= 30 ? 'text-amber-500' : 'text-profit',
            )}>
              {composite}
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              /100 · lower is better
            </div>
          </div>
          <div className="border border-ink p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              DISCIPLINE
            </div>
            <div className="font-display text-6xl leading-none tracking-tighter text-ink">
              {disciplineScore == null ? '—' : disciplineScore.toFixed(0)}
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {disciplineScore == null ? 'Not enough data yet' : '/100 · higher is better'}
            </div>
          </div>
          <div className="border border-ink p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              WORST LOSING STREAK
            </div>
            <div className="font-display text-6xl leading-none tracking-tighter text-hotred">
              {fmtMoney(-c.criticalPosition.drawdown)}
            </div>
            <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {c.criticalPosition.hasData
                ? `${c.criticalPosition.daysToTrough} days from your high to your low`
                : 'not enough dated history'}
            </div>
          </div>
        </div>
      </BrutalCard>

      {/* Bias profile */}
      <Reveal>
        <div>
          <SectionHeading
            n="01"
            title="THE SEVEN HABITS"
            subtitle="Each one is scored 0–100 from a single number in your own history. Higher means the habit is stronger, and more expensive."
          />
          <div className="grid gap-3">
            {biases
              .slice()
              .sort((a, b) => b.score - a.score)
              .map((x) => (
                <BiasCard key={x.id} {...x} />
              ))}
          </div>
        </div>
      </Reveal>

      {/* Decision profile */}
      <Reveal>
        <div>
          <SectionHeading
            n="02"
            title="HOW YOU MAKE DECISIONS"
            subtitle="Three quick reads on how steady your sizing is, how you play after cold stretches, and whether wins go to your head."
          />
          <div className="grid gap-3 md:grid-cols-3">
            <ProfileCard
              label="HOW STEADY YOUR BETS ARE"
              value={c.consistency.dailyFeeCv.toFixed(2)}
              caption="Below 0.5 means your daily spend is steady. Above 1.0 means it's all over the place."
            />
            <ProfileCard
              label="HOW YOU PLAY AFTER LOSSES"
              value={pc.hasData ? `${pc.coldStreakNextDayRoi.toFixed(0)}% ROI` : '—'}
              caption={
                pc.hasData
                  ? `Your ROI the day after a losing streak vs your normal day of ${pc.baselineNextDayRoi.toFixed(0)}%.`
                  : `You haven't played enough back-to-back days yet to know.`
              }
              danger={pc.hasData && pc.coldStreakNextDayRoi < pc.baselineNextDayRoi - 10}
            />
            <ProfileCard
              label="HOW YOU PLAY AFTER WINS"
              value={`${c.consistency.afterBigWinInflationPct >= 0 ? '+' : ''}${c.consistency.afterBigWinInflationPct.toFixed(0)}%`}
              caption="How much more you spend the day after a big win. 0% would mean you stuck to your plan."
              danger={c.consistency.afterBigWinInflationPct > 25}
            />
          </div>
        </div>
      </Reveal>

      {/* Behavioral recommendations */}
      <Reveal>
        <div>
          <SectionHeading
            n="03"
            title="RULES TO WRITE DOWN"
            subtitle="Not resolutions. Rules. The point is to decide once, in a quiet moment, so you don't have to decide again in a hot one."
          />
          <ol className="space-y-3">
            {biases
              .slice()
              .sort((a, b) => b.score - a.score)
              .slice(0, 5)
              .map((x, i) => (
                <li key={x.id} className="border border-ink p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
                      RULE {String(i + 1).padStart(2, '0')} · {x.name}
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      strength of the habit: {x.score.toFixed(0)}/100
                    </div>
                  </div>
                  <p className="mt-2 font-serif text-base leading-relaxed text-ink">{x.remedy}</p>
                  <p className="mt-1 font-mono text-[11px] text-muted-foreground">{x.evidence}</p>
                </li>
              ))}
          </ol>
        </div>
      </Reveal>

      {/* Closing */}
      <Reveal>
        <NextSteps
          intro="Two rules this week beats seven rules never. Start here."
          steps={biases
            .slice()
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map((x) => ({
              do: x.remedy,
              because: x.evidence,
            }))
            .concat([
              {
                do: 'Upload fresh data in 30 days and re-run this report.',
                because:
                  'The only way to know a rule worked is to see the same numbers move.',
              },
            ])}
        />
      </Reveal>
    </div>
  )
}

/* ---------- helpers ---------- */

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(1, x))
}

function SectionHeading({ n, title, subtitle }: { n: string; title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        SECTION {n}
      </div>
      <h2 className="font-display text-3xl leading-none tracking-tight text-ink sm:text-5xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl font-serif text-base leading-relaxed text-ink/70">{subtitle}</p>
    </div>
  )
}

interface BiasCardProps {
  id: string
  name: string
  score: number
  evidence: string
  implication: string
  remedy: string
}
function BiasCard(x: BiasCardProps) {
  const tier = x.score >= 60 ? 'red' : x.score >= 30 ? 'amber' : 'good'
  const border =
    tier === 'red' ? 'border-hotred' : tier === 'amber' ? 'border-amber-500' : 'border-profit'
  const bar =
    tier === 'red' ? 'bg-hotred' : tier === 'amber' ? 'bg-amber-500' : 'bg-profit'
  const color =
    tier === 'red' ? 'text-hotred' : tier === 'amber' ? 'text-amber-500' : 'text-profit'
  return (
    <div className={cn('border p-4', border)}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
          {x.name}
        </div>
        <div className={cn('font-mono text-xs font-bold', color)}>
          {x.score.toFixed(0)}/100
        </div>
      </div>
      <div className="mt-2 h-2 w-full border border-ink/20">
        <div className={cn('h-full', bar)} style={{ width: `${Math.min(100, x.score)}%` }} />
      </div>
      <p className="mt-3 font-mono text-[11px] text-muted-foreground">{x.evidence}</p>
      <p className="mt-2 font-serif text-sm leading-relaxed text-ink/80">{x.implication}</p>
    </div>
  )
}

function ProfileCard({
  label,
  value,
  caption,
  danger,
}: {
  label: string
  value: string
  caption: string
  danger?: boolean
}) {
  return (
    <div className={cn('border p-5', danger ? 'border-hotred' : 'border-ink')}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          'font-display text-5xl leading-none tracking-tighter',
          danger ? 'text-hotred' : 'text-ink',
        )}
      >
        {value}
      </div>
      <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted-foreground">{caption}</p>
    </div>
  )
}