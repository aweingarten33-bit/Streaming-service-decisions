import { env } from "./env";
import type { MediaType, ResolvedMediaType } from "./types";

const BASE = "https://api.themoviedb.org/3";
const MAX_ATTEMPTS = 5;

function tmdbApiKey(): string {
  if (!env.TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY is not set -- add it in your environment to use this feature.");
  }
  return env.TMDB_API_KEY;
}

async function tmdbFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", tmdbApiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url.toString());
    if (res.ok) return (await res.json()) as T;
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS - 1) {
      const retryAfter = Number(res.headers.get("retry-after")) || 2 ** attempt;
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }
    throw new Error(`TMDB API ${res.status} on ${path}: ${await res.text()}`);
  }
}

export interface TmdbCandidate {
  tmdbId: number;
  title: string;
  mediaType: ResolvedMediaType;
  year: number | null;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
}

interface TmdbSearchResult {
  id: number;
  title?: string;
  name?: string;
  media_type?: "movie" | "tv" | "person";
  release_date?: string;
  first_air_date?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
}

function toCandidate(r: TmdbSearchResult, fallbackType?: ResolvedMediaType): TmdbCandidate {
  const mediaType: ResolvedMediaType =
    r.media_type === "movie" || r.media_type === "tv" ? r.media_type : (fallbackType ?? "movie");
  const dateStr = r.release_date || r.first_air_date;
  return {
    tmdbId: r.id,
    title: r.title ?? r.name ?? "",
    mediaType,
    year: dateStr ? Number(dateStr.slice(0, 4)) : null,
    overview: r.overview,
    posterPath: r.poster_path,
    backdropPath: r.backdrop_path,
  };
}

/** Searches TMDB for a title. Uses the type-specific endpoint when known, /search/multi otherwise. */
export async function searchTitle(title: string, mediaType: MediaType): Promise<TmdbCandidate[]> {
  if (mediaType === "movie" || mediaType === "tv") {
    const data = await tmdbFetch<{ results: TmdbSearchResult[] }>(`/search/${mediaType}`, {
      query: title,
    });
    return data.results.map((r) => toCandidate(r, mediaType));
  }
  const data = await tmdbFetch<{ results: TmdbSearchResult[] }>("/search/multi", { query: title });
  return data.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .map((r) => toCandidate(r));
}

/** Looks up a title directly by its IMDb id (tt#######) -- exact match, no fuzzy search needed. */
export async function findByImdbId(imdbId: string): Promise<TmdbCandidate | null> {
  const data = await tmdbFetch<{
    movie_results: TmdbSearchResult[];
    tv_results: TmdbSearchResult[];
  }>(`/find/${imdbId}`, { external_source: "imdb_id" });
  const movie = data.movie_results[0];
  if (movie) return toCandidate(movie, "movie");
  const tv = data.tv_results[0];
  if (tv) return toCandidate(tv, "tv");
  return null;
}

export interface TmdbDetails extends TmdbCandidate {
  genres: string[];
  runtime: number | null;
  director: string | null;
  topCast: string[];
  trailerKey: string | null;
  voteAverage: number | null;
  voteCount: number | null;
}

/** Fetches full details for disambiguation, storage, and the title detail view. */
export async function getDetails(
  tmdbId: number,
  mediaType: ResolvedMediaType,
): Promise<TmdbDetails> {
  const data = await tmdbFetch<{
    id: number;
    title?: string;
    name?: string;
    release_date?: string;
    first_air_date?: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    genres: { name: string }[];
    runtime?: number;
    episode_run_time?: number[];
    created_by?: { name: string }[];
    credits?: { crew: { job: string; name: string }[]; cast?: { name: string }[] };
    videos?: { results: { site: string; type: string; key: string; official?: boolean }[] };
    vote_average?: number;
    vote_count?: number;
  }>(`/${mediaType}/${tmdbId}`, { append_to_response: "credits,videos" });

  const dateStr = data.release_date || data.first_air_date;
  const director =
    mediaType === "movie"
      ? (data.credits?.crew.find((c) => c.job === "Director")?.name ?? null)
      : (data.created_by?.[0]?.name ?? null);

  const youtubeVideos = (data.videos?.results ?? []).filter((v) => v.site === "YouTube");
  const trailerKey =
    youtubeVideos.find((v) => v.type === "Trailer" && v.official)?.key ??
    youtubeVideos.find((v) => v.type === "Trailer")?.key ??
    youtubeVideos.find((v) => v.type === "Teaser")?.key ??
    null;

  return {
    tmdbId: data.id,
    title: data.title ?? data.name ?? "",
    mediaType,
    year: dateStr ? Number(dateStr.slice(0, 4)) : null,
    overview: data.overview,
    posterPath: data.poster_path,
    backdropPath: data.backdrop_path,
    genres: data.genres.map((g) => g.name),
    runtime: data.runtime ?? data.episode_run_time?.[0] ?? null,
    director,
    topCast: (data.credits?.cast ?? []).slice(0, 4).map((c) => c.name),
    trailerKey,
    voteAverage: data.vote_average ?? null,
    voteCount: data.vote_count ?? null,
  };
}

/** Fetches the IMDb id for a title, for joining against IMDb's own ratings dataset. */
export async function getExternalIds(
  tmdbId: number,
  mediaType: ResolvedMediaType,
): Promise<string | null> {
  const data = await tmdbFetch<{ imdb_id?: string | null }>(
    `/${mediaType}/${tmdbId}/external_ids`,
    {},
  );
  return data.imdb_id ?? null;
}

/** Fetches real US subscription-tier streaming availability (never rent/buy, that's not "on your service"). */
export async function getWatchProviders(
  tmdbId: number,
  mediaType: ResolvedMediaType,
): Promise<string[]> {
  const data = await tmdbFetch<{
    results?: Record<string, { flatrate?: { provider_name: string }[] }>;
  }>(`/${mediaType}/${tmdbId}/watch/providers`, {});
  const us = data.results?.US;
  return (us?.flatrate ?? []).map((p) => p.provider_name);
}
