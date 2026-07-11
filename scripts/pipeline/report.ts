import { supabase } from "@/lib/pipeline/supabase";

interface MentionRow {
  tmdb_id: number | null;
  sentiment: string;
  descriptors: string[];
  resolution_confidence: string | null;
  video_id: string;
}

const REC_SENTIMENTS = new Set(["enthusiastic_rec", "qualified_rec"]);

/** Prints the sanity-check queries used to judge whether the pipeline's output is worth building on. */
export async function printReport(curatorId?: string) {
  const { data: curators } = await supabase.from("curators").select("id, name");
  const curatorById = new Map((curators ?? []).map((c) => [c.id as string, c.name as string]));

  let videoQuery = supabase.from("videos").select("id, curator_id, audience_sentiment_score");
  if (curatorId) videoQuery = videoQuery.eq("curator_id", curatorId);
  const { data: videos } = await videoQuery;
  const curatorByVideoId = new Map(
    (videos ?? []).map((v) => [v.id as string, v.curator_id as string]),
  );
  const videoIds = (videos ?? []).map((v) => v.id as string);

  const { data: mentions } = await supabase
    .from("mentions")
    .select("tmdb_id, sentiment, descriptors, resolution_confidence, video_id")
    .in("video_id", videoIds.length > 0 ? videoIds : ["00000000-0000-0000-0000-000000000000"]);
  const rows = (mentions ?? []) as MentionRow[];

  const { data: titles } = await supabase.from("titles").select("tmdb_id, title");
  const titleById = new Map((titles ?? []).map((t) => [t.tmdb_id as number, t.title as string]));

  console.log("=== Mentions per curator ===");
  const perCurator = new Map<string, number>();
  for (const m of rows) {
    const cId = curatorByVideoId.get(m.video_id);
    if (!cId) continue;
    perCurator.set(cId, (perCurator.get(cId) ?? 0) + 1);
  }
  for (const [cId, count] of [...perCurator.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${curatorById.get(cId) ?? cId}: ${count}`);
  }
  if (perCurator.size === 0) console.log("  (none yet)");

  console.log("\n=== Top 20 titles by distinct curators recommending ===");
  const curatorsByTitle = new Map<number, Set<string>>();
  for (const m of rows) {
    if (!m.tmdb_id || !REC_SENTIMENTS.has(m.sentiment)) continue;
    const cId = curatorByVideoId.get(m.video_id);
    if (!cId) continue;
    if (!curatorsByTitle.has(m.tmdb_id)) curatorsByTitle.set(m.tmdb_id, new Set());
    curatorsByTitle.get(m.tmdb_id)!.add(cId);
  }
  const topTitles = [...curatorsByTitle.entries()]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 20);
  if (topTitles.length === 0) console.log("  (none yet)");
  for (const [tmdbId, curatorSet] of topTitles) {
    console.log(`  ${titleById.get(tmdbId) ?? `tmdb:${tmdbId}`} — ${curatorSet.size} curator(s)`);
  }

  console.log("\n=== Hidden gems (tagged hidden_gem by 2+ curators) ===");
  const hiddenGemCurators = new Map<number, Set<string>>();
  for (const m of rows) {
    if (!m.tmdb_id || !m.descriptors?.includes("hidden_gem")) continue;
    const cId = curatorByVideoId.get(m.video_id);
    if (!cId) continue;
    if (!hiddenGemCurators.has(m.tmdb_id)) hiddenGemCurators.set(m.tmdb_id, new Set());
    hiddenGemCurators.get(m.tmdb_id)!.add(cId);
  }
  const hiddenGems = [...hiddenGemCurators.entries()].filter(([, set]) => set.size >= 2);
  if (hiddenGems.length === 0) console.log("  (none yet)");
  for (const [tmdbId, curatorSet] of hiddenGems) {
    console.log(`  ${titleById.get(tmdbId) ?? `tmdb:${tmdbId}`} — ${curatorSet.size} curator(s)`);
  }

  console.log("\n=== Resolution rate ===");
  const total = rows.length;
  const counts = { exact: 0, disambiguated: 0, unresolved: 0, pending: 0 };
  for (const m of rows) {
    if (m.resolution_confidence === "exact") counts.exact++;
    else if (m.resolution_confidence === "disambiguated") counts.disambiguated++;
    else if (m.resolution_confidence === "unresolved") counts.unresolved++;
    else counts.pending++;
  }
  const pct = (n: number) => (total > 0 ? ((n / total) * 100).toFixed(1) : "0.0");
  console.log(`  total mentions: ${total}`);
  console.log(`  exact: ${counts.exact} (${pct(counts.exact)}%)`);
  console.log(`  disambiguated: ${counts.disambiguated} (${pct(counts.disambiguated)}%)`);
  console.log(`  unresolved: ${counts.unresolved} (${pct(counts.unresolved)}%)`);
  if (counts.pending > 0) console.log(`  pending resolution: ${counts.pending}`);

  console.log("\n=== Average audience comment sentiment per curator ===");
  const sentimentByCurator = new Map<string, number[]>();
  for (const v of videos ?? []) {
    if (v.audience_sentiment_score === null || v.audience_sentiment_score === undefined) continue;
    const cId = v.curator_id as string;
    if (!sentimentByCurator.has(cId)) sentimentByCurator.set(cId, []);
    sentimentByCurator.get(cId)!.push(v.audience_sentiment_score as number);
  }
  if (sentimentByCurator.size === 0) console.log("  (none yet)");
  for (const [cId, scores] of sentimentByCurator.entries()) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    console.log(`  ${curatorById.get(cId) ?? cId}: ${avg.toFixed(2)} (${scores.length} video(s))`);
  }
}

async function main() {
  const curatorId = process.argv.find((a) => a.startsWith("--curator-id="))?.split("=")[1];
  await printReport(curatorId);
}

if (import.meta.main) {
  main();
}
