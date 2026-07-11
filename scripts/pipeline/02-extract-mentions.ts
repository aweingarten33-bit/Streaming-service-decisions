import { supabase } from "@/lib/pipeline/supabase";
import { fetchTranscript, chunkTranscript } from "@/lib/pipeline/transcript";
import { callClaudeJSON } from "@/lib/pipeline/llm";
import type { MentionExtraction } from "@/lib/pipeline/types";

const EXTRACTION_SYSTEM_PROMPT = `You extract structured film/TV mentions from a movie/TV curator's spoken video transcript.

Return ONLY a JSON array (no prose, no markdown fences) of mention objects — one per distinct movie, TV show, or documentary discussed. If the same title comes up more than once in this transcript, merge it into a single object. If nothing is mentioned, return [].

Each object must match exactly:
{
  "title_mentioned": string (title as spoken/referenced),
  "media_type": "movie" | "tv" | "documentary" | "unknown",
  "year_hint": number or null (only if the curator mentions a year or era),
  "context_clues": string (director, actors, plot details mentioned nearby — used later to disambiguate against a database),
  "sentiment": "enthusiastic_rec" | "qualified_rec" | "notable_mention" | "pan" | "neutral_reference",
  "descriptors": string[] (short tags such as hidden_gem, comfort_watch, great_ending, slow_burn, visually_stunning),
  "quote_free_summary": string, at most 15 words, written entirely in YOUR OWN words describing why it was mentioned
}

Hard rule: never copy a sentence or distinctive phrase from the transcript into any field, especially quote_free_summary — always paraphrase. Only include actual films, TV shows, or documentaries — skip books, games, podcasts, and unrelated chatter.`;

// Rough per-token pricing for claude-sonnet-4-6, in USD per million tokens — update if pricing changes.
const INPUT_COST_PER_MTOK = 3;
const OUTPUT_COST_PER_MTOK = 15;

function normalizeKey(title: string): string {
  return title.trim().toLowerCase();
}

async function extractFromChunk(
  chunk: string,
  videoTitle: string,
): Promise<{ mentions: MentionExtraction[]; inputTokens: number; outputTokens: number }> {
  const user = `VIDEO TITLE: ${videoTitle}\n\nTRANSCRIPT CHUNK:\n${chunk}`;
  const { data, inputTokens, outputTokens } = await callClaudeJSON<MentionExtraction[]>({
    system: EXTRACTION_SYSTEM_PROMPT,
    user,
    maxTokens: 4000,
  });
  return { mentions: Array.isArray(data) ? data : [], inputTokens, outputTokens };
}

/** Fetches the transcript, extracts mentions chunk-by-chunk, and writes results. Never throws on missing captions. */
export async function extractVideo(video: {
  id: string;
  youtube_video_id: string;
  title: string;
}): Promise<{ mentionsExtracted: number; inputTokens: number; outputTokens: number }> {
  const transcript = await fetchTranscript(video.youtube_video_id);
  if (!transcript) {
    await supabase
      .from("videos")
      .update({ transcript_status: "unavailable", extracted_at: new Date().toISOString() })
      .eq("id", video.id);
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
      if (!byKey.has(key)) byKey.set(key, mention);
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
      })),
    );
    if (error) throw new Error(`Failed to insert mentions for video ${video.id}: ${error.message}`);
  }

  await supabase
    .from("videos")
    .update({ transcript_status: "available", extracted_at: new Date().toISOString() })
    .eq("id", video.id);

  return { mentionsExtracted: mentions.length, inputTokens, outputTokens };
}

async function main() {
  const force = process.argv.includes("--force");
  const curatorId = process.argv.find((a) => a.startsWith("--curator-id="))?.split("=")[1];

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
