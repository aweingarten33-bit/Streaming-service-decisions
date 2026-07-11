/**
 * Chess Grandmaster metrics.
 * -------------------------------------------------------------------
 * Every function in this file is PURE MATH over ContestRow[].
 * The AI layer never runs calculations; it only narrates these numbers.
 * If a number appears in the Chess Grandmaster report, it comes from here.
 */
import type {
  AccuracyBand,
  Bucket,
  CandidateMove,
  ChessMetrics,
  ConditionalSplit,
  ConfidenceRead,
  ContestRow,
  CriticalPosition,
  HiddenInteraction,
  PhaseSplit,
  PositionConversion,
  StrategicAccuracy,
  StrategicConsistency,
  VarianceAttribution,
} from './types'

/* ---------- generic helpers ---------- */

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0
}
function stddev(xs: number[]): number {
  if (xs.length < 2) return 0
  const m = mean(xs)
  const v = xs.reduce((s, x) => s + (x - m) * (x - m), 0) / (xs.length - 1)
  return Math.sqrt(v)
}
function roiPct(net: number, fees: number): number {
  return fees > 0 ? (net / fees) * 100 : 0
}

/** Confidence read on a set of per-entry ROI observations. */
export function confidenceOf(rows: ContestRow[]): ConfidenceRead {
  const perEntryRoi = rows
    .filter((r) => r.entryFee > 0)
    .map((r) => (r.net / r.entryFee) * 100)
  const n = perEntryRoi.length
  if (n < 2) return { level: 'LOW', sampleSize: n, standardError: 0, zScore: 0 }
  const m = mean(perEntryRoi)
  const se = stddev(perEntryRoi) / Math.sqrt(n)
  const z = se > 0 ? Math.abs(m) / se : 0
  const level: ConfidenceRead['level'] =
    n >= 100 && z >= 2 ? 'HIGH' : n >= 30 && z >= 1.5 ? 'MEDIUM' : 'LOW'
  return { level, sampleSize: n, standardError: se, zScore: z }
}

/* ---------- daily cumulative series ---------- */

interface DayPoint {
  day: string
  net: number
  fees: number
  entries: number
  cashed: number
  cum: number
}

function dailySeries(rows: ContestRow[]): DayPoint[] {
  const map = new Map<string, DayPoint>()
  for (const r of rows) {
    if (!r.date) continue
    const day = r.date.slice(0, 10)
    const pt = map.get(day) ?? { day, net: 0, fees: 0, entries: 0, cashed: 0, cum: 0 }
    pt.net += r.net
    pt.fees += r.entryFee
    pt.entries += 1
    if (r.cashed) pt.cashed += 1
    map.set(day, pt)
  }
  const days = [...map.values()].sort((a, b) => a.day.localeCompare(b.day))
  let c = 0
  for (const d of days) {
    c += d.net
    d.cum = c
  }
  return days
}

/* ---------- critical position ---------- */

function computeCriticalPosition(days: DayPoint[]): CriticalPosition {
  if (days.length < 5) {
    return {
      hasData: false,
      peakDate: '—',
      peakNet: 0,
      troughDate: '—',
      troughNet: 0,
      drawdown: 0,
      daysToTrough: 0,
      worstWeekLabel: '—',
      worstWeekNet: 0,
      worstWeekEntries: 0,
    }
  }
  // Find the peak-to-trough drawdown after that peak (classic MDD walk).
  let peakIdx = 0
  let peakVal = days[0].cum
  let bestPeakIdx = 0
  let bestTroughIdx = 0
  let bestDrawdown = 0
  for (let i = 0; i < days.length; i++) {
    if (days[i].cum > peakVal) {
      peakVal = days[i].cum
      peakIdx = i
    }
    const dd = peakVal - days[i].cum
    if (dd > bestDrawdown) {
      bestDrawdown = dd
      bestPeakIdx = peakIdx
      bestTroughIdx = i
    }
  }
  const peak = days[bestPeakIdx]
  const trough = days[bestTroughIdx]

  // Worst calendar week (ISO-ish: bucket by yyyy-Www using UTC).
  const weekMap = new Map<string, { net: number; entries: number }>()
  for (const d of days) {
    const dt = new Date(d.day + 'T00:00:00Z')
    const onejan = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1))
    const week = Math.ceil(((dt.getTime() - onejan.getTime()) / 86400000 + onejan.getUTCDay() + 1) / 7)
    const key = `${dt.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
    const w = weekMap.get(key) ?? { net: 0, entries: 0 }
    w.net += d.net
    w.entries += d.entries
    weekMap.set(key, w)
  }
  const weeks = [...weekMap.entries()].sort((a, b) => a[1].net - b[1].net)
  const worst = weeks[0]

  return {
    hasData: true,
    peakDate: peak.day,
    peakNet: peak.cum,
    troughDate: trough.day,
    troughNet: trough.cum,
    drawdown: Math.max(0, bestDrawdown),
    daysToTrough: bestTroughIdx - bestPeakIdx,
    worstWeekLabel: worst?.[0] ?? '—',
    worstWeekNet: worst?.[1].net ?? 0,
    worstWeekEntries: worst?.[1].entries ?? 0,
  }
}

/* ---------- strategic accuracy ---------- */

// Chess-style move quality. We classify every dollar of fees by the ROI of the
// bucket it landed in (sport × contest class × entry type × buy-in band).
// Only cells with real sample (>= MIN_CELL) get graded; the rest are "unknown"
// and excluded from the score's denominator.
const MIN_CELL = 8

function classifyByCells(rows: ContestRow[]): StrategicAccuracy {
  const cells = new Map<string, ContestRow[]>()
  for (const r of rows) {
    const key = `${r.sport}|${r.contestClass}|${r.entryType}|${r.buyinBand}`
    if (!cells.has(key)) cells.set(key, [])
    cells.get(key)!.push(r)
  }
  const cellStats = new Map<string, { fees: number; net: number; roi: number; n: number }>()
  for (const [k, list] of cells) {
    const fees = list.reduce((s, r) => s + r.entryFee, 0)
    const net = list.reduce((s, r) => s + r.net, 0)
    cellStats.set(k, { fees, net, roi: roiPct(net, fees), n: list.length })
  }
  const bands = { best: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
  const bandDollars = { best: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
  const bandNet = { best: 0, inaccuracy: 0, mistake: 0, blunder: 0 }
  let totalClassifiedFees = 0
  let totalClassifiedEntries = 0
  for (const r of rows) {
    const key = `${r.sport}|${r.contestClass}|${r.entryType}|${r.buyinBand}`
    const cs = cellStats.get(key)
    if (!cs || cs.n < MIN_CELL) continue
    totalClassifiedFees += r.entryFee
    totalClassifiedEntries += 1
    let band: keyof typeof bands
    if (cs.roi >= 0) band = 'best'
    else if (cs.roi >= -15) band = 'inaccuracy'
    else if (cs.roi >= -40) band = 'mistake'
    else band = 'blunder'
    bands[band] += 1
    bandDollars[band] += r.entryFee
    bandNet[band] += r.net
  }
  const bestMovePct = totalClassifiedFees > 0 ? (bandDollars.best / totalClassifiedFees) * 100 : 0
  // Weighted move-quality score (chess-style): best=100, inacc=70, mistake=35, blunder=0.
  const score = totalClassifiedFees > 0
    ? (bandDollars.best * 100 +
        bandDollars.inaccuracy * 70 +
        bandDollars.mistake * 35 +
        bandDollars.blunder * 0) /
      totalClassifiedFees
    : 0
  const out: StrategicAccuracy = {
    score,
    bestMovePct,
    totalClassified: totalClassifiedEntries,
    bands: [
      { label: 'Best Move', entries: bands.best, fees: bandDollars.best, net: bandNet.best, share: pct(bandDollars.best, totalClassifiedFees) },
      { label: 'Inaccuracy', entries: bands.inaccuracy, fees: bandDollars.inaccuracy, net: bandNet.inaccuracy, share: pct(bandDollars.inaccuracy, totalClassifiedFees) },
      { label: 'Mistake', entries: bands.mistake, fees: bandDollars.mistake, net: bandNet.mistake, share: pct(bandDollars.mistake, totalClassifiedFees) },
      { label: 'Blunder', entries: bands.blunder, fees: bandDollars.blunder, net: bandNet.blunder, share: pct(bandDollars.blunder, totalClassifiedFees) },
    ] as AccuracyBand[],
  }
  return out
}
function pct(a: number, b: number): number {
  return b > 0 ? (a / b) * 100 : 0
}

/* ---------- candidate moves ---------- */

// For each losing cell with real volume, propose the top winning cell as the
// "stronger alternative" and quantify the EV gap on that segment's fees.
function computeCandidateMoves(rows: ContestRow[]): CandidateMove[] {
  const cells = new Map<string, ContestRow[]>()
  for (const r of rows) {
    const key = `${r.buyinBand} ${r.contestClass} ${r.entryType} · ${r.sport}`
    if (!cells.has(key)) cells.set(key, [])
    cells.get(key)!.push(r)
  }
  const stats = [...cells.entries()].map(([k, list]) => {
    const fees = list.reduce((s, r) => s + r.entryFee, 0)
    const net = list.reduce((s, r) => s + r.net, 0)
    return { key: k, fees, net, roi: roiPct(net, fees), n: list.length }
  })
  const winners = stats.filter((s) => s.n >= MIN_CELL && s.roi > 0).sort((a, b) => b.roi - a.roi)
  const losers = stats.filter((s) => s.n >= MIN_CELL && s.roi < 0).sort((a, b) => a.net - b.net)
  const alt = winners[0]
  if (!alt) return []
  return losers.slice(0, 4).map((l) => ({
    situation: l.key,
    historicalRoi: l.roi,
    historicalEntries: l.n,
    historicalNet: l.net,
    alternative: alt.key,
    alternativeRoi: Math.min(alt.roi, 25), // cap for credibility
    evGap: Math.min(alt.roi, 25) - l.roi,
    dollarSwing: (l.fees * (Math.min(alt.roi, 25) - l.roi)) / 100,
  }))
}

/* ---------- phases (opening / middlegame / endgame) ---------- */

function computePhases(days: DayPoint[]): PhaseSplit[] {
  if (days.length < 3) return []
  const third = Math.floor(days.length / 3)
  const slices: [PhaseSplit['phase'], DayPoint[]][] = [
    ['Opening', days.slice(0, third)],
    ['Middlegame', days.slice(third, third * 2)],
    ['Endgame', days.slice(third * 2)],
  ]
  return slices.map(([phase, ds]) => {
    const entries = ds.reduce((s, d) => s + d.entries, 0)
    const fees = ds.reduce((s, d) => s + d.fees, 0)
    const net = ds.reduce((s, d) => s + d.net, 0)
    return { phase, entries, fees, net, roi: roiPct(net, fees) }
  })
}

/* ---------- conditional splits ---------- */

function computeConditionalSplits(rows: ContestRow[], days: DayPoint[], baselineRoi: number): ConditionalSplit[] {
  const out: ConditionalSplit[] = []
  if (days.length < 6) return out

  // Days that follow N consecutive losing days.
  function afterStreak(dir: 'loss' | 'win', minLen: number): ContestRow[] {
    const targetDays = new Set<string>()
    let streak = 0
    for (let i = 0; i < days.length; i++) {
      const isLoss = days[i].net < 0
      const match = dir === 'loss' ? isLoss : !isLoss && days[i].net > 0
      if (match) streak += 1
      else {
        if (streak >= minLen && i < days.length) targetDays.add(days[i].day)
        streak = 0
      }
      if (streak >= minLen && i + 1 < days.length) targetDays.add(days[i + 1].day)
    }
    return rows.filter((r) => r.date && targetDays.has(r.date.slice(0, 10)))
  }

  const afterLosses = afterStreak('loss', 3)
  if (afterLosses.length >= 10) {
    const fees = afterLosses.reduce((s, r) => s + r.entryFee, 0)
    const net = afterLosses.reduce((s, r) => s + r.net, 0)
    const roi = roiPct(net, fees)
    out.push({
      condition: 'Sessions following a 3+ losing-day streak',
      entries: afterLosses.length,
      fees,
      net,
      roi,
      vsBaselineRoiDelta: roi - baselineRoi,
      confidence: confidenceOf(afterLosses),
    })
  }

  const afterWins = afterStreak('win', 3)
  if (afterWins.length >= 10) {
    const fees = afterWins.reduce((s, r) => s + r.entryFee, 0)
    const net = afterWins.reduce((s, r) => s + r.net, 0)
    const roi = roiPct(net, fees)
    out.push({
      condition: 'Sessions following a 3+ winning-day streak',
      entries: afterWins.length,
      fees,
      net,
      roi,
      vsBaselineRoiDelta: roi - baselineRoi,
      confidence: confidenceOf(afterWins),
    })
  }

  // High-volatility weeks: entry-fee day is top-quintile.
  const feeThreshold = quantile(days.map((d) => d.fees), 0.8)
  const highVolDays = new Set(days.filter((d) => d.fees >= feeThreshold).map((d) => d.day))
  const highVolRows = rows.filter((r) => r.date && highVolDays.has(r.date.slice(0, 10)))
  if (highVolRows.length >= 20) {
    const fees = highVolRows.reduce((s, r) => s + r.entryFee, 0)
    const net = highVolRows.reduce((s, r) => s + r.net, 0)
    const roi = roiPct(net, fees)
    out.push({
      condition: 'Top-quintile volume days ("heavy slates")',
      entries: highVolRows.length,
      fees,
      net,
      roi,
      vsBaselineRoiDelta: roi - baselineRoi,
      confidence: confidenceOf(highVolRows),
    })
  }

  // Weekend vs weekday.
  const weekendRows = rows.filter((r) => {
    if (!r.date) return false
    const d = new Date(r.date).getUTCDay()
    return d === 0 || d === 6
  })
  if (weekendRows.length >= 20) {
    const fees = weekendRows.reduce((s, r) => s + r.entryFee, 0)
    const net = weekendRows.reduce((s, r) => s + r.net, 0)
    const roi = roiPct(net, fees)
    out.push({
      condition: 'Weekend contests (Sat/Sun)',
      entries: weekendRows.length,
      fees,
      net,
      roi,
      vsBaselineRoiDelta: roi - baselineRoi,
      confidence: confidenceOf(weekendRows),
    })
  }

  return out
}

function quantile(xs: number[], q: number): number {
  if (!xs.length) return 0
  const sorted = [...xs].sort((a, b) => a - b)
  const idx = Math.min(sorted.length - 1, Math.floor(q * sorted.length))
  return sorted[idx]
}

/* ---------- position conversion ---------- */

function computeConversion(days: DayPoint[]): PositionConversion {
  if (days.length < 8) {
    return {
      hotStreakNextDayRoi: 0,
      hotStreakNextDayEntries: 0,
      coldStreakNextDayRoi: 0,
      coldStreakNextDayEntries: 0,
      baselineNextDayRoi: 0,
      hasData: false,
    }
  }
  let hotFees = 0, hotNet = 0, hotEntries = 0
  let coldFees = 0, coldNet = 0, coldEntries = 0
  let baseFees = 0, baseNet = 0
  let winRun = 0, lossRun = 0
  for (let i = 0; i < days.length; i++) {
    if (i > 0) {
      if (winRun >= 3) {
        hotFees += days[i].fees; hotNet += days[i].net; hotEntries += days[i].entries
      } else if (lossRun >= 3) {
        coldFees += days[i].fees; coldNet += days[i].net; coldEntries += days[i].entries
      } else {
        baseFees += days[i].fees; baseNet += days[i].net
      }
    }
    if (days[i].net > 0) { winRun += 1; lossRun = 0 }
    else if (days[i].net < 0) { lossRun += 1; winRun = 0 }
    else { winRun = 0; lossRun = 0 }
  }
  return {
    hotStreakNextDayRoi: roiPct(hotNet, hotFees),
    hotStreakNextDayEntries: hotEntries,
    coldStreakNextDayRoi: roiPct(coldNet, coldFees),
    coldStreakNextDayEntries: coldEntries,
    baselineNextDayRoi: roiPct(baseNet, baseFees),
    hasData: hotEntries + coldEntries > 0,
  }
}

/* ---------- hidden interactions ---------- */

function computeHiddenInteractions(
  rows: ContestRow[],
  sportB: Bucket[],
  buyinB: Bucket[],
  entryB: Bucket[],
): HiddenInteraction[] {
  const roiFor = (bs: Bucket[], k: string) => bs.find((b) => b.key === k)?.roi ?? 0
  const cells = new Map<string, ContestRow[]>()
  for (const r of rows) {
    const key = `${r.sport} × ${r.entryType} × ${r.buyinBand}`
    if (!cells.has(key)) cells.set(key, [])
    cells.get(key)!.push(r)
  }
  const results: HiddenInteraction[] = []
  for (const [k, list] of cells) {
    if (list.length < 10) continue
    const fees = list.reduce((s, r) => s + r.entryFee, 0)
    const net = list.reduce((s, r) => s + r.net, 0)
    const roi = roiPct(net, fees)
    const [sport, entryType, buyin] = k.split(' × ')
    const expected = (roiFor(sportB, sport) + roiFor(entryB, entryType) + roiFor(buyinB, buyin)) / 3
    results.push({
      cell: k,
      entries: list.length,
      fees,
      net,
      roi,
      expectedRoi: expected,
      interactionRoi: roi - expected,
    })
  }
  // Top surprises by absolute interaction magnitude.
  return results
    .sort((a, b) => Math.abs(b.interactionRoi) - Math.abs(a.interactionRoi))
    .slice(0, 5)
}

/* ---------- variance attribution ---------- */

function computeVariance(rows: ContestRow[]): VarianceAttribution {
  // "Structural" = losses in cells whose ROI is negative AND confidence >= MEDIUM.
  // "Variance"    = the remainder of net losses.
  const cells = new Map<string, ContestRow[]>()
  for (const r of rows) {
    const key = `${r.sport}|${r.contestClass}|${r.entryType}|${r.buyinBand}`
    if (!cells.has(key)) cells.set(key, [])
    cells.get(key)!.push(r)
  }
  let structural = 0
  let totalLoss = 0
  for (const list of cells.values()) {
    const fees = list.reduce((s, r) => s + r.entryFee, 0)
    const net = list.reduce((s, r) => s + r.net, 0)
    if (net < 0) totalLoss += net
    if (net < 0 && list.length >= 20) {
      const conf = confidenceOf(list)
      if (conf.level !== 'LOW') structural += net
    }
  }
  const variance = totalLoss - structural
  const totalMag = Math.abs(totalLoss) || 1
  return {
    structuralLossDollars: Math.abs(structural),
    varianceLossDollars: Math.max(0, Math.abs(variance)),
    structuralSharePct: (Math.abs(structural) / totalMag) * 100,
  }
}

/* ---------- strategic consistency ---------- */

function computeConsistency(days: DayPoint[]): StrategicConsistency {
  if (days.length < 5) {
    return { dailyFeeCv: 0, afterBigWinInflationPct: 0, afterBigLossInflationPct: 0, score: 50 }
  }
  const fees = days.map((d) => d.fees)
  const cv = mean(fees) > 0 ? stddev(fees) / mean(fees) : 0
  const netSorted = [...days].map((d) => d.net).sort((a, b) => a - b)
  const bigLossThreshold = netSorted[Math.floor(netSorted.length * 0.1)]
  const bigWinThreshold = netSorted[Math.floor(netSorted.length * 0.9)]
  let afterLossFees: number[] = []
  let afterWinFees: number[] = []
  let baselineFees: number[] = []
  for (let i = 1; i < days.length; i++) {
    const prev = days[i - 1].net
    if (prev <= bigLossThreshold) afterLossFees.push(days[i].fees)
    else if (prev >= bigWinThreshold) afterWinFees.push(days[i].fees)
    else baselineFees.push(days[i].fees)
  }
  const base = mean(baselineFees) || 1
  const afterLossInfl = ((mean(afterLossFees) - base) / base) * 100
  const afterWinInfl = ((mean(afterWinFees) - base) / base) * 100
  // Score: lower CV + smaller |infl| = higher score.
  const cvPenalty = Math.min(50, cv * 40)
  const inflPenalty = Math.min(30, (Math.abs(afterLossInfl) + Math.abs(afterWinInfl)) / 10)
  const score = Math.max(0, Math.min(100, 100 - cvPenalty - inflPenalty))
  return {
    dailyFeeCv: cv,
    afterBigWinInflationPct: Number.isFinite(afterWinInfl) ? afterWinInfl : 0,
    afterBigLossInflationPct: Number.isFinite(afterLossInfl) ? afterLossInfl : 0,
    score,
  }
}

/* ---------- main entry ---------- */

export function computeChess(
  rows: ContestRow[],
  sportBreakdown: Bucket[],
  buyinBreakdown: Bucket[],
  entryTypeBreakdown: Bucket[],
  overallRoi: number,
): ChessMetrics {
  const days = dailySeries(rows)
  return {
    criticalPosition: computeCriticalPosition(days),
    strategicAccuracy: classifyByCells(rows),
    candidateMoves: computeCandidateMoves(rows),
    phases: computePhases(days),
    conditionalSplits: computeConditionalSplits(rows, days, overallRoi),
    positionConversion: computeConversion(days),
    hiddenInteractions: computeHiddenInteractions(rows, sportBreakdown, buyinBreakdown, entryTypeBreakdown),
    varianceAttribution: computeVariance(rows),
    consistency: computeConsistency(days),
    overallConfidence: confidenceOf(rows),
  }
}