"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Play, Plus, BookmarkCheck, ChevronRight } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist";
import { CueingDots, Kicker, MetaLine, Sprockets, Stamp, TMDB_IMG, Wordmark } from "./ui";

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
  backdropPath: string | null;
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
  const [playing, setPlaying] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { has, toggle } = useWatchlist();

  useEffect(() => {
    setDetail(null);
    setSimilar([]);
    setError(null);
    setPlaying(false);
    scrollRef.current?.scrollTo({ top: 0 });
    fetch(`/api/title/${tmdbId}?type=${mediaType}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Could not load this title.");
        setDetail(data.title);
        setSimilar(data.similar ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load this title."));
  }, [tmdbId, mediaType]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const runtimeLabel =
    detail?.runtime != null
      ? detail.runtime >= 60
        ? `${Math.floor(detail.runtime / 60)} hr ${detail.runtime % 60} min`
        : `${detail.runtime} min`
      : null;

  const saved = detail ? has(detail.tmdbId) : false;

  return (
    <div ref={scrollRef} className="fixed inset-0 z-50 overflow-y-auto bg-background">
      {/* Masthead */}
      <header className="sticky top-0 z-30 bg-background/92 backdrop-blur-md">
        <Sprockets />
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
          <button
            onClick={onClose}
            aria-label="Back"
            className="focus-ink inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-ink transition-colors hover:text-vermilion"
          >
            <ArrowLeft size={15} /> Back
          </button>
          <Wordmark size="sm" />
        </div>
        <hr className="rule-ink" />
      </header>

      {error && (
        <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-8">
          <div className="border-[1.5px] border-destructive bg-destructive/5 px-5 py-4 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-destructive">
              Reel unavailable
            </p>
            <p className="mt-1.5 font-serif text-ink">{error}</p>
          </div>
        </div>
      )}

      {!detail && !error && (
        <div className="flex min-h-[60vh] items-center justify-center">
          <CueingDots label="Threading the projector" />
        </div>
      )}

      {detail && (
        <div className="mx-auto w-full max-w-2xl px-5 pb-20 pt-6">
          <Kicker>{detail.mediaType === "tv" ? "Series program" : "Feature program"}</Kicker>

          {/* Framed backdrop / trailer */}
          <div className="group relative mt-3 overflow-hidden frame-ink bg-secondary">
            <div className="aspect-video w-full">
              {playing && detail.trailerKey ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${detail.trailerKey}?autoplay=1&playsinline=1`}
                  title={`${detail.title} trailer`}
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : detail.backdropPath ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`${TMDB_IMG}/w1280${detail.backdropPath}`}
                  alt=""
                  aria-hidden
                  className="img-vermilion h-full w-full object-cover"
                />
              ) : (
                <div className="grid h-full w-full place-items-center bg-secondary">
                  <span className="kicker text-muted-foreground">No still on file</span>
                </div>
              )}
            </div>
            {!playing && detail.trailerKey && (
              <button
                onClick={() => setPlaying(true)}
                className="focus-ink absolute bottom-3 right-3 inline-flex items-center gap-2 border-[1.5px] border-ink bg-background px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-ink transition-colors hover:bg-vermilion hover:text-accent-foreground hover:border-vermilion"
              >
                <Play size={13} /> Play trailer
              </button>
            )}
          </div>

          {/* Title block */}
          <h1 className="mt-6 text-balance font-display text-4xl font-black leading-[0.95] tracking-tight text-ink sm:text-5xl">
            {detail.title}
          </h1>
          <MetaLine
            className="mt-3"
            items={[
              detail.year ? String(detail.year) : null,
              detail.mediaType,
              runtimeLabel,
              detail.rating != null
                ? `${detail.ratingSource} ${detail.rating.toFixed(1)}${
                    detail.voteCount ? ` · ${detail.voteCount.toLocaleString()}` : ""
                  }`
                : null,
            ]}
          />

          {detail.genres.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {detail.genres.map((g) => (
                <span
                  key={g}
                  className="border border-ink/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-ink/70"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Primary actions */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {detail.streamingProviders.length > 0 && (
              <div className="flex-1 border-[1.5px] border-ink bg-vermilion px-5 py-3.5 text-accent-foreground">
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-80">
                  Now playing on
                </p>
                <p className="font-display text-lg font-bold leading-tight">
                  {detail.streamingProviders[0]}
                </p>
                {detail.streamingProviders.length > 1 && (
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] opacity-80">
                    Also on {detail.streamingProviders.slice(1, 3).join(", ")}
                  </p>
                )}
              </div>
            )}
            <button
              onClick={() =>
                toggle({
                  tmdbId: detail.tmdbId,
                  title: detail.title,
                  year: detail.year,
                  mediaType: detail.mediaType,
                  posterPath: detail.posterPath,
                })
              }
              aria-pressed={saved}
              className={`focus-ink inline-flex items-center justify-center gap-2 border-[1.5px] border-ink px-5 py-3.5 font-display text-sm font-bold uppercase tracking-wide transition-colors ${
                saved ? "bg-ink text-primary-foreground" : "bg-card text-ink hover:bg-secondary"
              } ${detail.streamingProviders.length === 0 ? "flex-1" : ""}`}
            >
              {saved ? <BookmarkCheck size={16} /> : <Plus size={16} />}
              {saved ? "On your list" : "Add to list"}
            </button>
          </div>

          {/* Why this — editorial feature */}
          {detail.why && (
            <div className="mt-8 border-l-2 border-vermilion bg-secondary/60 px-5 py-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-vermilion">
                Why the DJ picked this
              </p>
              <p className="mt-2 font-serif text-lg leading-relaxed text-ink">{detail.why}</p>
            </div>
          )}

          {/* Synopsis */}
          {detail.overview && (
            <div className="mt-8">
              <div className="flex items-center gap-3">
                <Kicker className="text-ink">Synopsis</Kicker>
                <hr className="rule-hair flex-1" />
              </div>
              <p className="mt-3 font-serif text-[17px] leading-relaxed text-ink/90">
                {detail.overview}
              </p>
            </div>
          )}

          {/* Credits */}
          {(detail.topCast.length > 0 || detail.director) && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {detail.director && (
                <div>
                  <Kicker>{detail.mediaType === "tv" ? "Created by" : "Directed by"}</Kicker>
                  <p className="mt-1 font-serif text-lg text-ink">{detail.director}</p>
                </div>
              )}
              {detail.topCast.length > 0 && (
                <div>
                  <Kicker>Starring</Kicker>
                  <p className="mt-1 font-serif text-lg leading-snug text-ink">
                    {detail.topCast.join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* More like this */}
          {similar.length > 0 && (
            <div className="mt-10">
              <div className="flex items-end justify-between border-b-[1.5px] border-ink pb-2">
                <Kicker className="text-ink">Double feature — more like this</Kicker>
                <Kicker>{String(similar.length).padStart(2, "0")}</Kicker>
              </div>
              <div className="mt-4 divide-y divide-border">
                {similar.map((s, i) => (
                  <button
                    key={s.tmdbId}
                    onClick={() => onSwap(s.tmdbId, s.mediaType)}
                    className="focus-ink group flex w-full items-center gap-4 py-3 text-left"
                  >
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="h-16 w-28 flex-none overflow-hidden frame-ink bg-secondary">
                      {s.backdropPath || s.posterPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${TMDB_IMG}/w300${s.backdropPath ?? s.posterPath}`}
                          alt=""
                          aria-hidden
                          loading="lazy"
                          className="img-duotone h-full w-full object-cover group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-display font-bold text-ink group-hover:text-vermilion">
                        {s.title}
                      </p>
                      <MetaLine
                        className="mt-0.5"
                        items={[
                          s.year ? String(s.year) : null,
                          s.rating != null ? `★ ${s.rating.toFixed(1)}` : null,
                        ]}
                      />
                    </div>
                    <ChevronRight
                      size={16}
                      className="flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-vermilion"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
