
import type { AnalysisReport } from './types'
import { fmtMoney } from './analysis'


/* ----------------------------------------------------------------
 * Download a blob as a file. Plain and boring on purpose: create an
 * object URL, click a hidden <a download>, revoke the URL after.
 * This is the standard, broadly-supported approach for a real deployed
 * site (Chrome/Safari/Firefox, desktop and mobile). No iframe-framing
 * guesswork, no popup-window fallback — those are exactly the kind of
 * "clever" branches that fail silently and are hard to debug.
 * ---------------------------------------------------------------- */
export async function downloadBlob(blob: Blob, filename: string) {
  if (!blob || blob.size === 0) {
    throw new Error('Generated file was empty — nothing to download.')
  }

  // --- Path 1: Web Share API with files (the correct way to get a file onto a
  // phone). Opens the native share sheet — "Save to Files", AirDrop, etc. This
  // is what actually works on iOS Safari, where the <a download> anchor is
  // unreliable for blobs, especially after async generation breaks the
  // user-gesture chain. ---
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean
    share?: (data: { files: File[]; title?: string }) => Promise<void>
  }
  try {
    const file = new File([blob], filename, { type: blob.type || 'application/octet-stream' })
    if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
      await nav.share({ files: [file], title: filename })
      return
    }
  } catch (err) {
    // User cancelling the share sheet throws AbortError — that's not a failure,
    // don't fall through to opening tabs in that case.
    if (err instanceof DOMException && err.name === 'AbortError') return
    // otherwise fall through to the anchor method
  }

  // --- Path 2: classic anchor download (desktop browsers honor this) ---
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()

  // Free the blob URL after the browser has had a moment to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

/* ----------------------------------------------------------------
 * PDF — rendered directly with jsPDF (data-driven, no html2canvas).
 * This avoids the Tailwind v4 oklch/oklab parse crash entirely and
 * produces a crisp, selectable, multi-page report.
 * ---------------------------------------------------------------- */
export async function exportPdf(r: AnalysisReport, filename: string) {
  try {
    const { default: jsPDF } = await import('jspdf')
    const pdf = new jsPDF('p', 'mm', 'a4')
    buildPdfContent(pdf, r)
    const blob = pdf.output('blob')
    await downloadBlob(blob, filename)
  } catch (err) {
    console.error('PDF export failed:', err)
    throw new Error(
      err instanceof Error ? `PDF export failed: ${err.message}` : 'PDF export failed for an unknown reason.',
    )
  }
}

/* ----------------------------------------------------------------
 * PDF — professional-services register (law firm / consulting).
 * Serif type (Times), navy + grey palette, formal cover page,
 * prose framing over dashboard color. Data-driven jsPDF; avoids the
 * Tailwind oklch parse crash entirely.
 * ---------------------------------------------------------------- */

/* Corporate palette */
const NAVY: [number, number, number] = [23, 42, 77] // deep corporate navy
const NAVY_LT: [number, number, number] = [64, 88, 133]
const CHARCOAL: [number, number, number] = [38, 43, 51]
const SLATE: [number, number, number] = [90, 98, 112]
const HAIR: [number, number, number] = [205, 210, 219] // hairline rules
const POS: [number, number, number] = [22, 90, 60] // muted forest green
const NEG: [number, number, number] = [140, 32, 38] // muted oxblood red

function buildPdfContent(pdf: import('jspdf').jsPDF, r: AnalysisReport) {
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const M = 22 // generous margins, professional-services style
  const contentW = pageW - M * 2
  let y = M

  const setFill = (c: [number, number, number]) => pdf.setFillColor(c[0], c[1], c[2])
  const setColor = (c: [number, number, number]) => pdf.setTextColor(c[0], c[1], c[2])
  const setStroke = (c: [number, number, number]) => pdf.setDrawColor(c[0], c[1], c[2])

  const FOOTER_H = 16
  const HEADER_H = 18
  const ensure = (needed: number) => {
    if (y + needed > pageH - M - FOOTER_H) {
      pdf.addPage()
      y = M + HEADER_H
    }
  }

  const generated = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  /* ============================ COVER PAGE ============================ */
  // Navy header block
  setFill(NAVY)
  pdf.rect(0, 0, pageW, 58, 'F')
  pdf.setFont('times', 'bold')
  pdf.setFontSize(26)
  pdf.setTextColor(255, 255, 255)
  pdf.text('DFS ANALYSIS ENGINE', M, 34)
  pdf.setFont('times', 'italic')
  pdf.setFontSize(11)
  pdf.setTextColor(200, 208, 222)
  pdf.text('Performance & Bankroll Advisory', M, 44)

  // Title block, vertically centered-ish
  y = 108
  pdf.setFont('times', 'normal')
  pdf.setFontSize(11)
  setColor(SLATE)
  pdf.text('CONFIDENTIAL DIAGNOSTIC REPORT', M, y)
  setStroke(NAVY)
  pdf.setLineWidth(0.4)
  pdf.line(M, y + 3, M + 60, y + 3)
  y += 20

  pdf.setFont('times', 'bold')
  pdf.setFontSize(30)
  setColor(NAVY)
  pdf.text('Daily Fantasy Sports', M, y)
  y += 13
  pdf.text('Leak & Bankroll Assessment', M, y)
  y += 24

  // Prepared-for / meta table
  pdf.setFont('times', 'normal')
  pdf.setFontSize(10.5)
  const metaRows: [string, string][] = [
    ['Platform', r.platform],
    ['Period Reviewed', `${r.dateRange.start}  —  ${r.dateRange.end}`],
    ['Entries Analyzed', r.rowCount.toLocaleString()],
    ['Report Date', generated],
  ]
  metaRows.forEach(([k, v]) => {
    setColor(SLATE)
    pdf.setFont('times', 'normal')
    pdf.text(k.toUpperCase(), M, y)
    setColor(CHARCOAL)
    pdf.setFont('times', 'bold')
    pdf.text(v, M + 55, y)
    setStroke(HAIR)
    pdf.setLineWidth(0.2)
    pdf.line(M, y + 3, M + contentW, y + 3)
    y += 11
  })

  // Cover footer notice
  y = pageH - 46
  setStroke(NAVY)
  pdf.setLineWidth(0.4)
  pdf.line(M, y, M + contentW, y)
  y += 7
  pdf.setFont('times', 'italic')
  pdf.setFontSize(8.5)
  setColor(SLATE)
  const disclaimer =
    'This report is a data-driven diagnostic prepared solely from history files supplied by the recipient. ' +
    'It constitutes performance analysis, not financial, investment, or gambling advice. Figures reflect the ' +
    'uploaded dataset only and may be affected by incomplete or platform-edited records.'
  pdf.text(pdf.splitTextToSize(disclaimer, contentW), M, y)

  /* ============================ BODY PAGES ============================ */
  pdf.addPage()
  y = M + HEADER_H

  const sectionNo = { n: 0 }
  const heading = (text: string) => {
    ensure(18)
    sectionNo.n += 1
    pdf.setFont('times', 'bold')
    pdf.setFontSize(13)
    setColor(NAVY)
    pdf.text(`${romanOrNum(sectionNo.n)}.  ${text}`, M, y)
    y += 3
    setStroke(NAVY)
    pdf.setLineWidth(0.5)
    pdf.line(M, y, M + contentW, y)
    y += 8
  }

  const para = (
    text: string,
    opts: { italic?: boolean; size?: number; color?: [number, number, number] } = {},
  ) => {
    const { italic = false, size = 10.5, color = CHARCOAL } = opts
    pdf.setFont('times', italic ? 'italic' : 'normal')
    pdf.setFontSize(size)
    setColor(color)
    const wrapped = pdf.splitTextToSize(text, contentW)
    for (const w of wrapped) {
      ensure(size * 0.52)
      pdf.text(w, M, y)
      y += size * 0.52
    }
  }

  const gap = (h = 4) => {
    y += h
  }

  const kv = (label: string, value: string, color: [number, number, number] = CHARCOAL) => {
    ensure(7)
    pdf.setFont('times', 'normal')
    pdf.setFontSize(10.5)
    setColor(SLATE)
    pdf.text(label, M, y)
    pdf.setFont('times', 'bold')
    setColor(color)
    pdf.text(value, M + contentW, y, { align: 'right' })
    setStroke(HAIR)
    pdf.setLineWidth(0.2)
    pdf.line(M, y + 2.5, M + contentW, y + 2.5)
    y += 8
  }

  const table = (
    headers: string[],
    rows: { key: string; entries: number; roi: number; net: number }[],
  ) => {
    if (!rows.length) return
    const colW = [contentW * 0.4, contentW * 0.2, contentW * 0.2, contentW * 0.2]
    const rowH = 8
    ensure(rowH * 2)
    // header row: navy underline, no fill (formal, restrained)
    pdf.setFont('times', 'bold')
    pdf.setFontSize(9.5)
    setColor(NAVY)
    let x = M
    headers.forEach((h, i) => {
      const alignRight = i >= 1
      pdf.text(h, alignRight ? x + colW[i] - 2 : x, y, { align: alignRight ? 'right' : 'left' })
      x += colW[i]
    })
    y += 2.5
    setStroke(NAVY)
    pdf.setLineWidth(0.5)
    pdf.line(M, y, M + contentW, y)
    y += 5.5
    // body
    rows.forEach((b) => {
      ensure(rowH)
      const cells = [b.key, b.entries.toLocaleString(), `${b.roi.toFixed(1)}%`, fmtMoney(b.net)]
      x = M
      cells.forEach((c, i) => {
        const alignRight = i >= 1
        pdf.setFont('times', i === 0 ? 'bold' : 'normal')
        pdf.setFontSize(10)
        if (i === 2 || i === 3) setColor(b.net >= 0 && b.roi >= 0 ? POS : NEG)
        else setColor(CHARCOAL)
        pdf.text(c, alignRight ? x + colW[i] - 2 : x, y, { align: alignRight ? 'right' : 'left' })
        x += colW[i]
      })
      y += 1.5
      setStroke(HAIR)
      pdf.setLineWidth(0.15)
      pdf.line(M, y, M + contentW, y)
      y += rowH - 1.5
    })
    gap(6)
  }

  // RAG status dot + label row for the scorecard
  const statusRGB = (s: 'GREEN' | 'AMBER' | 'RED'): [number, number, number] =>
    s === 'GREEN' ? [22, 110, 70] : s === 'AMBER' ? [176, 130, 30] : NEG
  const scorecardRow = (m: import('./types').ScorecardMetric) => {
    ensure(13)
    // status dot
    setFill(statusRGB(m.status))
    pdf.circle(M + 1.5, y - 1.4, 1.4, 'F')
    // label + grade
    pdf.setFont('times', 'bold')
    pdf.setFontSize(10.5)
    setColor(NAVY)
    pdf.text(m.label, M + 6, y)
    pdf.setFontSize(11)
    setColor(statusRGB(m.status))
    pdf.text(m.grade, M + contentW - 3, y, { align: 'right' })
    // value / target
    pdf.setFont('times', 'normal')
    pdf.setFontSize(9)
    setColor(CHARCOAL)
    pdf.text(m.value, M + 6, y + 4.5)
    setColor(SLATE)
    pdf.text(`Target: ${m.target}`, M + contentW - 12, y + 4.5, { align: 'right' })
    y += 6.5
    // note
    pdf.setFont('times', 'italic')
    pdf.setFontSize(8.5)
    setColor(SLATE)
    const wrapped = pdf.splitTextToSize(m.note, contentW - 6)
    pdf.text(wrapped, M + 6, y)
    y += wrapped.length * 4 + 2
    setStroke(HAIR)
    pdf.setLineWidth(0.15)
    pdf.line(M, y, M + contentW, y)
    y += 4
  }

  const reallocTable = (moves: import('./types').ReallocationMove[]) => {
    const cols = [contentW * 0.28, contentW * 0.18, contentW * 0.26, contentW * 0.28]
    const headers = ['Reallocate From', 'ROI There', 'Redeploy To', 'Projected Swing']
    ensure(16)
    pdf.setFont('times', 'bold'); pdf.setFontSize(9.5); setColor(NAVY)
    let x = M
    headers.forEach((h, i) => {
      const ar = i >= 1
      pdf.text(h, ar ? x + cols[i] - 2 : x, y, { align: ar ? 'right' : 'left' })
      x += cols[i]
    })
    y += 2.5
    setStroke(NAVY); pdf.setLineWidth(0.5); pdf.line(M, y, M + contentW, y); y += 5.5
    moves.forEach((m) => {
      ensure(9)
      const cells = [m.fromSegment, `${m.fromRoi.toFixed(1)}%`, m.toSegment, `${fmtMoney(m.swing)}`]
      x = M
      cells.forEach((c, i) => {
        const ar = i >= 1
        pdf.setFont('times', i === 0 ? 'bold' : 'normal'); pdf.setFontSize(9.5)
        if (i === 1) setColor(NEG)
        else if (i === 3) setColor(POS)
        else setColor(CHARCOAL)
        const txt = pdf.splitTextToSize(c, cols[i] - 3)
        pdf.text(txt, ar ? x + cols[i] - 2 : x, y, { align: ar ? 'right' : 'left' })
        x += cols[i]
      })
      y += 1.5
      setStroke(HAIR); pdf.setLineWidth(0.15); pdf.line(M, y, M + contentW, y)
      y += 6.5
    })
    gap(4)
  }

  /* ---- I. Executive Summary ---- */
  heading('Executive Summary')
  para(r.executiveSummary)
  gap(3)
  kv('Lifetime Return on Investment', `${r.roi >= 0 ? '+' : ''}${r.roi.toFixed(1)}%`, r.roi >= 0 ? POS : NEG)
  kv('Net Profit / (Loss)', fmtMoney(r.netProfit), r.netProfit >= 0 ? POS : NEG)
  kv('Total Entries', r.lifetimeEntries.toLocaleString())
  kv('Win Rate (In-the-Money)', `${r.winRate.toFixed(1)}%`)
  kv('Strongest Segment', r.bestSport, POS)
  kv('Weakest Segment', r.worstSport, NEG)
  if (r.reallocation.hasData) {
    kv('Est. Cost of Misallocation', fmtMoney(r.reallocation.totalProjectedSwing), NEG)
  }
  gap(6)

  /* ---- II. Health Scorecard ---- */
  heading('Health Scorecard')
  para(
    'A diagnostic read of your current condition. Green indicates a strength, amber a watch-item, ' +
      'red a priority to address. Grades and targets follow.',
    { italic: true, color: SLATE },
  )
  gap(4)
  r.scorecard.forEach(scorecardRow)
  gap(4)

  /* ---- III. Capital Discipline Assessment ---- */
  heading('Capital Discipline Assessment')
  if (r.disciplineScore.provisional) {
    para(
      'Insufficient qualified history to produce a reliable Capital Discipline Score. A minimum ' +
        'threshold of entries and staked capital is required before this measure is reported.',
      { italic: true, color: SLATE },
    )
  } else {
    const s = r.disciplineScore.score ?? 0
    para(
      'The Capital Discipline Score measures the share of your statistically-qualified capital that was ' +
        'allocated to segments your own results show you can beat, net of penalties for overexposure, ' +
        'loss-chasing, and concentration.',
    )
    gap(3)
    kv('Capital Discipline Score', `${s.toFixed(0)} / 100`, s >= 70 ? POS : s >= 45 ? NAVY : NEG)
    kv('Edge-Aligned Allocation', `${r.disciplineScore.allocationScore.toFixed(0)}%`)
    kv('Behavioral Penalty Applied', `\u2212${r.disciplineScore.penalty.toFixed(0)} points`)
    kv('Qualified Capital Assessed', fmtMoney(r.disciplineScore.classifiedCapital))
  }
  gap(6)

  /* ---- IV. Performance by Segment ---- */
  heading('Performance by Segment')
  para('Results segmented by sport, contest structure, and buy-in tier.', { italic: true, color: SLATE })
  gap(4)
  pdf.setFont('times', 'bold'); pdf.setFontSize(10.5); setColor(NAVY)
  ensure(8); pdf.text('By Sport', M, y); y += 6
  table(['Segment', 'Entries', 'ROI', 'Net'], r.sportBreakdown)
  pdf.setFont('times', 'bold'); pdf.setFontSize(10.5); setColor(NAVY)
  ensure(8); pdf.text('By Contest Type', M, y); y += 6
  table(['Segment', 'Entries', 'ROI', 'Net'], r.contestTypeBreakdown)
  pdf.setFont('times', 'bold'); pdf.setFontSize(10.5); setColor(NAVY)
  ensure(8); pdf.text('By Buy-In Tier', M, y); y += 6
  table(['Segment', 'Entries', 'ROI', 'Net'], r.buyinBreakdown)

  /* ---- V. Financial Impact & Reallocation ---- */
  heading('Financial Impact & Reallocation')
  if (r.reallocation.hasData) {
    para(
      `The single most valuable question this report answers is not "where did you lose?" but ` +
        `"what did that loss cost you versus your best alternative?" Below, each losing segment is ` +
        `compared against ${r.reallocation.anchorSegment}, your strongest proven pocket at ` +
        `+${r.reallocation.anchorRoi.toFixed(1)}% ROI. "Projected Swing" is what the same capital ` +
        `would have returned there, based on your own historical results.`,
    )
    gap(4)
    reallocTable(r.reallocation.moves)
    para(
      `Estimated total opportunity cost of misallocation: ${fmtMoney(r.reallocation.totalProjectedSwing)}. ` +
        `This is a counterfactual based on your own past ROI — a measure of opportunity cost, not a ` +
        `forecast of future profit. Variance and small samples still apply.`,
      { italic: true, color: SLATE },
    )
  } else {
    para(
      'Insufficient positive-ROI history to compute a reliable reallocation analysis. Once you have a ' +
        'proven-winning segment with adequate sample, this section will quantify the cost of capital ' +
        'deployed elsewhere.',
      { italic: true, color: SLATE },
    )
  }
  gap(6)

  /* ---- VI. Key Findings ---- */
  heading('Key Findings & Root-Cause Analysis')
  r.findings.forEach((f, i) => {
    ensure(34)
    pdf.setFont('times', 'bold'); pdf.setFontSize(10.5); setColor(NAVY)
    pdf.text(`Finding ${i + 1}.`, M, y)
    setColor(f.severity === 'CRITICAL' ? NEG : CHARCOAL)
    const titleWrapped = pdf.splitTextToSize(f.title, contentW - 40)
    pdf.text(titleWrapped, M + 22, y)
    pdf.setFont('times', 'italic'); pdf.setFontSize(8.5); setColor(SLATE)
    pdf.text(`[${f.severity}]`, M + contentW, y, { align: 'right' })
    y += titleWrapped.length * 5 + 1
    const field = (label: string, text: string, color = CHARCOAL) => {
      ensure(8)
      pdf.setFont('times', 'bold'); pdf.setFontSize(9); setColor(NAVY)
      pdf.text(label, M + 4, y)
      pdf.setFont('times', 'normal'); setColor(color)
      const w = pdf.splitTextToSize(text, contentW - 34)
      pdf.text(w, M + 30, y)
      y += w.length * 4.4 + 1.5
    }
    field('What we found', f.whatWeFound)
    field('Why it matters', f.whyItMatters)
    field('Root cause', f.rootCause)
    field('Recommendation', f.recommendation, POS)
    gap(4)
  })

  /* ---- VII. Prioritized Roadmap ---- */
  heading('Prioritized Action Roadmap')
  const phaseLabel: Record<string, string> = {
    QUICK_WIN: 'Quick Wins — Before Your Next Slate',
    MEDIUM: 'Medium-Term — This Month',
    LONG_TERM: 'Long-Term — Next 3–6 Months',
  }
  ;(['QUICK_WIN', 'MEDIUM', 'LONG_TERM'] as const).forEach((phase) => {
    const items = r.phasedPlan.filter((p) => p.phase === phase)
    if (!items.length) return
    ensure(12)
    pdf.setFont('times', 'bold'); pdf.setFontSize(11); setColor(NAVY)
    pdf.text(phaseLabel[phase], M, y)
    y += 2.5
    setStroke(NAVY); pdf.setLineWidth(0.3); pdf.line(M, y, M + contentW, y); y += 6
    items.forEach((item, idx) => {
      ensure(16)
      pdf.setFont('times', 'bold'); pdf.setFontSize(10); setColor(CHARCOAL)
      const aw = pdf.splitTextToSize(`${idx + 1}. ${item.action}`, contentW - 26)
      pdf.text(aw, M, y)
      // priority tag
      pdf.setFont('times', 'italic'); pdf.setFontSize(8); setColor(item.priority === 'HIGH' ? NEG : SLATE)
      pdf.text(item.priority, M + contentW, y, { align: 'right' })
      y += aw.length * 4.8 + 1
      pdf.setFont('times', 'normal'); pdf.setFontSize(9); setColor(SLATE)
      const rw = pdf.splitTextToSize(item.rationale, contentW - 6)
      pdf.text(rw, M + 6, y)
      y += rw.length * 4.2 + 1
      pdf.setFont('times', 'italic'); pdf.setFontSize(9); setColor(POS)
      const bw = pdf.splitTextToSize(`Expected benefit: ${item.expectedBenefit}`, contentW - 6)
      pdf.text(bw, M + 6, y)
      y += bw.length * 4.2 + 4
    })
    gap(3)
  })

  /* ---- VIII. Advisor's Narrative ---- */
  heading("Advisor's Narrative")
  r.narrative.split('\n').filter(Boolean).forEach((p) => {
    para(p)
    gap(1.5)
  })

  /* ---- IX. Glossary / Appendix ---- */
  heading('Appendix — Glossary of Terms')
  para('Definitions for the metrics and abbreviations used throughout this report.', { italic: true, color: SLATE })
  gap(4)
  r.glossary.forEach((g) => {
    ensure(11)
    pdf.setFont('times', 'bold'); pdf.setFontSize(9.5); setColor(NAVY)
    pdf.text(g.term, M, y)
    y += 4.2
    pdf.setFont('times', 'normal'); pdf.setFontSize(9); setColor(CHARCOAL)
    const w = pdf.splitTextToSize(g.definition, contentW)
    pdf.text(w, M, y)
    y += w.length * 4 + 3
  })

  /* ============================ HEADERS & FOOTERS ============================ */
  const pageCount = pdf.getNumberOfPages()
  for (let p = 2; p <= pageCount; p++) {
    pdf.setPage(p)
    // running header
    pdf.setFont('times', 'italic')
    pdf.setFontSize(8)
    setColor(SLATE)
    pdf.text('DFS Analysis Engine — Confidential Diagnostic Report', M, M - 4)
    setStroke(HAIR)
    pdf.setLineWidth(0.2)
    pdf.line(M, M, M + contentW, M)
    // footer
    const fy = pageH - 12
    setStroke(HAIR)
    pdf.setLineWidth(0.2)
    pdf.line(M, fy - 4, pageW - M, fy - 4)
    pdf.setFont('times', 'normal')
    pdf.setFontSize(8)
    setColor(SLATE)
    pdf.text('Prepared from recipient-supplied data · Confidential', M, fy)
    pdf.text(`Page ${p - 1} of ${pageCount - 1}`, pageW - M, fy, { align: 'right' })
  }
}

function romanOrNum(n: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
  return romans[n - 1] ?? String(n)
}

/* ---------------- Word (.docx via docx package) ---------------- */

export async function exportWord(r: AnalysisReport, filename: string) {
  try {
    const blob = await buildWordBlob(r)
    await downloadBlob(blob, filename)
  } catch (err) {
    console.error('Word export failed:', err)
    throw new Error(
      err instanceof Error ? `Word export failed: ${err.message}` : 'Word export failed for an unknown reason.',
    )
  }
}

async function buildWordBlob(r: AnalysisReport): Promise<Blob> {
  const docx = await import('docx')
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    Table,
    TableRow,
    TableCell,
    WidthType,
    BorderStyle,
    AlignmentType,
  } = docx

  const H = (text: string, level: (typeof HeadingLevel)[keyof typeof HeadingLevel]) =>
    new Paragraph({ text, heading: level, spacing: { before: 240, after: 120 } })

  const P = (text: string, bold = false) =>
    new Paragraph({
      children: [new TextRun({ text, bold, font: 'Consolas', size: 20 })],
      spacing: { after: 80 },
    })

  const cell = (text: string, bold = false) =>
    new TableCell({
      children: [
        new Paragraph({
          children: [new TextRun({ text, bold, font: 'Consolas', size: 18 })],
        }),
      ],
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
    })

  const bucketTable = (
    headers: string[],
    rows: { key: string; entries: number; roi: number; net: number }[],
  ) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
        left: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
        right: { style: BorderStyle.SINGLE, size: 4, color: '000000' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: '999999' },
      },
      rows: [
        new TableRow({ children: headers.map((h) => cell(h, true)) }),
        ...rows.map(
          (b) =>
            new TableRow({
              children: [
                cell(b.key),
                cell(String(b.entries)),
                cell(`${b.roi.toFixed(1)}%`),
                cell(fmtMoney(b.net)),
              ],
            }),
        ),
      ],
    })

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial' } },
      },
    },
    sections: [
      {
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: 'DFS ANALYSIS ENGINE', bold: true, size: 48, color: '000000' }),
            ],
            alignment: AlignmentType.LEFT,
          }),
          P(`DFS LEAK REPORT — ${r.platform.toUpperCase()}`, true),
          P(`${r.dateRange.start} → ${r.dateRange.end}  //  ${r.rowCount} entries`),

          H('EXECUTIVE SUMMARY', HeadingLevel.HEADING_1),
          P(r.executiveSummary),
          P(`Lifetime ROI: ${r.roi.toFixed(1)}%`, true),
          P(`Net P&L: ${fmtMoney(r.netProfit)}`, true),
          P(`Total Entries: ${r.lifetimeEntries}   Win Rate: ${r.winRate.toFixed(1)}%`),
          P(`Best Sport: ${r.bestSport}   Worst Sport: ${r.worstSport}`),
          P(`Biggest Leak: ${r.biggestLeak}`),

          H('CAPITAL DISCIPLINE SCORE', HeadingLevel.HEADING_1),
          ...(r.disciplineScore.provisional
            ? [P('PROVISIONAL — not enough classified history yet to score reliably.')]
            : [
                P(`${(r.disciplineScore.score ?? 0).toFixed(0)} / 100`, true),
                P(
                  `Allocation: ${r.disciplineScore.allocationScore.toFixed(0)}%   Penalty: -${r.disciplineScore.penalty.toFixed(0)}   Classified capital: ${fmtMoney(r.disciplineScore.classifiedCapital)}`,
                ),
                P(
                  '% of your proven-sample capital that went to spots your own data shows you can beat, minus a penalty for overbetting, loss-chasing, and concentration.',
                ),
              ]),

          H('HEALTH SCORECARD', HeadingLevel.HEADING_1),
          ...r.scorecard.flatMap((m) => [
            P(`${m.label} — Grade ${m.grade} (${m.status})`, true),
            P(`   ${m.value}   |   Target: ${m.target}`),
            P(`   ${m.note}`),
          ]),

          H('BY SPORT', HeadingLevel.HEADING_1),
          bucketTable(['Sport', 'Entries', 'ROI', 'Net'], r.sportBreakdown),

          H('BY CONTEST TYPE', HeadingLevel.HEADING_1),
          bucketTable(['Type', 'Entries', 'ROI', 'Net'], r.contestTypeBreakdown),

          H('BY BUY-IN', HeadingLevel.HEADING_1),
          bucketTable(['Band', 'Entries', 'ROI', 'Net'], r.buyinBreakdown),

          H('FINANCIAL IMPACT & REALLOCATION', HeadingLevel.HEADING_1),
          ...(r.reallocation.hasData
            ? [
                P(
                  `Each losing segment is measured against ${r.reallocation.anchorSegment}, your strongest proven pocket at +${r.reallocation.anchorRoi.toFixed(1)}% ROI. "Swing" is what that capital would have returned there, based on your own history.`,
                ),
                ...r.reallocation.moves.map((m) =>
                  P(
                    `Move from ${m.fromSegment} (${m.fromRoi.toFixed(1)}% ROI) → ${m.toSegment}. Projected swing: ${fmtMoney(m.swing)}.`,
                  ),
                ),
                P(
                  `Estimated total opportunity cost: ${fmtMoney(r.reallocation.totalProjectedSwing)}. This is a counterfactual from your own past ROI — opportunity cost, not a forecast. Variance applies.`,
                  true,
                ),
              ]
            : [P('Insufficient positive-ROI history to compute a reliable reallocation analysis.')]),

          H('KEY FINDINGS & ROOT-CAUSE ANALYSIS', HeadingLevel.HEADING_1),
          ...r.findings.flatMap((f, i) => [
            P(`Finding ${i + 1}. [${f.severity}] ${f.title}`, true),
            P(`   What we found: ${f.whatWeFound}`),
            P(`   Why it matters: ${f.whyItMatters}`),
            P(`   Root cause: ${f.rootCause}`),
            P(`   Recommendation: ${f.recommendation}`),
          ]),

          H('PRIORITIZED ACTION ROADMAP', HeadingLevel.HEADING_1),
          ...(['QUICK_WIN', 'MEDIUM', 'LONG_TERM'] as const).flatMap((phase) => {
            const label =
              phase === 'QUICK_WIN'
                ? 'Quick Wins — Before Your Next Slate'
                : phase === 'MEDIUM'
                  ? 'Medium-Term — This Month'
                  : 'Long-Term — Next 3–6 Months'
            const items = r.phasedPlan.filter((p) => p.phase === phase)
            if (!items.length) return []
            return [
              P(label, true),
              ...items.flatMap((item, idx) => [
                P(`   ${idx + 1}. ${item.action}  [${item.priority}]`),
                P(`      ${item.rationale}`),
                P(`      Expected benefit: ${item.expectedBenefit}`),
              ]),
            ]
          }),

          H('ADVISOR\u2019S NARRATIVE', HeadingLevel.HEADING_1),
          ...r.narrative.split('\n').map((line) => P(line)),

          H('APPENDIX — GLOSSARY OF TERMS', HeadingLevel.HEADING_1),
          ...r.glossary.flatMap((g) => [P(g.term, true), P(`   ${g.definition}`)]),
        ],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  return blob
}
