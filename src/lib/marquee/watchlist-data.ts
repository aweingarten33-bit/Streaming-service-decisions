import { getSupabase } from "@/lib/pipeline/supabase";
import type { WatchlistCandidate } from "./types";

export interface SavedTasteSource {
  id: string;
  title: string;
  description: string | null;
  note: string | null;
}

interface WatchlistItemRow {
  id: string;
  tmdb_id: number;
  media_type: string;
  status: string;
  titles: {
    title: string;
    year: number | null;
    genres: string[];
    runtime: number | null;
    poster_path: string | null;
    backdrop_path: string | null;
    streaming_providers: string[];
    tmdb_rating: number | null;
    imdb_rating: number | null;
    overview: string | null;
    trailer_key: string | null;
  } | null;
}

/** Loads saved IMDb list metadata that can act as lightweight taste signals without scraping list contents. */
export async function getSavedTasteSources(deviceId: string): Promise<SavedTasteSource[]> {
  const { data, error } = await getSupabase()
    .from("saved_lists")
    .select("id, title, description, note")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load saved lists: ${error.message}`);
  return (data ?? []) as SavedTasteSource[];
}

/** Loads a device's watchlist joined with cached TMDB metadata -- the only title pool `/api/decide` is ever allowed to pick from. */
export async function getWatchlistCandidates(deviceId: string): Promise<WatchlistCandidate[]> {
  const { data, error } = await getSupabase()
    .from("watchlist_items")
    .select(
      `id, tmdb_id, media_type, status,
       titles!inner ( title, year, genres, runtime, poster_path, backdrop_path, streaming_providers, tmdb_rating, imdb_rating, overview, trailer_key )`,
    )
    .eq("device_id", deviceId);

  if (error) throw new Error(`Failed to load watchlist: ${error.message}`);

  return ((data ?? []) as unknown as WatchlistItemRow[])
    .filter((row) => row.titles !== null)
    .map((row) => ({
      id: row.id,
      tmdbId: row.tmdb_id,
      mediaType: row.media_type as "movie" | "tv",
      status: row.status as "active" | "watched",
      title: row.titles!.title,
      year: row.titles!.year,
      genres: row.titles!.genres,
      runtime: row.titles!.runtime,
      posterPath: row.titles!.poster_path,
      backdropPath: row.titles!.backdrop_path,
      streamingProviders: row.titles!.streaming_providers,
      tmdbRating: row.titles!.tmdb_rating,
      imdbRating: row.titles!.imdb_rating,
      overview: row.titles!.overview,
      trailerKey: row.titles!.trailer_key,
    }));
}
