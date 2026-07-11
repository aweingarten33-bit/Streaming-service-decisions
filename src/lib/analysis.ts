import type {
  ActionStep,
  AnalysisReport,
  BankrollMetrics,
  Bucket,
  ContestRow,
  DisciplineScore,
  Finding,
  GlossaryTerm,
  Leak,
  PhasedRecommendation,
  Platform,
  Reallocation,
  ReallocationMove,
  ScorecardMetric,
  TrendPoint,
} from './types'
import { computeChess } from './chess-metrics'

/* ---------- header-name tolerant matching ---------- */

const HEADER_ALIASES: Record<string, string[]> = {
  sport: ['sport'],
  contestName: ['entry', 'contest_name', 'contestname', 'title', 'contest', 'entry name'],
  date: ['contest_date_est', 'contest_date', 'date', 'entry date'],
  entryFee: ['entry_fee', 'entry ($)', 'entry', 'entryfee', 'entry fee', 'buyin', 'buy_in'],
  winningsNonTicket: ['winnings_non_ticket', 'winnings ($)', 'winnings', 'payout', 'winnings_non'],
  winningsTicket: ['winnings_ticket'],
  gameType: ['game_type', 'gametype', 'game type'],
  contestEntries: ['contest_entries', 'entries', 'field_size', 'field size', 'contestentries'],
  place: ['place', 'places', 'position', 'rank', 'finish'],
  points: ['points', 'score', 'fpts'],
  prizePool: ['prize_pool', 'prizepool', 'prize pool', 'prizes'],
  contestKey: ['contest_key', 'contestkey', 'contest id', 'contestid'],
  entryKey: ['entry_key', 'entrykey', 'entry id', 'entryid'],
}

function normalize(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function autoMapHeaders(headers: string[]): Record<string, string | null> {
  const map: Record<string, string | null> = {}
  const normalized = headers.map((h) => ({ raw: h, norm: normalize(h) }))
  // A column may only be claimed by ONE field. Without this, a DraftKings file
  // whose contest column is literally named "Entry" gets that column claimed by
  // both contestName AND entryKey — and the entry-key dedup then silently
  // deletes legitimate rows. Claim order follows HEADER_ALIASES insertion order,
  // and contestName is defined before entryKey, so the name wins as intended.
  const claimed = new Set<string>()

  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    let found: string | null = null

    // 1) exact alias match on an unclaimed column
    for (const alias of aliases) {
      const hit = normalized.find((n) => n.norm === alias && !claimed.has(n.raw))
      if (hit) {
        found = hit.raw
        break
      }
    }

    // 2) fuzzy contains — but only header-CONTAINS-alias (e.g. "Entry Fee ($)"
    //    contains "entry fee"). We deliberately do NOT do alias-contains-header,
    //    which was letting "entry id" swallow a bare "Entry" column. Require the
    //    alias to be at least 4 chars so short tokens can't over-match.
    if (!found) {
      for (const alias of aliases) {
        if (alias.length < 4) continue
        const hit = normalized.find((n) => !claimed.has(n.raw) && n.norm.includes(alias))
        if (hit) {
          found = hit.raw
          break
        }
      }
    }

    if (found) claimed.add(found)
    map[field] = found
  }
  return map
}

/* ---------- value cleaners ---------- */

export function toNumber(v: unknown): number {
  if (v == null) return 0
  const s = String(v)
    .replace(/[$,]/g, '')
    .replace(/[()]/g, (m) => (m === '(' ? '-' : '')) // (5.00) => -5.00
    .trim()
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

/* ---------- derivations ---------- */

export function classifyContest(name: string, gameType?: string): 'CASH' | 'GPP' | 'UNKNOWN' {
  const s = `${name} ${gameType ?? ''}`.toLowerCase()
  if (/50\/50|double up|double-up|multiplier|head.?to.?head|h2h|satellite|qualifier|cash game/.test(s))
    return 'CASH'
  if (/gpp|tournament|millionaire|milly|guaranteed|\$?\d[\d,]*k?\s*(gtd|guaranteed)|showdown|slam|special/.test(s))
    return 'GPP'
  return 'UNKNOWN'
}

export function classifyEntryType(
  name: string,
  contestKeyCount: number,
): 'SINGLE' | '3-MAX' | '20-MAX' | 'MME' | 'UNKNOWN' {
  const s = name.toLowerCase()
  if (/single entry|single-entry|\[single\]/.test(s)) return 'SINGLE'
  if (/3-?max|3 max/.test(s)) return '3-MAX'
  if (/20-?max|20 max/.test(s)) return '20-MAX'
  if (/150-?max|mme|multi-entry|multi entry|\d{2,3}-?max/.test(s)) return 'MME'
  // secondary signal from duplicate contest keys
  if (contestKeyCount >= 20) return 'MME'
  if (contestKeyCount >= 4) return '20-MAX'
  if (contestKeyCount >= 2) return '3-MAX'
  if (contestKeyCount === 1) return 'SINGLE'
  return 'UNKNOWN'
}

export function buyinBand(fee: number): string {
  if (fee < 1) return '<$1'
  if (fee <= 5) return '$1–5'
  if (fee <= 25) return '$5–25'
  if (fee <= 100) return '$25–100'
  return '$100+'
}

const BAND_ORDER = ['<$1', '$1–5', '$5–25', '$25–100', '$100+']

/* ---------- row building ---------- */

export function buildRows(
  raw: Record<string, string>[],
  map: Record<string, string | null>,
): ContestRow[] {
  // first pass: contest key counts
  const keyCounts = new Map<string, number>()
  for (const r of raw) {
    const key = map.contestKey ? r[map.contestKey] : undefined
    if (key) keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1)
  }

  const rows: ContestRow[] = []
  const seenEntry = new Set<string>()

  for (const r of raw) {
    const contestName = map.contestName ? (r[map.contestName] ?? '') : ''
    const feeRaw = map.entryFee ? r[map.entryFee] : '0'
    const entryFee = toNumber(feeRaw)
    // skip rows with no meaningful data
    if (!contestName && !entryFee) continue

    const entryKey = map.entryKey ? r[map.entryKey] : undefined
    if (entryKey) {
      if (seenEntry.has(entryKey)) continue
      seenEntry.add(entryKey)
    }

    const winNon = map.winningsNonTicket ? toNumber(r[map.winningsNonTicket]) : 0
    const winTicket = map.winningsTicket ? toNumber(r[map.winningsTicket]) : 0
    const winnings = winNon + winTicket

    const dateRaw = map.date ? r[map.date] : ''
    const parsedDate = dateRaw ? new Date(dateRaw) : new Date(NaN)
    const iso = isNaN(parsedDate.getTime()) ? '' : parsedDate.toISOString()

    const contestKey = map.contestKey ? r[map.contestKey] : undefined
    const keyCount = contestKey ? (keyCounts.get(contestKey) ?? 1) : 0
    const gameType = map.gameType ? r[map.gameType] : undefined

    rows.push({
      sport: (map.sport ? r[map.sport] : 'UNKNOWN')?.toUpperCase() || 'UNKNOWN',
      contestName,
      date: iso,
      entryFee,
      winnings,
      gameType,
      contestEntries: map.contestEntries ? toNumber(r[map.contestEntries]) : undefined,
      place: map.place ? toNumber(r[map.place]) : undefined,
      points: map.points ? toNumber(r[map.points]) : undefined,
      prizePool: map.prizePool ? toNumber(r[map.prizePool]) : undefined,
      contestKey,
      entryKey,
      contestClass: classifyContest(contestName, gameType),
      entryType: classifyEntryType(contestName, keyCount),
      buyinBand: buyinBand(entryFee),
      net: winnings - entryFee,
      cashed: winnings > 0,
    })
  }
  return rows
}

/* ---------- bucket aggregation ---------- */

function aggregate(rows: ContestRow[], keyFn: (r: ContestRow) => string): Bucket[] {
  const groups = new Map<string, ContestRow[]>()
  for (const r of rows) {
    const k = keyFn(r)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(r)
  }
  const buckets: Bucket[] = []
  for (const [key, list] of groups) {
    const fees = list.reduce((s, r) => s + r.entryFee, 0)
    const winnings = list.reduce((s, r) => s + r.winnings, 0)
    const net = winnings - fees
    const wins = list.filter((r) => r.cashed).length
    buckets.push({
      key,
      entries: list.length,
      fees,
      winnings,
      net,
      roi: fees > 0 ? (net / fees) * 100 : 0,
      winRate: list.length ? (wins / list.length) * 100 : 0,
      smallSample: list.length < 20,
    })
  }
  return buckets
}

/* ---------- leaks + action plan ---------- */

function buildLeaks(
  sportB: Bucket[],
  ctB: Bucket[],
  buyinB: Bucket[],
  entryB: Bucket[],
  bankroll: BankrollMetrics,
): Leak[] {
  const leaks: Leak[] = []
  const meaningful = (b: Bucket) => b.entries >= 15

  // worst buy-in band with real volume
  const worstBand = [...buyinB]
    .filter(meaningful)
    .filter((b) => b.net < 0)
    .sort((a, b) => a.net - b.net)[0]
  if (worstBand) {
    leaks.push({
      id: 'buyin',
      title: `You bleed money in the ${worstBand.key} buy-in range`,
      severity: worstBand.net < -300 ? 'CRITICAL' : 'HIGH',
      data: `${worstBand.roi.toFixed(1)}% ROI over ${worstBand.entries} entries — net ${fmtMoney(
        worstBand.net,
      )} on ${fmtMoney(worstBand.fees)} risked.`,
      fix: `Cut ${worstBand.key} entries until you rebuild an edge. Redeploy that bankroll into the bands where you are green.`,
      metric: worstBand.net,
    })
  }

  // worst contest type
  const worstCt = [...ctB]
    .filter(meaningful)
    .filter((b) => b.net < 0)
    .sort((a, b) => a.net - b.net)[0]
  if (worstCt) {
    leaks.push({
      id: 'contesttype',
      title: `${titleCase(worstCt.key)} contests are draining your roll`,
      severity: worstCt.net < -400 ? 'CRITICAL' : 'HIGH',
      data: `${worstCt.roi.toFixed(1)}% ROI across ${worstCt.entries} ${titleCase(
        worstCt.key,
      )} entries — net ${fmtMoney(worstCt.net)}.`,
      fix:
        worstCt.key === 'GPP'
          ? 'Large-field GPPs punish under-rolled players. Shift volume toward cash/single-entry until your win rate stabilizes.'
          : 'Reassess your cash-game process — cash ROI is your truest skill signal and it is negative.',
      metric: worstCt.net,
    })
  }

  // worst entry type (MME)
  const worstEntry = [...entryB]
    .filter(meaningful)
    .filter((b) => b.net < 0 && b.key !== 'UNKNOWN')
    .sort((a, b) => a.net - b.net)[0]
  if (worstEntry) {
    leaks.push({
      id: 'entrytype',
      title: `${worstEntry.key} formats are above your pay grade`,
      severity: 'HIGH',
      data: `${worstEntry.roi.toFixed(1)}% ROI over ${worstEntry.entries} ${worstEntry.key} entries — net ${fmtMoney(
        worstEntry.net,
      )}. Pros with 150-lineup portfolios have a structural edge here.`,
      fix: `Drop ${worstEntry.key} until your single-entry ROI is consistently positive. You cannot out-volume the sharks.`,
      metric: worstEntry.net,
    })
  }

  // worst sport
  const worstSport = [...sportB]
    .filter(meaningful)
    .filter((b) => b.net < 0)
    .sort((a, b) => a.net - b.net)[0]
  if (worstSport) {
    leaks.push({
      id: 'sport',
      title: `${worstSport.key} is your worst sport by a mile`,
      severity: worstSport.net < -400 ? 'CRITICAL' : 'MEDIUM',
      data: `${worstSport.roi.toFixed(1)}% ROI over ${worstSport.entries} ${worstSport.key} entries — net ${fmtMoney(
        worstSport.net,
      )}.`,
      fix: `Either fix your ${worstSport.key} process or reallocate that capital to sports where you win.`,
      metric: worstSport.net,
    })
  }

  // loss chasing
  if (bankroll.lossChasingPct > 100) {
    leaks.push({
      id: 'chasing',
      title: 'You chase downswings by inflating entries after cold weeks',
      severity: 'CRITICAL',
      data: `+${bankroll.lossChasingPct.toFixed(0)}% entry inflation following cold stretches — a textbook tilt pattern.`,
      fix: 'Set a fixed weekly entry budget and never raise it after a downswing. Chasing turns variance into ruin.',
      metric: -Math.abs(bankroll.lossChasingPct) * 5,
    })
  }

  // exposure
  if (bankroll.peakSlateExposurePct > 10) {
    leaks.push({
      id: 'exposure',
      title: 'You over-expose your bankroll on single slates',
      severity: bankroll.peakSlateExposurePct > 25 ? 'CRITICAL' : 'HIGH',
      data: `Peak single-slate exposure hit ${bankroll.peakSlateExposurePct.toFixed(
        1,
      )}% of your rolling bankroll — safe limits are 2.5–5%.`,
      fix: 'Cap any single slate at 5% of your bankroll. One cold Sunday should never threaten your roll.',
      metric: -bankroll.peakSlateExposurePct * 10,
    })
  }

  return leaks.sort((a, b) => a.metric - b.metric).slice(0, 5)
}

function buildActionPlan(
  leaks: Leak[],
  sportB: Bucket[],
  buyinB: Bucket[],
): ActionStep[] {
  const steps: ActionStep[] = []
  const bestBand = [...buyinB]
    .filter((b) => b.entries >= 15)
    .sort((a, b) => b.roi - a.roi)[0]
  const bestSport = [...sportB]
    .filter((b) => b.entries >= 15)
    .sort((a, b) => b.roi - a.roi)[0]

  leaks.slice(0, 3).forEach((leak) => {
    steps.push({ rank: steps.length + 1, action: leak.fix, reason: leak.data })
  })
  if (bestBand && bestBand.roi > 0) {
    steps.push({
      rank: steps.length + 1,
      action: `Concentrate volume in the ${bestBand.key} band.`,
      reason: `It is your most profitable stake at ${bestBand.roi.toFixed(1)}% ROI over ${bestBand.entries} entries.`,
    })
  }
  if (bestSport && bestSport.roi > 0) {
    steps.push({
      rank: steps.length + 1,
      action: `Lean into ${bestSport.key} — it is your edge.`,
      reason: `${bestSport.roi.toFixed(1)}% ROI over ${bestSport.entries} entries. Put your money where you win.`,
    })
  }
  return steps.slice(0, 5)
}

/* ---------- helpers ---------- */

export function fmtMoney(n: number): string {
  const sign = n < 0 ? '-' : ''
  return `${sign}$${Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
function titleCase(s: string) {
  return s === 'GPP' ? 'GPP' : s.charAt(0) + s.slice(1).toLowerCase()
}

/* ---------- bankroll signals ---------- */

function computeBankroll(rows: ContestRow[], ctB: Bucket[], totalFees: number): BankrollMetrics {
  // group by date (day)
  const byDay = new Map<string, number>()
  const feeByDay = new Map<string, number>()
  const dated = rows.filter((r) => r.date)
  for (const r of dated) {
    const day = r.date.slice(0, 10)
    byDay.set(day, (byDay.get(day) ?? 0) + r.net)
    feeByDay.set(day, (feeByDay.get(day) ?? 0) + r.entryFee)
  }
  const days = [...byDay.keys()].sort()

  // peak slate exposure vs rolling bankroll proxy (starting roll = 20% of total fees or $200)
  let roll = Math.max(200, totalFees * 0.15)
  let peakExposure = 0
  for (const day of days) {
    const fee = feeByDay.get(day) ?? 0
    if (roll > 0) peakExposure = Math.max(peakExposure, (fee / roll) * 100)
    roll += byDay.get(day) ?? 0
    roll = Math.max(roll, 50)
  }

  // loss chasing: avg fee the day after a losing day vs baseline
  let afterLossFees = 0
  let afterLossCount = 0
  let baselineFees = 0
  let baselineCount = 0
  for (let i = 1; i < days.length; i++) {
    const prevNet = byDay.get(days[i - 1]) ?? 0
    const fee = feeByDay.get(days[i]) ?? 0
    if (prevNet < 0) {
      afterLossFees += fee
      afterLossCount++
    } else {
      baselineFees += fee
      baselineCount++
    }
  }
  const afterAvg = afterLossCount ? afterLossFees / afterLossCount : 0
  const baseAvg = baselineCount ? baselineFees / baselineCount : 0
  const lossChasingPct = baseAvg > 0 ? ((afterAvg - baseAvg) / baseAvg) * 100 : 0

  const topFormat = [...ctB].sort((a, b) => b.fees - a.fees)[0]
  const formatConcentrationPct = totalFees > 0 && topFormat ? (topFormat.fees / totalFees) * 100 : 0

  const distinctContestTypes = new Set(rows.map((r) => `${r.contestClass}-${r.entryType}`)).size

  return {
    peakSlateExposurePct: peakExposure,
    lossChasingPct: Math.max(0, lossChasingPct),
    formatConcentrationPct,
    concentratedFormat: topFormat?.key ?? 'UNKNOWN',
    distinctContestTypes,
  }
}

/* ---------- trends ---------- */

function computeTrends(rows: ContestRow[]): { cumulative: TrendPoint[]; monthly: TrendPoint[] } {
  const dated = rows.filter((r) => r.date).sort((a, b) => a.date.localeCompare(b.date))
  const byDay = new Map<string, ContestRow[]>()
  for (const r of dated) {
    const day = r.date.slice(0, 10)
    if (!byDay.has(day)) byDay.set(day, [])
    byDay.get(day)!.push(r)
  }
  let cum = 0
  const cumulative: TrendPoint[] = []
  for (const day of [...byDay.keys()].sort()) {
    const list = byDay.get(day)!
    const net = list.reduce((s, r) => s + r.net, 0)
    const fees = list.reduce((s, r) => s + r.entryFee, 0)
    cum += net
    cumulative.push({
      label: day,
      net,
      cumulative: cum,
      roi: fees ? (net / fees) * 100 : 0,
      entries: list.length,
    })
  }

  const byMonth = new Map<string, ContestRow[]>()
  for (const r of dated) {
    const m = r.date.slice(0, 7)
    if (!byMonth.has(m)) byMonth.set(m, [])
    byMonth.get(m)!.push(r)
  }
  let mcum = 0
  const monthly: TrendPoint[] = []
  for (const m of [...byMonth.keys()].sort()) {
    const list = byMonth.get(m)!
    const net = list.reduce((s, r) => s + r.net, 0)
    const fees = list.reduce((s, r) => s + r.entryFee, 0)
    mcum += net
    monthly.push({
      label: m,
      net,
      cumulative: mcum,
      roi: fees ? (net / fees) * 100 : 0,
      entries: list.length,
    })
  }
  return { cumulative, monthly }
}

/* ---------- reallocation (counterfactual) engine ---------- */

// The core value-add: for each losing segment with real volume, compute what
// that same capital WOULD have returned had it been deployed in the user's
// single best proven-winning segment instead. This is descriptive
// counterfactual math on the user's OWN historical ROI — not a forward
// prediction. Framed that way in the report so it stays credible.
function buildReallocation(
  buyinB: Bucket[],
  ctB: Bucket[],
  entryB: Bucket[],
  sportB: Bucket[],
): Reallocation {
  const MIN = 15 // minimum entries to treat a segment as real signal

  // Anchor = the single most profitable segment (by ROI) with real volume,
  // searched across all dimensions. This is where we'd redeploy.
  const allWinners = [
    ...buyinB.map((b) => ({ b, dim: 'buy-in tier' })),
    ...ctB.map((b) => ({ b, dim: 'contest type' })),
    ...entryB.map((b) => ({ b, dim: 'entry type' })),
    ...sportB.map((b) => ({ b, dim: 'sport' })),
  ].filter(({ b }) => b.entries >= MIN && b.roi > 0 && b.key !== 'UNKNOWN')

  const anchor = [...allWinners].sort((a, b) => b.b.roi - a.b.roi)[0]

  if (!anchor) {
    return {
      moves: [],
      totalBled: 0,
      totalProjectedSwing: 0,
      anchorSegment: '',
      anchorRoi: 0,
      hasData: false,
    }
  }

  // Cap the anchor ROI used for projection. A freak-hot segment (e.g. +900%
  // over a lucky stretch) would otherwise produce absurd, non-credible
  // "swing" figures. Projecting reallocation at more than a sober +25% ROI
  // is not defensible for a sharp reader, so clamp the projection rate even
  // if the displayed segment ROI is higher.
  const PROJECTION_ROI_CAP = 0.25
  const anchorRoi = Math.min(anchor.b.roi / 100, PROJECTION_ROI_CAP)

  // Losing segments to consider redeploying FROM — one per dimension, the
  // worst by net dollars, so we don't double-count the same dollars.
  const losingCandidates = [
    { list: buyinB, dim: 'buy-in tier', label: (k: string) => `${k} buy-ins` },
    { list: ctB, dim: 'contest type', label: (k: string) => `${titleCase(k)} contests` },
    { list: entryB, dim: 'entry type', label: (k: string) => `${k} entries` },
    { list: sportB, dim: 'sport', label: (k: string) => `${k}` },
  ]

  const moves: ReallocationMove[] = []
  for (const { list, dim, label } of losingCandidates) {
    const worst = [...list]
      .filter((b) => b.entries >= MIN && b.net < 0 && b.key !== 'UNKNOWN')
      .sort((a, b) => a.net - b.net)[0]
    if (!worst) continue
    // Don't redeploy a segment into itself.
    if (label(worst.key) === anchor.dim && worst.key === anchor.b.key) continue

    const projectedReturn = worst.fees * anchorRoi // what the fees would've earned at anchor ROI
    const actualNet = worst.net // negative
    const swing = projectedReturn - actualNet // full EV difference

    moves.push({
      fromSegment: label(worst.key),
      fromDimension: dim,
      capitalBled: Math.abs(worst.net),
      feesInSegment: worst.fees,
      fromRoi: worst.roi,
      toSegment: anchor.dim === 'sport' ? anchor.b.key : `${anchor.b.key} (${anchor.dim})`,
      toRoi: anchorRoi * 100,
      projectedReturn,
      swing,
    })
  }

  // Keep the top 3 highest-swing moves.
  moves.sort((a, b) => b.swing - a.swing)
  const top = moves.slice(0, 3)

  return {
    moves: top,
    totalBled: top.reduce((s, m) => s + m.capitalBled, 0),
    totalProjectedSwing: top.reduce((s, m) => s + m.swing, 0),
    anchorSegment: anchor.dim === 'sport' ? anchor.b.key : `${anchor.b.key} (${anchor.dim})`,
    anchorRoi: anchorRoi * 100, // the (capped) rate actually used for projection
    hasData: top.length > 0,
  }
}

/* ---------- health scorecard (RAG + letter grades) ---------- */

function gradeFrom(pct: number): { grade: ScorecardMetric['grade']; status: ScorecardMetric['status'] } {
  if (pct >= 85) return { grade: 'A', status: 'GREEN' }
  if (pct >= 70) return { grade: 'B', status: 'GREEN' }
  if (pct >= 55) return { grade: 'C', status: 'AMBER' }
  if (pct >= 40) return { grade: 'D', status: 'AMBER' }
  return { grade: 'F', status: 'RED' }
}

function buildScorecard(
  report: {
    roi: number
    winRate: number
    disciplineScore: DisciplineScore
    bankroll: BankrollMetrics
  },
): ScorecardMetric[] {
  const cards: ScorecardMetric[] = []

  // Overall profitability
  {
    // Map ROI to a 0-100 feel: -50% => 0, 0% => 50, +50% => 100 (clamped)
    const pct = Math.max(0, Math.min(100, 50 + report.roi))
    const { grade, status } = gradeFrom(pct)
    cards.push({
      label: 'Overall Profitability',
      value: `${report.roi >= 0 ? '+' : ''}${report.roi.toFixed(1)}% ROI`,
      target: 'Positive ROI',
      grade,
      status,
      note:
        report.roi >= 0
          ? 'You are net profitable across the period reviewed.'
          : 'You are losing money overall — the findings below isolate where.',
    })
  }

  // Capital discipline
  {
    if (report.disciplineScore.provisional) {
      cards.push({
        label: 'Capital Discipline',
        value: 'Provisional',
        target: '70 / 100+',
        grade: 'C',
        status: 'AMBER',
        note: 'Not enough qualified history yet to grade reliably.',
      })
    } else {
      const s = report.disciplineScore.score ?? 0
      const { grade, status } = gradeFrom(s)
      cards.push({
        label: 'Capital Discipline',
        value: `${s.toFixed(0)} / 100`,
        target: '70 / 100+',
        grade,
        status,
        note: 'How well your money tracked the segments you can actually beat.',
      })
    }
  }

  // Bankroll exposure (lower is better; 5% target)
  {
    const exp = report.bankroll.peakSlateExposurePct
    // 5% or less => 100; 25%+ => 0
    const pct = Math.max(0, Math.min(100, 100 - (exp - 5) * 5))
    const { grade, status } = gradeFrom(pct)
    cards.push({
      label: 'Bankroll Exposure',
      value: `${exp.toFixed(1)}% peak`,
      target: '≤ 5% per slate',
      grade,
      status,
      note:
        exp > 5
          ? 'Single-slate exposure exceeds safe limits — one cold day can hurt.'
          : 'Single-slate exposure is within safe limits.',
    })
  }

  // Loss-chasing discipline (lower is better; 0% ideal)
  {
    const chase = report.bankroll.lossChasingPct
    // 0% => 100; 150%+ => 0
    const pct = Math.max(0, Math.min(100, 100 - chase / 1.5))
    const { grade, status } = gradeFrom(pct)
    cards.push({
      label: 'Tilt / Loss-Chasing',
      value: chase > 0 ? `+${chase.toFixed(0)}% after losses` : 'None detected',
      target: 'No inflation',
      grade,
      status,
      note:
        chase > 50
          ? 'You raise stakes after cold stretches — a costly, correctable tilt pattern.'
          : 'No meaningful loss-chasing pattern detected.',
    })
  }

  // Concentration (moderate is fine; extreme is risky)
  {
    const conc = report.bankroll.formatConcentrationPct
    const pct = conc > 70 ? 40 : conc > 55 ? 60 : 85
    const { grade, status } = gradeFrom(pct)
    cards.push({
      label: 'Format Concentration',
      value: `${conc.toFixed(0)}% in one format`,
      target: '≤ 55%',
      grade,
      status,
      note:
        conc > 55
          ? 'A large share of capital sits in a single format — diversify to reduce variance.'
          : 'Capital is reasonably spread across formats.',
    })
  }

  return cards
}

/* ---------- findings (consulting flow) ---------- */

// Rewrites the raw leaks into the consulting flow: what we found → why it
// matters → root cause → dollar impact → recommendation.
function buildFindings(leaks: Leak[]): Finding[] {
  const whyMap: Record<string, string> = {
    buyin: 'Buy-in tiers where you lose reveal the stake level at which your edge disappears. Money deployed there is structurally negative-expectation for you.',
    contesttype: 'Contest structure dictates variance and field strength. Losing in a structure means it does not fit your current skill or bankroll.',
    entrytype: 'Entry-cap formats determine who you compete against. Mass-multi-entry pits you against professional portfolios you cannot out-volume.',
    sport: 'A losing sport signals a process or information gap specific to that sport — not general bad luck.',
    chasing: 'Raising stakes after losses converts normal variance into risk of ruin. It is the single most destructive bankroll behavior.',
    exposure: 'Over-concentrating on one slate means a single bad day can wipe out weeks of gains. Professionals cap this deliberately.',
  }
  const rootMap: Record<string, string> = {
    buyin: 'Likely moving up in stakes chasing bigger scores before the edge was proven at lower tiers.',
    contesttype: 'Likely over-weighting high-variance tournaments relative to demonstrated skill.',
    entrytype: 'Likely entering mass-multi formats without a large optimized portfolio to compete.',
    sport: 'Likely thinner research, worse late-news handling, or weaker player models in this sport.',
    chasing: 'Emotional response to downswings — attempting to "win it back" by increasing volume.',
    exposure: 'No fixed per-slate cap; entry sizing driven by confidence rather than a rule.',
  }

  return leaks.map((l) => ({
    id: l.id,
    title: l.title,
    severity: l.severity,
    whatWeFound: l.data,
    whyItMatters: whyMap[l.id] ?? 'This pattern is measurably reducing your long-run expected value.',
    rootCause: rootMap[l.id] ?? 'A repeated process or bankroll habit visible across the dataset.',
    dollarImpact: l.metric,
    recommendation: l.fix,
  }))
}

/* ---------- phased recommendations (roadmap) ---------- */

function buildPhasedPlan(
  reallocation: Reallocation,
  bankroll: BankrollMetrics,
  bestSport: Bucket | undefined,
): PhasedRecommendation[] {
  const plan: PhasedRecommendation[] = []

  // QUICK WINS — before the next slate
  if (reallocation.hasData && reallocation.moves[0]) {
    const m = reallocation.moves[0]
    plan.push({
      phase: 'QUICK_WIN',
      action: `Stop deploying capital into ${m.fromSegment}. Redirect it to ${m.toSegment}.`,
      rationale: `${m.fromSegment} ran ${m.fromRoi.toFixed(1)}% ROI; ${m.toSegment} ran +${m.toRoi.toFixed(1)}%.`,
      priority: 'HIGH',
      expectedBenefit: `~${fmtMoney(m.swing)} projected swing based on your own historical ROI (opportunity cost, not a guarantee).`,
    })
  }
  if (bankroll.peakSlateExposurePct > 5) {
    plan.push({
      phase: 'QUICK_WIN',
      action: 'Set a hard per-slate cap at 5% of your bankroll and do not exceed it.',
      rationale: `Peak exposure hit ${bankroll.peakSlateExposurePct.toFixed(1)}% — well above safe limits.`,
      priority: 'HIGH',
      expectedBenefit: 'Removes risk-of-ruin from a single cold day; stabilizes variance immediately.',
    })
  }

  // MEDIUM — this month
  if (bankroll.lossChasingPct > 50) {
    plan.push({
      phase: 'MEDIUM',
      action: 'Adopt a fixed weekly entry budget and never raise it after a losing week.',
      rationale: `You currently inflate entries by +${bankroll.lossChasingPct.toFixed(0)}% after cold stretches.`,
      priority: 'HIGH',
      expectedBenefit: 'Breaks the tilt loop that turns normal downswings into large drawdowns.',
    })
  }
  if (reallocation.hasData && reallocation.moves[1]) {
    const m = reallocation.moves[1]
    plan.push({
      phase: 'MEDIUM',
      action: `Phase out ${m.fromSegment} once your core edge is stable.`,
      rationale: `Second-largest drag on the portfolio at ${m.fromRoi.toFixed(1)}% ROI.`,
      priority: 'MEDIUM',
      expectedBenefit: `~${fmtMoney(m.swing)} projected swing if reallocated to your proven pocket.`,
    })
  }

  // LONG TERM — 3-6 months
  if (bestSport) {
    plan.push({
      phase: 'LONG_TERM',
      action: `Build depth in ${bestSport.key}, your demonstrated strength, and track ROI by segment each month.`,
      rationale: `${bestSport.key} is your most reliable edge at ${bestSport.roi.toFixed(1)}% ROI over ${bestSport.entries} entries.`,
      priority: 'MEDIUM',
      expectedBenefit: 'Compounds your one proven advantage instead of diluting it across weak formats.',
    })
  }
  plan.push({
    phase: 'LONG_TERM',
    action: 'Re-upload your history monthly to track whether these leaks are closing.',
    rationale: 'A diagnostic is only useful if you measure whether the fixes worked.',
    priority: 'LOW',
    expectedBenefit: 'Turns one-time advice into a feedback loop — the core of long-run improvement.',
  })

  return plan
}

/* ---------- glossary ---------- */

function buildGlossary(): GlossaryTerm[] {
  return [
    { term: 'ROI', definition: 'Return on Investment. Net profit divided by total entry fees, as a percentage. +10% means for every $100 risked you netted $10 profit.' },
    { term: 'Net / P&L', definition: 'Profit and Loss. Total winnings minus total entry fees. The actual dollars won or lost.' },
    { term: 'GPP', definition: 'Guaranteed Prize Pool. Large-field tournaments with top-heavy payouts — high variance, most entrants lose, a few win big.' },
    { term: 'Cash game', definition: 'Contests where roughly the top half of the field is paid (50/50s, Double-Ups, Head-to-Heads). Lower variance; ROI here is the cleanest read on skill.' },
    { term: 'Single-Entry', definition: 'A contest where each player may enter only one lineup — levels the field against high-volume pros.' },
    { term: '3-Max / 20-Max', definition: 'Contests capping entries per player at 3 or 20 lineups.' },
    { term: 'MME', definition: 'Mass Multi-Entry. Tournaments allowing 100+ lineups per player. Professionals with large, optimized portfolios hold a structural edge here.' },
    { term: 'Buy-In Tier', definition: 'Entry-fee band (e.g. $1–5, $25–100). Isolating ROI by tier reveals the stake level where your edge holds or breaks.' },
    { term: 'Win Rate (ITM)', definition: 'In-The-Money rate. The percentage of entries that finished in a paid position.' },
    { term: 'Variance', definition: 'The swing in results around your average. GPPs are high-variance; cash games are low-variance.' },
    { term: 'Capital Discipline Score', definition: 'A 0–100 proprietary measure of how much of your statistically-qualified capital went to segments your own data shows you can beat, net of penalties for overexposure, loss-chasing, and concentration.' },
    { term: 'Edge-Aligned Allocation', definition: 'The share of your proven-sample capital that was deployed into positive-ROI segments.' },
    { term: 'Reallocation Swing', definition: 'A counterfactual estimate: what your bled capital would have returned at your own proven-winning ROI instead. A measure of opportunity cost, not a forward guarantee.' },
    { term: 'Peak Slate Exposure', definition: 'The largest share of your rolling bankroll risked on a single day. Bankroll guidelines suggest capping this at 2.5–5%.' },
    { term: 'Small Sample', definition: 'A segment with too few entries (under ~20) to draw reliable conclusions. Flagged so a hot or cold streak is not mistaken for a real edge.' },
  ]
}

/* ---------- capital discipline score ---------- */

// Tunable weights for the penalty side. Kept as named constants so the
// score stays explainable in one sentence, not a black box.
const EXPOSURE_FREE_PCT = 5 // no penalty below this peak-slate-exposure %
const EXPOSURE_WEIGHT = 0.5
const CHASING_WEIGHT = 0.1 // lossChasingPct is often 50-150+, scale it down
const CONCENTRATION_FREE_PCT = 50 // no penalty below this format-concentration %
const CONCENTRATION_WEIGHT = 0.3
const PENALTY_CAP = 40

const MIN_ENTRIES_FOR_SCORE = 30
const MIN_FEES_FOR_SCORE = 200

/**
 * Capital Discipline Score — NOT a "decision accuracy" score. DFS has no
 * objective best-move oracle the way chess/poker do, so this measures
 * something narrower and honest: of the money in buckets large enough to
 * trust (non-small-sample), what % went where the user's OWN data shows
 * they actually have an edge — minus a penalty for overbetting, loss-
 * chasing, and over-concentration.
 */
function computeDisciplineScore(
  breakdowns: Bucket[][],
  bankroll: BankrollMetrics,
  totalEntries: number,
  totalFees: number,
): DisciplineScore {
  // Score each breakdown dimension independently (sport, contest type,
  // buy-in, entry type), then combine weighted by how much capital each
  // dimension actually classified. This avoids double-counting the same
  // dollar across multiple partitions of the same rows.
  let weightedGoodPct = 0
  let totalWeight = 0
  // For the displayed dollar figures, use whichever single dimension
  // classified the most capital — one coherent view, not a mix of four.
  let bestDimTotal = 0
  let goodCapital = 0
  let badCapital = 0

  for (const buckets of breakdowns) {
    const valid = buckets.filter((b) => !b.smallSample && b.entries > 0)
    const good = valid.filter((b) => b.roi > 0).reduce((s, b) => s + b.fees, 0)
    const bad = valid.filter((b) => b.roi < 0).reduce((s, b) => s + b.fees, 0)
    const total = good + bad
    if (total <= 0) continue
    weightedGoodPct += (good / total) * total
    totalWeight += total
    if (total > bestDimTotal) {
      bestDimTotal = total
      goodCapital = good
      badCapital = bad
    }
  }

  const allocationScore = totalWeight > 0 ? (weightedGoodPct / totalWeight) * 100 : 0

  const penalty = Math.min(
    PENALTY_CAP,
    Math.max(0, bankroll.peakSlateExposurePct - EXPOSURE_FREE_PCT) * EXPOSURE_WEIGHT +
      Math.max(0, bankroll.lossChasingPct) * CHASING_WEIGHT +
      Math.max(0, bankroll.formatConcentrationPct - CONCENTRATION_FREE_PCT) * CONCENTRATION_WEIGHT,
  )

  const provisional = totalEntries < MIN_ENTRIES_FOR_SCORE || totalFees < MIN_FEES_FOR_SCORE || totalWeight <= 0
  const rawScore = Math.min(100, Math.max(0, allocationScore - penalty))

  return {
    score: provisional ? null : rawScore,
    provisional,
    allocationScore,
    penalty,
    goodCapital,
    badCapital,
    classifiedCapital: totalWeight,
  }
}

/* ---------- main entry ---------- */

export function analyze(
  rows: ContestRow[],
  platform: Platform,
  filename: string,
): AnalysisReport {
  const lifetimeEntries = rows.length
  const totalFees = rows.reduce((s, r) => s + r.entryFee, 0)
  const totalWinnings = rows.reduce((s, r) => s + r.winnings, 0)
  const netProfit = totalWinnings - totalFees
  const roi = totalFees > 0 ? (netProfit / totalFees) * 100 : 0
  const wins = rows.filter((r) => r.cashed).length
  const winRate = lifetimeEntries ? (wins / lifetimeEntries) * 100 : 0

  const sportBreakdown = aggregate(rows, (r) => r.sport).sort((a, b) => b.entries - a.entries)
  const contestTypeBreakdown = aggregate(rows, (r) => r.contestClass).sort(
    (a, b) => b.entries - a.entries,
  )
  const buyinBreakdown = aggregate(rows, (r) => r.buyinBand).sort(
    (a, b) => BAND_ORDER.indexOf(a.key) - BAND_ORDER.indexOf(b.key),
  )
  const entryTypeBreakdown = aggregate(rows, (r) => r.entryType).sort(
    (a, b) => b.entries - a.entries,
  )

  const bankroll = computeBankroll(rows, contestTypeBreakdown, totalFees)
  const { cumulative, monthly } = computeTrends(rows)
  const disciplineScore = computeDisciplineScore(
    [sportBreakdown, contestTypeBreakdown, buyinBreakdown, entryTypeBreakdown],
    bankroll,
    lifetimeEntries,
    totalFees,
  )

  const rankedSports = [...sportBreakdown].filter((b) => b.entries >= 10)
  const bestSportB = [...rankedSports].sort((a, b) => b.roi - a.roi)[0]
  const worstSportB = [...rankedSports].sort((a, b) => a.roi - b.roi)[0]
  const bestBandB = [...buyinBreakdown].filter((b) => b.entries >= 10).sort((a, b) => b.roi - a.roi)[0]

  const leaks = buildLeaks(
    sportBreakdown,
    contestTypeBreakdown,
    buyinBreakdown,
    entryTypeBreakdown,
    bankroll,
  )
  const actionPlan = buildActionPlan(leaks, sportBreakdown, buyinBreakdown)
  const reallocation = buildReallocation(
    buyinBreakdown,
    contestTypeBreakdown,
    entryTypeBreakdown,
    sportBreakdown,
  )
  const glossary = buildGlossary()
  const scorecard = buildScorecard({
    roi,
    winRate,
    disciplineScore,
    bankroll,
  })
  const findings = buildFindings(leaks)
  const bestSportForPlan = [...sportBreakdown].filter((b) => b.entries >= 15 && b.roi > 0).sort((a, b) => b.roi - a.roi)[0]
  const phasedPlan = buildPhasedPlan(reallocation, bankroll, bestSportForPlan)

  const chess = computeChess(rows, sportBreakdown, buyinBreakdown, entryTypeBreakdown, roi)

  const dates = rows.map((r) => r.date).filter(Boolean).sort()
  const sports = [...new Set(rows.map((r) => r.sport))]

  const report: AnalysisReport = {
    id: `rpt_${Date.now()}`,
    platform,
    filename,
    createdAt: new Date().toISOString(),
    rowCount: lifetimeEntries,
    dateRange: {
      start: dates[0]?.slice(0, 10) ?? '—',
      end: dates[dates.length - 1]?.slice(0, 10) ?? '—',
    },
    sports,
    lifetimeEntries,
    totalFees,
    totalWinnings,
    netProfit,
    roi,
    winRate,
    bestSport: bestSportB ? `${bestSportB.key} (${bestSportB.roi.toFixed(1)}%)` : '—',
    worstSport: worstSportB ? `${worstSportB.key} (${worstSportB.roi.toFixed(1)}%)` : '—',
    biggestLeak: leaks[0]?.title ?? 'No dominant leak detected',
    bestOpportunity: bestBandB
      ? `${bestBandB.key} buy-ins (${bestBandB.roi.toFixed(1)}% ROI)`
      : '—',
    sportBreakdown,
    contestTypeBreakdown,
    buyinBreakdown,
    entryTypeBreakdown,
    bankroll,
    disciplineScore,
    cumulative,
    monthly,
    leaks,
    actionPlan,
    reallocation,
    glossary,
    scorecard,
    findings,
    phasedPlan,
    executiveSummary: '',
    narrative: '',
    chess,
  }

  return report
}
