import { supabase } from "@/lib/pipeline/supabase";
import { searchTitle, getDetails, getWatchProviders } from "@/lib/pipeline/tmdb";
import { disambiguateCandidates } from "@/lib/pipeline/disambiguate";
import type { MediaType } from "@/lib/pipeline/types";

async function upsertTitle(details: Awaited<ReturnType<typeof getDetails>>) {
  const streamingProviders = await getWatchProviders(details.tmdbId, details.mediaType).catch(
    () => [],
  );
  await supabase.from("titles").upsert(
    {
      tmdb_id: details.tmdbId,
      title: details.title,
      media_type: details.mediaType,
      year: details.year,
      genres: details.genres,
      runtime: details.runtime,
      poster_path: details.posterPath,
      backdrop_path: details.backdropPath,
      streaming_providers: streamingProviders,
    },
    { onConflict: "tmdb_id" },
  );
}

/** Resolves one mention to a TMDB ID. Never guesses silently — falls back to 'unresolved'. */
export async function resolveMention(mention: {
  id: string;
  title_mentioned: string;
  media_type: MediaType;
  year_hint: number | null;
  context_clues: string;
}): Promise<"exact" | "disambiguated" | "unresolved"> {
  const candidates = await searchTitle(mention.title_mentioned, mention.media_type);

  if (candidates.length === 0) {
    await supabase
      .from("mentions")
      .update({ resolution_confidence: "unresolved" })
      .eq("id", mention.id);
    return "unresolved";
  }

  const yearFiltered = mention.year_hint
    ? candidates.filter((c) => c.year !== null && Math.abs(c.year - mention.year_hint!) <= 1)
    : candidates;

  if (candidates.length === 1 || yearFiltered.length === 1) {
    const chosen = yearFiltered.length === 1 ? yearFiltered[0] : candidates[0];
    const details = await getDetails(chosen.tmdbId, chosen.mediaType);
    await upsertTitle(details);
    await supabase
      .from("mentions")
      .update({ tmdb_id: details.tmdbId, resolution_confidence: "exact" })
      .eq("id", mention.id);
    return "exact";
  }

  const shortlistPool = yearFiltered.length > 0 ? yearFiltered : candidates;
  const chosenId = await disambiguateCandidates(shortlistPool, mention.context_clues);
  if (chosenId === null) {
    await supabase
      .from("mentions")
      .update({ resolution_confidence: "unresolved" })
      .eq("id", mention.id);
    return "unresolved";
  }

  const chosenCandidate = shortlistPool.find((c) => c.tmdbId === chosenId)!;
  const details = await getDetails(chosenCandidate.tmdbId, chosenCandidate.mediaType);
  await upsertTitle(details);
  await supabase
    .from("mentions")
    .update({ tmdb_id: details.tmdbId, resolution_confidence: "disambiguated" })
    .eq("id", mention.id);
  return "disambiguated";
}

async function main() {
  const force = process.argv.includes("--force");
  const curatorId = process.argv.find((a) => a.startsWith("--curator-id="))?.split("=")[1];

  let videoIds: string[] | undefined;
  if (curatorId) {
    const { data: vids } = await supabase.from("videos").select("id").eq("curator_id", curatorId);
    videoIds = (vids ?? []).map((v) => v.id as string);
  }

  let query = supabase
    .from("mentions")
    .select("id, title_mentioned, media_type, year_hint, context_clues, video_id");
  if (!force) query = query.is("resolution_confidence", null);
  if (videoIds)
    query = query.in(
      "video_id",
      videoIds.length > 0 ? videoIds : ["00000000-0000-0000-0000-000000000000"],
    );
  const { data: mentions, error } = await query;
  if (error) throw new Error(`Failed to load mentions: ${error.message}`);

  const counts = { exact: 0, disambiguated: 0, unresolved: 0 };
  for (const mention of mentions ?? []) {
    process.stdout.write(`Resolving "${mention.title_mentioned}"... `);
    try {
      const result = await resolveMention(mention);
      counts[result]++;
      console.log(result);
    } catch (err) {
      console.log(`FAILED: ${String(err)}`);
    }
  }

  console.log(
    `\nDone. exact=${counts.exact} disambiguated=${counts.disambiguated} unresolved=${counts.unresolved}`,
  );
}

if (import.meta.main) {
  main();
}
