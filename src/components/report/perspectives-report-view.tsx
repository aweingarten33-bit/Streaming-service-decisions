"use client";

import type { AnalysisReport, Bucket } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { Reveal } from '@/components/fx/reveal'
import { BrutalCard } from '@/components/punk/brutal-card'
import { cn } from '@/lib/utils'
import { Bar, KpiCard, NextSteps } from './_shared'

/**
 * PerspectivesReportView — one master report, fifteen expert voices.
 *
 * The CSV is analyzed once. Each perspective below reads the SAME
 * AnalysisReport through a different lens (CEO, CIO, coach, poker pro,
 * risk manager, behavioral, pattern, data scientist, intel, root cause,
 * GM, house, performance, mentor, board). Voice: an experienced advisor
 * writing to the player in plain English. No jargon.
 */
export function PerspectivesReportView({ report }: { report: AnalysisReport }) {
  const s = derive(report)

  return (
    <div className="space-y-14 sm:space-y-20">
      <MasterHeader report={report} s={s} />

      <Reveal>
        <ExecutiveBoard report={report} s={s} />
      </Reveal>
      <Reveal>
        <ChiefInvestmentOfficer report={report} s={s} />
      </Reveal>
      <Reveal>
        <ProDfsCoach report={report} s={s} />
      </Reveal>
      <Reveal>
        <PokerPro report={report} s={s} />
      </Reveal>
      <Reveal>
        <RiskManager report={report} s={s} />
      </Reveal>
      <Reveal>
        <BehavioralPsychologist report={report} s={s} />
      </Reveal>
      <Reveal>
        <PatternAi report={report} s={s} />
      </Reveal>
      <Reveal>
        <DataScientist report={report} s={s} />
      </Reveal>
      <Reveal>
        <IntelOfficer report={report} s={s} />
      </Reveal>
      <Reveal>
        <AccidentInvestigator report={report} s={s} />
      </Reveal>
      <Reveal>
        <GeneralManager report={report} s={s} />
      </Reveal>
      <Reveal>
        <CasinoAnalyst report={report} s={s} />
      </Reveal>
      <Reveal>
        <PerformanceCoach report={report} s={s} />
      </Reveal>
      <Reveal>
        <Mentor report={report} s={s} />
      </Reveal>
      <Reveal>
        <FinalBoard report={report} s={s} />
      </Reveal>
    </div>
  )
}

/* ============================================================
   Master header
   ============================================================ */

function MasterHeader({ report, s }: PerspectiveProps) {
  return (
    <BrutalCard border="ink" className="p-5 sm:p-8">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:text-xs">
        INDEPENDENT STRATEGY ASSESSMENT · {report.platform} · {report.dateRange.start} → {report.dateRange.end} · {report.rowCount} ENTRIES
      </div>
      <h1 className="font-display mt-2 text-4xl leading-none tracking-tight text-ink sm:text-6xl">
        Fifteen experts read your history.
      </h1>
      <p className="mt-6 max-w-3xl border-l-2 border-ink pl-4 font-serif text-lg leading-relaxed text-ink sm:text-xl">
        Your DFS history has been independently reviewed by a multidisciplinary
        advisory panel. Each expert analyzed the same data from their own area
        of expertise — a CEO, a portfolio manager, a poker pro, a behavioral
        psychologist, a risk officer, a scout, a mentor — and reached their
        conclusions independently. Where they agree, you should pay attention.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <KpiCard label="TAKE-HOME" value={fmtMoney(report.netProfit)} tone={report.netProfit >= 0 ? 'good' : 'bad'} />
        <KpiCard label="ROI" value={`${report.roi >= 0 ? '+' : ''}${report.roi.toFixed(1)}%`} tone={report.roi >= 0 ? 'good' : 'bad'} />
        <KpiCard label="DISCIPLINE" value={s.discipline == null ? '—' : `${s.discipline}/100`} tone={s.disciplineTone} />
        <KpiCard label="WORST STRETCH" value={fmtMoney(-report.chess.criticalPosition.drawdown)} tone="bad" />
      </div>
    </BrutalCard>
  )
}

/* ============================================================
   Perspective components (15)
   ============================================================ */

function ExecutiveBoard({ report, s }: PerspectiveProps) {
  const healthy = s.efficiency >= 55 && s.discipline != null && s.discipline >= 55
  return (
    <Perspective
      n="01"
      badge="THE EXECUTIVE BOARD"
      whoPill="CEO · McKinsey · KPMG"
      question="How healthy is your DFS operation overall?"
    >
      <BoardVerdict
        headline={
          healthy
            ? 'The business is fundamentally sound. Protect what works before chasing what\'s new.'
            : 'The process is decent, but your money is not going where you\'re winning.'
        }
      >
        Your operation has real profit centers and real loss centers. Roughly{' '}
        <B>{s.efficiency}%</B> of your entry money is landing in categories your
        own history says you can beat. The rest is subsidizing categories that
        are losing you money quarter after quarter. Profitable business units
        should not be financing underperforming ones.
      </BoardVerdict>
      <Recommendation>
        Protect your profitable strategies first. Expansion into higher-risk
        opportunities only after the base is defended.
      </Recommendation>
    </Perspective>
  )
}

function ChiefInvestmentOfficer({ report, s }: PerspectiveProps) {
  const rebal = report.reallocation
  return (
    <Perspective
      n="02"
      badge="THE CHIEF INVESTMENT OFFICER"
      whoPill="Portfolio Management"
      question="If your bankroll were a portfolio, would I put money in it?"
    >
      <BoardVerdict
        headline={
          rebal.hasData
            ? `Yes — but I'd move ${fmtMoney(rebal.totalProjectedSwing)} of it before the next cycle.`
            : 'The book has potential, but not enough position data to allocate confidently yet.'
        }
      >
        Your best-performing segment is{' '}
        <B>{rebal.hasData ? rebal.anchorSegment : (s.bestBucket?.key ?? 'not yet clear')}</B>
        {rebal.hasData && (
          <> at <B>{rebal.anchorRoi.toFixed(1)}% ROI</B></>
        )}
        . Meanwhile, real dollars keep landing in segments that lose money on
        repeat. That's an allocation problem, not a talent problem.
      </BoardVerdict>
      {rebal.hasData && rebal.moves[0] && (
        <MoveCard
          from={rebal.moves[0].fromSegment}
          fromRoi={rebal.moves[0].fromRoi}
          to={rebal.moves[0].toSegment}
          toRoi={rebal.moves[0].toRoi}
          swing={rebal.moves[0].swing}
        />
      )}
      <Recommendation>
        Increase capital to historically profitable segments. Reduce exposure
        to segments with a clear negative track record.
      </Recommendation>
    </Perspective>
  )
}

function ProDfsCoach({ report, s }: PerspectiveProps) {
  const bestSelection = s.bestBucket
  const worstSelection = s.worstBucket
  return (
    <Perspective
      n="03"
      badge="THE ELITE DFS COACH"
      whoPill="Top 1% player"
      question="How would the best players in the world evaluate you?"
    >
      <BoardVerdict
        headline="Your lineups are competitive. Your contest selection is where you're leaving money on the table."
      >
        The top 1% spend as much time choosing <B>where</B> to play as choosing{' '}
        <B>who</B> to play. In your history, entries in{' '}
        <B>{bestSelection?.key ?? 'your best category'}</B> return{' '}
        <B>{bestSelection ? `${bestSelection.roi.toFixed(1)}%` : ''}</B>. Entries
        in <B>{worstSelection?.key ?? 'your weakest category'}</B> return{' '}
        <B>{worstSelection ? `${worstSelection.roi.toFixed(1)}%` : ''}</B>. Same
        player, same skills, same week. The difference is the room you walked
        into.
      </BoardVerdict>
      <Recommendation>
        Before every slate, choose the room first, the lineup second. The room
        matters more than most players believe.
      </Recommendation>
    </Perspective>
  )
}

function PokerPro({ report, s }: PerspectiveProps) {
  return (
    <Perspective
      n="04"
      badge="THE POKER PRO"
      whoPill="Decision-quality lens"
      question="Are you making good decisions — or just chasing results?"
    >
      <BoardVerdict
        headline="Some of your losing weeks were good decisions. Some of your winning weeks were bad ones."
      >
        A good decision made with the right information can still lose. A bad
        decision made in a heated moment can still win. Over enough hands,
        though, the process wins. Your process score is{' '}
        <B>{s.decisionScore}/100</B> — decent, but{' '}
        {s.decisionScore >= 70
          ? "the results should follow if you keep it up."
          : 'the outcomes are still doing more of the talking than the process is.'}
      </BoardVerdict>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="RIGHT SPOTS" value={`${s.qualityPct}%`} caption="Share of your money that went into spots you can actually beat." tone={s.qualityPct >= 60 ? 'good' : 'warn'} />
        <KpiCard label="STEADINESS" value={`${s.steadinessPct}%`} caption="How similar your bet sizes look from day to day." tone={s.steadinessPct >= 60 ? 'good' : 'warn'} />
        <KpiCard label="COOL HEAD" value={`${s.coolHeadPct}%`} caption="How well you avoid throwing more money at a losing day." tone={s.coolHeadPct >= 60 ? 'good' : 'warn'} />
      </div>
      <Recommendation>
        Judge the decision, not the outcome. Variance will eventually tell you
        whether your process is actually profitable — but only if the process
        stays the same long enough for the sample to speak.
      </Recommendation>
    </Perspective>
  )
}

function RiskManager({ report, s }: PerspectiveProps) {
  const b = report.bankroll
  const cp = report.chess.criticalPosition
  return (
    <Perspective
      n="05"
      badge="THE HEDGE-FUND RISK MANAGER"
      whoPill="CRO"
      question="How much can this bankroll actually take?"
    >
      <BoardVerdict
        headline={
          s.riskComposite >= 60
            ? 'The bankroll is running with risks that are larger than they need to be.'
            : s.riskComposite >= 30
              ? 'Risk is inside limits, but a couple of habits are pushing close to policy.'
              : 'Risk posture is clean. Keep the rules; the results will keep themselves.'
        }
      >
        Your worst peak-to-trough stretch cost <B>{fmtMoney(-cp.drawdown)}</B>{' '}
        {cp.hasData ? `over ${cp.daysToTrough} days` : ''}. At your most exposed
        moment, <B>{b.peakSlateExposurePct.toFixed(1)}%</B> of your rolling
        bankroll was on a single slate. And <B>{b.formatConcentrationPct.toFixed(0)}%</B>{' '}
        of your money went into a single format ({b.concentratedFormat}). Any
        one of those, on a bad day, is enough to end a book.
      </BoardVerdict>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="ONE-SLATE EXPOSURE" value={`${b.peakSlateExposurePct.toFixed(1)}%`} tone={b.peakSlateExposurePct > 10 ? 'bad' : 'warn'} caption="Safe zone: under 5% of bankroll on any single slate." />
        <KpiCard label="ONE-FORMAT EXPOSURE" value={`${b.formatConcentrationPct.toFixed(0)}%`} tone={b.formatConcentrationPct > 60 ? 'bad' : 'warn'} caption="Safe zone: under 40% in any single format." />
        <KpiCard label="WORST STRETCH" value={fmtMoney(-cp.drawdown)} tone="bad" caption={cp.hasData ? `${cp.daysToTrough} days from high to low.` : 'Not enough dated data.'} />
      </div>
      <Recommendation>
        Diversify contest exposure. Trim oversized positions. Protect the
        bankroll before chasing upside — always in that order.
      </Recommendation>
    </Perspective>
  )
}

function BehavioralPsychologist({ report }: PerspectiveProps) {
  const c = report.chess.consistency
  const b = report.bankroll
  return (
    <Perspective
      n="06"
      badge="THE BEHAVIORAL PSYCHOLOGIST"
      whoPill="Decision under pressure"
      question="Who are you across the table from — the field, or yourself?"
    >
      <BoardVerdict
        headline="Your biggest opponent is not the field. It's the person you become after a hot streak — and the one you become after a cold one."
      >
        The day after a big win, your entry sizing changes by{' '}
        <B>{c.afterBigWinInflationPct >= 0 ? '+' : ''}{c.afterBigWinInflationPct.toFixed(0)}%</B>.
        The day after a losing day, you spend an average of{' '}
        <B>{b.lossChasingPct.toFixed(0)}% more</B> on entries. Both directions
        are your emotions writing your budget for you. Both, historically,
        lower your expected return.
      </BoardVerdict>
      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard label="AFTER A WIN" value={`${c.afterBigWinInflationPct >= 0 ? '+' : ''}${c.afterBigWinInflationPct.toFixed(0)}%`} tone={c.afterBigWinInflationPct > 25 ? 'bad' : 'warn'} caption="How much more you bet the day after a big win." />
        <KpiCard label="AFTER A LOSS" value={`+${b.lossChasingPct.toFixed(0)}%`} tone={b.lossChasingPct > 20 ? 'bad' : 'warn'} caption="Average entry-fee bump the day after a losing day." />
      </div>
      <Recommendation>
        Decide your weekly entry budget in a cold room, on a quiet day.
        Never revise it in a hot one.
      </Recommendation>
    </Perspective>
  )
}

function PatternAi({ report }: PerspectiveProps) {
  const interactions = report.chess.hiddenInteractions.slice(0, 3)
  return (
    <Perspective
      n="07"
      badge="THE PATTERN RECOGNITION AI"
      whoPill="What repeats"
      question="What keeps happening in your history, over and over?"
    >
      <BoardVerdict
        headline={
          interactions.length
            ? 'Two patterns keep repeating — and they compound when they show up together.'
            : 'Nothing loud enough to flag as a repeat pattern yet. Keep building sample.'
        }
      >
        A single bad slate is noise. The same result showing up in the same
        combination over and over is a pattern — and patterns respond to rules
        the way noise never will.
      </BoardVerdict>
      {interactions.length > 0 && (
        <ol className="space-y-2">
          {interactions.map((h, i) => (
            <li key={i} className={cn('border p-4', h.interactionRoi >= 0 ? 'border-profit' : 'border-hotred')}>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                HIDDEN PATTERN #{i + 1}
              </div>
              <p className="mt-1 font-serif text-base leading-relaxed text-ink sm:text-lg">
                In <B>{h.cell}</B>, your ROI runs at{' '}
                <B>{h.roi.toFixed(1)}%</B> — {Math.abs(h.interactionRoi).toFixed(1)}{' '}
                points {h.interactionRoi >= 0 ? 'better' : 'worse'} than it should
                be, across {h.entries} entries and {fmtMoney(h.net)} of net.
              </p>
            </li>
          ))}
        </ol>
      )}
      <Recommendation>
        These relationships are stronger than any single-slate result. Trust
        them more than you trust yesterday.
      </Recommendation>
    </Perspective>
  )
}

function DataScientist({ report }: PerspectiveProps) {
  const bestSport = topBucket(report.sportBreakdown)
  const bestContest = topBucket(report.contestTypeBreakdown)
  const bestBuyin = topBucket(report.buyinBreakdown)
  const confidence = report.chess.overallConfidence.level
  const confidenceWord = confidence === 'HIGH' ? 'strong' : confidence === 'MEDIUM' ? 'decent' : 'thin'
  return (
    <Perspective
      n="08"
      badge="THE SPORTS DATA SCIENTIST"
      whoPill="Evidence only"
      question="Setting opinion aside, what does the data actually say?"
    >
      <BoardVerdict headline="No opinions. Only what the numbers show.">
        Across {report.rowCount} entries, your career ROI is{' '}
        <B>{report.roi >= 0 ? '+' : ''}{report.roi.toFixed(1)}%</B> on{' '}
        {fmtMoney(report.totalFees)} of entry fees. The sample is <B>{confidenceWord}</B>
        {' '}enough to draw the following:
      </BoardVerdict>
      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="STRONGEST SPORT" value={bestSport?.key ?? '—'} caption={bestSport ? `${bestSport.roi.toFixed(1)}% ROI across ${bestSport.entries} entries.` : 'Not enough sample yet.'} tone="good" />
        <KpiCard label="BEST CONTEST TYPE" value={bestContest?.key ?? '—'} caption={bestContest ? `${bestContest.roi.toFixed(1)}% ROI, ${fmtMoney(bestContest.net)} net.` : 'Not enough sample yet.'} tone="good" />
        <KpiCard label="BEST BUY-IN" value={bestBuyin?.key ?? '—'} caption={bestBuyin ? `${bestBuyin.roi.toFixed(1)}% ROI across ${bestBuyin.entries} entries.` : 'Not enough sample yet.'} tone="good" />
      </div>
      <Recommendation>
        Reinforce the categories with a real sample and a real positive number.
        Discount the ones without.
      </Recommendation>
    </Perspective>
  )
}

function IntelOfficer({ report }: PerspectiveProps) {
  const objMet = report.roi >= 0
  return (
    <Perspective
      n="09"
      badge="THE INTELLIGENCE OFFICER"
      whoPill="Mission debrief"
      question="What was the mission — and did you accomplish it?"
    >
      <BoardVerdict
        headline={
          objMet
            ? 'Mission objective met. The wins are real. So are the failures.'
            : 'Mission objective not met yet. The successes tell you where the next mission starts.'
        }
      >
        <B>Mission objective:</B> generate a long-term positive ROI on a
        controlled bankroll.
      </BoardVerdict>
      <div className="grid gap-3 md:grid-cols-2">
        <MissionBlock
          tone="good"
          title="MISSION SUCCESSES"
          items={successBullets(report)}
        />
        <MissionBlock
          tone="bad"
          title="MISSION FAILURES"
          items={failureBullets(report)}
        />
      </div>
      <Recommendation>
        Next mission: defend the established advantages. Do not open a second
        front until the first one is secure.
      </Recommendation>
    </Perspective>
  )
}

function AccidentInvestigator({ report }: PerspectiveProps) {
  const primary =
    [...report.findings]
      .filter((f) => f.dollarImpact < 0)
      .sort((a, b) => a.dollarImpact - b.dollarImpact)[0] ?? report.findings[0]
  return (
    <Perspective
      n="10"
      badge="THE ACCIDENT INVESTIGATOR"
      whoPill="Root cause"
      question="What caused the crash — and how do we make sure it doesn't happen again?"
    >
      <BoardVerdict
        headline={
          primary
            ? `The biggest single loss traces back to one thing — and it's fixable.`
            : 'Not enough evidence yet to isolate a single root cause.'
        }
      >
        {primary ? (
          <>
            <B>The incident:</B> {primary.whatWeFound}
            <br />
            <B>Primary cause:</B> {primary.rootCause}
            <br />
            <B>Dollar impact:</B> {fmtMoney(primary.dollarImpact)}.
          </>
        ) : (
          'Keep uploading entries. A pattern needs more than a few slates before we can trust it.'
        )}
      </BoardVerdict>
      {primary && (
        <Recommendation>{primary.recommendation}</Recommendation>
      )}
    </Perspective>
  )
}

function GeneralManager({ report }: PerspectiveProps) {
  const roster = [...report.contestTypeBreakdown]
    .filter((b) => b.entries >= 5)
    .sort((a, b) => b.fees - a.fees)
    .slice(0, 5)
  return (
    <Perspective
      n="11"
      badge="THE GENERAL MANAGER"
      whoPill="Roster construction"
      question="If each contest type were a player on your team, who plays and who sits?"
    >
      <BoardVerdict headline="Some players deserve more minutes. Some should be benched. One or two should be released.">
        Great teams put their best players in the game the most. Your bench
        currently gets more minutes than it earned.
      </BoardVerdict>
      <div className="space-y-2">
        {roster.map((r) => {
          const decision = rosterDecision(r)
          return (
            <div key={r.key} className={cn('flex items-center justify-between border p-3', decision.tone === 'good' ? 'border-profit' : decision.tone === 'bad' ? 'border-hotred' : 'border-amber-500')}>
              <div>
                <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">{r.key}</div>
                <div className="font-mono text-[11px] text-muted-foreground">
                  {r.entries} entries · {fmtMoney(r.net)} net · {r.roi.toFixed(1)}% ROI
                </div>
              </div>
              <div className={cn('font-display text-xl tracking-tight', decision.tone === 'good' ? 'text-profit' : decision.tone === 'bad' ? 'text-hotred' : 'text-amber-500')}>
                {decision.label}
              </div>
            </div>
          )
        })}
      </div>
      <Recommendation>
        Reallocate playing time toward the starters. Bench the underperformers.
        A GM who keeps giving minutes to a losing player is the reason the team
        misses the playoffs.
      </Recommendation>
    </Perspective>
  )
}

function CasinoAnalyst({ report, s }: PerspectiveProps) {
  const disciplined = (s.discipline ?? 0) >= 55
  return (
    <Perspective
      n="12"
      badge="THE CASINO RISK ANALYST"
      whoPill="House perspective"
      question="If we were the house, how would we classify you?"
    >
      <BoardVerdict
        headline={
          disciplined
            ? 'You are a disciplined, improving, process-oriented player — not quite an "advantage player" across every format yet.'
            : 'You are a customer, not yet a threat. Which is a fixable problem.'
        }
      >
        The house cares less about how much you win in a session and more about
        which habits show up over and over. In your file, the good habits are:
        contest selection, a real edge in your best category, and a growing
        discipline score. The habits still working against you: chasing after
        losses, sizing up after wins, and overloading a single format.
      </BoardVerdict>
      <ul className="grid gap-2 sm:grid-cols-2">
        <PillRow ok label="Process-oriented" />
        <PillRow ok label="Improving over time" />
        <PillRow ok label="Has a real edge somewhere" />
        <PillRow label="Chases losses" />
        <PillRow label="Escalates buy-ins after wins" />
        <PillRow label="Overexposed to one format" />
      </ul>
      <Recommendation>
        You have not reached "advantage player" behavior across every format
        yet. You will — the profile is close. The remaining gap is discipline,
        not skill.
      </Recommendation>
    </Perspective>
  )
}

function PerformanceCoach({ report }: PerspectiveProps) {
  const recent = report.monthly.slice(-3)
  const prior = report.monthly.slice(-6, -3)
  const recentRoi = avg(recent.map((x) => x.roi))
  const priorRoi = avg(prior.map((x) => x.roi))
  const trend = recentRoi - priorRoi
  return (
    <Perspective
      n="13"
      badge="THE HIGH-STAKES PERFORMANCE COACH"
      whoPill="Elite performance"
      question="What's the difference between good and great?"
    >
      <BoardVerdict headline="Professionals don't become great by finding better plays. They become great by eliminating the same mistake twice.">
        Over the last three months your ROI is <B>{recentRoi.toFixed(1)}%</B>{' '}
        against a prior three-month baseline of <B>{priorRoi.toFixed(1)}%</B> —
        a {Math.abs(trend).toFixed(1)}-point {trend >= 0 ? 'improvement' : 'decline'}.
        Improvement is visible in the file. The next level isn't a better
        lineup; it's a more boring one.
      </BoardVerdict>
      <Recommendation>
        Pick one mistake you make repeatedly, write down the rule that stops
        it, and hold to that rule for 30 days. Then pick the next one. That's
        the whole game.
      </Recommendation>
    </Perspective>
  )
}

function Mentor({ report, s }: PerspectiveProps) {
  const anchor = report.reallocation.hasData ? report.reallocation.anchorSegment : s.bestBucket?.key
  return (
    <Perspective
      n="14"
      badge="THE MENTOR"
      whoPill="Molly Bloom-style read"
      question="What are you missing that's staring you in the face?"
    >
      <BoardVerdict headline="You don't need more confidence. You need more conviction in the right places.">
        Your strongest results already tell you where your edge is. It's{' '}
        {anchor ? <B>{anchor}</B> : 'in your best-performing category above'}. You
        keep proving it and then quietly wandering off to test whether you can
        beat rooms you already know you can't. The challenge isn't discovering
        the edge. The challenge is trusting it enough to keep showing up in
        the same room.
      </BoardVerdict>
      <p className="border-l-2 border-ink pl-4 font-serif text-lg leading-relaxed text-ink sm:text-xl">
        Professionals aren't defined by their spectacular wins. They're defined
        by disciplined repetition. A career is a thousand small correct
        decisions in a row — most of them so quiet nobody notices.
      </p>
    </Perspective>
  )
}

function FinalBoard({ report, s }: PerspectiveProps) {
  return (
    <Perspective
      n="15"
      badge="FINAL ADVISORY BOARD RECOMMENDATION"
      whoPill="The panel converges"
      question="What does every expert agree on?"
    >
      <BoardVerdict headline="Every expert independently reviewed the same history. Their conclusions converge.">
        Different disciplines, different vocabularies, same four notes.
      </BoardVerdict>
      <ul className="space-y-2">
        {[
          'Protect your strengths — the segments your own data has already proven.',
          'Reduce risk that isn\'t buying you anything — oversized slates, single-format overload, post-loss escalation.',
          'Allocate capital where you have a demonstrated edge, not where you hope one exists.',
          'Let process — not emotion — drive decisions. Measure success across hundreds of contests, not any one slate.',
        ].map((line, i) => (
          <li key={i} className="border border-ink p-3 font-serif text-base leading-relaxed text-ink sm:text-lg">
            <span className="mr-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              {String(i + 1).padStart(2, '0')}
            </span>
            {line}
          </li>
        ))}
      </ul>

      <div className="pt-4">
        <NextSteps
          title="THIS WEEK"
          intro="Three moves the whole panel would sign."
          steps={[
            {
              do: report.reallocation.hasData && report.reallocation.moves[0]
                ? `Shift next week\'s entry budget out of ${report.reallocation.moves[0].fromSegment} and into ${report.reallocation.moves[0].toSegment}.`
                : `Concentrate next week\'s entry budget on ${s.bestBucket?.key ?? 'your best-ROI category with 20+ entries'}.`,
              because: 'The same money in a better room is the single biggest lever you have.',
            },
            {
              do: 'Write down your weekly entry budget on Sunday. Do not raise it during the week for any reason.',
              because: 'A written rule beats a resolution every single time.',
            },
            {
              do: 'Upload fresh data in 30 days and re-run the panel.',
              because: 'The only way to know a change worked is to see the same numbers move.',
            },
          ]}
        />
      </div>
    </Perspective>
  )
}

/* ============================================================
   Building blocks
   ============================================================ */

interface DerivedSignals {
  discipline: number | null
  disciplineTone: 'good' | 'warn' | 'bad'
  efficiency: number
  qualityPct: number
  steadinessPct: number
  coolHeadPct: number
  decisionScore: number
  riskComposite: number
  bestBucket: Bucket | null
  worstBucket: Bucket | null
}

interface PerspectiveProps {
  report: AnalysisReport
  s: DerivedSignals
}

function derive(report: AnalysisReport): DerivedSignals {
  const b = report.bankroll
  const c = report.chess
  const totalFees = Math.max(1, report.totalFees)
  const winFees = report.sportBreakdown
    .filter((x) => x.roi > 0 && !x.smallSample)
    .reduce((s, x) => s + x.fees, 0)
  const efficiency = Math.round((winFees / totalFees) * 100)

  const quality = clamp01(c.strategicAccuracy.bestMovePct / 100) * 100
  const steadiness = clamp01(1 - c.consistency.dailyFeeCv / 2) * 100
  const coolHead = clamp01(1 - b.lossChasingPct / 100) * 100
  const efficiencyPart = clamp01(1 - c.varianceAttribution.varianceLossDollars /
    Math.max(1, c.varianceAttribution.varianceLossDollars + Math.abs(c.varianceAttribution.structuralLossDollars))) * 100
  const decisionScore = Math.round((quality + steadiness + coolHead + efficiencyPart) / 4)

  const riskComposite = Math.round(
    (clamp01(b.peakSlateExposurePct / 25) * 100 * 0.9 +
      clamp01(b.lossChasingPct / 100) * 100 * 0.8 +
      clamp01(b.formatConcentrationPct / 100) * 100 * 0.6 +
      clamp01(c.consistency.dailyFeeCv / 2) * 100 * 0.55 +
      clamp01(c.varianceAttribution.structuralSharePct / 100) * 100 * 0.85) / 3.7,
  )

  const discipline = report.disciplineScore.provisional ? null : (report.disciplineScore.score ?? null)
  const disciplineTone: 'good' | 'warn' | 'bad' =
    discipline == null ? 'warn' : discipline >= 70 ? 'good' : discipline >= 45 ? 'warn' : 'bad'

  const rankable = [...report.contestTypeBreakdown, ...report.buyinBreakdown, ...report.sportBreakdown]
    .filter((x) => x.entries >= 10)
  const bestBucket = rankable.length
    ? rankable.slice().sort((a, b) => b.roi - a.roi)[0]
    : null
  const worstBucket = rankable.length
    ? rankable.slice().sort((a, b) => a.roi - b.roi)[0]
    : null

  return {
    discipline,
    disciplineTone,
    efficiency,
    qualityPct: Math.round(quality),
    steadinessPct: Math.round(steadiness),
    coolHeadPct: Math.round(coolHead),
    decisionScore,
    riskComposite,
    bestBucket,
    worstBucket,
  }
}

function Perspective({
  n,
  badge,
  whoPill,
  question,
  children,
}: {
  n: string
  badge: string
  whoPill: string
  question: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-5">
      <header className="border-b border-ink pb-4">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="font-display text-5xl leading-none tracking-tighter text-ink sm:text-7xl">
            {n}
          </span>
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              {whoPill}
            </div>
            <h2 className="font-display text-2xl leading-tight tracking-tight text-ink sm:text-4xl">
              {badge}
            </h2>
          </div>
        </div>
        <p className="mt-3 font-serif text-base italic leading-relaxed text-ink/70 sm:text-lg">
          {question}
        </p>
      </header>
      {children}
    </section>
  )
}

function BoardVerdict({
  headline,
  children,
}: {
  headline: string
  children: React.ReactNode
}) {
  return (
    <div className="border border-ink p-5">
      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        VERDICT
      </div>
      <p className="mt-2 font-display text-xl leading-snug tracking-tight text-ink sm:text-3xl">
        {headline}
      </p>
      <div className="mt-4 border-l-2 border-ink pl-4 font-serif text-base leading-relaxed text-ink sm:text-lg">
        {children}
      </div>
    </div>
  )
}

function Recommendation({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-profit p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-profit">
        RECOMMENDATION
      </div>
      <p className="mt-2 font-serif text-base leading-relaxed text-ink sm:text-lg">{children}</p>
    </div>
  )
}

function MoveCard({
  from,
  fromRoi,
  to,
  toRoi,
  swing,
}: {
  from: string
  fromRoi: number
  to: string
  toRoi: number
  swing: number
}) {
  return (
    <div className="border border-ink p-4">
      <div className="font-mono text-xs font-bold uppercase tracking-widest text-hotred">
        LESS MONEY IN · {from} ({fromRoi.toFixed(1)}% ROI)
      </div>
      <div className="mt-2 border-t border-ink/20 pt-2 font-mono text-xs font-bold uppercase tracking-widest text-profit">
        MORE MONEY IN · {to} ({toRoi.toFixed(1)}% ROI)
      </div>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">
        What the same dollars would have earned: <span className="text-profit">{fmtMoney(swing)}</span>
      </p>
    </div>
  )
}

function MissionBlock({
  title,
  items,
  tone,
}: {
  title: string
  items: string[]
  tone: 'good' | 'bad'
}) {
  const color = tone === 'good' ? 'border-profit text-profit' : 'border-hotred text-hotred'
  return (
    <div className={cn('border p-4', color)}>
      <div className={cn('font-mono text-[10px] uppercase tracking-widest', tone === 'good' ? 'text-profit' : 'text-hotred')}>
        {title}
      </div>
      <ul className="mt-2 space-y-1 font-serif text-base leading-relaxed text-ink">
        {items.map((x, i) => (
          <li key={i}>— {x}</li>
        ))}
      </ul>
    </div>
  )
}

function PillRow({ label, ok = false }: { label: string; ok?: boolean }) {
  return (
    <li className={cn('flex items-center gap-2 border p-2 font-mono text-xs', ok ? 'border-profit text-ink' : 'border-hotred text-ink')}>
      <span className={cn('font-display text-base', ok ? 'text-profit' : 'text-hotred')}>
        {ok ? '✓' : '×'}
      </span>
      <span className="uppercase tracking-widest">{label}</span>
    </li>
  )
}

function B({ children }: { children: React.ReactNode }) {
  return <span className="font-bold text-ink">{children}</span>
}

/* ============================================================
   Helpers
   ============================================================ */

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0
  return Math.max(0, Math.min(1, x))
}

function avg(xs: number[]) {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0
}

function topBucket(buckets: Bucket[]): Bucket | null {
  const eligible = buckets.filter((b) => b.entries >= 10 && b.roi > 0 && !b.smallSample)
  if (!eligible.length) return null
  return eligible.slice().sort((a, b) => b.roi - a.roi)[0]
}

function rosterDecision(b: Bucket): { label: string; tone: 'good' | 'warn' | 'bad' } {
  if (b.smallSample) return { label: 'DEVELOPMENTAL', tone: 'warn' }
  if (b.roi >= 15) return { label: 'STARTER · MORE MINUTES', tone: 'good' }
  if (b.roi >= 0) return { label: 'ROLE PLAYER', tone: 'good' }
  if (b.roi >= -15) return { label: 'BENCH', tone: 'warn' }
  return { label: 'RELEASE', tone: 'bad' }
}

function successBullets(report: AnalysisReport): string[] {
  const wins = [...report.contestTypeBreakdown, ...report.sportBreakdown, ...report.buyinBreakdown]
    .filter((b) => !b.smallSample && b.roi > 0 && b.entries >= 10)
    .sort((a, b) => b.net - a.net)
    .slice(0, 3)
  if (!wins.length) {
    return ['Not enough winning categories with a strong sample yet.']
  }
  return wins.map((b) => `${b.key} — ${fmtMoney(b.net)} net at ${b.roi.toFixed(1)}% ROI.`)
}

function failureBullets(report: AnalysisReport): string[] {
  const losses = [...report.contestTypeBreakdown, ...report.sportBreakdown, ...report.buyinBreakdown]
    .filter((b) => b.roi < 0 && b.entries >= 10)
    .sort((a, b) => a.net - b.net)
    .slice(0, 3)
  if (!losses.length) {
    return ['No dominant loss center — the bleeding is spread thin.']
  }
  return losses.map((b) => `${b.key} — ${fmtMoney(b.net)} net at ${b.roi.toFixed(1)}% ROI.`)
}