import { curators as curatorConfigs } from "../../config/curators";
import { supabase } from "@/lib/pipeline/supabase";
import { ingestCurator } from "./01-ingest-videos";
import { extractVideo } from "./02-extract-mentions";
import { resolveMention } from "./03-resolve-tmdb";
import { analyzeVideoComments } from "./04-analyze-comments";
import { printReport } from "./report";

/** Runs ingest -> extract -> resolve for exactly one curator, then prints the sanity-check report. */
async function main() {
  const handleArg = process.argv.find((a) => a.startsWith("--curator="))?.split("=")[1];
  const config = handleArg
    ? curatorConfigs.find((c) => c.youtubeHandle === handleArg)
    : curatorConfigs.find((c) => c.active);
  if (!config) throw new Error("No matching active curator found in config/curators.ts");

  console.log(`=== Step 1: ingest videos (${config.name}) ===`);
  const { curatorId, newVideos } = await ingestCurator(config);
  console.log(`${newVideos} new video(s) ingested.\n`);

  console.log("=== Step 2: extract mentions ===");
  const { data: videos, error: videosErr } = await supabase
    .from("videos")
    .select("id, youtube_video_id, title")
    .eq("curator_id", curatorId)
    .is("extracted_at", null);
  if (videosErr) throw new Error(videosErr.message);
  for (const video of videos ?? []) {
    process.stdout.write(`  "${video.title}"... `);
    const result = await extractVideo(video);
    console.log(`${result.mentionsExtracted} mention(s).`);
  }
  console.log();

  console.log("=== Step 3: resolve against TMDB ===");
  const { data: videoIdRows } = await supabase
    .from("videos")
    .select("id")
    .eq("curator_id", curatorId);
  const videoIds = (videoIdRows ?? []).map((v) => v.id as string);
  const { data: mentions } = await supabase
    .from("mentions")
    .select("id, title_mentioned, media_type, year_hint, context_clues")
    .in("video_id", videoIds.length > 0 ? videoIds : ["00000000-0000-0000-0000-000000000000"])
    .is("resolution_confidence", null);
  for (const mention of mentions ?? []) {
    process.stdout.write(`  "${mention.title_mentioned}"... `);
    const result = await resolveMention(mention);
    console.log(result);
  }
  console.log();

  console.log("=== Step 4: analyze audience comments ===");
  const { data: unanalyzed } = await supabase
    .from("videos")
    .select("id, youtube_video_id, title")
    .eq("curator_id", curatorId)
    .is("comments_analyzed_at", null);
  for (const video of unanalyzed ?? []) {
    process.stdout.write(`  "${video.title}"... `);
    await analyzeVideoComments(video);
    console.log("done.");
  }

  console.log(`\n=== Report (${config.name} only) ===`);
  await printReport(curatorId);
}

main();
