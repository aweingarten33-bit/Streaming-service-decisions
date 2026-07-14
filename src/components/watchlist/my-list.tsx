"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Plus, X, Search } from "lucide-react";
import { getDeviceId } from "@/lib/device-id";

const TMDB_IMG = "https://image.tmdb.org/t/p";

interface SearchResult {
  tmdbId: number;
  title: string;
  mediaType: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
}

interface SavedTitle {
  tmdbId: number;
  title: string;
  mediaType: string;
  year: number | null;
  posterPath: string | null;
}

export function MyList({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [saved, setSaved] = useState<SavedTitle[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  function refreshSaved() {
    const deviceId = getDeviceId();
    fetch(`/api/watchlist?deviceId=${deviceId}`)
      .then((res) => res.json())
      .then((data) => {
        const titles: SavedTitle[] = data.titles ?? [];
        setSaved(titles);
        setSavedIds(new Set(titles.map((t) => `${t.mediaType}:${t.tmdbId}`)));
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    refreshSaved();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      fetch(`/api/watchlist/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results ?? []));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  async function add(item: SearchResult | SavedTitle) {
    const deviceId = getDeviceId();
    setSavedIds((prev) => new Set(prev).add(`${item.mediaType}:${item.tmdbId}`));
    await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, tmdbId: item.tmdbId, mediaType: item.mediaType }),
    });
    refreshSaved();
  }

  async function remove(item: SavedTitle) {
    const deviceId = getDeviceId();
    setSaved((prev) => prev.filter((t) => t.tmdbId !== item.tmdbId));
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(`${item.mediaType}:${item.tmdbId}`);
      return next;
    });
    await fetch("/api/watchlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deviceId, tmdbId: item.tmdbId, mediaType: item.mediaType }),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#08080c]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <button
          onClick={onClose}
          aria-label="Back"
          className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white"
        >
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display text-lg text-[#F5EEDC]">My List</h1>
      </div>

      <div className="border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5">
          <Search size={16} className="text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a movie or show to add..."
            className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {query.trim() && (
          <div className="mb-6 space-y-2">
            {results.map((r) => {
              const key = `${r.mediaType}:${r.tmdbId}`;
              const isSaved = savedIds.has(key);
              return (
                <div key={key} className="flex items-center gap-3 rounded-xl bg-white/5 p-2">
                  {r.posterPath ? (
                    <img
                      src={`${TMDB_IMG}/w154${r.posterPath}`}
                      alt=""
                      className="h-16 w-11 flex-none rounded object-cover"
                    />
                  ) : (
                    <div className="h-16 w-11 flex-none rounded bg-white/10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-[#F5EEDC]">{r.title}</p>
                    <p className="font-mono text-[11px] text-white/40">
                      {r.year ?? ""} · {r.mediaType}
                    </p>
                  </div>
                  <button
                    onClick={() => !isSaved && add(r)}
                    disabled={isSaved}
                    className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[#E3B24B]/15 text-[#E3B24B] disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              );
            })}
            {results.length === 0 && (
              <p className="py-4 text-center text-sm text-white/30">No matches.</p>
            )}
          </div>
        )}

        {!query.trim() && (
          <>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-white/40">
              Saved ({saved.length})
            </p>
            {loading && <p className="text-sm text-white/30">Loading...</p>}
            {!loading && saved.length === 0 && (
              <p className="py-8 text-center text-sm text-white/30">
                Nothing saved yet — search above to add your first title.
              </p>
            )}
            <div className="space-y-2">
              {saved.map((t) => (
                <div
                  key={`${t.mediaType}:${t.tmdbId}`}
                  className="flex items-center gap-3 rounded-xl bg-white/5 p-2"
                >
                  {t.posterPath ? (
                    <img
                      src={`${TMDB_IMG}/w154${t.posterPath}`}
                      alt=""
                      className="h-16 w-11 flex-none rounded object-cover"
                    />
                  ) : (
                    <div className="h-16 w-11 flex-none rounded bg-white/10" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-[#F5EEDC]">{t.title}</p>
                    <p className="font-mono text-[11px] text-white/40">
                      {t.year ?? ""} · {t.mediaType}
                    </p>
                  </div>
                  <button
                    onClick={() => remove(t)}
                    aria-label="Remove"
                    className="grid h-8 w-8 flex-none place-items-center rounded-full bg-white/5 text-white/50"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
