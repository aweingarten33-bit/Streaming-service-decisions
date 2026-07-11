import type { AnalysisReport } from '@/lib/types'
import type { Synthesis, Finding } from '@/lib/advisory-synthesis'
import { fmtMoney } from '@/lib/analysis'
import { downloadBlob } from '@/lib/export'

/**
 * downloadAdvisoryPdf — generate and trigger download of the deep advisory
 * report. Uses @react-pdf/renderer entirely client-side; imports are lazy
 * so the library doesn't bloat the initial bundle.
 */
export async function downloadAdvisoryPdf(report: AnalysisReport, synthesis: Synthesis) {
  const [{ pdf }, { AdvisoryDocument }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./advisory-document'),
  ])
  const blob = await pdf(<AdvisoryDocument report={report} synthesis={synthesis} />).toBlob()
  const filename = `Advisory-Report_${report.platform}_${report.dateRange.start}_${report.dateRange.end}.pdf`
    .replace(/\s+/g, '-')
  await downloadBlob(blob, filename)
}

// Re-export so unused-import warnings don't fire on callers.
export { fmtMoney }
