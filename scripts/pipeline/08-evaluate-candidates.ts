import { supabase } from "@/lib/pipeline/supabase";
import { getChannelStats, listRecentVideos } from "@/lib/pipeline/youtube";
import { fetchTranscript, chunkTranscript } from "@/lib/pipeline/transcript";
import { callClaudeJSON } from "@/lib/pipeline/llm";
import { EXTRACTION_SYSTEM_PROMPT } from "./02-extract-mentions";
import type { MentionExtraction } from "@/lib/pipeline/types";

const MIN_SUBSCRIBERS = 200;
const MAX_SUBSCRIBERS = 5_000_000;
const MAX_DAYS_SINCE_UPLOAD = 180;
const SAMPLE_SIZE = 3;
// Average mentions per sampled video required to promote — the strongest signal
// available: does this channel's content actually yield real, structured
// recommendations when run through the same extraction used everywhere else.
const YIELD_THRESHOLD = 1.0;
const TOP_N_ACTIVE = 100;

interface EvaluationResult {
  status: "promoted" | "rejected";
  channelTitle: string | null;
  subscriberCount: number | null;
  yieldScore: number | null;
  rejectReason: string | null;
}

/** Basic filters plus a sample-extraction quality test — no human review. */
async function evaluateCandidate(channelId: string): Promise<EvaluationResult> {
  const stats = await getChannelStats(channelId);
  if (!stats) {
    return {
      status: "rejected",
      channelTitle: null,
      subscriberCount: null,
      yieldScore: null,
      rejectReason: "channel_not_found",
    };
  }
  if (stats.subscriberCount < MIN_SUBSCRIBERS || stats.subscriberCount > MAX_SUBSCRIBERS) {
    return {
      status: "rejected",
      channelTitle: stats.title,
      subscriberCount: stats.subscriberCount,
      yieldScore: null,
      rejectReason: "subscriber_count_out_of_range",
    };
  }

  const recentVideos = await listRecentVideos(channelId, SAMPLE_SIZE);
  if (recentVideos.length === 0) {
    return {
      status: "rejected",
      channelTitle: stats.title,
      subscriberCount: stats.subscriberCount,
      yieldScore: null,
      rejectReason: "no_videos",
    };
  }

  const daysSinceUpload =
    (Date.now() - new Date(recentVideos[0].publishedAt).getTime()) / 86_400_000;
  if (daysSinceUpload > MAX_DAYS_SINCE_UPLOAD) {
    return {
      status: "rejected",
      channelTitle: stats.title,
      subscriberCount: stats.subscriberCount,
      yieldScore: null,
      rejectReason: "inactive_channel",
    };
  }

  let totalMentions = 0;
  let videosWithTranscript = 0;
  for (const video of recentVideos) {
    const transcript = await fetchTranscript(video.youtubeVideoId);
    if (!transcript) continue;
    videosWithTranscript++;

    for (const chunk of chunkTranscript(transcript)) {
      const { data } = await callClaudeJSON<MentionExtraction[]>({
        system: EXTRACTION_SYSTEM_PROMPT,
        user: `VIDEO TITLE: ${video.title}\n\nTRANSCRIPT CHUNK:\n${chunk}`,
        maxTokens: 4000,
      });
      if (Array.isArray(data)) totalMentions += data.length;
    }
  }

  if (videosWithTranscript === 0) {
    return {
      status: "rejected",
      channelTitle: stats.title,
      subscriberCount: stats.subscriberCount,
      yieldScore: null,
      rejectReason: "no_transcripts_available",
    };
  }

  const yieldScore = totalMentions / videosWithTranscript;
  return {
    status: yieldScore >= YIELD_THRESHOLD ? "promoted" : "rejected",
    channelTitle: stats.title,
    subscriberCount: stats.subscriberCount,
    yieldScore,
    rejectReason: yieldScore >= YIELD_THRESHOLD ? null : "low_yield",
  };
}

/** Re-ranks all promoted candidates and keeps only the top N actively ingested in `curators`. */
async function promoteTopCandidates(): Promise<number> {
  const { data: promoted, error } = await supabase
    .from("candidate_channels")
    .select("youtube_channel_id, channel_title, yield_score")
    .eq("status", "promoted")
    .order("yield_score", { ascending: false });
  if (error) throw new Error(`Failed to load promoted candidates: ${error.message}`);

  const top = (promoted ?? []).slice(0, TOP_N_ACTIVE);
  const topIds = new Set(top.map((c) => c.youtube_channel_id as string));

  if (top.length > 0) {
    const { error: upsertErr } = await supabase.from("curators").upsert(
      top.map((c) => ({
        name: c.channel_title,
        youtube_channel_id: c.youtube_channel_id,
        url: `https://youtube.com/channel/${c.youtube_channel_id}`,
        active: true,
        discovery_source: "auto",
        discovery_score: c.yield_score,
      })),
      { onConflict: "youtube_channel_id" },
    );
    if (upsertErr) throw new Error(`Failed to upsert promoted curators: ${upsertErr.message}`);
  }

  const { data: activeAuto } = await supabase
    .from("curators")
    .select("id, youtube_channel_id")
    .eq("discovery_source", "auto")
    .eq("active", true);
  const toDeactivate = (activeAuto ?? [])
    .filter((c) => !topIds.has(c.youtube_channel_id as string))
    .map((c) => c.id as string);
  if (toDeactivate.length > 0) {
    await supabase.from("curators").update({ active: false }).in("id", toDeactivate);
  }

  return top.length;
}

async function main() {
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "20");

  const { data: pending, error } = await supabase
    .from("candidate_channels")
    .select("id, youtube_channel_id")
    .eq("status", "pending")
    .limit(limit);
  if (error) throw new Error(`Failed to load pending candidates: ${error.message}`);

  for (const candidate of pending ?? []) {
    process.stdout.write(`Evaluating ${candidate.youtube_channel_id}... `);
    try {
      const result = await evaluateCandidate(candidate.youtube_channel_id);
      await supabase
        .from("candidate_channels")
        .update({
          status: result.status,
          channel_title: result.channelTitle,
          subscriber_count: result.subscriberCount,
          yield_score: result.yieldScore,
          reject_reason: result.rejectReason,
          evaluated_at: new Date().toISOString(),
        })
        .eq("id", candidate.id);
      console.log(
        result.status === "promoted"
          ? `promoted (yield ${result.yieldScore?.toFixed(2)})`
          : `rejected (${result.rejectReason})`,
      );
    } catch (err) {
      console.log(`FAILED: ${String(err)}`);
    }
  }

  const activeCount = await promoteTopCandidates();
  console.log(`\nDone. ${activeCount} channel(s) now active (top ${TOP_N_ACTIVE} by yield score).`);
}

if (import.meta.main) {
  main();
}
