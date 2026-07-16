"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Check, X, Plus } from "lucide-react";
import type { WatchlistCandidate } from "@/lib/marquee/types";
import { useDeviceFetch } from "./use-device-fetch";

const TMDB_IMG = "https://image.tmdb.org/t/p";
type SortKey = "title" | "year";
type MediaTypeFilter = "any" | "movie" | "tv";

interface SearchResult {
  tmdbId: number;
  title: string;
  mediaType: "movie" | "tv";
  year: number | null;
  posterPath: string | null;
  overview: string | null;
}

export function WatchlistScreen({ onImportAgain }: { onImportAgain: () => void }) {
  const deviceFetch = useDeviceFetch();
  const [items, setItems] = useState<WatchlistCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("title");
  const [mediaTypeFilter, setMediaTypeFilter] = useState<MediaTypeFilter>("any");
  const [manualQuery, setManualQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  function refresh() {
    deviceFetch("/api/watchlist")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleWatched(item: WatchlistCandidate) {
    const nextStatus = item.status === "watched" ? "active" : "watched";
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: nextStatus } : i)));
    await deviceFetch("/api/watchlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId: item.tmdbId, mediaType: item.mediaType, status: nextStatus }),
    });
  }

  async function searchManualTitle(text: string) {
    if (!text.trim()) return;
    setSearching(true);
    const res = await deviceFetch(`/api/watchlist/search?q=${encodeURIComponent(text)}`);
    const data = await res.json();
    setSearchResults(data.results ?? []);
    setSearching(false);
  }

  async function addManualTitle(result: SearchResult) {
    await deviceFetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tmdbId: result.tmdbId,
        mediaType: result.mediaType,
        source: "manual",
      }),
    });
    setManualQuery("");
    setSearchResults([]);
    refresh();
  }

  async function remove(item: WatchlistCandidate) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await deviceFetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId: item.tmdbId, mediaType: item.mediaType }),
    });
  }

  const visible = useMemo(() => {
    const filtered = items
      .filter((i) => i.title.toLowerCase().includes(query.toLowerCase()))
      .filter((i) => mediaTypeFilter === "any" || i.mediaType === mediaTypeFilter);
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "year") return (b.year ?? 0) - (a.year ?? 0);
      return a.title.localeCompare(b.title);
    });
    return sorted;
  }, [items, query, sort, mediaTypeFilter]);

  return (
    <div className="mx-auto w-full max-w-xl px-6 pb-12 pt-16">
      <div className="flex items-center justify-between">
        <h1 className="spray-glow font-display text-2xl font-semibold text-ink">My Watchlist</h1>
        <button
          type="button"
          onClick={onImportAgain}
          className="btn-press flex items-center gap-1.5 rounded-full border border-rule px-3 py-1.5 text-xs font-medium text-ink-2"
        >
          <RotateCcw size={12} /> Import
        </button>
      </div>
      <div className="stencil-rule mt-4" />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          searchManualTitle(manualQuery);
        }}
        className="wall-texture mt-5 rounded-2xl border border-rule bg-ink/5 p-3"
      >
        <p className="tape-strip inline-block px-2 py-0.5 text-xs font-bold text-black/70 uppercase tracking-wider">
          Add a title
        </p>
        <div className="mt-2 flex gap-2">
          <input
            value={manualQuery}
            onChange={(e) => setManualQuery(e.target.value)}
            placeholder="Search movie or show..."
            className="min-w-0 flex-1 rounded-xl border border-rule bg-paper/50 px-4 py-2.5 text-[14px] text-ink placeholder:text-ink/30 focus:border-red/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searching}
            className="btn-press rounded-xl bg-red px-4 text-sm font-semibold text-red-ink disabled:opacity-50"
          >
            Search
          </button>
        </div>
        {searchResults.length > 0 && (
          <div className="mt-3 space-y-2">
            {searchResults.slice(0, 5).map((result) => (
              <button
                key={`${result.mediaType}:${result.tmdbId}`}
                type="button"
                onClick={() => addManualTitle(result)}
                className="btn-press flex w-full items-center gap-3 rounded-xl bg-paper/50 p-2 text-left hover:bg-ink/10"
              >
                {result.posterPath ? (
                  <img
                    src={`${TMDB_IMG}/w92${result.posterPath}`}
                    alt=""
                    className="h-14 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="h-14 w-10 rounded bg-ink/10" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {result.title}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
                    {result.year ?? ""} · {result.mediaType}
                  </span>
                </span>
                <Plus size={16} className="text-red" />
              </button>
            ))}
          </div>
        )}
      </form>

      <div
        role="group"
        aria-label="Movie or TV show"
        className="mt-4 flex w-full gap-2 rounded-xl border-2 border-rule bg-paper-2 p-1"
      >
        {(
          [
            ["any", "Any"],
            ["movie", "Movie"],
            ["tv", "TV Show"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={mediaTypeFilter === value}
            onClick={() => setMediaTypeFilter(value)}
            className={`btn-press flex-1 rounded-lg py-2 text-[13px] font-bold transition-colors ${
              mediaTypeFilter === value ? "bg-red text-red-ink" : "text-ink-2 hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your list..."
          className="flex-1 rounded-xl border border-rule bg-ink/5 px-4 py-2.5 text-[14px] text-ink placeholder:text-ink/30 focus:border-red/40 focus:outline-none"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-rule bg-ink/5 px-3 py-2.5 text-[13px] text-ink-2 focus:outline-none"
        >
          <option value="title">Title</option>
          <option value="year">Year</option>
        </select>
      </div>

      {loading && <p className="mt-8 text-center text-sm text-ink/30">Loading...</p>}
      {!loading && visible.length === 0 && (
        <p className="scrawl mt-8 text-center text-lg text-ink/40">Nothing here yet.</p>
      )}

      <div className="mt-4 space-y-2">
        {visible.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 rounded-xl bg-ink/5 p-2 ${item.status === "watched" ? "opacity-50" : ""}`}
          >
            {item.posterPath ? (
              <img
                src={`${TMDB_IMG}/w154${item.posterPath}`}
                alt=""
                className="h-16 w-11 flex-none rounded object-cover"
              />
            ) : (
              <div className="h-16 w-11 flex-none rounded bg-ink/10" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-ink">{item.title}</p>
              <p className="font-mono text-[11px] text-ink/40">
                {item.year ?? ""} · {item.mediaType}
                {item.status === "watched" ? " · watched" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleWatched(item)}
              aria-label={item.status === "watched" ? "Mark unwatched" : "Mark watched"}
              className={`btn-press grid h-8 w-8 flex-none place-items-center rounded-full ${
                item.status === "watched" ? "bg-red/20 text-red" : "bg-ink/5 text-ink/40"
              }`}
            >
              <Check size={15} />
            </button>
            <button
              type="button"
              onClick={() => remove(item)}
              aria-label="Remove"
              className="btn-press grid h-8 w-8 flex-none place-items-center rounded-full bg-ink/5 text-ink/40"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
