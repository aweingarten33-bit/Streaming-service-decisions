import { getSupabase } from "@/lib/pipeline/supabase";
import { getDetails, getWatchProviders } from "@/lib/pipeline/tmdb";
import type { ResolvedMediaType } from "@/lib/pipeline/types";

/** Fetches live TMDB details and caches them in `titles` -- shared by every place a title enters a user's watchlist. */
export async function upsertTitle(tmdbId: number, mediaType: ResolvedMediaType): Promise<void> {
  const [details, streamingProviders] = await Promise.all([
    getDetails(tmdbId, mediaType),
    getWatchProviders(tmdbId, mediaType).catch(() => []),
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
      updated_at: new Date().toISOString(),
    },
    { onConflict: "tmdb_id,media_type" },
  );

  if (error) throw new Error(`Failed to cache title ${tmdbId}: ${error.message}`);
}
