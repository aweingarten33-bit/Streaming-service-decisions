import { curators as configuredCurators } from "../../config/curators";
import { supabase } from "@/lib/pipeline/supabase";

const ACTIVE_SENTIMENTS = ["enthusiastic_rec", "qualified_rec"];

type CountResult = { count: number | null; error: { message: string } | null };
type CountQuery = {
  eq(column: string, value: unknown): CountQuery;
  gt(column: string, value: unknown): CountQuery;
  in(column: string, values: readonly unknown[]): CountQuery;
  is(column: string, value: unknown): CountQuery;
  not(column: string, operator: string, value: unknown): CountQuery;
};

async function count(
  table: string,
  apply: (query: CountQuery) => CountQuery = (query) => query,
): Promise<number> {
  const result = (await apply(
    supabase.from(table).select("*", { count: "exact", head: true }) as unknown as CountQuery,
  )) as unknown as CountResult;
  if (result.error) throw new Error(`${table} count failed: ${result.error.message}`);
  return result.count ?? 0;
}

function pct(part: number, whole: number): string {
  return whole > 0 ? `${((part / whole) * 100).toFixed(1)}%` : "0.0%";
}

async function main() {
  const { data: curators, error: curatorsError } = await supabase
    .from("curators")
    .select("id, name, youtube_channel_id, active, discovery_source")
    .order("name");
  if (curatorsError) throw new Error(`Failed to load curators: ${curatorsError.message}`);

  const { data: configuredRows, error: configuredError } = await supabase
    .from("curators")
    .select("id, name, youtube_channel_id, active")
    .in(
      "name",
      configuredCurators.map((c) => c.name),
    );
  if (configuredError)
    throw new Error(`Failed to load configured curators: ${configuredError.message}`);

  const configuredByName = new Map((configuredRows ?? []).map((c) => [c.name as string, c]));
  const curatorIds = (curators ?? []).map((c) => c.id as string);

  const totalVideos = await count("videos");
  const extractedVideos = await count("videos", (q) => q.not("extracted_at", "is", null));
  const pendingVideos = await count("videos", (q) =>
    q.is("extracted_at", null).eq("transcript_status", "pending"),
  );
  const retryableUnavailable = await count("videos", (q) =>
    q.is("extracted_at", null).eq("transcript_status", "unavailable"),
  );
  const totalMentions = await count("mentions", (q) => q.not("video_id", "is", null));
  const resolvedMentions = await count("mentions", (q) =>
    q.not("video_id", "is", null).not("tmdb_id", "is", null),
  );
  const positiveResolvedMentions = await count("mentions", (q) =>
    q.not("video_id", "is", null).not("tmdb_id", "is", null).in("sentiment", ACTIVE_SENTIMENTS),
  );

  let titleSignalRows: number | null = null;
  try {
    titleSignalRows = await count("title_signal_summary", (q) => q.gt("positive_mention_count", 0));
  } catch {
    titleSignalRows = null;
  }

  console.log("=== YouTube bank health ===");
  console.log(`Curators in DB: ${(curators ?? []).length}`);
  console.log(`Configured active curators: ${configuredCurators.filter((c) => c.active).length}`);
  console.log(`Videos in bank: ${totalVideos}`);
  console.log(
    `Extracted videos: ${extractedVideos}/${totalVideos} (${pct(extractedVideos, totalVideos)})`,
  );
  console.log(`Pending transcript extraction: ${pendingVideos}`);
  console.log(`Retryable unavailable transcripts: ${retryableUnavailable}`);
  console.log(`YouTube mentions: ${totalMentions}`);
  console.log(
    `Resolved YouTube mentions: ${resolvedMentions}/${totalMentions} (${pct(resolvedMentions, totalMentions)})`,
  );
  console.log(
    `Resolved positive recommendation mentions usable by website: ${positiveResolvedMentions}`,
  );
  console.log(
    `Aggregated title_signal_summary rows usable by website: ${titleSignalRows === null ? "table missing/not migrated" : titleSignalRows}`,
  );

  console.log("\n=== Configured curator coverage ===");
  for (const configured of configuredCurators.filter((c) => c.active)) {
    const row = configuredByName.get(configured.name);
    if (!row) {
      console.log(`MISSING IN DB: ${configured.name} (${configured.youtubeHandle})`);
      continue;
    }

    const curatorId = row.id as string;
    const videos = await count("videos", (q) => q.eq("curator_id", curatorId));
    const extracted = await count("videos", (q) =>
      q.eq("curator_id", curatorId).not("extracted_at", "is", null),
    );
    const unavailable = await count("videos", (q) =>
      q.eq("curator_id", curatorId).is("extracted_at", null).eq("transcript_status", "unavailable"),
    );
    const { data: videoRows } = await supabase
      .from("videos")
      .select("id")
      .eq("curator_id", curatorId);
    const ids = (videoRows ?? []).map((v) => v.id as string);
    const mentions =
      ids.length === 0
        ? 0
        : await count("mentions", (q) => q.not("video_id", "is", null).in("video_id", ids));
    const resolvedPositive =
      ids.length === 0
        ? 0
        : await count("mentions", (q) =>
            q.in("video_id", ids).not("tmdb_id", "is", null).in("sentiment", ACTIVE_SENTIMENTS),
          );

    const status = videos === 0 ? "NO VIDEOS" : resolvedPositive === 0 ? "NOT SERVING" : "SERVING";
    console.log(
      `${status}: ${configured.name} — videos ${videos}, extracted ${extracted}, unavailable ${unavailable}, mentions ${mentions}, resolved positive ${resolvedPositive}`,
    );
  }

  const curatorsWithoutVideos = [] as string[];
  for (const curator of curators ?? []) {
    const videos = await count("videos", (q) => q.eq("curator_id", curator.id));
    if (videos === 0) curatorsWithoutVideos.push(curator.name as string);
  }
  if (curatorsWithoutVideos.length > 0) {
    console.log("\nCurators in DB with zero videos:");
    for (const name of curatorsWithoutVideos) console.log(`  - ${name}`);
  }

  if (curatorIds.length === 0 || totalVideos === 0 || positiveResolvedMentions === 0) {
    process.exitCode = 1;
  }
}

if (import.meta.main) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
