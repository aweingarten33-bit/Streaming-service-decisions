import type { ComponentType } from 'react'
import type { AnalysisReport } from './types'
import { PerspectivesReportView } from '@/components/report/perspectives-report-view'
import { StrategicAuditReportView } from '@/components/report/strategic-audit-report-view'
import { ExecutiveReviewReportView } from '@/components/report/executive-review-report-view'
import { ReportView } from '@/components/report/report-view'
import { ChessReportView } from '@/components/report/chess-report-view'
import { BehavioralReportView } from '@/components/report/behavioral-report-view'
import { InvestmentReportView } from '@/components/report/investment-report-view'
import { IntelligenceReportView } from '@/components/report/intelligence-report-view'
import { ForensicReportView } from '@/components/report/forensic-report-view'
import { RiskReportView } from '@/components/report/risk-report-view'
import { PatternReportView } from '@/components/report/pattern-report-view'
import { DecisionReportView } from '@/components/report/decision-report-view'
import { RootCauseReportView } from '@/components/report/root-cause-report-view'
import { ScoutingReportView } from '@/components/report/scouting-report-view'

/**
 * Report template registry.
 *
 * Every template consumes the SAME AnalysisReport (all math computed once in
 * src/lib/analysis.ts + src/lib/chess-metrics.ts). Adding a new template
 * (e.g. Investment Committee Review) is a single entry here — no changes to
 * the upload flow or analytics engine.
 */
export type ReportTemplateId =
  | 'executive-review'
  | 'strategic-audit'
  | 'perspectives'
  | 'executive'
  | 'chess'
  | 'behavioral'
  | 'investment'
  | 'intelligence'
  | 'forensic'
  | 'risk'
  | 'pattern'
  | 'decision'
  | 'root-cause'
  | 'scouting'

export interface ReportTemplate {
  id: ReportTemplateId
  name: string
  tagline: string
  emoji: string
  Component: ComponentType<{ report: AnalysisReport }>
}

export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'executive-review',
    name: 'Quarterly Performance Review',
    tagline: 'Would you hire yourself? An independent investment-committee review of your DFS career.',
    emoji: '§',
    Component: ExecutiveReviewReportView,
  },
  {
    id: 'strategic-audit',
    name: 'Strategy & Decision-Making Audit',
    tagline: 'Huron-style consulting review: findings, leaks, recommendations, 30-day action plan.',
    emoji: '⧉',
    Component: StrategicAuditReportView,
  },
  {
    id: 'perspectives',
    name: 'Independent Strategy Assessment',
    tagline: 'Fifteen experts. One master report. Your DFS career, reviewed by an advisory panel.',
    emoji: '⌘',
    Component: PerspectivesReportView,
  },
  {
    id: 'executive',
    name: 'Executive Strategy Audit',
    tagline: 'Health scorecard, findings, action roadmap.',
    emoji: '📊',
    Component: ReportView,
  },
  {
    id: 'chess',
    name: 'Chess Grandmaster Audit',
    tagline: 'Position, candidate moves, accuracy, conversion.',
    emoji: '♟',
    Component: ChessReportView,
  },
  {
    id: 'behavioral',
    name: 'Behavioral Psychology Assessment',
    tagline: 'Bias profile, tilt, discipline, decision noise.',
    emoji: '🧠',
    Component: BehavioralReportView,
  },
  {
    id: 'investment',
    name: 'Investment Committee Review',
    tagline: 'Portfolio, risk-adjusted return, rebalancing, vote.',
    emoji: '₿',
    Component: InvestmentReportView,
  },
  {
    id: 'intelligence',
    name: 'Intelligence Assessment',
    tagline: 'Threats, opportunities, blind spots, indicators.',
    emoji: '⌖',
    Component: IntelligenceReportView,
  },
  {
    id: 'forensic',
    name: 'Forensic Accounting Review',
    tagline: 'Profit centers, loss centers, hidden costs, ledger.',
    emoji: '₪',
    Component: ForensicReportView,
  },
  {
    id: 'risk',
    name: 'Risk Assessment',
    tagline: 'Register, matrix, drawdown, stress test, controls.',
    emoji: '△',
    Component: RiskReportView,
  },
  {
    id: 'pattern',
    name: 'Pattern Recognition Analysis',
    tagline: 'Hidden interactions, seasonality, anomalies, clusters.',
    emoji: '◍',
    Component: PatternReportView,
  },
  {
    id: 'decision',
    name: 'Decision Science Review',
    tagline: 'Quality, consistency, process, counterfactuals.',
    emoji: '⌬',
    Component: DecisionReportView,
  },
  {
    id: 'root-cause',
    name: 'Root Cause Analysis',
    tagline: 'Five whys, contributing factors, corrective actions.',
    emoji: '⌘',
    Component: RootCauseReportView,
  },
  {
    id: 'scouting',
    name: 'Professional Scouting Report',
    tagline: 'Trait grades, floor/ceiling, comparison, dev areas.',
    emoji: '⌥',
    Component: ScoutingReportView,
  },
]

export function getTemplate(id: ReportTemplateId): ReportTemplate {
  return REPORT_TEMPLATES.find((t) => t.id === id) ?? REPORT_TEMPLATES[0]
}