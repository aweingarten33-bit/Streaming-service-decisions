"use client";

import type { AnalysisReport, Finding } from '@/lib/types'
import { fmtMoney } from '@/lib/analysis'
import { Reveal } from '@/components/fx/reveal'
import { cn } from '@/lib/utils'
import { AdvisorLetter, KpiCard, NextSteps, ReportHeader, SectionHeading } from './_shared'

/**
 * Root Cause Analysis — NASA "5 Whys" applied to the largest finding.
 */
export function RootCauseReportView({ report }: { report: AnalysisReport }) {
  const primary =
    [...report.findings]
      .filter((f) => f.dollarImpact < 0)
      .sort((a, b) => a.dollarImpact - b.dollarImpact)[0] ?? report.findings[0]

  return (
    <div className="space-y-12 sm:space-y-16">
      <AdvisorLetter
        signedBy="The Root-Cause Desk"
        headline={
          primary
            ? `The biggest hole in your bankroll traces back to one thing — and it's fixable.`
            : 'Not enough data yet to isolate a single root cause.'
        }
        body={
          <>
            <p>
              A root cause is the earliest link in the chain — the one that, if broken,
              would have kept everything after it from happening. We took the biggest
              dollar loss in your history and walked it backward, one honest question at
              a time.
            </p>
            <p>
              What you'll see below is not blame. It's the specific decision (or the
              specific missing rule) that made the loss possible in the first place. Once
              you can name it, you can write a rule that stops it from recurring — which
              is the whole point.
            </p>
          </>
        }
      />

      <ReportHeader
        badge="⌘ WHY IT HAPPENED"
        title="The one link in the chain that started it."
        epigraph="We took your biggest single loss and walked it backward — what happened, why it happened, and the missing rule that let it happen in the first place. Fix the root; the rest stops repeating."
        report={report}
      />

      {!primary ? (
        <p className="border border-dashed border-ink/25 p-3 font-mono text-xs text-muted-foreground">Insufficient findings to run root-cause on.</p>
      ) : (
        <>
          <Reveal>
            <div className="grid gap-3 sm:grid-cols-3">
              <KpiCard label="THE FINDING" value={primary.title.length > 24 ? primary.title.slice(0, 24) + '…' : primary.title} tone="bad" caption={`Severity: ${primary.severity.toLowerCase()}`} />
              <KpiCard label="WHAT IT COST" value={fmtMoney(primary.dollarImpact)} tone="bad" caption="Real dollars traced to this one cause." />
              <KpiCard label="HOW SURE WE ARE" value={report.chess.overallConfidence.level === 'HIGH' ? 'Very' : report.chess.overallConfidence.level === 'MEDIUM' ? 'Fairly' : 'Not very'} tone={report.chess.overallConfidence.level === 'HIGH' ? 'good' : 'warn'} caption="How confident we are in this read. Depends on how many entries you've played." />
            </div>
          </Reveal>

          <Reveal>
            <FiveWhys finding={primary} />
          </Reveal>
        </>
      )}

      <Reveal>
        <div>
          <SectionHeading n="02" title="THINGS THAT MADE IT WORSE" subtitle="Other patterns that show up in your history and make the main problem more likely — or more expensive when it hits." />
          <div className="space-y-2">
            {report.findings.slice(1, 5).map((f) => (
              <div key={f.id} className={cn('border p-3', f.severity === 'CRITICAL' ? 'border-hotred' : f.severity === 'HIGH' ? 'border-amber-500' : 'border-ink')}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">{f.title}</div>
                  <div className="font-mono text-xs text-hotred">{fmtMoney(f.dollarImpact)}</div>
                </div>
                <p className="mt-1 font-serif text-sm text-ink/80">{f.rootCause}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="03" title="WHAT TO DO ABOUT IT" subtitle="Rules — not resolutions. The goal is to make the same mistake impossible next time, not to remember harder." />
          <ol className="space-y-2">
            {report.phasedPlan.slice(0, 5).map((p, i) => (
              <li key={i} className="border border-ink p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="font-mono text-xs font-bold uppercase tracking-widest text-ink">
                    {p.phase.replace('_', ' ')} · {p.priority}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">{p.expectedBenefit}</div>
                </div>
                <p className="mt-2 font-serif text-base text-ink">{p.action}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{p.rationale}</p>
              </li>
            ))}
          </ol>
        </div>
      </Reveal>

      <Reveal>
        <div>
          <SectionHeading n="04" title="HOW YOU'LL KNOW IT'S WORKING" subtitle="Three numbers to watch, in the order they'll move." />
          <div className="grid gap-3 sm:grid-cols-3">
            <KpiCard label="MOVES FIRST" value="Chase %" caption="How often you bet more after a losing day. Moves within a week of following the rule." />
            <KpiCard label="MOVES NEXT" value="Discipline" caption="Your overall discipline score. Should climb over three uploads." />
            <KpiCard label="MOVES LAST" value="ROI" caption="Slowest to move. Do not judge the plan by this in the first month." />
          </div>
        </div>
      </Reveal>

      <Reveal>
        <NextSteps
          intro="One rule to write down today. One habit to build this week. One number to check next month."
          steps={[
            {
              do: primary?.recommendation
                ? primary.recommendation
                : 'Cut the entries in your worst-performing spot in half for the next 30 days.',
              because: primary?.rootCause
                ? primary.rootCause
                : "It's the fastest way to break the pattern that's costing you the most.",
            },
            {
              do: 'Every Sunday, review the past week and note whether you followed the rule above. One line, in writing.',
              because: 'The rule only matters if you know when you broke it.',
            },
            {
              do: 'Upload fresh data in 30 days. Check that the "Chase %" number moved before you check ROI.',
              because: 'ROI is the last thing to change. If Chase % moves, the rule is working — the rest follows.',
            },
          ]}
        />
      </Reveal>
    </div>
  )
}

function FiveWhys({ finding }: { finding: Finding }) {
  const whys = [
    { q: `What happened?`, a: finding.whatWeFound },
    { q: `Why did that happen?`, a: finding.whyItMatters },
    { q: `Why was that possible?`, a: finding.rootCause },
    {
      q: `Why wasn't it prevented?`,
      a: `No written rule exists in the current playbook to constrain this pattern before it exceeds acceptable dollar impact.`,
    },
    {
      q: `Why has it recurred?`,
      a: `The recurring cost is being attributed to variance instead of policy — so the policy has not been rewritten.`,
    },
  ]
  return (
    <div>
      <SectionHeading n="01" title="FIVE WHYS" subtitle={`Primary finding: ${finding.title}`} />
      <ol className="space-y-2">
        {whys.map((w, i) => (
          <li key={i} className="border border-ink p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">WHY {i + 1}</div>
            <div className="mt-1 font-mono text-sm font-bold uppercase tracking-widest text-ink">{w.q}</div>
            <p className="mt-2 font-serif text-base leading-relaxed text-ink">{w.a}</p>
          </li>
        ))}
      </ol>
      <div className="mt-4 border border-profit p-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-profit">ROOT CAUSE</div>
        <p className="mt-2 font-serif text-lg leading-relaxed text-ink">{finding.rootCause}</p>
        <div className="mt-4 border-t border-profit/40 pt-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-profit">RECOMMENDATION</div>
          <p className="mt-2 font-serif text-base leading-relaxed text-ink">{finding.recommendation}</p>
        </div>
      </div>
    </div>
  )
}