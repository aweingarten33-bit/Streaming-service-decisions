"use client";

import { useState } from "react";
import type { DecideIntent } from "@/lib/marquee/intent";
import { getCopy, type Language } from "@/lib/marquee/copy";

const TMDB_IMG = "https://image.tmdb.org/t/p";

export interface DecideResult {
  tmdbId: number;
  title: string;
  year: number | null;
  mediaType: string;
  runtime: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  streamingProviders: string[];
  tmdbRating: number | null;
  imdbRating: number | null;
  overview: string | null;
  trailerKey: string | null;
  explanation: string;
}

export function ResultCard({
  result,
  intent,
  language,
  onGiveMeAnother,
  onNotTonight,
  onMarkWatched,
}: {
  result: DecideResult;
  intent: DecideIntent | null;
  language: Language;
  onGiveMeAnother: () => void;
  onNotTonight: () => void;
  onMarkWatched: () => void;
}) {
  const copy = getCopy(language);
  const [showWhy, setShowWhy] = useState(false);

  const runtimeLabel =
    result.runtime != null
      ? result.runtime >= 60
        ? `${Math.floor(result.runtime / 60)}h ${result.runtime % 60}m`
        : `${result.runtime} min`
      : null;

  const watchUrl = `https://www.themoviedb.org/${result.mediaType}/${result.tmdbId}/watch`;

  const rating =
    result.imdbRating != null
      ? { value: result.imdbRating, label: "IMDb" }
      : result.tmdbRating != null
        ? { value: result.tmdbRating, label: "TMDB" }
        : null;

  const matchedBits: string[] = [];
  if (intent) {
    if (intent.maxRuntimeMinutes) matchedBits.push(`under ${intent.maxRuntimeMinutes} min`);
    if (intent.hookSpeed === "fast") matchedBits.push("fast hook");
    if (intent.backgroundFriendly) matchedBits.push("phone-friendly");
    for (const m of intent.moods) matchedBits.push(m.replace(/_/g, " "));
    for (const a of intent.avoidMoods) matchedBits.push(`avoiding ${a.replace(/_/g, " ")}`);
  }

  return (
    <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="relative h-56 w-full sm:h-72">
        {result.backdropPath || result.posterPath ? (
          <img
            src={`${TMDB_IMG}/w1280${result.backdropPath ?? result.posterPath}`}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a0a14] to-[#0e1420]" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      </div>

      <div className="px-5 pb-5 pt-4">
        <h2 className="font-display text-2xl font-semibold text-[#F5EEDC]">{result.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-white/50">
          {result.year && <span>{result.year}</span>}
          <span>{result.mediaType}</span>
          {runtimeLabel && <span>{runtimeLabel}</span>}
          {rating && (
            <span className="text-[#E3B24B]">
              ★ {rating.value.toFixed(1)} {rating.label}
            </span>
          )}
        </div>

        {result.streamingProviders.length > 0 && (
          <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-[#E3B24B]">
            On {result.streamingProviders.slice(0, 3).join(" · ")}
          </p>
        )}

        {result.overview && (
          <p className="mt-3 text-[13px] leading-relaxed text-white/50">{result.overview}</p>
        )}

        <p className="mt-3 text-[15px] leading-relaxed text-white/80">{result.explanation}</p>

        {result.trailerKey && (
          <a
            href={`https://www.youtube.com/watch?v=${result.trailerKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs font-medium text-white/40 underline-offset-4 hover:text-white/70 hover:underline"
          >
            ▶ Watch Trailer
          </a>
        )}

        {matchedBits.length > 0 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              className="text-xs font-medium text-white/40 underline-offset-4 hover:text-white/70 hover:underline"
            >
              {copy.whyThis}
            </button>
            {showWhy && (
              <p className="mt-1.5 text-xs text-white/50">Matched: {matchedBits.join(", ")}.</p>
            )}
          </div>
        )}

        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 block w-full rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] py-3.5 text-center text-[15px] font-semibold text-[#181104] transition-transform hover:brightness-110"
        >
          {copy.primaryActionLabel}
        </a>

        <div className="mt-2 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onGiveMeAnother}
            className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
          >
            {copy.giveMeAnother}
          </button>
          <button
            type="button"
            onClick={onNotTonight}
            className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
          >
            {copy.notTonight}
          </button>
          <button
            type="button"
            onClick={onMarkWatched}
            className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/10"
          >
            {copy.markWatched}
          </button>
        </div>
      </div>
    </div>
  );
}
