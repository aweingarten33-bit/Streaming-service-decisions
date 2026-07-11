"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Papa from "papaparse";
import { useStore } from "@/lib/store";
import { analyze, buildRows, autoMapHeaders, fmtMoney } from "@/lib/analysis";
import { generateNarrative } from "@/lib/coach";
import { sampleCsv } from "@/lib/sample";
import { AdvisoryOverview } from "@/components/report/advisory-overview";
import { BrutalButton } from "@/components/punk/brutal-button";
import { cn } from "@/lib/utils";

export function ReportsClient() {
  const { reports, activeReportId, setActive, removeReport, addReport } = useStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const active = reports.find((r) => r.id === activeReportId) ?? reports[0];

  const loadSample = () => {
    const res = Papa.parse<Record<string, string>>(sampleCsv(), {
      header: true,
      skipEmptyLines: true,
    });
    const data = res.data.filter((r) => Object.keys(r).length > 1);
    const map = autoMapHeaders(res.meta.fields ?? []);
    const rows = buildRows(data, map);
    const report = analyze(rows, "DFS", "sample-history.csv");
    const { executiveSummary, narrative } = generateNarrative(report);
    report.executiveSummary = executiveSummary;
    report.narrative = narrative;
    addReport(report);
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-[#05060a] text-white">
        <div className="mx-auto max-w-7xl px-4 pt-24">
          <div className="font-mono text-xs uppercase tracking-[0.4em] text-neutral-500">Loading reports…</div>
        </div>
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="relative min-h-screen bg-[#05060a] text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-40 top-10 h-[60vw] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(127,232,255,0.10),transparent_60%)]" />
          <div className="absolute -right-40 top-40 h-[70vw] w-[70vw] rounded-full bg-[radial-gradient(circle,rgba(184,132,255,0.10),transparent_60%)]" />
        </div>
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-24 sm:pt-28">
          <div className="mb-3 h-px w-16 bg-gradient-to-r from-[#7fe8ff] to-transparent" />
          <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-neutral-500">Chapter 03 · Verdict</div>
          <h1 className="mt-3 font-display text-[12vw] font-light leading-[0.98] tracking-tight sm:text-6xl">
            No{" "}
            <span className="bg-gradient-to-r from-[#7fe8ff] via-[#b884ff] to-[#ff8ad6] bg-clip-text text-transparent">
              readings
            </span>{" "}
            yet.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-neutral-400">
            Upload a contest history to get the diagnostic. No CSV handy? Generate a sample report to see the full breakdown.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/upload">
              <BrutalButton variant="lime" size="lg">UPLOAD CSV →</BrutalButton>
            </Link>
            <BrutalButton variant="orange" size="lg" onClick={loadSample}>
              GENERATE SAMPLE REPORT
            </BrutalButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#05060a] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-10 h-[60vw] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(127,232,255,0.10),transparent_60%)]" />
        <div className="absolute -right-40 top-40 h-[70vw] w-[70vw] rounded-full bg-[radial-gradient(circle,rgba(184,132,255,0.10),transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 pb-16 pt-24 sm:pt-28">
        <div className="mb-10 sm:mb-14">
          <div className="mb-3 h-px w-16 bg-gradient-to-r from-[#7fe8ff] to-transparent" />
          <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-neutral-500">Chapter 03 · Verdict</div>
          <h1 className="mt-3 font-display text-[12vw] font-light leading-[0.98] tracking-tight sm:text-6xl">
            The{" "}
            <span className="bg-gradient-to-r from-[#7fe8ff] via-[#b884ff] to-[#ff8ad6] bg-clip-text text-transparent">
              diagnosis
            </span>
            .
          </h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-3">
          <Link href="/upload" className="block">
            <BrutalButton variant="lime" size="sm" className="w-full">
              + NEW UPLOAD
            </BrutalButton>
          </Link>
          {reports.map((r) => {
            const isActive = active?.id === r.id;
            return (
              <motion.button
                key={r.id}
                layout
                onClick={() => setActive(r.id)}
                className={cn(
                  "w-full border p-3 text-left backdrop-blur transition-colors",
                  isActive
                    ? "border-[#7fe8ff]/60 bg-white/[0.04]"
                    : "border-white/10 bg-white/[0.02] hover:border-white/30",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-500">
                    {r.platform}
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeReport(r.id);
                    }}
                    className="font-mono text-[10px] text-[#ff8ad6] hover:underline"
                  >
                    DELETE
                  </span>
                </div>
                <div className="mt-1 truncate font-mono text-xs text-neutral-200">{r.filename}</div>
                <div
                  className={cn(
                    "mt-1 font-display text-2xl leading-none",
                    r.netProfit >= 0 ? "text-[#7fe8ff]" : "text-[#ff8ad6]",
                  )}
                >
                  {r.roi >= 0 ? "+" : ""}
                  {r.roi.toFixed(1)}%
                </div>
                <div className="font-mono text-[10px] text-neutral-500">
                  {fmtMoney(r.netProfit)} // {r.rowCount} entries
                </div>
              </motion.button>
            );
          })}
        </aside>

        {active && (
          <div className="min-w-0 bg-paper p-5 text-ink shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 sm:p-8">
            <AdvisoryOverview key={active.id} report={active} />
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
