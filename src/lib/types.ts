export type Platform = string

export interface ContestRow {
  sport: string
  contestName: string
  date: string // ISO
  entryFee: number
  winnings: number
  gameType?: string
  contestEntries?: number
  place?: number
  points?: number
  prizePool?: number
  contestKey?: string
  entryKey?: string
  // derived
  contestClass: 'CASH' | 'GPP' | 'UNKNOWN'
  entryType: 'SINGLE' | '3-MAX' | '20-MAX' | 'MME' | 'UNKNOWN'
  buyinBand: string
  net: number
  cashed: boolean
}

export interface Bucket {
  key: string
  entries: number
  fees: number
  winnings: number
  net: number
  roi: number
  winRate: number
  smallSample: boolean
}

export interface Leak {
  id: string
  title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  data: string
  fix: string
  metric: number // net dollars lost (negative) for ranking
}

export interface ActionStep {
  rank: number
  action: string
  reason: string
}

export interface ScorecardMetric {
  label: string
  value: string // formatted current value
  target: string // formatted target/benchmark
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  status: 'GREEN' | 'AMBER' | 'RED'
  note: string // one-line plain-English read
}

export interface Finding {
  id: string
  title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  whatWeFound: string // the evidence
  whyItMatters: string // the implication
  rootCause: string // the likely underlying behavior
  dollarImpact: number // net $ tied to this finding (negative)
  recommendation: string // the prescribed move
}

export interface PhasedRecommendation {
  phase: 'QUICK_WIN' | 'MEDIUM' | 'LONG_TERM'
  action: string
  rationale: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  expectedBenefit: string // quantified where possible
}

export interface ReallocationMove {
  fromSegment: string // e.g. "$25–100 buy-ins" or "MME entries"
  fromDimension: string // "buy-in tier", "contest type", etc.
  capitalBled: number // net dollars lost in the losing segment (positive number)
  feesInSegment: number // total fees deployed there
  fromRoi: number // the losing segment's ROI %
  toSegment: string // the proven-winning segment to redeploy into
  toRoi: number // that segment's ROI %
  projectedReturn: number // feesInSegment * toRoi — what that capital would've returned in the good segment
  swing: number // projectedReturn - net(fromSegment): total EV swing from the move
}

export interface Reallocation {
  moves: ReallocationMove[]
  totalBled: number // sum of net losses across the flagged losing segments
  totalProjectedSwing: number // sum of swings — the headline "this cost you $X" number
  anchorSegment: string // the proven-winning segment used as the redeploy target
  anchorRoi: number
  hasData: boolean
}

export interface GlossaryTerm {
  term: string
  definition: string
}

export interface DisciplineScore {
  score: number | null // 0-100, null when provisional (not enough classified data yet)
  provisional: boolean
  allocationScore: number // 0-100: % of your "proven" capital (non-small-sample buckets) that went to your edge-positive spots
  penalty: number // 0-40: deducted for overbetting, loss-chasing, over-concentration
  goodCapital: number
  badCapital: number
  classifiedCapital: number // goodCapital + badCapital, i.e. capital in buckets with enough sample to judge
}

export interface BankrollMetrics {
  peakSlateExposurePct: number
  lossChasingPct: number
  formatConcentrationPct: number
  concentratedFormat: string
  distinctContestTypes: number
}

export interface TrendPoint {
  label: string
  net: number
  cumulative: number
  roi: number
  entries: number
}

/* ===================================================================
 * Chess Grandmaster metrics — pure CSV math, no AI.
 * Every field below is a number derived from ContestRow[].
 * The Chess report template consumes these; the AI layer only narrates.
 * =================================================================== */

export interface ConfidenceRead {
  level: 'LOW' | 'MEDIUM' | 'HIGH'
  sampleSize: number
  // Standard error of the ROI mean, in ROI-percent points. Small SE + large
  // sample => HIGH; wide SE or n<30 => LOW.
  standardError: number
  // Rough two-sided z-style score: |mean| / SE. >2 is "unlikely to be noise".
  zScore: number
}

export interface CriticalPosition {
  hasData: boolean
  peakDate: string // date of peak cumulative net
  peakNet: number
  troughDate: string
  troughNet: number
  drawdown: number // peakNet - troughNet (positive number)
  daysToTrough: number
  // The single worst calendar week by net, if we have >= 8 weeks of data.
  worstWeekLabel: string
  worstWeekNet: number
  worstWeekEntries: number
}

export interface AccuracyBand {
  label: 'Best Move' | 'Inaccuracy' | 'Mistake' | 'Blunder'
  entries: number
  fees: number
  net: number
  share: number // % of total fees
}

export interface StrategicAccuracy {
  score: number // 0-100
  bestMovePct: number // % of fees deployed to positive-ROI, real-sample cells
  bands: AccuracyBand[]
  // Per-entry classification counts (informational).
  totalClassified: number
}

export interface CandidateMove {
  situation: string // e.g. "$25–100 GPP MME entries"
  historicalRoi: number
  historicalEntries: number
  historicalNet: number
  alternative: string // proven-winning cell for the same capital
  alternativeRoi: number
  evGap: number // (altRoi - historicalRoi) in percent points
  dollarSwing: number // fees * (altRoi - historicalRoi)/100
}

export interface PhaseSplit {
  phase: 'Opening' | 'Middlegame' | 'Endgame'
  entries: number
  fees: number
  net: number
  roi: number
}

export interface ConditionalSplit {
  condition: string // human label
  entries: number
  fees: number
  net: number
  roi: number
  vsBaselineRoiDelta: number // roi - baseline
  confidence: ConfidenceRead
}

export interface PositionConversion {
  // After 3+ consecutive cashing days, does the next day's ROI stay hot or regress?
  hotStreakNextDayRoi: number
  hotStreakNextDayEntries: number
  // After 3+ consecutive losing days, does the next day get worse (tilt)?
  coldStreakNextDayRoi: number
  coldStreakNextDayEntries: number
  baselineNextDayRoi: number
  hasData: boolean
}

export interface HiddenInteraction {
  cell: string // e.g. "NFL × MME × $25–100"
  entries: number
  fees: number
  net: number
  roi: number
  // Expected ROI if the row belonged to the average of its dimensions
  // (unweighted average of the three marginal ROIs). Interaction = actual - expected.
  expectedRoi: number
  interactionRoi: number
}

export interface VarianceAttribution {
  // How much of the total loss is "explainable variance" (large-field GPP
  // downswings within normal bounds) vs. structural leak (segments whose
  // ROI is negative with high confidence).
  structuralLossDollars: number
  varianceLossDollars: number
  structuralSharePct: number
}

export interface StrategicConsistency {
  // Coefficient of variation of daily entry fees. Higher = less consistent.
  dailyFeeCv: number
  // Entry-fee inflation after big win (top-decile day). Positive = escalation.
  afterBigWinInflationPct: number
  // Entry-fee inflation after big loss (bottom-decile day). Positive = chasing.
  afterBigLossInflationPct: number
  score: number // 0-100, higher = more consistent
}

export interface ChessMetrics {
  criticalPosition: CriticalPosition
  strategicAccuracy: StrategicAccuracy
  candidateMoves: CandidateMove[]
  phases: PhaseSplit[]
  conditionalSplits: ConditionalSplit[]
  positionConversion: PositionConversion
  hiddenInteractions: HiddenInteraction[]
  varianceAttribution: VarianceAttribution
  consistency: StrategicConsistency
  // Confidence read on the overall ROI figure.
  overallConfidence: ConfidenceRead
}

export interface AnalysisReport {
  id: string
  platform: Platform
  filename: string
  createdAt: string
  rowCount: number
  dateRange: { start: string; end: string }
  sports: string[]

  lifetimeEntries: number
  totalFees: number
  totalWinnings: number
  netProfit: number
  roi: number
  winRate: number

  bestSport: string
  worstSport: string
  biggestLeak: string
  bestOpportunity: string

  sportBreakdown: Bucket[]
  contestTypeBreakdown: Bucket[]
  buyinBreakdown: Bucket[]
  entryTypeBreakdown: Bucket[]

  bankroll: BankrollMetrics
  disciplineScore: DisciplineScore
  cumulative: TrendPoint[]
  monthly: TrendPoint[]

  leaks: Leak[]
  actionPlan: ActionStep[]
  reallocation: Reallocation
  glossary: GlossaryTerm[]
  scorecard: ScorecardMetric[]
  findings: Finding[]
  phasedPlan: PhasedRecommendation[]

  executiveSummary: string
  narrative: string

  // Chess Grandmaster metrics (populated by analyze()).
  chess: ChessMetrics
}
