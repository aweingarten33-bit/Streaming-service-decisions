"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Play } from "lucide-react";

const TMDB_IMG = "https://image.tmdb.org/t/p";

interface DetailTitle {
  tmdbId: number;
  title: string;
  mediaType: string;
  year: number | null;
  genres: string[];
  runtime: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  streamingProviders: string[];
  rating: number | null;
  ratingSource: string;
  voteCount: number | null;
  overview: string | null;
  director: string | null;
  topCast: string[];
  trailerKey: string | null;
  why: string | null;
}

interface SimilarTitle {
  tmdbId: number;
  title: string;
  mediaType: string;
  year: number | null;
  posterPath: string | null;
  rating: number | null;
}

export function TitleDetail({
  tmdbId,
  mediaType,
  onClose,
  onSwap,
}: {
  tmdbId: number;
  mediaType: string;
  onClose: () => void;
  onSwap: (tmdbId: number, mediaType: string) => void;
}) {
  const [detail, setDetail] = useState<DetailTitle | null>(null);
  const [similar, setSimilar] = useState<SimilarTitle[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDetail(null);
    setSimilar([]);
    setError(null);
    fetch(`/api/title/${tmdbId}?type=${mediaType}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load this title.");
        setDetail(data.title);
        setSimilar(data.similar ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load this title."));
  }, [tmdbId, mediaType]);

  const runtimeLabel =
    detail?.runtime != null
      ? detail.runtime >= 60
        ? `${Math.floor(detail.runtime / 60)} hr ${detail.runtime % 60} min`
        : `${detail.runtime} min`
      : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#08080c]">
      <button
        onClick={onClose}
        aria-label="Back"
        className="fixed left-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md"
      >
        <ChevronLeft size={22} />
      </button>

      {error && (
        <div className="flex min-h-screen items-center justify-center px-8">
          <p className="text-sm text-red-300/90">{error}</p>
        </div>
      )}

      {!detail && !error && (
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#E3B24B]"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}

      {detail && (
        <div className="mx-auto w-full max-w-xl pb-16">
          <div className="relative h-64 w-full sm:h-80">
            {detail.backdropPath ? (
              <img
                src={`${TMDB_IMG}/w1280${detail.backdropPath}`}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-[#1a0a14] to-[#0e1420]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#08080c] via-transparent to-black/40" />
            {detail.trailerKey && (
              <a
                href={`https://www.youtube.com/watch?v=${detail.trailerKey}`}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-black/80"
              >
                <Play size={13} /> Play Trailer
              </a>
            )}
          </div>

          <div className="px-6">
            <h1 className="font-display mt-5 text-3xl font-semibold text-[#F5EEDC]">
              {detail.title}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] uppercase tracking-wider text-white/50">
              {detail.year && <span>{detail.year}</span>}
              <span>{detail.mediaType}</span>
              {runtimeLabel && <span>{runtimeLabel}</span>}
              {detail.rating != null && (
                <span className="text-white/70">
                  {detail.ratingSource} ★ {detail.rating.toFixed(1)}
                  {detail.voteCount ? ` · ${detail.voteCount.toLocaleString()}` : ""}
                </span>
              )}
            </div>

            {detail.genres.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {detail.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-white/70"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {detail.streamingProviders.length > 0 ? (
              <div className="mt-5 rounded-xl bg-gradient-to-br from-[#f2ca6d] to-[#c8933a] px-5 py-3 text-center font-semibold text-[#181104]">
                Watch on {detail.streamingProviders[0]}
                {detail.streamingProviders.length > 1 && (
                  <span className="block text-xs font-normal opacity-70">
                    Also on {detail.streamingProviders.slice(1, 3).join(", ")}
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-5 font-mono text-[11px] uppercase tracking-wider text-white/40">
                Not currently on a subscription service
              </p>
            )}

            {detail.overview && (
              <p className="mt-5 text-[15px] leading-relaxed text-white/80">{detail.overview}</p>
            )}

            {(detail.topCast.length > 0 || detail.director) && (
              <div className="mt-4 space-y-1 text-sm text-white/50">
                {detail.topCast.length > 0 && (
                  <p>
                    <span className="text-white/35">Starring:</span> {detail.topCast.join(", ")}
                  </p>
                )}
                {detail.director && (
                  <p>
                    <span className="text-white/35">
                      {detail.mediaType === "tv" ? "Created by:" : "Director:"}
                    </span>{" "}
                    {detail.director}
                  </p>
                )}
              </div>
            )}

            {detail.why && (
              <div className="mt-6 rounded-2xl border border-[#E3B24B]/30 bg-[#E3B24B]/5 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#E3B24B]">
                  Why this?
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/80">{detail.why}</p>
              </div>
            )}

            {similar.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-lg text-[#F5EEDC]">More Like This</h2>
                <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                  {similar.map((s) => (
                    <button
                      key={s.tmdbId}
                      onClick={() => onSwap(s.tmdbId, s.mediaType)}
                      className="w-24 flex-none text-left"
                    >
                      {s.posterPath ? (
                        <img
                          src={`${TMDB_IMG}/w200${s.posterPath}`}
                          alt={s.title}
                          className="h-36 w-24 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-36 w-24 rounded-lg bg-white/10" />
                      )}
                      <p className="mt-1.5 line-clamp-2 text-xs text-white/80">{s.title}</p>
                      {s.rating != null && (
                        <p className="font-mono text-[10px] text-white/40">
                          ★ {s.rating.toFixed(1)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
