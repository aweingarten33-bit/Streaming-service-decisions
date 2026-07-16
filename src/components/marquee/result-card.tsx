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
    <div className="shadow-stamp w-full overflow-hidden rounded-3xl border-2 border-rule bg-paper-2">
      <div className="relative h-56 w-full border-b-2 border-rule sm:h-72">
        {result.backdropPath || result.posterPath ? (
          <img
            src={`${TMDB_IMG}/w1280${result.backdropPath ?? result.posterPath}`}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-paper-3 to-paper-2" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-paper-2 via-transparent to-transparent" />
      </div>

      <div className="px-5 pb-5 pt-4">
        <h2 className="font-display text-2xl font-black tracking-tight text-ink">{result.title}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-2">
          {result.year && <span>{result.year}</span>}
          <span>{result.mediaType}</span>
          {runtimeLabel && <span>{runtimeLabel}</span>}
          {rating && (
            <span className="text-red-ink rounded bg-red px-1.5 py-0.5">
              ★ {rating.value.toFixed(1)} {rating.label}
            </span>
          )}
        </div>

        {result.streamingProviders.length > 0 && (
          <p className="mt-2 font-mono text-[11px] font-bold uppercase tracking-wider text-red">
            On {result.streamingProviders.slice(0, 3).join(" · ")}
          </p>
        )}

        {result.overview && (
          <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{result.overview}</p>
        )}

        <p className="mt-3 text-[15px] leading-relaxed text-ink/90">{result.explanation}</p>

        {result.trailerKey && (
          <a
            href={`https://www.youtube.com/watch?v=${result.trailerKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs font-medium text-ink/40 underline-offset-4 hover:text-ink-2 hover:underline"
          >
            ▶ Watch Trailer
          </a>
        )}

        {matchedBits.length > 0 && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setShowWhy((v) => !v)}
              className="text-xs font-medium text-ink/40 underline-offset-4 hover:text-ink-2 hover:underline"
            >
              {copy.whyThis}
            </button>
            {showWhy && (
              <p className="mt-1.5 text-xs text-ink-2">Matched: {matchedBits.join(", ")}.</p>
            )}
          </div>
        )}

        {/* the seal breaking -- one stencil-cut rule marks the moment of commitment */}
        <div className="stencil-rule mt-5" />

        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-press shadow-stamp-sm mt-3 block w-full rounded-xl border-2 border-rule bg-red py-3.5 text-center text-[15px] font-black uppercase tracking-wide text-red-ink hover:brightness-110"
        >
          {copy.primaryActionLabel}
        </a>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={onGiveMeAnother}
            className="btn-press rounded-xl border-2 border-rule bg-paper py-2.5 text-xs font-bold text-ink-2 transition-colors hover:bg-paper-3"
          >
            {copy.giveMeAnother}
          </button>
          <button
            type="button"
            onClick={onNotTonight}
            className="btn-press rounded-xl border-2 border-rule bg-paper py-2.5 text-xs font-bold text-ink-2 transition-colors hover:bg-paper-3"
          >
            {copy.notTonight}
          </button>
          <button
            type="button"
            onClick={onMarkWatched}
            className="btn-press rounded-xl border-2 border-rule bg-paper py-2.5 text-xs font-bold text-ink-2 transition-colors hover:bg-paper-3"
          >
            {copy.markWatched}
          </button>
        </div>
      </div>
    </div>
  );
}
