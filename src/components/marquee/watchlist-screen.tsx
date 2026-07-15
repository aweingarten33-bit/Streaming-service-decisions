"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Check, X } from "lucide-react";
import type { WatchlistCandidate } from "@/lib/marquee/types";
import { useDeviceFetch } from "./use-device-fetch";

const TMDB_IMG = "https://image.tmdb.org/t/p";
type SortKey = "title" | "year";

export function WatchlistScreen({ onImportAgain }: { onImportAgain: () => void }) {
  const deviceFetch = useDeviceFetch();
  const [items, setItems] = useState<WatchlistCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("title");

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

  async function remove(item: WatchlistCandidate) {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await deviceFetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdbId: item.tmdbId, mediaType: item.mediaType }),
    });
  }

  const visible = useMemo(() => {
    const filtered = items.filter((i) => i.title.toLowerCase().includes(query.toLowerCase()));
    const sorted = [...filtered].sort((a, b) => {
      if (sort === "year") return (b.year ?? 0) - (a.year ?? 0);
      return a.title.localeCompare(b.title);
    });
    return sorted;
  }, [items, query, sort]);

  return (
    <div className="mx-auto w-full max-w-xl px-6 pb-28 pt-16">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-[#F5EEDC]">My Watchlist</h1>
        <button
          type="button"
          onClick={onImportAgain}
          className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70"
        >
          <RotateCcw size={12} /> Import
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your list..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[14px] text-white placeholder:text-white/30 focus:border-[#E3B24B]/40 focus:outline-none"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-[13px] text-white/70 focus:outline-none"
        >
          <option value="title">Title</option>
          <option value="year">Year</option>
        </select>
      </div>

      {loading && <p className="mt-8 text-center text-sm text-white/30">Loading...</p>}
      {!loading && visible.length === 0 && (
        <p className="mt-8 text-center text-sm text-white/30">Nothing here yet.</p>
      )}

      <div className="mt-4 space-y-2">
        {visible.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 rounded-xl bg-white/5 p-2 ${item.status === "watched" ? "opacity-50" : ""}`}
          >
            {item.posterPath ? (
              <img
                src={`${TMDB_IMG}/w154${item.posterPath}`}
                alt=""
                className="h-16 w-11 flex-none rounded object-cover"
              />
            ) : (
              <div className="h-16 w-11 flex-none rounded bg-white/10" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-medium text-[#F5EEDC]">{item.title}</p>
              <p className="font-mono text-[11px] text-white/40">
                {item.year ?? ""} · {item.mediaType}
                {item.status === "watched" ? " · watched" : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggleWatched(item)}
              aria-label={item.status === "watched" ? "Mark unwatched" : "Mark watched"}
              className={`grid h-8 w-8 flex-none place-items-center rounded-full ${
                item.status === "watched"
                  ? "bg-[#E3B24B]/20 text-[#E3B24B]"
                  : "bg-white/5 text-white/40"
              }`}
            >
              <Check size={15} />
            </button>
            <button
              type="button"
              onClick={() => remove(item)}
              aria-label="Remove"
              className="grid h-8 w-8 flex-none place-items-center rounded-full bg-white/5 text-white/40"
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
