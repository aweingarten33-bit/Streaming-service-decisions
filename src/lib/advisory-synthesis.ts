import type { AnalysisReport, Bucket } from './types'
import { fmtMoney } from './analysis'

/**
 * Advisory synthesis — one unified read on the file.
 *
 * A finding is only surfaced when multiple independent checks against the
 * SAME AnalysisReport agree. That agreement is the "highest-confidence"
 * signal we present in the app; the PDF export shows the full evidence
 * and the exact math behind each number.
 *
 * Voice: Buffett-style — plain English, no jargon, no invented composite
 * scores. Every number carries a math note that the PDF prints in full.
 */

export type FindingDirection = 'protect' | 'reduce' | 'stop' | 'watch'

export interface Evidence {
  /** Human-readable label for the number, e.g. "NFL Single Entry ROI". */
  label: string
  /** Formatted value, e.g. "+8.4%" or "$3,842". */
  value: string
  /** One-sentence explanation of exactly how the number was computed. */
  math: string
}

export interface Finding {
  id: string
  /** Buffett-style headline, no numbers. */
  headline: string
  /** One sentence: what this means for the player. */
  implication: string
  /** One sentence: the concrete action. */
  action: string
  direction: FindingDirection
  /** Names of the independent checks that fired for this finding. */
  agreeingChecks: string[]
  /** The specific numbers and their math. */
  evidence: Evidence[]
}

export interface Synthesis {
  /** Findings where ≥2 checks agree, ranked by number of agreeing checks. */
  highestConfidence: Finding[]
  /** Plain-English narrative: what actually happened. */
  whatHappened: string[]
  /** Plain-English narrative: why it happened. */
  whyItHappened: string[]
  /** 3–5 concrete actions the player should take next. */
  whatToDoNext: string[]
  /** Bottom-line one-sentence read. */
  bottomLine: string
}

export function synthesize(report: AnalysisReport): Synthesis {
  const c = collectCandidates(report)
  const highestConfidence = c
    .filter((f) => f.agreeingChecks.length >= 2)
    .sort((a, b) => b.agreeingChecks.length - a.agreeingChecks.length)
    .slice(0, 4)

  const bestBucket = pickBestBucket(report)
  const worstBucket = pickWorstBucket(report)

  return {
    highestConfidence,
    whatHappened: buildWhatHappened(report, bestBucket, worstBucket),
    whyItHappened: buildWhyItHappened(report, bestBucket, worstBucket),
    whatToDoNext: buildWhatToDoNext(report, highestConfidence, bestBucket, worstBucket),
    bottomLine: buildBottomLine(report, bestBucket, worstBucket),
  }
}

/* ============================================================
   Candidate findings — each is a set of independent checks that
   have to agree before we call the finding "highest-confidence."
   ============================================================ */

function collectCandidates(report: AnalysisReport): Finding[] {
  return [
    findingProvenEdge(report),
    findingAllocationLeak(report),
    findingConcentrationRisk(report),
    findingBehavioralTilt(report),
    findingSmallSampleTrap(report),
    findingUnderfundedEdge(report),
  ].filter((f): f is Finding => f !== null)
}

function findingProvenEdge(report: AnalysisReport): Finding | null {
  const best = pickBestBucket(report)
  if (!best) return null
  const checks: string[] = []
  const ev: Evidence[] = []

  if (best.roi > 5 && best.entries >= 30) {
    checks.push('Segment ROI check')
    ev.push({
      label: `${best.key} ROI`,
      value: `${best.roi >= 0 ? '+' : ''}${best.roi.toFixed(1)}%`,
      math: `Sum of net across ${best.entries} entries in ${best.key} divided by sum of entry fees in the same segment, expressed as a percent.`,
    })
    ev.push({
      label: `${best.key} net`,
      value: fmtMoney(best.net),
      math: `Sum of (winnings − entry fee) across all ${best.entries} entries classified as ${best.key}.`,
    })
  }

  const bestSport = pickBest(report.sportBreakdown, 20)
  if (bestSport && bestSport.roi > 5 && bestSport.key !== best.key) {
    checks.push('Sport-level ROI check')
    ev.push({
      label: `${bestSport.key} ROI`,
      value: `${bestSport.roi >= 0 ? '+' : ''}${bestSport.roi.toFixed(1)}%`,
      math: `Same ROI calculation restricted to entries whose sport is ${bestSport.key} (${bestSport.entries} entries).`,
    })
  }

  const bestBuyin = pickBest(report.buyinBreakdown, 20)
  if (bestBuyin && bestBuyin.roi > 5 && bestBuyin.key !== best.key) {
    checks.push('Buy-in tier check')
    ev.push({
      label: `${bestBuyin.key} ROI`,
      value: `${bestBuyin.roi >= 0 ? '+' : ''}${bestBuyin.roi.toFixed(1)}%`,
      math: `ROI calculation restricted to entries in the ${bestBuyin.key} buy-in tier (${bestBuyin.entries} entries).`,
    })
  }

  if (checks.length < 2) return null
  return {
    id: 'proven-edge',
    direction: 'protect',
    headline: `You have a real edge in ${best.key} — it's the part of your book worth protecting first.`,
    implication: `Your best segment is not a fluke. Multiple slices of the data — segment, sport, and buy-in tier — all point to the same conclusion.`,
    action: `Defend or gently expand volume in ${best.key} before making any other change.`,
    agreeingChecks: checks,
    evidence: ev,
  }
}

function findingAllocationLeak(report: AnalysisReport): Finding | null {
  const worst = pickWorstBucket(report)
  if (!worst || worst.roi >= -3) return null
  const checks: string[] = []
  const ev: Evidence[] = []

  if (worst.entries >= 20 && worst.roi < -5) {
    checks.push('Segment-level ROI check')
    ev.push({
      label: `${worst.key} ROI`,
      value: `${worst.roi.toFixed(1)}%`,
      math: `Sum of net across ${worst.entries} entries in ${worst.key} divided by sum of entry fees in the same segment.`,
    })
    ev.push({
      label: `${worst.key} net`,
      value: fmtMoney(worst.net),
      math: `Sum of (winnings − entry fee) across all ${worst.entries} entries in ${worst.key}.`,
    })
  }

  if (report.reallocation.hasData && report.reallocation.moves[0]) {
    checks.push('Reallocation check')
    const m = report.reallocation.moves[0]
    ev.push({
      label: 'Opportunity cost of current allocation',
      value: fmtMoney(m.swing),
      math: `Estimated by taking the fees currently deployed in ${m.fromSegment} (${fmtMoney(m.feesInSegment)}) and multiplying by the historical ROI of ${m.toSegment} (${m.toRoi.toFixed(1)}%), then subtracting what the losing segment actually netted.`,
    })
  }

  const bestMovePct = report.chess.strategicAccuracy.bestMovePct
  if (bestMovePct < 60) {
    checks.push('Capital-deployment check')
    ev.push({
      label: 'Share of fees on proven-positive segments',
      value: `${bestMovePct.toFixed(0)}%`,
      math: `Total entry fees deployed in segments that (a) have ≥ 30 entries and (b) have historical ROI > 0%, divided by total entry fees.`,
    })
  }

  if (checks.length < 2) return null
  return {
    id: 'allocation-leak',
    direction: 'reduce',
    headline: `Too much of your money is going where the record says you don't win.`,
    implication: `The losses are concentrated in a segment that multiple checks agree does not currently carry a positive expected return.`,
    action: `Cut ${worst.key} exposure by at least half until it clears zero over a larger sample.`,
    agreeingChecks: checks,
    evidence: ev,
  }
}

function findingConcentrationRisk(report: AnalysisReport): Finding | null {
  const b = report.bankroll
  const checks: string[] = []
  const ev: Evidence[] = []

  if (b.formatConcentrationPct > 45) {
    checks.push('Format-concentration check')
    ev.push({
      label: `Share of fees in ${b.concentratedFormat}`,
      value: `${b.formatConcentrationPct.toFixed(0)}%`,
      math: `Sum of entry fees in ${b.concentratedFormat} divided by sum of all entry fees, expressed as a percent.`,
    })
  }

  if (b.peakSlateExposurePct > 8) {
    checks.push('Single-slate exposure check')
    ev.push({
      label: 'Peak single-slate exposure',
      value: `${b.peakSlateExposurePct.toFixed(1)}%`,
      math: `The largest single day's entry fees divided by rolling bankroll on that day (rolling bankroll = starting bankroll + cumulative net up to that date).`,
    })
  }

  const cp = report.chess.criticalPosition
  if (cp.hasData && cp.drawdown > report.totalFees * 0.12) {
    checks.push('Drawdown check')
    ev.push({
      label: 'Worst peak-to-trough drawdown',
      value: fmtMoney(-cp.drawdown),
      math: `The largest negative difference between a peak in cumulative net (${fmtMoney(cp.peakNet)} on ${cp.peakDate}) and a subsequent trough (${fmtMoney(cp.troughNet)} on ${cp.troughDate}).`,
    })
  }

  if (checks.length < 2) return null
  return {
    id: 'concentration-risk',
    direction: 'reduce',
    headline: `The book is running with more risk than the results are paying you for.`,
    implication: `Concentration in one format and exposure on your biggest days are both large enough to turn a bad slate into a bad month.`,
    action: `Cap ${b.concentratedFormat} at ≤ 40% of monthly fees and ≤ 5% of bankroll on any single slate.`,
    agreeingChecks: checks,
    evidence: ev,
  }
}

function findingBehavioralTilt(report: AnalysisReport): Finding | null {
  const b = report.bankroll
  const c = report.chess.consistency
  const conv = report.chess.positionConversion
  const checks: string[] = []
  const ev: Evidence[] = []

  if (b.lossChasingPct > 15) {
    checks.push('Post-loss sizing check')
    ev.push({
      label: 'Entry-fee increase after a losing day',
      value: `+${b.lossChasingPct.toFixed(0)}%`,
      math: `Average day-over-day entry fee change on days that follow a losing day, minus the same average on days that follow a non-losing day.`,
    })
  }

  if (c.afterBigWinInflationPct > 20) {
    checks.push('Post-big-win sizing check')
    ev.push({
      label: 'Entry-fee increase after a top-decile winning day',
      value: `+${c.afterBigWinInflationPct.toFixed(0)}%`,
      math: `Average entry fee on days that follow a top-decile winning day, divided by the average entry fee on all other days, minus one.`,
    })
  }

  if (
    conv.hasData &&
    conv.coldStreakNextDayEntries >= 20 &&
    conv.coldStreakNextDayRoi - conv.baselineNextDayRoi < -5
  ) {
    checks.push('Cold-streak-recovery check')
    ev.push({
      label: 'ROI the day after 3+ losing days in a row',
      value: `${conv.coldStreakNextDayRoi.toFixed(1)}%`,
      math: `Average ROI on days that follow at least three consecutive losing days (${conv.coldStreakNextDayEntries} such days), compared to a baseline of ${conv.baselineNextDayRoi.toFixed(1)}% on non-streak days.`,
    })
  }

  if (checks.length < 2) return null
  return {
    id: 'behavioral-tilt',
    direction: 'stop',
    headline: `Your budget is being written by the last result, not by the plan.`,
    implication: `Sizing changes measurably after both wins and losses, and neither direction is supported by a corresponding lift in returns.`,
    action: `Set the weekly entry budget on a quiet day, in writing. Do not revise it mid-week for any reason.`,
    agreeingChecks: checks,
    evidence: ev,
  }
}

function findingSmallSampleTrap(report: AnalysisReport): Finding | null {
  const all = [
    ...report.contestTypeBreakdown,
    ...report.buyinBreakdown,
    ...report.sportBreakdown,
  ]
  const hot = all.find((b) => b.roi > 15 && b.entries < 25)
  if (!hot) return null
  const checks: string[] = ['Small-sample check']
  const ev: Evidence[] = [
    {
      label: `${hot.key} ROI`,
      value: `${hot.roi >= 0 ? '+' : ''}${hot.roi.toFixed(1)}%`,
      math: `ROI over only ${hot.entries} entries — a sample size at which random variance can produce a result this large by chance.`,
    },
  ]
  if (report.chess.overallConfidence.level === 'LOW') {
    checks.push('Overall confidence check')
    ev.push({
      label: 'Overall confidence in career ROI',
      value: 'LOW',
      math: `Standard error of the ROI mean is ${report.chess.overallConfidence.standardError.toFixed(1)} points on ${report.chess.overallConfidence.sampleSize} entries; the |mean|/SE ratio is ${report.chess.overallConfidence.zScore.toFixed(2)}, below the 2.0 threshold at which a signal separates from noise.`,
    })
  }
  if (checks.length < 2) return null
  return {
    id: 'small-sample-trap',
    direction: 'watch',
    headline: `The most exciting number in your file is also the least trustworthy one.`,
    implication: `A very high ROI on a small sample is not the same thing as an edge. Treat it as a candidate signal, not a proven one.`,
    action: `Do not up-fund ${hot.key} on the current number. Keep the sample growing before drawing any conclusion.`,
    agreeingChecks: checks,
    evidence: ev,
  }
}

function findingUnderfundedEdge(report: AnalysisReport): Finding | null {
  if (report.roi >= 0) return null
  const all = [
    ...report.contestTypeBreakdown,
    ...report.buyinBreakdown,
    ...report.sportBreakdown,
  ]
  const candidate = [...all]
    .filter((b) => b.roi > 3 && b.entries >= 50)
    .sort((x, y) => y.entries - x.entries)[0]
  if (!candidate) return null
  const shareOfFees = (candidate.fees / Math.max(1, report.totalFees)) * 100
  const checks: string[] = ['Positive-segment check']
  const ev: Evidence[] = [
    {
      label: `${candidate.key} ROI`,
      value: `${candidate.roi >= 0 ? '+' : ''}${candidate.roi.toFixed(1)}%`,
      math: `Positive ROI over ${candidate.entries} entries — enough sample to be treated as a real signal rather than variance.`,
    },
  ]
  if (shareOfFees < 25) {
    checks.push('Underfunding check')
    ev.push({
      label: `Share of total fees in ${candidate.key}`,
      value: `${shareOfFees.toFixed(0)}%`,
      math: `Entry fees deployed to ${candidate.key} (${fmtMoney(candidate.fees)}) divided by total entry fees (${fmtMoney(report.totalFees)}).`,
    })
  }
  if (report.roi < 0) {
    checks.push('Headline-vs-segment contrast check')
    ev.push({
      label: 'Overall ROI',
      value: `${report.roi.toFixed(1)}%`,
      math: `Total net (${fmtMoney(report.netProfit)}) divided by total fees (${fmtMoney(report.totalFees)}), expressed as a percent. The headline masks the positive segment above.`,
    })
  }
  if (checks.length < 2) return null
  return {
    id: 'underfunded-edge',
    direction: 'protect',
    headline: `The headline number is hiding a segment that's already working.`,
    implication: `An aggregated ROI in the red is masking a specific segment with a genuine, sample-supported positive return.`,
    action: `Grow ${candidate.key} until it becomes the largest line in the book, not a footnote.`,
    agreeingChecks: checks,
    evidence: ev,
  }
}

/* ============================================================
   Narrative — plain English, no invented composites.
   ============================================================ */

function buildWhatHappened(report: AnalysisReport, best: Bucket | null, worst: Bucket | null): string[] {
  const paras: string[] = []
  paras.push(
    `Across ${report.rowCount.toLocaleString()} entries between ${report.dateRange.start} and ${report.dateRange.end}, you deployed ${fmtMoney(report.totalFees)} in entry fees and finished at ${fmtMoney(report.netProfit)} net, an ROI of ${report.roi >= 0 ? '+' : ''}${report.roi.toFixed(1)}%.`,
  )
  if (best && worst && best.key !== worst.key) {
    paras.push(
      `The aggregate hides how uneven the story is. ${best.key} returned ${best.roi >= 0 ? '+' : ''}${best.roi.toFixed(1)}% over ${best.entries} entries; ${worst.key} returned ${worst.roi.toFixed(1)}% over ${worst.entries} entries. Same player, same period, very different outcomes.`,
    )
  }
  const cp = report.chess.criticalPosition
  if (cp.hasData && cp.drawdown > 0) {
    paras.push(
      `The single worst stretch cost ${fmtMoney(-cp.drawdown)}, from a peak on ${cp.peakDate} to a trough on ${cp.troughDate}. That number is the one worth sizing every future decision against.`,
    )
  }
  return paras
}

function buildWhyItHappened(report: AnalysisReport, best: Bucket | null, worst: Bucket | null): string[] {
  const paras: string[] = []
  const b = report.bankroll

  if (worst && worst.roi < -5 && best && best.roi > 3) {
    paras.push(
      `The single biggest reason your results look the way they do is not lineup quality — it's where the money is going. Profitable segments are quietly financing unprofitable ones, and the aggregate ROI reflects that subsidy, not your best decisions.`,
    )
  } else if (b.formatConcentrationPct > 50) {
    paras.push(
      `The book's results are being driven by one format: ${b.concentratedFormat} carries ${b.formatConcentrationPct.toFixed(0)}% of your fees. When one line item is that large, its variance overwhelms every other reported number.`,
    )
  } else {
    paras.push(
      `There is no single dominant cause. Instead, the file shows a series of small allocation misses accumulating into a bigger one over time.`,
    )
  }

  if (b.lossChasingPct > 15 || report.chess.consistency.afterBigWinInflationPct > 20) {
    paras.push(
      `Behavioral signals reinforce the pattern. Entries sized up by roughly ${b.lossChasingPct.toFixed(0)}% the day after a losing session and ${report.chess.consistency.afterBigWinInflationPct.toFixed(0)}% the day after a top-decile winning session. In both directions, the budget was written by the last result rather than by the plan.`,
    )
  }

  return paras
}

function buildWhatToDoNext(
  report: AnalysisReport,
  hc: Finding[],
  best: Bucket | null,
  worst: Bucket | null,
): string[] {
  // Actions come primarily from the highest-confidence findings, ordered
  // by their agreement count. Fill with defaults if fewer than three fire.
  const seen = new Set<string>()
  const actions: string[] = []
  for (const f of hc) {
    if (seen.has(f.action)) continue
    seen.add(f.action)
    actions.push(f.action)
  }
  if (actions.length < 3 && best) {
    actions.push(`Protect ${best.key} at its current volume for the next 30 days. Do not experiment with new buy-in tiers inside this segment.`)
  }
  if (actions.length < 3 && worst && worst.roi < 0) {
    actions.push(`Reduce ${worst.key} exposure to a token allocation until a larger sample proves an edge.`)
  }
  actions.push('Upload the next 30 days of data at the end of the month and re-run the review. Follow-through, not the current numbers, is what tells you whether anything changed.')
  return actions.slice(0, 5)
}

function buildBottomLine(report: AnalysisReport, best: Bucket | null, worst: Bucket | null): string {
  if (best && worst && best.roi > 5 && worst.roi < -5) {
    return `You do not have a lineup-quality problem. You have an allocation problem — and allocation problems are the easiest kind to fix.`
  }
  if (report.roi >= 5) {
    return `The book is genuinely working. The priority now shifts from finding edge to defending it.`
  }
  if (report.roi >= 0) {
    return `Results are close to break-even. The path forward runs through discipline, not discovery.`
  }
  return `The losses are traceable. That is good news: what is traceable is fixable.`
}

/* ============================================================
   Helpers
   ============================================================ */

function pickBest(buckets: Bucket[], minEntries: number): Bucket | null {
  const eligible = buckets.filter((b) => b.entries >= minEntries)
  if (!eligible.length) return null
  return [...eligible].sort((a, b) => b.roi - a.roi)[0]
}

function pickBestBucket(report: AnalysisReport): Bucket | null {
  const all = [
    ...report.contestTypeBreakdown,
    ...report.buyinBreakdown,
    ...report.sportBreakdown,
  ].filter((b) => b.entries >= 20)
  if (!all.length) return null
  return [...all].sort((a, b) => b.roi - a.roi)[0]
}

function pickWorstBucket(report: AnalysisReport): Bucket | null {
  const all = [
    ...report.contestTypeBreakdown,
    ...report.buyinBreakdown,
    ...report.sportBreakdown,
  ].filter((b) => b.entries >= 20)
  if (!all.length) return null
  return [...all].sort((a, b) => a.roi - b.roi)[0]
}

export const directionLabel: Record<FindingDirection, string> = {
  protect: 'PROTECT',
  reduce: 'REDUCE',
  stop: 'STOP',
  watch: 'WATCH',
}
