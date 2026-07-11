import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { AnalysisReport } from '@/lib/types'
import type { Synthesis, Finding } from '@/lib/advisory-synthesis'
import { directionLabel } from '@/lib/advisory-synthesis'
import { fmtMoney } from '@/lib/analysis'
import { ensureFonts } from './fonts'

ensureFonts()

/**
 * AdvisoryDocument — the deep, exportable version of the review.
 *
 * Every number displayed anywhere in this document is accompanied by an
 * explanation of exactly how it was computed. The goal is a document that
 * would survive being read side-by-side with the raw CSV.
 */

const s = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    fontFamily: 'SourceSerif',
    fontSize: 10.5,
    color: '#111',
    lineHeight: 1.5,
  },
  runningHeader: {
    position: 'absolute',
    top: 24,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    letterSpacing: 1.2,
    color: '#666',
  },
  runningFooter: {
    position: 'absolute',
    bottom: 24,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    letterSpacing: 1.2,
    color: '#666',
  },
  // Cover page
  coverTag: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    letterSpacing: 1.8,
    color: '#666',
    marginBottom: 40,
  },
  coverTitle: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 42,
    lineHeight: 1.05,
    marginBottom: 24,
    color: '#111',
  },
  coverBottomLine: {
    fontFamily: 'SourceSerif',
    fontStyle: 'italic',
    fontSize: 14,
    lineHeight: 1.4,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#111',
    color: '#111',
    marginTop: 24,
  },
  coverMetaBlock: {
    marginTop: 40,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#111',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  coverMetaLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    letterSpacing: 1.4,
    color: '#666',
    marginBottom: 4,
  },
  coverMetaValue: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 14,
    color: '#111',
  },
  // Section
  sectionTag: {
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    letterSpacing: 1.6,
    color: '#666',
    marginBottom: 4,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 22,
    marginBottom: 6,
    color: '#111',
  },
  sectionSubtitle: {
    fontFamily: 'SourceSerif',
    fontStyle: 'italic',
    fontSize: 10,
    color: '#555',
    marginBottom: 14,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#111',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.55,
    marginBottom: 10,
    color: '#111',
  },
  // Finding card
  findingCard: {
    borderWidth: 1,
    borderColor: '#111',
    padding: 14,
    marginBottom: 12,
  },
  findingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  findingTag: {
    fontFamily: 'JetBrainsMono',
    fontSize: 8,
    letterSpacing: 1.4,
    color: '#111',
  },
  findingHeadline: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 14,
    lineHeight: 1.25,
    marginBottom: 8,
    color: '#111',
  },
  findingBody: {
    fontSize: 10.5,
    lineHeight: 1.5,
    marginBottom: 6,
    color: '#111',
  },
  findingAction: {
    fontFamily: 'SourceSerif',
    fontStyle: 'italic',
    fontSize: 10.5,
    lineHeight: 1.5,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#111',
    marginTop: 6,
    color: '#111',
  },
  checksBar: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#999',
  },
  checkLine: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    color: '#333',
    marginBottom: 2,
  },
  evidenceRow: {
    marginTop: 8,
    padding: 8,
    borderWidth: 0.5,
    borderColor: '#999',
  },
  evidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  evidenceLabel: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    letterSpacing: 0.8,
    color: '#111',
  },
  evidenceValue: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 12,
    color: '#111',
  },
  evidenceMath: {
    fontSize: 9,
    fontFamily: 'SourceSerif',
    fontStyle: 'italic',
    color: '#444',
    lineHeight: 1.45,
  },
  // Action list
  actionRow: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    paddingBottom: 8,
  },
  actionNumber: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 22,
    width: 34,
    color: '#111',
  },
  actionText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 1.5,
    color: '#111',
  },
  // Methodology
  methodItem: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  methodTerm: {
    fontFamily: 'Archivo',
    fontWeight: 700,
    fontSize: 10.5,
    marginBottom: 3,
    color: '#111',
  },
  methodBody: {
    fontSize: 9.5,
    lineHeight: 1.5,
    color: '#333',
  },
})

export function AdvisoryDocument({
  report,
  synthesis,
}: {
  report: AnalysisReport
  synthesis: Synthesis
}) {
  const runningLabel = `ADVISORY REPORT · ${report.platform.toUpperCase()} · ${report.dateRange.start} – ${report.dateRange.end}`
  return (
    <Document
      title="DFS Advisory Report"
      author="DFS Strategy Auditor"
      subject="Independent performance review"
    >
      {/* Cover */}
      <Page size="LETTER" style={s.page}>
        <RunningHeader label={runningLabel} />
        <Text style={s.coverTag}>
          INDEPENDENT ADVISORY REVIEW · PREPARED BY DFS STRATEGY AUDITOR
        </Text>
        <Text style={s.coverTitle}>
          A close read of{'\n'}your DFS history.
        </Text>
        <Text style={s.coverBottomLine}>{synthesis.bottomLine}</Text>
        <View style={s.coverMetaBlock}>
          <View>
            <Text style={s.coverMetaLabel}>PLATFORM</Text>
            <Text style={s.coverMetaValue}>{report.platform}</Text>
          </View>
          <View>
            <Text style={s.coverMetaLabel}>PERIOD</Text>
            <Text style={s.coverMetaValue}>
              {report.dateRange.start} — {report.dateRange.end}
            </Text>
          </View>
          <View>
            <Text style={s.coverMetaLabel}>ENTRIES</Text>
            <Text style={s.coverMetaValue}>{report.rowCount.toLocaleString()}</Text>
          </View>
          <View>
            <Text style={s.coverMetaLabel}>FEES DEPLOYED</Text>
            <Text style={s.coverMetaValue}>{fmtMoney(report.totalFees)}</Text>
          </View>
        </View>
        <View style={{ marginTop: 40 }}>
          <Text style={s.sectionTag}>HOW TO READ THIS DOCUMENT</Text>
          <Text style={s.paragraph}>
            This report is organized so the most important reads come first. The
            Highest-Confidence Findings are the recommendations that multiple
            independent checks against your data agreed on — they should carry
            the most weight. The sections after that unpack what happened, why,
            and what to do next. Every number in this document is followed by an
            italic sentence explaining exactly how it was computed. If a number
            does not appear with its math, that is a bug in this report.
          </Text>
        </View>
        <RunningFooter />
      </Page>

      {/* Highest-confidence findings */}
      <Page size="LETTER" style={s.page}>
        <RunningHeader label={runningLabel} />
        <SectionHeader
          tag="THE SIGNAL"
          title="Highest-Confidence Findings"
          subtitle="Where more than one independent check reached the same conclusion. Ranked by number of agreeing checks."
        />
        {synthesis.highestConfidence.length === 0 && (
          <Text style={s.paragraph}>
            No finding met the two-check agreement threshold at the current sample
            size. Continue building data before treating any single pattern as
            settled.
          </Text>
        )}
        {synthesis.highestConfidence.map((f) => (
          <FindingBlock key={f.id} finding={f} />
        ))}
        <RunningFooter />
      </Page>

      {/* What happened */}
      <Page size="LETTER" style={s.page}>
        <RunningHeader label={runningLabel} />
        <SectionHeader tag="THE FACTS" title="What actually happened." />
        {synthesis.whatHappened.map((p, i) => (
          <Text key={i} style={s.paragraph}>{p}</Text>
        ))}

        <View style={{ marginTop: 20 }}>
          <SectionHeader tag="THE CAUSE" title="Why it happened." />
          {synthesis.whyItHappened.map((p, i) => (
            <Text key={i} style={s.paragraph}>{p}</Text>
          ))}
        </View>
        <RunningFooter />
      </Page>

      {/* What to do next */}
      <Page size="LETTER" style={s.page}>
        <RunningHeader label={runningLabel} />
        <SectionHeader
          tag="THE PLAN"
          title="What to do next."
          subtitle="Every action here corresponds to a finding on page 2. Nothing is speculative."
        />
        {synthesis.whatToDoNext.map((a, i) => (
          <View key={i} style={s.actionRow}>
            <Text style={s.actionNumber}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={s.actionText}>{a}</Text>
          </View>
        ))}
        <RunningFooter />
      </Page>

      {/* Methodology appendix */}
      <Page size="LETTER" style={s.page}>
        <RunningHeader label={runningLabel} />
        <SectionHeader
          tag="APPENDIX"
          title="Methodology."
          subtitle="How each recurring number in this report is computed. Read once and reference as needed."
        />
        {METHODOLOGY.map((m) => (
          <View key={m.term} style={s.methodItem} wrap={false}>
            <Text style={s.methodTerm}>{m.term}</Text>
            <Text style={s.methodBody}>{m.body}</Text>
          </View>
        ))}
        <RunningFooter />
      </Page>
    </Document>
  )
}

/* ============================================================
   Building blocks
   ============================================================ */

function RunningHeader({ label }: { label: string }) {
  return (
    <View style={s.runningHeader} fixed>
      <Text>{label}</Text>
      <Text>DFS STRATEGY AUDITOR</Text>
    </View>
  )
}

function RunningFooter() {
  return (
    <View style={s.runningFooter} fixed>
      <Text>Confidential · For the named recipient only.</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  )
}

function SectionHeader({
  tag,
  title,
  subtitle,
}: {
  tag: string
  title: string
  subtitle?: string
}) {
  return (
    <View>
      <Text style={s.sectionTag}>{tag}</Text>
      <Text style={s.sectionTitle}>{title}</Text>
      {subtitle && <Text style={s.sectionSubtitle}>{subtitle}</Text>}
      <View style={s.sectionDivider} />
    </View>
  )
}

function FindingBlock({ finding }: { finding: Finding }) {
  return (
    <View style={s.findingCard} wrap={false}>
      <View style={s.findingHeader}>
        <Text style={s.findingTag}>
          {directionLabel[finding.direction]} · {finding.agreeingChecks.length} INDEPENDENT CHECKS AGREE
        </Text>
      </View>
      <Text style={s.findingHeadline}>{finding.headline}</Text>
      <Text style={s.findingBody}>{finding.implication}</Text>
      <Text style={s.findingAction}>Do this: {finding.action}</Text>
      <View style={s.checksBar}>
        <Text style={{ ...s.checkLine, fontFamily: 'Archivo', fontWeight: 700, marginBottom: 4 }}>
          Checks that agreed:
        </Text>
        {finding.agreeingChecks.map((c) => (
          <Text key={c} style={s.checkLine}>· {c}</Text>
        ))}
      </View>
      {finding.evidence.map((e, i) => (
        <View key={i} style={s.evidenceRow}>
          <View style={s.evidenceHeader}>
            <Text style={s.evidenceLabel}>{e.label}</Text>
            <Text style={s.evidenceValue}>{e.value}</Text>
          </View>
          <Text style={s.evidenceMath}>How this was computed: {e.math}</Text>
        </View>
      ))}
    </View>
  )
}

/* ============================================================
   Methodology appendix
   ============================================================ */

const METHODOLOGY: { term: string; body: string }[] = [
  {
    term: 'ROI (Return on Investment)',
    body: 'For any group of entries: sum of (winnings − entry fee) across the group, divided by sum of entry fees in the group, expressed as a percent. A group can be the entire file, a single sport, a single contest type, a single buy-in tier, or any combination.',
  },
  {
    term: 'Net',
    body: 'For any group of entries: sum of (winnings − entry fee). This is the dollar figure. ROI is the same figure normalized by capital deployed.',
  },
  {
    term: 'Segment',
    body: 'A slice of the entries defined by contest type, buy-in tier, or sport. A segment is treated as having a "real sample" once it contains at least 30 entries; segments with fewer entries are noted as small-sample and are excluded from findings ranking.',
  },
  {
    term: 'Peak-to-Trough Drawdown',
    body: 'Tracks cumulative net (running total of net across all dated entries). The drawdown is the largest negative gap between any earlier peak and any later trough on that curve. The dollar drawdown is (peak net − trough net).',
  },
  {
    term: 'Format Concentration',
    body: 'The share of total entry fees allocated to the single largest format across the file. A concentration of 50% means half of the dollar volume flowed to one format.',
  },
  {
    term: 'Peak Single-Slate Exposure',
    body: 'On each date, entry fees for that date divided by the rolling bankroll on that date (rolling bankroll = starting bankroll + cumulative net up to but not including that date). The reported figure is the maximum value across the file.',
  },
  {
    term: 'Post-Loss Sizing Change',
    body: 'The average entry fee on days immediately following a losing day, compared to the average entry fee on all other days, expressed as a percent change. A positive number means fees rise after a losing day.',
  },
  {
    term: 'Post-Big-Win Sizing Change',
    body: 'The average entry fee on days immediately following a top-decile winning day, compared to the average entry fee on all other days, expressed as a percent change.',
  },
  {
    term: 'Cold-Streak Next-Day ROI',
    body: 'The average ROI on days that follow three or more consecutive losing days, compared to a baseline of the average ROI on non-streak days. Requires at least twenty such days to be treated as signal rather than noise.',
  },
  {
    term: 'Opportunity Cost',
    body: 'For any pair of segments (from, to): (fees currently in the "from" segment × historical ROI of the "to" segment) − actual net of the "from" segment. It answers: "if this money had been deployed in your best-known segment at that segment\'s historical ROI, what would the difference have been?"',
  },
  {
    term: 'Confidence',
    body: 'Sample-driven, not opinion-driven. A finding is only surfaced when at least two independent checks against the file agree. The number of agreeing checks is displayed next to every finding. A single check firing is not enough.',
  },
  {
    term: 'Overall ROI Confidence',
    body: 'Computed from the standard error of the mean ROI across the file. HIGH = large sample and small standard error; the file\'s aggregate ROI is a stable read. MEDIUM = usable but sensitive to a bad month. LOW = the aggregate number is inside the range that variance alone can produce, so individual segment-level reads are more reliable than the headline.',
  },
]
