"use client";

import { useEffect, useState } from "react";
import { Bookmark, ExternalLink, ListPlus, Search } from "lucide-react";
import { getExploreCopy, importSummary, type Language } from "@/lib/marquee/copy";
import { EXPLORE_CATEGORIES } from "@/lib/marquee/list-search/categories";
import type { PublicListSearchResult } from "@/lib/marquee/list-search/types";
import { useDeviceFetch } from "./use-device-fetch";

interface ImportOutcome {
  imported: number;
  duplicates: number;
  needHelp: string[];
  total: number;
}

interface SavedList {
  id: string;
  url: string;
  title: string;
  description: string | null;
  note: string | null;
  created_at: string;
}

type SearchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "results"; results: PublicListSearchResult[] }
  | { kind: "empty" }
  | { kind: "error"; message: string };

export function ExploreScreen({ language }: { language: Language }) {
  const deviceFetch = useDeviceFetch();
  const copy = getExploreCopy(language);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const [saved, setSaved] = useState<SavedList[]>([]);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<
    Record<string, ImportOutcome | { error: string }>
  >({});

  function loadSaved() {
    deviceFetch("/api/explore/saved")
      .then((res) => res.json())
      .then((data) => setSaved(data.items ?? []));
  }

  useEffect(() => {
    loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(text: string) {
    if (!text.trim()) return;
    setState({ kind: "loading" });
    try {
      const res = await deviceFetch("/api/explore/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ kind: "error", message: data.error ?? copy.searchFailed });
        return;
      }
      const results: PublicListSearchResult[] = data.results ?? [];
      setState(results.length > 0 ? { kind: "results", results } : { kind: "empty" });
    } catch {
      setState({ kind: "error", message: copy.searchFailed });
    }
  }

  async function saveList(result: PublicListSearchResult) {
    setSaved((prev) => [
      {
        id: result.url,
        url: result.url,
        title: result.title,
        description: result.description ?? null,
        note: null,
        created_at: new Date().toISOString(),
      },
      ...prev,
    ]);
    await deviceFetch("/api/explore/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: result.url,
        title: result.title,
        description: result.description,
      }),
    });
    loadSaved();
  }

  async function importSavedList(id: string) {
    setImportingId(id);
    try {
      const res = await deviceFetch("/api/explore/saved/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      setImportResults((prev) => ({
        ...prev,
        [id]: res.ok ? data : { error: data.error ?? "Couldn't add that list." },
      }));
    } catch {
      setImportResults((prev) => ({ ...prev, [id]: { error: "Couldn't add that list." } }));
    } finally {
      setImportingId(null);
    }
  }

  async function removeSaved(id: string) {
    setSaved((prev) => prev.filter((s) => s.id !== id));
    await deviceFetch("/api/explore/saved", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  const savedUrls = new Set(saved.map((s) => s.url));

  return (
    <div className="mx-auto w-full max-w-xl px-6 pb-12 pt-16">
      <h1 className="font-display text-2xl font-semibold text-ink">{copy.headline}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="mt-4 flex items-center gap-2 rounded-2xl border border-rule bg-paper/70 px-3 py-2 backdrop-blur-xl transition-colors focus-within:border-red/50"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-ink placeholder:text-ink/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state.kind === "loading"}
          aria-label="Search"
          className="btn-press grid h-10 w-10 flex-none place-items-center rounded-xl bg-red text-red-ink hover:brightness-110 disabled:opacity-50"
        >
          <Search size={18} />
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXPLORE_CATEGORIES.map((category) => (
          <button
            key={category.label}
            type="button"
            onClick={() => {
              setQuery(category.query);
              runSearch(category.query);
            }}
            className="btn-press rounded-full border border-rule bg-ink/5 px-3 py-1.5 text-xs font-medium text-ink-2"
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {state.kind === "loading" && (
          <p className="text-center text-sm text-ink-2" role="status" aria-live="polite">
            Searching...
          </p>
        )}

        {state.kind === "empty" && (
          <p className="rounded-2xl border border-rule bg-ink/5 px-5 py-6 text-center text-sm text-ink-2">
            {copy.noResults}
          </p>
        )}

        {state.kind === "error" && (
          <p className="rounded-2xl border border-rule bg-ink/5 px-5 py-6 text-center text-sm text-red-300/90">
            {state.message}
          </p>
        )}

        {state.kind === "results" && (
          <div className="space-y-2">
            {state.results.map((result) => (
              <div key={result.url} className="rounded-xl border border-rule bg-ink/5 p-4">
                <p className="text-[11px] uppercase tracking-wider text-ink/40">IMDb</p>
                <p className="mt-1 text-[15px] font-medium text-ink">{result.title}</p>
                {result.description && (
                  <p className="mt-1 line-clamp-2 text-[13px] text-ink-2">{result.description}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-press flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red px-3 py-2 text-[13px] font-semibold text-red-ink"
                  >
                    <ExternalLink size={14} />
                    {copy.openInImdb}
                  </a>
                  <button
                    type="button"
                    onClick={() => saveList(result)}
                    disabled={savedUrls.has(result.url)}
                    aria-label={savedUrls.has(result.url) ? copy.saved : copy.save}
                    className="btn-press grid h-9 w-9 flex-none place-items-center rounded-lg border border-rule text-ink-2 disabled:text-red"
                  >
                    <Bookmark
                      size={15}
                      fill={savedUrls.has(result.url) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>
            ))}
            <p className="pt-1 text-center text-[11px] text-ink/30">
              Results via Google Custom Search
            </p>
          </div>
        )}
      </div>

      <div className="mt-10">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink/40">
          {copy.savedListsTitle}
        </p>
        <div className="stencil-rule mt-3" />
        {saved.length === 0 ? (
          <p className="mt-3 text-sm text-ink/40">{copy.noSavedLists}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {saved.map((item) => {
              const outcome = importResults[item.id];
              return (
                <div key={item.id} className="rounded-xl bg-ink/5 p-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-ink">{item.title}</p>
                      <p className="truncate font-mono text-[11px] text-ink/40">{item.url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => importSavedList(item.id)}
                      disabled={importingId === item.id}
                      aria-label="Add this list's titles to my watchlist"
                      className="btn-press grid h-8 w-8 flex-none place-items-center rounded-full bg-ink/5 text-ink/40 disabled:opacity-50"
                    >
                      <ListPlus size={14} />
                    </button>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={copy.openInImdb}
                      className="btn-press grid h-8 w-8 flex-none place-items-center rounded-full bg-ink/5 text-ink/40"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button
                      type="button"
                      onClick={() => removeSaved(item.id)}
                      aria-label="Remove"
                      className="btn-press grid h-8 w-8 flex-none place-items-center rounded-full bg-ink/5 text-ink/40"
                    >
                      &times;
                    </button>
                  </div>
                  {importingId === item.id && (
                    <p className="mt-2 text-xs text-ink/40">Adding this list's titles…</p>
                  )}
                  {outcome && importingId !== item.id && (
                    <p className="mt-2 text-xs text-ink-2">
                      {"error" in outcome
                        ? outcome.error
                        : importSummary(
                            outcome.imported,
                            outcome.duplicates,
                            outcome.needHelp.length,
                          )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
