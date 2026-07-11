import type { AnalysisReport } from './types'
import { generateNarrative } from './coach'

/**
 * Tries the real LLM coach (app/api/coach). If the API key isn't configured,
 * the request fails, or the model returns something malformed, falls back to
 * the deterministic template so the report is never blocked on the network.
 */
export async function getNarrative(
  report: AnalysisReport,
): Promise<{ executiveSummary: string; narrative: string; source: 'llm' | 'template' }> {
  try {
    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    })
    if (!res.ok) throw new Error('coach api failed')
    const data = await res.json()
    if (!data.executiveSummary || !data.narrative) throw new Error('malformed')
    return { ...data, source: 'llm' }
  } catch {
    return { ...generateNarrative(report), source: 'template' }
  }
}
