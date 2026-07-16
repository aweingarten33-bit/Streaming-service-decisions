"use client";

import { useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { ONBOARDING, importSummary } from "@/lib/marquee/copy";
import { useDeviceFetch } from "./use-device-fetch";

interface ImportResult {
  imported: number;
  duplicates: number;
  needHelp: string[];
  total: number;
}

export function Onboarding({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const deviceFetch = useDeviceFetch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setImporting(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("source", "imdb_csv");
    try {
      const res = await deviceFetch("/api/watchlist/import", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Import failed.");
        return;
      }
      setResult(data);
    } catch {
      setError("Import failed.");
    } finally {
      setImporting(false);
    }
  }

  if (result) {
    if (reviewing) {
      return (
        <div className="flex min-h-screen flex-col bg-[#08080c] px-6 py-16">
          <h1 className="font-display text-2xl font-semibold text-[#F5EEDC]">The weird ones</h1>
          <p className="mt-2 text-sm text-white/50">
            Couldn't confidently match these to a real title. You can add them manually later from
            My Watchlist.
          </p>
          <div className="mt-6 space-y-2">
            {result.needHelp.map((title, i) => (
              <div key={i} className="rounded-xl bg-white/5 px-4 py-3 text-sm text-white/70">
                {title}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={onDone}
            className="mt-8 w-full rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] py-3 text-sm font-semibold text-[#181104]"
          >
            {ONBOARDING.pickSomething}
          </button>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#08080c] px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-[#F5EEDC]">
          {importSummary(result.imported, result.duplicates, result.needHelp.length)}
        </h1>
        <div className="mt-8 w-full max-w-xs space-y-2">
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] py-3 text-sm font-semibold text-[#181104]"
          >
            {ONBOARDING.pickSomething}
          </button>
          {result.needHelp.length > 0 && (
            <button
              type="button"
              onClick={() => setReviewing(true)}
              className="w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-white/70"
            >
              {ONBOARDING.reviewWeirdOnes(result.needHelp.length)}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[#08080c] px-6 text-center">
      {!importing && (
        <button
          type="button"
          onClick={onCancel}
          aria-label="Back"
          className="absolute left-4 top-6 grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/60"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {importing ? (
        <p className="text-sm text-white/60" role="status" aria-live="polite">
          Importing your watchlist…
        </p>
      ) : (
        <>
          <h1 className="font-display text-3xl font-semibold text-[#F5EEDC]">
            {ONBOARDING.headline}
          </h1>
          <p className="mt-3 max-w-xs text-sm text-white/60">{ONBOARDING.supporting}</p>
          <p className="mt-3 max-w-xs text-xs text-white/40">{ONBOARDING.whyCsv}</p>
          <p className="mt-2 max-w-xs text-xs font-medium text-[#E3B24B]/80">
            {ONBOARDING.browserOnlyWarning}
          </p>

          <div className="mt-8 w-full max-w-xs space-y-2">
            <a
              href={ONBOARDING.imdbWatchlistUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] py-3 text-center text-sm font-semibold text-[#181104]"
            >
              {ONBOARDING.primaryAction}
            </a>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border border-white/15 py-3 text-sm font-medium text-white/70"
            >
              {ONBOARDING.secondaryAction}
            </button>
          </div>

          <ol className="mt-8 w-full max-w-xs space-y-2 text-left text-sm text-white/50">
            {ONBOARDING.steps.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-[#E3B24B]">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>

          {error && <p className="mt-4 text-sm text-red-300/90">{error}</p>}
        </>
      )}
    </div>
  );
}
