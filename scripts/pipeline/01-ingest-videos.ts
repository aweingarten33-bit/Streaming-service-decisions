import { curators as curatorConfigs } from "../../config/curators";
import { supabase } from "@/lib/pipeline/supabase";
import { resolveChannelId, listUploadedVideos } from "@/lib/pipeline/youtube";
import type { CuratorConfig } from "@/lib/pipeline/types";

/** Lists a channel's videos and inserts any not already stored for that curator. */
export async function ingestVideosForCurator(
  curatorId: string,
  channelId: string,
): Promise<number> {
  const videos = await listUploadedVideos(channelId);

  const { data: existing } = await supabase
    .from("videos")
    .select("youtube_video_id")
    .eq("curator_id", curatorId);
  const existingIds = new Set((existing ?? []).map((v) => v.youtube_video_id as string));

  const newVideos = videos.filter((v) => !existingIds.has(v.youtubeVideoId));
  if (newVideos.length > 0) {
    const { error: insertErr } = await supabase.from("videos").insert(
      newVideos.map((v) => ({
        curator_id: curatorId,
        youtube_video_id: v.youtubeVideoId,
        title: v.title,
        published_at: v.publishedAt,
        description: v.description,
        transcript_status: "pending",
      })),
    );
    if (insertErr)
      throw new Error(`Failed to insert videos for curator ${curatorId}: ${insertErr.message}`);
  }

  return newVideos.length;
}

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

  const newVideos = await ingestVideosForCurator(curatorRow.id, channelId);
  return { curatorId: curatorRow.id, newVideos };
}

async function main() {
  const only = process.argv.find((a) => a.startsWith("--curator="))?.split("=")[1];
  const targets = curatorConfigs.filter((c) => c.active && (!only || c.youtubeHandle === only));

  for (const config of targets) {
    process.stdout.write(`Ingesting ${config.name} (${config.youtubeHandle})... `);
    try {
      const { newVideos } = await ingestCurator(config);
      console.log(`${newVideos} new video(s).`);
    } catch (err) {
      console.log(`FAILED: ${String(err)}`);
    }
  }

  if (!only) {
    const { data: autoCurators } = await supabase
      .from("curators")
      .select("id, name, youtube_channel_id")
      .eq("discovery_source", "auto")
      .eq("active", true);

    for (const curator of autoCurators ?? []) {
      process.stdout.write(`Ingesting ${curator.name} (auto-discovered)... `);
      try {
        const newVideos = await ingestVideosForCurator(
          curator.id as string,
          curator.youtube_channel_id as string,
        );
        console.log(`${newVideos} new video(s).`);
      } catch (err) {
        console.log(`FAILED: ${String(err)}`);
      }
    }
  }
}

if (import.meta.main) {
  main();
}
