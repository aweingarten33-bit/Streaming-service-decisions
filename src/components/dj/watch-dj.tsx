"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Upload } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";
import { PROMPT_BANK } from "@/lib/marquee/prompts";

const IMDB_WATCHLIST_URL = "https://www.imdb.com/list/watchlist";
const TMDB_IMG = "https://image.tmdb.org/t/p";

type Tab = "home" | "watchlist" | "settings";

interface WatchlistItem {
  tmdb_id: number;
  status: "unwatched" | "watched";
  created_at: string;
  titles: {
    tmdb_id: number;
    title: string;
    media_type: string;
    year: number | null;
    genres: string[];
    runtime: number | null;
    poster_path: string | null;
  };
}

interface DecisionResult {
  tmdbId: number;
  title: string;
  year: number | null;
  mediaType: string;
  runtime: number | null;
  posterPath: string | null;
  genres: string[];
  streamingProviders: string[];
  explanation: string;
}

export function WatchDj({ backdrops: _backdrops }: { backdrops: string[] }) {
  const [tab, setTab] = useState<Tab>("home");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<DecisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recent");
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const promptChoices = useMemo(() => PROMPT_BANK.slice(0, 15), []);

  const loadWatchlist = useCallback(async () => {
    const params = new URLSearchParams({ deviceId: getDeviceId(), sort });
    if (search.trim()) params.set("search", search.trim());
    const res = await fetch(`/api/watchlist?${params}`);
    const data = await res.json();
    setItems(data.items ?? []);
  }, [search, sort]);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  async function decide(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setDecision(null);
    setPrompt("");
    try {
      const res = await fetch("/api/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: getDeviceId(), prompt: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not pick tonight.");
      setDecision(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not pick tonight.");
      if (items.length === 0) setTab("settings");
    } finally {
      setLoading(false);
    }
  }

  async function importCsv(file: File) {
    setImporting(true);
    setImportStatus("Reading IMDb CSV…");
    try {
      const text = await file.text();
      const rows = parseImdbCsv(text);
      setImportStatus(`Matching ${rows.length} titles…`);
      const res = await fetch("/api/imports/imdb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: getDeviceId(), rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed.");
      setImportStatus(`Imported ${data.matched} titles. You're ready.`);
      await loadWatchlist();
      setTab("home");
    } catch (e) {
      setImportStatus(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function setWatched(item: WatchlistItem, watched: boolean) {
    await fetch("/api/watchlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: getDeviceId(),
        tmdbId: item.tmdb_id,
        status: watched ? "watched" : "unwatched",
      }),
    });
    await loadWatchlist();
  }

  async function removeItem(item: WatchlistItem) {
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId: getDeviceId(), tmdbId: item.tmdb_id }),
    });
    await loadWatchlist();
  }

  return (
    <div className="min-h-screen bg-[#08080c] text-[#F5EEDC]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(227,178,75,0.13),_transparent_30rem)]" />
      <main className="relative mx-auto flex min-h-screen w-full max-w-xl flex-col px-5 pb-28 pt-10">
        <header className="flex items-center justify-between text-sm">
          <button
            onClick={() => setTab("home")}
            className={tab === "home" ? "text-[#E3B24B]" : "text-white/45"}
          >
            Home
          </button>
          <button
            onClick={() => setTab("watchlist")}
            className={tab === "watchlist" ? "text-[#E3B24B]" : "text-white/45"}
          >
            My Watchlist
          </button>
          <button
            onClick={() => setTab("settings")}
            className={tab === "settings" ? "text-[#E3B24B]" : "text-white/45"}
          >
            Settings
          </button>
        </header>

        {tab === "home" && (
          <section className="flex flex-1 flex-col justify-center py-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#E3B24B]/70">
              Marquee
            </p>
            <h1 className="mt-4 font-display text-5xl leading-none">What kind of night is this?</h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                decide(prompt);
              }}
              className="mt-8 flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.04] p-2"
            >
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Text your watchlist…"
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] outline-none placeholder:text-white/35"
              />
              <button
                disabled={loading}
                className="grid h-11 w-11 place-items-center rounded-xl bg-[#E3B24B] text-[#181104] disabled:opacity-50"
                aria-label="Decide"
              >
                <ArrowUp size={18} />
              </button>
            </form>
            <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
              {promptChoices.map((choice) => (
                <button
                  key={choice}
                  onClick={() => decide(choice)}
                  className="shrink-0 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-sm text-white/70 hover:border-[#E3B24B]/50 hover:text-white"
                >
                  {choice}
                </button>
              ))}
            </div>
            {loading && <p className="mt-8 text-sm text-white/45">Checking your list…</p>}
            {error && <p className="mt-8 text-sm text-red-300">{error}</p>}
            {decision && <OnePick result={decision} />}
          </section>
        )}

        {tab === "watchlist" && (
          <section className="py-8">
            <h1 className="font-display text-3xl">My Watchlist</h1>
            <div className="mt-5 flex gap-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm outline-none"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-xl border border-white/10 bg-[#111116] px-2 text-sm"
              >
                <option value="recent">Recent</option>
                <option value="title">Title</option>
                <option value="runtime">Runtime</option>
                <option value="unwatched">Unwatched</option>
              </select>
            </div>
            <div className="mt-5 space-y-2">
              {items.map((item) => (
                <WatchlistRow
                  key={item.tmdb_id}
                  item={item}
                  onWatched={setWatched}
                  onRemove={removeItem}
                />
              ))}
              {items.length === 0 && (
                <p className="text-sm text-white/45">
                  Import IMDb in Settings. Then this becomes useful.
                </p>
              )}
            </div>
          </section>
        )}

        {tab === "settings" && (
          <section className="flex flex-1 flex-col justify-center py-12">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#E3B24B]/70">
              Import
            </p>
            <h1 className="mt-4 font-display text-4xl leading-tight">Bring your IMDb Watchlist.</h1>
            <ol className="mt-6 space-y-3 text-sm leading-relaxed text-white/65">
              <li>1. Tap Open IMDb Watchlist.</li>
              <li>2. Export/download your Watchlist CSV from IMDb.</li>
              <li>3. Return here and tap Import IMDb CSV.</li>
              <li>4. Marquee matches, dedupes, enriches, and gets out of the way.</li>
            </ol>
            <a
              href={IMDB_WATCHLIST_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-8 rounded-2xl bg-[#E3B24B] px-5 py-3 text-center font-semibold text-[#181104]"
            >
              Open IMDb Watchlist
            </a>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-white/12 px-5 py-3 text-sm text-white/80 disabled:opacity-50"
            >
              <Upload size={16} /> Import IMDb CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
            />
            {importStatus && <p className="mt-4 text-sm text-white/55">{importStatus}</p>}
          </section>
        )}
      </main>
    </div>
  );
}

function OnePick({ result }: { result: DecisionResult }) {
  return (
    <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
      <div className="flex gap-4 p-4">
        {result.posterPath && (
          <img
            src={`${TMDB_IMG}/w200${result.posterPath}`}
            alt=""
            className="h-36 w-24 rounded-xl object-cover"
          />
        )}
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-[#E3B24B]/70">Tonight</p>
          <h2 className="mt-2 font-display text-3xl leading-tight">{result.title}</h2>
          <p className="mt-2 text-xs text-white/45">
            {[
              result.year,
              result.runtime ? `${result.runtime} min` : null,
              ...result.genres.slice(0, 2),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {result.streamingProviders.length > 0 && (
            <p className="mt-2 text-xs text-[#E3B24B]">
              On {result.streamingProviders.slice(0, 2).join(" · ")}
            </p>
          )}
        </div>
      </div>
      <p className="border-t border-white/10 px-4 py-3 text-sm leading-relaxed text-white/75">
        {result.explanation}
      </p>
    </div>
  );
}

function WatchlistRow({
  item,
  onWatched,
  onRemove,
}: {
  item: WatchlistItem;
  onWatched: (item: WatchlistItem, watched: boolean) => void;
  onRemove: (item: WatchlistItem) => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      {item.titles.poster_path && (
        <img
          src={`${TMDB_IMG}/w92${item.titles.poster_path}`}
          alt=""
          className="h-16 w-11 rounded-md object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.titles.title}</p>
        <p className="text-xs text-white/40">
          {[item.titles.year, item.titles.runtime ? `${item.titles.runtime} min` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      <button
        onClick={() => onWatched(item, item.status !== "watched")}
        className="text-xs text-white/50 hover:text-[#E3B24B]"
      >
        {item.status === "watched" ? "Unwatch" : "Watched"}
      </button>
      <button onClick={() => onRemove(item)} className="text-xs text-white/35 hover:text-red-300">
        Remove
      </button>
    </div>
  );
}

function parseImdbCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines[0] ?? "").map((h) => h.trim().toLowerCase());
  const titleIdx = headers.findIndex((h) => ["title", "name"].includes(h));
  const yearIdx = headers.findIndex((h) => h.includes("year"));
  const constIdx = headers.findIndex((h) => h === "const" || h === "imdb id");
  const typeIdx = headers.findIndex((h) => h.includes("title type") || h === "type");
  return lines
    .slice(1)
    .map((line) => {
      const cols = splitCsvLine(line);
      const type = (cols[typeIdx] ?? "").toLowerCase();
      return {
        title: cols[titleIdx] ?? "",
        year: yearIdx >= 0 ? Number(cols[yearIdx]) || null : null,
        imdbId: constIdx >= 0 ? cols[constIdx] : null,
        mediaType: type.includes("tv") ? "tv" : "movie",
      };
    })
    .filter((row) => row.title);
}

function splitCsvLine(line: string) {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"' && line[i + 1] === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      out.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current);
  return out.map((value) => value.trim());
}
