/**
 * Generates a realistic DraftKings-style contest history as raw CSV rows.
 * Deterministic-ish (seeded) so the sample report is stable and demonstrative:
 * a losing GPP/MME grinder who is actually profitable in small cash games.
 */

const SPORTS = ['NFL', 'NBA', 'MLB', 'NHL']

const GPP_NAMES = [
  'NFL $2M Fantasy Football Millionaire [$1M to 1st]',
  'NBA $150K Bomber [150-Max]',
  'MLB $100K Slugger [20-Max]',
  'NFL $1M PrizeFight [MME]',
  'NBA $50K Crossover [3-Max]',
  'NHL $25K Wraparound [20-Max]',
]

const CASH_NAMES = [
  'NFL $10 Double Up',
  'NBA $5 50/50',
  'MLB $25 Double Up',
  'NHL $10 50/50',
  'NFL $5 Head-to-Head',
  'NBA $50 Double Up',
]

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function sampleCsv(): string {
  const rnd = mulberry32(42)
  const headers = [
    'Sport',
    'Contest_Name',
    'Contest_Date_EST',
    'Entry_Fee',
    'Winnings_Non_Ticket',
    'Winnings_Ticket',
    'Game_Type',
    'Contest_Entries',
    'Places_Paid',
    'Points',
    'Prize_Pool',
    'Contest_Key',
    'Entry_Key',
  ]

  const rows: string[][] = []
  const start = new Date('2024-08-01').getTime()
  const end = new Date('2025-01-15').getTime()
  let contestSeq = 1000

  for (let i = 0; i < 620; i++) {
    const isCash = rnd() < 0.4
    const sport = SPORTS[Math.floor(rnd() * SPORTS.length)]
    const name = isCash
      ? CASH_NAMES[Math.floor(rnd() * CASH_NAMES.length)]
      : GPP_NAMES[Math.floor(rnd() * GPP_NAMES.length)]

    // buy-in
    const fee = isCash
      ? [5, 10, 25, 50][Math.floor(rnd() * 4)]
      : [1, 3, 5, 20, 100][Math.floor(rnd() * 5)]

    // outcome: cash games ~ slightly +EV, GPPs ~ heavily -EV with occasional spike
    let winnings = 0
    if (isCash) {
      // ~56% win rate, double-up structure
      winnings = rnd() < 0.56 ? fee * 1.8 : 0
    } else {
      const roll = rnd()
      if (roll > 0.97) winnings = fee * 120 // rare big score
      else if (roll > 0.9) winnings = fee * 8
      else if (roll > 0.78) winnings = fee * 2.2
      else winnings = 0
    }

    const date = new Date(start + rnd() * (end - start))
    // MME: duplicate contest keys for GPP big-field entries
    const isMME = !isCash && /MME|Max/.test(name)
    const contestKey = `C${contestSeq}`
    const dupes = isMME ? 1 + Math.floor(rnd() * 6) : 1

    for (let d = 0; d < dupes; d++) {
      rows.push([
        sport,
        `"${name}"`,
        date.toISOString().slice(0, 19).replace('T', ' '),
        fee.toFixed(2),
        winnings.toFixed(2),
        '0',
        isCash ? 'Cash' : 'Tournament',
        isCash ? '100' : String(5000 + Math.floor(rnd() * 200000)),
        isCash ? '50' : String(1000 + Math.floor(rnd() * 40000)),
        (100 + rnd() * 80).toFixed(2),
        isCash ? (fee * 200).toFixed(2) : String(10000 + Math.floor(rnd() * 2000000)),
        contestKey,
        `E${contestSeq}_${d}`,
      ])
    }
    contestSeq++
  }

  const lines = [headers.join(',')]
  for (const r of rows) lines.push(r.join(','))
  return lines.join('\n')
}
