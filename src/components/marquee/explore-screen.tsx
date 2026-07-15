"use client";

import { useEffect, useState } from "react";
import { Bookmark, ExternalLink, Search } from "lucide-react";
import { getExploreCopy, type Language } from "@/lib/marquee/copy";
import { EXPLORE_CATEGORIES } from "@/lib/marquee/list-search/categories";
import type { PublicListSearchResult } from "@/lib/marquee/list-search/types";
import { useAuthedFetch } from "./use-authed-fetch";

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
  const authedFetch = useAuthedFetch();
  const copy = getExploreCopy(language);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>({ kind: "idle" });
  const [saved, setSaved] = useState<SavedList[]>([]);

  function loadSaved() {
    authedFetch("/api/explore/saved")
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
      const res = await authedFetch("/api/explore/search", {
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
    await authedFetch("/api/explore/saved", {
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

  async function removeSaved(id: string) {
    setSaved((prev) => prev.filter((s) => s.id !== id));
    await authedFetch("/api/explore/saved", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  const savedUrls = new Set(saved.map((s) => s.url));

  return (
    <div className="mx-auto w-full max-w-xl px-6 pb-28 pt-16">
      <h1 className="font-display text-2xl font-semibold text-[#F5EEDC]">{copy.headline}</h1>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          runSearch(query);
        }}
        className="mt-4 flex items-center gap-2 rounded-2xl border border-white/15 bg-black/40 px-3 py-2 backdrop-blur-xl transition-colors focus-within:border-[#E3B24B]/50"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={copy.searchPlaceholder}
          className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-[#F5EEDC] placeholder:text-white/40 focus:outline-none"
        />
        <button
          type="submit"
          disabled={state.kind === "loading"}
          aria-label="Search"
          className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] text-[#181104] transition-transform hover:brightness-110 disabled:opacity-50"
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
            className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70"
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {state.kind === "loading" && (
          <p className="text-center text-sm text-white/50" role="status" aria-live="polite">
            Searching...
          </p>
        )}

        {state.kind === "empty" && (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-center text-sm text-white/70">
            {copy.noResults}
          </p>
        )}

        {state.kind === "error" && (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-center text-sm text-red-300/90">
            {state.message}
          </p>
        )}

        {state.kind === "results" && (
          <div className="space-y-2">
            {state.results.map((result) => (
              <div key={result.url} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-[11px] uppercase tracking-wider text-white/40">IMDb</p>
                <p className="mt-1 text-[15px] font-medium text-[#F5EEDC]">{result.title}</p>
                {result.description && (
                  <p className="mt-1 line-clamp-2 text-[13px] text-white/50">
                    {result.description}
                  </p>
                )}
                <div className="mt-3 flex gap-2">
                  <a
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] px-3 py-2 text-[13px] font-semibold text-[#181104]"
                  >
                    <ExternalLink size={14} />
                    {copy.openInImdb}
                  </a>
                  <button
                    type="button"
                    onClick={() => saveList(result)}
                    disabled={savedUrls.has(result.url)}
                    aria-label={savedUrls.has(result.url) ? copy.saved : copy.save}
                    className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-white/15 text-white/70 disabled:text-[#E3B24B]"
                  >
                    <Bookmark
                      size={15}
                      fill={savedUrls.has(result.url) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>
            ))}
            <p className="pt-1 text-center text-[11px] text-white/30">
              Results via Google Custom Search
            </p>
          </div>
        )}
      </div>

      <div className="mt-10">
        <p className="font-mono text-[11px] uppercase tracking-wider text-white/40">
          {copy.savedListsTitle}
        </p>
        {saved.length === 0 ? (
          <p className="mt-3 text-sm text-white/40">{copy.noSavedLists}</p>
        ) : (
          <div className="mt-3 space-y-2">
            {saved.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-[#F5EEDC]">{item.title}</p>
                  <p className="truncate font-mono text-[11px] text-white/40">{item.url}</p>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={copy.openInImdb}
                  className="grid h-8 w-8 flex-none place-items-center rounded-full bg-white/5 text-white/40"
                >
                  <ExternalLink size={14} />
                </a>
                <button
                  type="button"
                  onClick={() => removeSaved(item.id)}
                  aria-label="Remove"
                  className="grid h-8 w-8 flex-none place-items-center rounded-full bg-white/5 text-white/40"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
