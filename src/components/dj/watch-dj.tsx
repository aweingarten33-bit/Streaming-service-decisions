"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, ArrowUp } from "lucide-react";

interface Pick {
  tmdbId: number;
  title: string;
  year: number | null;
  mediaType: string;
  posterPath: string | null;
  rating: number | null;
  ratingSource: string | null;
  voteCount: number | null;
  genres: string[];
  why: string;
}

const CHIPS = [
  { emoji: "🎬", label: "Hidden Gems", prompt: "Show me a hidden gem nobody talks about" },
  { emoji: "😱", label: "Mind-Bending", prompt: "I want something mind-bending" },
  { emoji: "😂", label: "Funny Tonight", prompt: "I need something funny tonight" },
  {
    emoji: "📺",
    label: "One-Season Series",
    prompt: "A great one-season series with a complete story",
  },
  { emoji: "🎥", label: "Documentary", prompt: "An unbelievable documentary" },
  { emoji: "🎲", label: "Surprise Me", prompt: "I don't know what I want, surprise me" },
];

const TMDB_IMG = "https://image.tmdb.org/t/p";

export function WatchDj({ backdrops }: { backdrops: string[] }) {
  const [bgIndex, setBgIndex] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Pick[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (backdrops.length < 2) return;
    const id = setInterval(() => setBgIndex((i) => (i + 1) % backdrops.length), 7000);
    return () => clearInterval(id);
  }, [backdrops.length]);

  async function ask(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      setResults(data.results ?? []);
      setTimeout(
        () => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Rotating cinematic backdrop */}
      <div className="fixed inset-0 -z-10">
        {backdrops.length > 0 ? (
          backdrops.map((path, i) => (
            <div
              key={path}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-[2000ms]"
              style={{
                backgroundImage: `url(${TMDB_IMG}/original${path})`,
                opacity: i === bgIndex ? 1 : 0,
              }}
            />
          ))
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a14] via-[#08080c] to-[#0e1420]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/90" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-xl flex-col items-center px-6 pb-16 pt-24">
        <h1 className="font-display text-5xl font-semibold tracking-tight text-[#F5EEDC] sm:text-6xl">
          Watch DJ
        </h1>
        <p className="mt-3 text-center text-base text-white/60">Your personal movie &amp; TV DJ</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(prompt);
          }}
          className="mt-10 w-full"
        >
          <div className="flex items-center gap-2 rounded-2xl border border-white/15 bg-black/40 px-3 py-2 backdrop-blur-xl transition-colors focus-within:border-[#E3B24B]/50">
            <button
              type="button"
              aria-label="Voice input (coming soon)"
              className="grid h-10 w-10 flex-none place-items-center rounded-xl text-white/50 transition-colors hover:text-[#E3B24B]"
            >
              <Mic size={18} />
            </button>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="What do you feel like watching?"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-[#F5EEDC] placeholder:text-white/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              aria-label="Send"
              className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] text-[#181104] transition-transform hover:brightness-110 disabled:opacity-50"
            >
              <ArrowUp size={18} />
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => {
                setPrompt(chip.prompt);
                ask(chip.prompt);
              }}
              className="rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition-colors hover:border-[#E3B24B]/50 hover:text-[#F5EEDC]"
            >
              {chip.emoji} {chip.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-10 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#E3B24B]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}

        {error && <p className="mt-8 text-sm text-red-300/90">{error}</p>}

        {results && results.length > 0 && (
          <div ref={resultsRef} className="mt-10 w-full space-y-4">
            {results.map((pick) => (
              <div
                key={pick.tmdbId}
                className="overflow-hidden rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl"
              >
                <div className="flex gap-4 p-4">
                  {pick.posterPath && (
                    <img
                      src={`${TMDB_IMG}/w200${pick.posterPath}`}
                      alt={pick.title}
                      className="h-32 w-[86px] flex-none rounded-lg object-cover"
                    />
                  )}
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-medium text-[#F5EEDC]">
                      {pick.title}
                    </h2>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-white/50">
                      {pick.year && <span>{pick.year}</span>}
                      <span>{pick.mediaType}</span>
                      {pick.rating && (
                        <span>
                          {pick.ratingSource ?? ""} ★ {pick.rating.toFixed(1)}
                          {pick.voteCount ? ` · ${pick.voteCount.toLocaleString()}` : ""}
                        </span>
                      )}
                    </div>
                    {pick.genres.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {pick.genres.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="rounded-full border border-white/15 px-2 py-0.5 text-[11px] text-white/70"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <p className="border-t border-white/10 px-4 py-3 text-sm leading-relaxed text-white/75">
                  {pick.why}
                </p>
              </div>
            ))}
          </div>
        )}

        {results && results.length === 0 && (
          <p className="mt-10 text-sm text-white/60">
            Nothing matched that yet — try a different mood or fewer constraints.
          </p>
        )}
      </div>
    </div>
  );
}
