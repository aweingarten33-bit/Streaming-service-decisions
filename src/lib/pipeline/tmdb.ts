import { env } from "./env";
import type { MediaType, ResolvedMediaType } from "./types";

const BASE = "https://api.themoviedb.org/3";
const MAX_ATTEMPTS = 5;

async function tmdbFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", env.TMDB_API_KEY);
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

export interface TmdbDetails extends TmdbCandidate {
  genres: string[];
  runtime: number | null;
  director: string | null;
}

/** Fetches full details for disambiguation and storage, including director/creator for context. */
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
    genres: { name: string }[];
    runtime?: number;
    episode_run_time?: number[];
    created_by?: { name: string }[];
    credits?: { crew: { job: string; name: string }[] };
  }>(`/${mediaType}/${tmdbId}`, { append_to_response: "credits" });

  const dateStr = data.release_date || data.first_air_date;
  const director =
    mediaType === "movie"
      ? (data.credits?.crew.find((c) => c.job === "Director")?.name ?? null)
      : (data.created_by?.[0]?.name ?? null);

  return {
    tmdbId: data.id,
    title: data.title ?? data.name ?? "",
    mediaType,
    year: dateStr ? Number(dateStr.slice(0, 4)) : null,
    overview: data.overview,
    posterPath: data.poster_path,
    genres: data.genres.map((g) => g.name),
    runtime: data.runtime ?? data.episode_run_time?.[0] ?? null,
    director,
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
