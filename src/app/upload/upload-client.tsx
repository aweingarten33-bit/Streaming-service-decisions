"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import Papa from "papaparse";
import { AnimatePresence, motion } from "framer-motion";
import { BrutalButton } from "@/components/punk/brutal-button";
import { BrutalCard } from "@/components/punk/brutal-card";
import { Terminal } from "@/components/punk/terminal";
import { autoMapHeaders, buildRows, analyze } from "@/lib/analysis";
import { getNarrative } from "@/lib/coach-client";
import { sampleCsv } from "@/lib/sample";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Stage = "idle" | "parsing" | "review" | "analyzing" | "done";

const FIELD_LABELS: Record<string, string> = {
  sport: "Sport",
  contestName: "Contest Name",
  date: "Date (EST)",
  entryFee: "Entry Fee",
  winningsNonTicket: "Winnings",
  winningsTicket: "Winnings (Ticket)",
  gameType: "Game Type",
  contestEntries: "Field Size",
  place: "Place",
  points: "Points",
  prizePool: "Prize Pool",
  contestKey: "Contest Key",
  entryKey: "Entry Key",
};

export function UploadClient() {
  const router = useRouter();
  const addReport = useStore((s) => s.addReport);
  const activeReportId = useStore((s) => s.activeReportId);
  const inputRef = useRef<HTMLInputElement>(null);

  const platform = "DFS";
  const [stage, setStage] = useState<Stage>("idle");
  const [dragging, setDragging] = useState(false);
  const [filename, setFilename] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});

  const parseFile = useCallback((file: File) => {
    setError(null);
    setFilename(file.name);
    setStage("parsing");
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const data = res.data.filter((r) => Object.keys(r).length > 1);
        if (!data.length) {
          setError("No data rows detected. Is this a valid DraftKings/FanDuel export?");
          setStage("idle");
          return;
        }
        const hdrs = res.meta.fields ?? Object.keys(data[0]);
        setHeaders(hdrs);
        setRawRows(data);
        setMapping(autoMapHeaders(hdrs));
      },
      error: () => {
        setError("Failed to parse file. Check the format and try again.");
        setStage("idle");
      },
    });
  }, []);

  const parseString = useCallback((csv: string, name: string) => {
    setError(null);
    setFilename(name);
    setStage("parsing");
    const res = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    });
    const data = res.data.filter((r) => Object.keys(r).length > 1);
    const hdrs = res.meta.fields ?? Object.keys(data[0]);
    setHeaders(hdrs);
    setRawRows(data);
    setMapping(autoMapHeaders(hdrs));
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const runAnalysis = () => {
    setStage("analyzing");
    setTimeout(async () => {
      try {
        const rows = buildRows(rawRows, mapping);
        if (!rows.length) {
          setError("No valid contest rows after mapping. Check your column matches.");
          setStage("review");
          return;
        }
        const report = analyze(rows, platform, filename || "history.csv");
        const { executiveSummary, narrative } = await getNarrative(report);
        report.executiveSummary = executiveSummary;
        report.narrative = narrative;
        addReport(report);
      } catch {
        setError("Analysis failed. Try correcting your column mappings.");
        setStage("review");
      }
    }, 50);
  };

  const sports = [
    ...new Set(
      rawRows.map((r) => (mapping.sport ? r[mapping.sport] : "")).filter(Boolean),
    ),
  ];

  return (
    <div className="relative min-h-screen bg-[#05060a] text-white">
      {/* soft neon radials à la landing */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 top-10 h-[60vw] w-[60vw] rounded-full bg-[radial-gradient(circle,rgba(127,232,255,0.10),transparent_60%)]" />
        <div className="absolute -right-40 top-40 h-[70vw] w-[70vw] rounded-full bg-[radial-gradient(circle,rgba(184,132,255,0.10),transparent_60%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-24 sm:pt-28">
        {/* landing-style hero */}
        <div className="mb-10 sm:mb-14">
          <div className="mb-3 h-px w-16 bg-gradient-to-r from-[#7fe8ff] to-transparent" />
          <div className="font-mono text-[11px] uppercase tracking-[0.4em] text-neutral-500">
            Chapter 01 · Ingest
          </div>
          <h1 className="mt-3 font-display text-[12vw] font-light leading-[0.98] tracking-tight sm:text-6xl">
            Feed the{" "}
            <span className="bg-gradient-to-r from-[#7fe8ff] via-[#b884ff] to-[#ff8ad6] bg-clip-text text-transparent">
              signal
            </span>
            .
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-neutral-400">
            Drop your contest history CSV — from any DFS platform. Parsing runs in the browser; nothing leaves the device until you say so.
          </p>
        </div>

        {/* working surface — paper card floating on the dark editorial page */}
        <div className="bg-paper text-ink shadow-[0_20px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
          <div className="p-5 sm:p-8">
      <AnimatePresence mode="wait">
        {stage === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                "relative flex min-h-[340px] cursor-pointer flex-col items-center justify-center border border-dashed p-8 text-center transition-colors",
                dragging ? "border-lime bg-lime/5" : "border-ink/40 hover:border-lime",
              )}
            >
              <div className="grid-dots pointer-events-none absolute inset-0 opacity-30" />
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) parseFile(f);
                }}
              />
              <div className="font-display text-6xl text-profit">CSV</div>
              <p className="mt-4 font-display text-3xl tracking-tight text-ink">
                Drag &amp; drop your contest history
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                or click to browse · any DFS platform · header-tolerant
              </p>
              {error && (
                <p className="mt-6 border border-hotred bg-hotred/10 px-4 py-2 font-mono text-xs text-hotred">
                  ! {error}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <p className="font-mono text-xs text-muted-foreground">
                NO HISTORY HANDY? DOWNLOAD A SAMPLE FILE AND UPLOAD IT, OR LOAD IT DIRECTLY.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <BrutalButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const blob = new Blob([sampleCsv()], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "sample-dfs-history.csv";
                    a.rel = "noopener";
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 10_000);
                  }}
                >
                  DOWNLOAD SAMPLE CSV
                </BrutalButton>
                <BrutalButton
                  variant="orange"
                  size="sm"
                  onClick={() => parseString(sampleCsv(), "sample-history.csv")}
                >
                  LOAD SAMPLE DATA
                </BrutalButton>
              </div>
            </div>
          </motion.div>
        )}

        {stage === "parsing" && (
          <motion.div key="parsing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Terminal
              lines={[
                `INIT PARSER`,
                `READING ${filename}...`,
                `${rawRows.length} ROWS DETECTED`,
                `MATCHING HEADERS BY NAME...`,
                `MAPPED ${Object.values(mapping).filter(Boolean).length}/${Object.keys(FIELD_LABELS).length} FIELDS`,
                `PARSED ${rawRows.length} CONTESTS ACROSS ${sports.length || 1} SPORT(S). READY TO REVIEW.`,
              ]}
              onComplete={() => setTimeout(() => setStage("review"), 500)}
            />
          </motion.div>
        )}

        {stage === "review" && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <BrutalCard border="lime" className="p-6">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-profit">
                <span className="h-2 w-2 animate-pulse bg-lime" /> DATA HEALTH CHECK
              </div>
              <p className="font-display mt-2 text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
                PARSED {rawRows.length} CONTESTS
                {sports.length
                  ? ` ACROSS ${sports.map((s) => s.toUpperCase()).join(", ")}`
                  : ""}
                . READY TO ANALYZE.
              </p>
            </BrutalCard>

            <div>
              <h3 className="mb-3 font-mono text-sm font-bold uppercase tracking-widest text-ink">
                COLUMN MAPPING — CORRECT ANY MISMATCHES
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Object.keys(FIELD_LABELS).map((field) => (
                  <div key={field} className="border border-ink/30 p-3">
                    <label className="font-mono text-[10px] uppercase tracking-widest text-profit">
                      {FIELD_LABELS[field]}
                    </label>
                    <select
                      value={mapping[field] ?? ""}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, [field]: e.target.value || null }))
                      }
                      className="mt-1 w-full border border-ink bg-input px-2 py-2 font-mono text-xs text-ink focus:border-lime focus:outline-none"
                    >
                      <option value="">— none —</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 font-mono text-sm font-bold uppercase tracking-widest text-ink">
                PREVIEW — FIRST 20 ROWS
              </h3>
              <div className="overflow-x-auto border border-ink">
                <table className="w-full border-collapse font-mono text-xs">
                  <thead>
                    <tr className="bg-lime text-ink">
                      {headers.slice(0, 9).map((h) => (
                        <th
                          key={h}
                          className="whitespace-nowrap border-r-[2px] border-ink/20 px-3 py-2 text-left uppercase tracking-widest"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 20).map((row, i) => (
                      <tr
                        key={i}
                        className={cn("border-t-[1px] border-ink/10", i % 2 && "bg-ink/[0.03]")}
                      >
                        {headers.slice(0, 9).map((h) => (
                          <td
                            key={h}
                            className="max-w-[180px] truncate whitespace-nowrap border-r-[1px] border-ink/10 px-3 py-2 text-muted-foreground"
                          >
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {error && (
              <p className="border border-hotred bg-hotred/10 px-4 py-2 font-mono text-xs text-hotred">
                ! {error}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <BrutalButton variant="lime" size="lg" onClick={runAnalysis}>
                RUN ANALYSIS →
              </BrutalButton>
              <BrutalButton
                variant="ghost"
                size="lg"
                onClick={() => {
                  setStage("idle");
                  setRawRows([]);
                  setError(null);
                }}
              >
                START OVER
              </BrutalButton>
            </div>
          </motion.div>
        )}

        {stage === "analyzing" && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Terminal
              lines={[
                "BUILDING NORMALIZED ROWS...",
                "STRIPPING CURRENCY // DEDUP ENTRY_KEYS...",
                "CLASSIFYING CASH VS GPP...",
                "BUCKETING BY SPORT / BUY-IN / ENTRY TYPE...",
                "SCANNING BANKROLL RISK SIGNALS...",
                "DETECTING LOSS-CHASING PATTERNS...",
                "GRADING CAPITAL DISCIPLINE...",
                "COMPUTING REALLOCATION SWING...",
                "RUNNING ROOT-CAUSE ANALYSIS...",
                "COACH IS WRITING YOUR VERDICT...",
                "REPORT COMPILED.",
              ]}
              lineDelay={340}
              onComplete={() => setStage("done")}
            />
          </motion.div>
        )}

        {stage === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start gap-6 py-6"
          >
            <div className="font-mono text-[11px] uppercase tracking-[0.35em] text-profit">
              ● Report compiled
            </div>
            <h2 className="font-display text-4xl leading-[1.02] tracking-tight text-ink sm:text-5xl">
              Your diagnostic is ready.
            </h2>
            <p className="max-w-xl font-serif text-lg text-ink/70">
              Every entry has been graded, every leak quantified. Open the report to see the verdict, the numbers, and the plan.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <BrutalButton
                variant="lime"
                size="lg"
                onClick={() => router.push("/reports")}
              >
                OPEN REPORT →
              </BrutalButton>
              <BrutalButton
                variant="ghost"
                size="lg"
                onClick={() => {
                  setStage("idle");
                  setRawRows([]);
                  setError(null);
                  setFilename("");
                }}
              >
                UPLOAD ANOTHER
              </BrutalButton>
            </div>
            {activeReportId && (
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Report ID · {activeReportId.slice(0, 8)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
