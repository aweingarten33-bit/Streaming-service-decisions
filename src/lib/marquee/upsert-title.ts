import { getSupabase } from "@/lib/pipeline/supabase";
import { getDetails, getExternalIds, getWatchProviders } from "@/lib/pipeline/tmdb";
import type { ResolvedMediaType } from "@/lib/pipeline/types";

/**
 * Fetches live TMDB details and caches them in `titles` -- shared by every
 * place a title enters a user's watchlist. `knownImdbId` lets CSV import
 * pass through the id it already parsed from the export instead of paying
 * for an extra TMDB round trip; anything else (manual search-add) resolves
 * it via TMDB's external-ids lookup. The real IMDb rating itself isn't
 * fetched here -- that's a bulk-dataset sync (see scripts/sync-imdb-ratings.ts),
 * not a per-title API call.
 */
export async function upsertTitle(
  tmdbId: number,
  mediaType: ResolvedMediaType,
  knownImdbId?: string | null,
): Promise<void> {
  const [details, streamingProviders, imdbId] = await Promise.all([
    getDetails(tmdbId, mediaType),
    getWatchProviders(tmdbId, mediaType).catch(() => []),
    knownImdbId !== undefined ? knownImdbId : getExternalIds(tmdbId, mediaType).catch(() => null),
  ]);

  const { error } = await getSupabase().from("titles").upsert(
    {
      tmdb_id: details.tmdbId,
      media_type: details.mediaType,
      title: details.title,
      year: details.year,
      genres: details.genres,
      runtime: details.runtime,
      poster_path: details.posterPath,
      backdrop_path: details.backdropPath,
      streaming_providers: streamingProviders,
      tmdb_rating: details.voteAverage,
      tmdb_vote_count: details.voteCount,
      overview: details.overview,
      trailer_key: details.trailerKey,
      imdb_id: imdbId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tmdb_id,media_type" },
  );

  if (error) throw new Error(`Failed to cache title ${tmdbId}: ${error.message}`);
}
