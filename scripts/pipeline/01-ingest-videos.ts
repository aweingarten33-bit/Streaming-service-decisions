import { curators as curatorConfigs } from "../../config/curators";
import { supabase } from "@/lib/pipeline/supabase";
import { resolveChannelId, listUploadedVideos } from "@/lib/pipeline/youtube";
import type { CuratorConfig } from "@/lib/pipeline/types";

/** Resolves a curator's channel, upserts it, and inserts any videos not already stored. */
export async function ingestCurator(
  config: CuratorConfig,
): Promise<{ curatorId: string; newVideos: number }> {
  const channelId = await resolveChannelId(config.youtubeHandle);

  const { data: curatorRow, error: upsertErr } = await supabase
    .from("curators")
    .upsert(
      { name: config.name, youtube_channel_id: channelId, url: config.url, active: config.active },
      { onConflict: "youtube_channel_id" },
    )
    .select("id")
    .single();
  if (upsertErr || !curatorRow) {
    throw new Error(`Failed to upsert curator ${config.name}: ${upsertErr?.message}`);
  }

  const videos = await listUploadedVideos(channelId);

  const { data: existing } = await supabase
    .from("videos")
    .select("youtube_video_id")
    .eq("curator_id", curatorRow.id);
  const existingIds = new Set((existing ?? []).map((v) => v.youtube_video_id as string));

  const newVideos = videos.filter((v) => !existingIds.has(v.youtubeVideoId));
  if (newVideos.length > 0) {
    const { error: insertErr } = await supabase.from("videos").insert(
      newVideos.map((v) => ({
        curator_id: curatorRow.id,
        youtube_video_id: v.youtubeVideoId,
        title: v.title,
        published_at: v.publishedAt,
        description: v.description,
        transcript_status: "pending",
      })),
    );
    if (insertErr)
      throw new Error(`Failed to insert videos for ${config.name}: ${insertErr.message}`);
  }

  return { curatorId: curatorRow.id, newVideos: newVideos.length };
}

async function main() {
  const only = process.argv.find((a) => a.startsWith("--curator="))?.split("=")[1];
  const targets = curatorConfigs.filter((c) => c.active && (!only || c.youtubeHandle === only));
  if (targets.length === 0) {
    console.log("No active curators matched.");
    return;
  }

  for (const config of targets) {
    process.stdout.write(`Ingesting ${config.name} (${config.youtubeHandle})... `);
    try {
      const { newVideos } = await ingestCurator(config);
      console.log(`${newVideos} new video(s).`);
    } catch (err) {
      console.log(`FAILED: ${String(err)}`);
    }
  }
}

if (import.meta.main) {
  main();
}
