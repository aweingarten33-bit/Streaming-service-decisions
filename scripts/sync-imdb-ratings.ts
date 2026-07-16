/**
 * Backfills real IMDb ratings onto every cached title that has a known
 * imdb_id, from IMDb's own official non-commercial ratings dataset
 * (https://www.imdb.com/interfaces/ -- free for personal/non-commercial use,
 * which this app is). Only titles already present in `titles` are touched;
 * this never bulk-imports the dataset itself.
 *
 * The file is refreshed by IMDb daily, so re-run this periodically (a
 * cron'd Supabase edge function or a manual `bun run sync-imdb-ratings`
 * every so often is plenty for a personal watchlist app).
 */
import { getSupabase } from "@/lib/pipeline/supabase";

const RATINGS_URL = "https://datasets.imdbws.com/title.ratings.tsv.gz";

interface Rating {
  averageRating: number;
  numVotes: number;
}

async function fetchRatings(): Promise<Map<string, Rating>> {
  console.log(`Downloading ${RATINGS_URL} ...`);
  const res = await fetch(RATINGS_URL);
  if (!res.ok) throw new Error(`Failed to download IMDb ratings dataset: ${res.status}`);

  const gzipped = new Uint8Array(await res.arrayBuffer());
  const tsv = Buffer.from(Bun.gunzipSync(gzipped)).toString("utf-8");

  const ratings = new Map<string, Rating>();
  const lines = tsv.split("\n");
  // First line is the header (tconst, averageRating, numVotes).
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const [tconst, averageRating, numVotes] = line.split("\t");
    if (!tconst) continue;
    ratings.set(tconst, { averageRating: Number(averageRating), numVotes: Number(numVotes) });
  }
  console.log(`Parsed ${ratings.size} rated titles from the dataset.`);
  return ratings;
}

async function main() {
  const supabase = getSupabase();

  const { data: cached, error } = await supabase
    .from("titles")
    .select("tmdb_id, media_type, imdb_id")
    .not("imdb_id", "is", null);
  if (error) throw new Error(`Failed to load cached titles: ${error.message}`);
  if (!cached || cached.length === 0) {
    console.log("No cached titles have an imdb_id yet -- nothing to sync.");
    return;
  }

  const ratings = await fetchRatings();

  let updated = 0;
  let unmatched = 0;
  for (const title of cached) {
    const rating = ratings.get(title.imdb_id as string);
    if (!rating) {
      unmatched++;
      continue;
    }
    const { error: updateError } = await supabase
      .from("titles")
      .update({ imdb_rating: rating.averageRating, imdb_vote_count: rating.numVotes })
      .eq("tmdb_id", title.tmdb_id)
      .eq("media_type", title.media_type);
    if (updateError) {
      console.error(`Failed to update ${title.tmdb_id}/${title.media_type}:`, updateError.message);
      continue;
    }
    updated++;
  }

  console.log(`Updated ${updated} titles. ${unmatched} had no matching rating in the dataset.`);
}

main().catch((err) => {
  console.error("IMDb ratings sync failed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
