"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { SectionHeader } from "@/components/punk/section-header";
import { BrutalButton } from "@/components/punk/brutal-button";
import { BrutalCard } from "@/components/punk/brutal-card";
import { cn } from "@/lib/utils";

type ValidatorResponse = {
  verdict: "GREEN" | "YELLOW" | "RED";
  headline: string;
  reasoning: string[];
  fitScore: number;
  counterProposal: string;
};

const EXAMPLES = [
  "Sunday NFL, I want to fire 40 entries at $12 in the Milly Maker.",
  "Thinking about jumping from $5 3-max cash to $50 3-max cash next week.",
  "I lost 4 days in a row. Considering a $100 single-entry to make it back.",
  "Want to try NBA showdowns for the first time — $25 each, 10 entries.",
];

export function ValidatorClient() {
  const { reports, activeReportId } = useStore();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const active = reports.find((r) => r.id === activeReportId) ?? reports[0];

  const [play, setPlay] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidatorResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!active || !play.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/validator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposedPlay: play.trim(), report: active }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.status === 501) {
          setError(
            "The validator needs an ANTHROPIC_API_KEY configured on the server. Ask an admin to set it.",
          );
        } else {
          setError(body.error ?? `Request failed (${res.status}).`);
        }
        return;
      }
      const data = (await res.json()) as ValidatorResponse;
      setResult(data);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="font-mono text-sm text-profit">LOADING…</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <SectionHeader index="VD" label="DECISION VALIDATOR" title="ABOUT TO MAKE A PLAY?" />
      <p className="mb-8 max-w-2xl font-serif text-lg leading-relaxed text-ink/80">
        Describe what you&rsquo;re about to do. You&rsquo;ll get a blunt verdict grounded in your own
        uploaded history — not generic DFS advice.
      </p>

      {!active ? (
        <BrutalCard border="ink" className="p-6 text-center">
          <p className="font-display text-2xl tracking-tight text-ink">
            UPLOAD A CSV FIRST.
          </p>
          <p className="mt-2 font-mono text-sm text-muted-foreground">
            The validator judges your play against YOUR history. It needs a report to compare against.
          </p>
          <div className="mt-6 flex justify-center">
            <Link href="/upload">
              <BrutalButton variant="lime" size="lg">
                UPLOAD CSV →
              </BrutalButton>
            </Link>
          </div>
        </BrutalCard>
      ) : (
        <>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            JUDGING AGAINST: {active.filename} · {active.rowCount} ENTRIES ·{" "}
            {active.roi >= 0 ? "+" : ""}
            {active.roi.toFixed(1)}% ROI
          </div>
          <textarea
            value={play}
            onChange={(e) => setPlay(e.target.value)}
            placeholder="e.g. Sunday NFL, I want to fire 40 entries at $12 in the Milly Maker."
            rows={4}
            className="w-full border border-ink bg-paper p-4 font-serif text-base leading-relaxed text-ink outline-none focus:ring-2 focus:ring-lime"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setPlay(ex)}
                className="border border-ink/40 bg-ink/5 px-3 py-1.5 text-left font-mono text-[11px] uppercase tracking-widest text-ink hover:bg-ink/10"
              >
                {ex.length > 60 ? ex.slice(0, 57) + "…" : ex}
              </button>
            ))}
          </div>
          <div className="mt-5">
            <BrutalButton
              variant="lime"
              size="lg"
              onClick={run}
              disabled={loading || !play.trim()}
            >
              {loading ? "JUDGING…" : "VALIDATE THIS PLAY →"}
            </BrutalButton>
          </div>

          {error && (
            <div className="mt-6 border border-hotred p-4 font-mono text-sm text-hotred">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-10 space-y-6">
              <VerdictCard result={result} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function VerdictCard({ result }: { result: ValidatorResponse }) {
  const tone =
    result.verdict === "GREEN"
      ? { border: "border-profit", text: "text-profit", label: "GREEN LIGHT" }
      : result.verdict === "RED"
        ? { border: "border-hotred", text: "text-hotred", label: "RED LIGHT" }
        : { border: "border-amber-500", text: "text-amber-500", label: "YELLOW LIGHT" };

  return (
    <div className={cn("border-2 bg-paper", tone.border)}>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-ink/20 p-5">
        <div>
          <div className={cn("font-mono text-[11px] font-bold uppercase tracking-widest", tone.text)}>
            {tone.label}
          </div>
          <h2 className="mt-2 font-display text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
            {result.headline}
          </h2>
        </div>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            FIT SCORE
          </div>
          <div className={cn("font-display text-5xl leading-none tracking-tighter", tone.text)}>
            {result.fitScore}
          </div>
          <div className="font-mono text-[10px] text-muted-foreground">/ 100</div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            WHY
          </div>
          <ul className="mt-2 space-y-3">
            {result.reasoning.map((r, i) => (
              <li key={i} className="border-l-2 border-ink pl-3 font-serif text-base leading-relaxed text-ink">
                {r}
              </li>
            ))}
          </ul>
        </div>

        {result.counterProposal && result.counterProposal.trim() && (
          <div className="border-t border-ink/20 pt-4">
            <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              SMARTER VERSION OF THE SAME PLAY
            </div>
            <p className="mt-2 font-serif text-base italic leading-relaxed text-ink sm:text-lg">
              {result.counterProposal}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
