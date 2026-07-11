import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import { Readable } from "node:stream";
import { supabase } from "@/lib/pipeline/supabase";
import { getExternalIds, getDetails } from "@/lib/pipeline/tmdb";
import type { ResolvedMediaType } from "@/lib/pipeline/types";

const RATINGS_URL = "https://datasets.imdbws.com/title.ratings.tsv.gz";

/** Backfills titles.imdb_id for any row missing it, via TMDB's external_ids endpoint. */
async function backfillImdbIds(): Promise<number> {
  const { data: titles, error } = await supabase
    .from("titles")
    .select("tmdb_id, media_type")
    .is("imdb_id", null);
  if (error) throw new Error(`Failed to load titles: ${error.message}`);

  let updated = 0;
  for (const t of titles ?? []) {
    try {
      const imdbId = await getExternalIds(t.tmdb_id, t.media_type as ResolvedMediaType);
      if (imdbId) {
        await supabase.from("titles").update({ imdb_id: imdbId }).eq("tmdb_id", t.tmdb_id);
        updated++;
      }
    } catch (err) {
      console.log(`  Failed to backfill imdb_id for tmdb:${t.tmdb_id}: ${String(err)}`);
    }
  }
  return updated;
}

/**
 * Streams IMDb's ratings dataset line-by-line, matching only against titles we
 * already have (loaded into a Set up front) — the multi-million-row file is
 * never held in memory, only the small set of matches we actually care about.
 */
async function joinRatings(): Promise<number> {
  const { data: titles, error } = await supabase
    .from("titles")
    .select("tmdb_id, imdb_id")
    .not("imdb_id", "is", null);
  if (error) throw new Error(`Failed to load titles: ${error.message}`);

  const tmdbIdByImdbId = new Map<string, number>();
  for (const t of titles ?? []) {
    if (t.imdb_id) tmdbIdByImdbId.set(t.imdb_id, t.tmdb_id);
  }
  if (tmdbIdByImdbId.size === 0) return 0;

  console.log(
    `Streaming IMDb ratings dataset, matching against ${tmdbIdByImdbId.size} known title(s)...`,
  );
  const res = await fetch(RATINGS_URL);
  if (!res.ok || !res.body) throw new Error(`Failed to download ratings dataset: ${res.status}`);

  const nodeStream = Readable.fromWeb(res.body as never);
  const rl = createInterface({ input: nodeStream.pipe(createGunzip()) });

  const matches: { tmdbId: number; rating: number; votes: number }[] = [];
  let isHeaderRow = true;

  for await (const line of rl) {
    if (isHeaderRow) {
      isHeaderRow = false; // tconst \t averageRating \t numVotes
      continue;
    }
    const [tconst, avgRating, numVotes] = line.split("\t");
    const tmdbId = tmdbIdByImdbId.get(tconst);
    if (tmdbId === undefined) continue;
    matches.push({ tmdbId, rating: Number(avgRating), votes: Number(numVotes) });
  }

  const now = new Date().toISOString();
  for (const m of matches) {
    await supabase
      .from("titles")
      .update({ imdb_rating: m.rating, imdb_votes: m.votes, ratings_updated_at: now })
      .eq("tmdb_id", m.tmdbId);
  }

  return matches.length;
}

/**
 * Refreshes TMDB's own vote_average/vote_count for every title, from the same
 * details call the pipeline already makes elsewhere — a second, free
 * general-audience rating source alongside IMDb's, useful when IMDb coverage
 * is thin. Re-run safe: just overwrites with current numbers.
 */
async function refreshTmdbRatings(): Promise<number> {
  const { data: titles, error } = await supabase.from("titles").select("tmdb_id, media_type");
  if (error) throw new Error(`Failed to load titles: ${error.message}`);

  let updated = 0;
  for (const t of titles ?? []) {
    try {
      const details = await getDetails(t.tmdb_id, t.media_type as ResolvedMediaType);
      if (details.voteAverage !== null) {
        await supabase
          .from("titles")
          .update({ tmdb_rating: details.voteAverage, tmdb_vote_count: details.voteCount })
          .eq("tmdb_id", t.tmdb_id);
        updated++;
      }
    } catch (err) {
      console.log(`  Failed to refresh TMDB rating for tmdb:${t.tmdb_id}: ${String(err)}`);
    }
  }
  return updated;
}

async function main() {
  const start = Date.now();

  console.log("Step 1: backfilling missing imdb_id values via TMDB...");
  const backfilled = await backfillImdbIds();
  console.log(`  Backfilled ${backfilled} imdb_id value(s).\n`);

  console.log("Step 2: joining IMDb ratings dataset...");
  const rowsUpdated = await joinRatings();
  console.log(`  Updated ${rowsUpdated} title(s) with ratings.\n`);

  console.log("Step 3: refreshing TMDB's own rating/vote count...");
  const tmdbRefreshed = await refreshTmdbRatings();
  console.log(`  Updated ${tmdbRefreshed} title(s) with TMDB's own rating.\n`);

  const durationMs = Date.now() - start;
  await supabase.from("pipeline_runs").insert({
    run_type: "ratings_sync",
    rows_updated: rowsUpdated,
    duration_ms: durationMs,
  });

  console.log(`Done in ${(durationMs / 1000).toFixed(1)}s.`);
}

if (import.meta.main) {
  main();
}
