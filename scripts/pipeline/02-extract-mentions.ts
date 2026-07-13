import { supabase } from "@/lib/pipeline/supabase";
import { fetchTranscriptResult, chunkTranscript } from "@/lib/pipeline/transcript";
import { callClaudeJSON } from "@/lib/pipeline/llm";
import { descriptors } from "../../config/descriptors";
import type { MentionExtraction } from "@/lib/pipeline/types";

export const EXTRACTION_SYSTEM_PROMPT = `You extract structured film/TV mentions from a movie/TV curator's spoken video transcript.

Return ONLY a JSON array (no prose, no markdown fences) of mention objects — one per distinct movie, TV show, or documentary discussed. If the same title comes up more than once in this transcript, merge it into a single object. If nothing is mentioned, return [].

Each object must match exactly:
{
  "title_mentioned": string (title as spoken/referenced),
  "media_type": "movie" | "tv" | "documentary" | "unknown",
  "year_hint": number or null (only if the curator mentions a year or era),
  "context_clues": string (director, actors, plot details mentioned nearby — used later to disambiguate against a database),
  "sentiment": "enthusiastic_rec" | "qualified_rec" | "notable_mention" | "pan" | "neutral_reference",
  "descriptors": string[] (short tags — use any that fit from this exact list: ${descriptors.join(", ")}),
  "quote_free_summary": string, at most 15 words, written entirely in YOUR OWN words describing why it was mentioned
}

Hard rule: never copy a sentence or distinctive phrase from the transcript into any field, especially quote_free_summary — always paraphrase. Only include actual films, TV shows, or documentaries — skip books, games, podcasts, and unrelated chatter.`;

// Extraction runs on Haiku: pulling explicitly-discussed titles out of a
// transcript is mechanical enough that the ~10x cheaper model holds up.
const EXTRACTION_MODEL = "claude-haiku-4-5-20251001";
const EXTRACTION_PROMPT_VERSION = "youtube_mentions_v2_descriptor_expansion";

// Rough per-token pricing for claude-haiku-4-5, in USD per million tokens — update if pricing changes.
const INPUT_COST_PER_MTOK = 1;
const OUTPUT_COST_PER_MTOK = 5;

function normalizeKey(title: string): string {
  return title.trim().toLowerCase();
}

const SENTIMENT_STRENGTH: Record<string, number> = {
  pan: 0,
  neutral_reference: 1,
  notable_mention: 2,
  qualified_rec: 3,
  enthusiastic_rec: 4,
};

function richerText(current: string | null | undefined, next: string | null | undefined): string {
  const a = current?.trim() ?? "";
  const b = next?.trim() ?? "";
  return b.length > a.length ? b : a;
}

function mergeMention(existing: MentionExtraction, next: MentionExtraction): MentionExtraction {
  const existingStrength = SENTIMENT_STRENGTH[existing.sentiment] ?? 0;
  const nextStrength = SENTIMENT_STRENGTH[next.sentiment] ?? 0;
  const strongest = nextStrength > existingStrength ? next : existing;
  return {
    ...existing,
    media_type: existing.media_type !== "unknown" ? existing.media_type : next.media_type,
    year_hint: existing.year_hint ?? next.year_hint,
    context_clues: richerText(existing.context_clues, next.context_clues),
    sentiment: strongest.sentiment,
    descriptors: [
      ...new Set([...(existing.descriptors ?? []), ...(next.descriptors ?? [])]),
    ].filter((d) => descriptors.includes(d)),
    quote_free_summary: richerText(existing.quote_free_summary, next.quote_free_summary),
  };
}

async function extractFromChunk(
  chunk: string,
  videoTitle: string,
): Promise<{ mentions: MentionExtraction[]; inputTokens: number; outputTokens: number }> {
  const user = `VIDEO TITLE: ${videoTitle}\n\nTRANSCRIPT CHUNK:\n${chunk}`;
  const { data, inputTokens, outputTokens } = await callClaudeJSON<MentionExtraction[]>({
    system: EXTRACTION_SYSTEM_PROMPT,
    user,
    model: EXTRACTION_MODEL,
    maxTokens: 8000,
  });
  return { mentions: Array.isArray(data) ? data : [], inputTokens, outputTokens };
}

/** Fetches the transcript, extracts mentions chunk-by-chunk, and writes results. Never throws on missing captions. */
export async function extractVideo(video: {
  id: string;
  youtube_video_id: string;
  title: string;
}): Promise<{ mentionsExtracted: number; inputTokens: number; outputTokens: number }> {
  const runInsert = await supabase
    .from("extraction_runs")
    .insert({
      video_id: video.id,
      prompt_version: EXTRACTION_PROMPT_VERSION,
      model: EXTRACTION_MODEL,
      status: "started",
    })
    .select("id")
    .maybeSingle();
  const extractionRunId = runInsert.data?.id as string | undefined;

  const transcriptResult = await fetchTranscriptResult(video.youtube_video_id);
  const transcript = transcriptResult.text;
  if (!transcript) {
    console.log(
      `[${transcriptResult.failureReason ?? "unknown"}] ${transcriptResult.failureDetail ?? ""}`,
    );
    // Leave extracted_at null so the video is retried on a future run — transcript
    // fetches fail transiently (YouTube blocks datacenter IPs), and stamping the
    // video done here silently loses its mentions forever.
    await supabase
      .from("videos")
      .update({
        transcript_status: "unavailable",
        transcript_failure_reason: transcriptResult.failureReason,
        transcript_failure_detail: transcriptResult.failureDetail,
        transcript_last_attempt_at: new Date().toISOString(),
      })
      .eq("id", video.id);
    await supabase.rpc("increment_transcript_attempt_count", { target_video_id: video.id }).then(
      () => undefined,
      () => undefined,
    );
    if (extractionRunId) {
      await supabase
        .from("extraction_runs")
        .update({
          status: "skipped_no_transcript",
          error_message: [transcriptResult.failureReason, transcriptResult.failureDetail]
            .filter(Boolean)
            .join(": "),
        })
        .eq("id", extractionRunId);
    }
    return { mentionsExtracted: 0, inputTokens: 0, outputTokens: 0 };
  }

  const chunks = chunkTranscript(transcript);
  const byKey = new Map<string, MentionExtraction>();
  let inputTokens = 0;
  let outputTokens = 0;

  for (const chunk of chunks) {
    const result = await extractFromChunk(chunk, video.title);
    inputTokens += result.inputTokens;
    outputTokens += result.outputTokens;
    for (const mention of result.mentions) {
      const key = normalizeKey(mention.title_mentioned);
      byKey.set(key, byKey.has(key) ? mergeMention(byKey.get(key)!, mention) : mention);
    }
  }

  const mentions = [...byKey.values()];
  const sourceUrl = `https://youtube.com/watch?v=${video.youtube_video_id}`;

  if (mentions.length > 0) {
    const { error } = await supabase.from("mentions").insert(
      mentions.map((m) => ({
        video_id: video.id,
        title_mentioned: m.title_mentioned,
        media_type: m.media_type,
        year_hint: m.year_hint,
        context_clues: m.context_clues,
        sentiment: m.sentiment,
        descriptors: m.descriptors,
        quote_free_summary: m.quote_free_summary,
        source_url: sourceUrl,
        extraction_run_id: extractionRunId,
        extraction_prompt_version: EXTRACTION_PROMPT_VERSION,
        extraction_model: EXTRACTION_MODEL,
      })),
    );
    if (error) throw new Error(`Failed to insert mentions for video ${video.id}: ${error.message}`);
  }

  await supabase
    .from("videos")
    .update({
      transcript_status: "available",
      extracted_at: new Date().toISOString(),
      transcript_failure_reason: null,
      transcript_failure_detail: null,
      transcript_last_attempt_at: new Date().toISOString(),
    })
    .eq("id", video.id);

  await supabase.rpc("increment_transcript_attempt_count", { target_video_id: video.id }).then(
    () => undefined,
    () => undefined,
  );

  if (extractionRunId) {
    await supabase
      .from("extraction_runs")
      .update({
        status: "succeeded",
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        mentions_extracted: mentions.length,
      })
      .eq("id", extractionRunId);
  }

  return { mentionsExtracted: mentions.length, inputTokens, outputTokens };
}

/**
 * Prints an estimated cost for re-extracting already-processed videos (e.g.
 * after a taxonomy change), based on historical per-video cost from past
 * runs — no LLM calls made. Use before deciding whether --force is worth it.
 */
async function estimateReextractionCost(): Promise<void> {
  const { count: totalVideos } = await supabase
    .from("videos")
    .select("id", { count: "exact", head: true })
    .not("extracted_at", "is", null);

  const { data: pastRuns } = await supabase
    .from("pipeline_runs")
    .select("videos_processed, cost_estimate")
    .eq("run_type", "youtube_extraction")
    .gt("videos_processed", 0);

  const pastVideos = (pastRuns ?? []).reduce((sum, r) => sum + (r.videos_processed ?? 0), 0);
  const pastCost = (pastRuns ?? []).reduce((sum, r) => sum + (r.cost_estimate ?? 0), 0);

  if (pastVideos === 0) {
    console.log("No historical extraction runs yet — can't estimate. Run a small batch first.");
    return;
  }

  const avgCostPerVideo = pastCost / pastVideos;
  const estimatedCost = avgCostPerVideo * (totalVideos ?? 0);
  console.log(`Re-extraction (--force) would reprocess ${totalVideos} already-extracted video(s).`);
  console.log(
    `Based on $${avgCostPerVideo.toFixed(4)}/video average across ${pastVideos} historically processed video(s):`,
  );
  console.log(`  Estimated cost: ~$${estimatedCost.toFixed(2)}`);
}

async function main() {
  const force = process.argv.includes("--force");
  const curatorId = process.argv.find((a) => a.startsWith("--curator-id="))?.split("=")[1];

  if (process.argv.includes("--estimate")) {
    await estimateReextractionCost();
    return;
  }

  let query = supabase.from("videos").select("id, youtube_video_id, title, curator_id");
  if (!force) query = query.is("extracted_at", null);
  if (curatorId) query = query.eq("curator_id", curatorId);
  const { data: videos, error } = await query;
  if (error) throw new Error(`Failed to load videos: ${error.message}`);

  let videosProcessed = 0;
  let mentionsExtracted = 0;
  let inputTokens = 0;
  let outputTokens = 0;

  for (const video of videos ?? []) {
    process.stdout.write(`Extracting "${video.title}"... `);
    try {
      const result = await extractVideo(video);
      videosProcessed++;
      mentionsExtracted += result.mentionsExtracted;
      inputTokens += result.inputTokens;
      outputTokens += result.outputTokens;
      console.log(`${result.mentionsExtracted} mention(s).`);
    } catch (err) {
      console.log(`FAILED: ${String(err)}`);
    }
  }

  const tokensUsed = inputTokens + outputTokens;
  const costEstimate =
    (inputTokens / 1_000_000) * INPUT_COST_PER_MTOK +
    (outputTokens / 1_000_000) * OUTPUT_COST_PER_MTOK;

  await supabase.from("pipeline_runs").insert({
    videos_processed: videosProcessed,
    mentions_extracted: mentionsExtracted,
    tokens_used: tokensUsed,
    cost_estimate: costEstimate,
  });

  console.log(
    `\nDone. ${videosProcessed} video(s) processed, ${mentionsExtracted} mention(s) extracted, ~$${costEstimate.toFixed(4)} spent.`,
  );
}

if (import.meta.main) {
  main();
}
