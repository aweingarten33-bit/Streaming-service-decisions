import type { AnalysisReport } from './types'
import { fmtMoney } from './analysis'

/**
 * Deterministic "AI coach" narrative built entirely from computed metrics.
 * It never invents numbers, never recommends players or builds lineups, and
 * hedges small samples — matching the blunt-coach system-prompt spec.
 */
export function generateNarrative(r: AnalysisReport): { executiveSummary: string; narrative: string } {
  const profitable = r.netProfit >= 0
  const roiStr = `${r.roi >= 0 ? '+' : ''}${r.roi.toFixed(1)}%`

  const exec = profitable
    ? `You're net positive at ${roiStr} ROI across ${r.lifetimeEntries.toLocaleString()} entries — ${fmtMoney(
        r.netProfit,
      )} in the black. That's rare. Now protect it: your edge is real but concentrated, and a couple of leaks are quietly taxing your upside.`
    : `Straight up: you're down ${fmtMoney(Math.abs(r.netProfit))} at ${roiStr} ROI over ${r.lifetimeEntries.toLocaleString()} entries. That's not variance — it's a pattern. The good news is the leak is specific and fixable, and your best pocket (${r.bestOpportunity}) proves you can win when you play your game.`

  const parts: string[] = []
  parts.push(
    `PROCESS AUDIT — ${r.platform.toUpperCase()} // ${r.dateRange.start} → ${r.dateRange.end}`,
  )
  parts.push('')
  parts.push(
    profitable
      ? `You are a winning player, but you are leaving money on the table. Let's tighten the screws.`
      : `Let's be blunt about where your edge is leaking. The data doesn't lie, and it's telling a clear story.`,
  )
  parts.push('')

  parts.push('THE LEAKS THAT ARE COSTING YOU:')
  r.leaks.slice(0, 3).forEach((leak, i) => {
    parts.push('')
    parts.push(`${i + 1}. ${leak.title.toUpperCase()}`)
    parts.push(`   ${leak.data}`)
    parts.push(`   FIX: ${leak.fix}`)
  })

  parts.push('')
  parts.push('WHERE YOU ACTUALLY HAVE AN EDGE:')
  parts.push(`   Best sport: ${r.bestSport}. Best stake: ${r.bestOpportunity}.`)
  parts.push(
    `   Your cash-game discipline shows up in the win rate (${r.winRate.toFixed(
      1,
    )}%). Stop diluting it with formats you can't beat.`,
  )

  const smallBuckets = [
    ...r.sportBreakdown,
    ...r.buyinBreakdown,
    ...r.contestTypeBreakdown,
  ].filter((b) => b.smallSample && b.entries > 0)
  if (smallBuckets.length) {
    parts.push('')
    parts.push(
      `NOTE: Some buckets have under 20 entries (${smallBuckets
        .map((b) => b.key)
        .slice(0, 4)
        .join(', ')}). Treat those numbers as directional, not gospel — small samples lie.`,
    )
  }

  parts.push('')
  parts.push('DO THESE THINGS NEXT:')
  r.actionPlan.forEach((step) => {
    parts.push(`   ${step.rank}. ${step.action}`)
  })
  parts.push('')
  parts.push(
    profitable
      ? `Bottom line: you win. Now win bigger by cutting the dead weight. — Coach`
      : `Bottom line: you don't have a talent problem, you have a discipline problem. Fix the leaks above and you flip the curve. — Coach`,
  )

  return { executiveSummary: exec, narrative: parts.join('\n') }
}
