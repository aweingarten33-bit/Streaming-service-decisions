import { supabase } from "@/lib/pipeline/supabase";
import { listTopComments } from "@/lib/pipeline/youtube";
import { callClaudeJSON } from "@/lib/pipeline/llm";

const SENTIMENT_SYSTEM_PROMPT = `You are analyzing YouTube comments on a movie/TV curator's video to gauge the audience's overall reaction.

Return ONLY JSON: {"sentiment_score": number, "summary": string}
- sentiment_score: a number from -1.0 (very negative) to 1.0 (very positive) reflecting the audience's overall reaction.
- summary: at most 20 words, written entirely in YOUR OWN words — never quote any comment directly.

Base this only on the comments provided. If there are too few comments or they don't relate to a judgment, return {"sentiment_score": 0, "summary": "insufficient signal"}.`;

/** Fetches top comments and distills them into an aggregate sentiment score + paraphrased summary. */
export async function analyzeVideoComments(video: {
  id: string;
  youtube_video_id: string;
}): Promise<void> {
  const comments = await listTopComments(video.youtube_video_id, 50);

  if (comments.length === 0) {
    await supabase
      .from("videos")
      .update({
        audience_sentiment_score: null,
        audience_summary: null,
        comments_analyzed_at: new Date().toISOString(),
      })
      .eq("id", video.id);
    return;
  }

  const user = comments.map((c, i) => `${i + 1}. (${c.likeCount} likes) ${c.text}`).join("\n");
  const { data } = await callClaudeJSON<{ sentiment_score: number; summary: string }>({
    system: SENTIMENT_SYSTEM_PROMPT,
    user,
    model: "claude-haiku-4-5-20251001",
    maxTokens: 200,
  });

  await supabase
    .from("videos")
    .update({
      audience_sentiment_score: data.sentiment_score,
      audience_summary: data.summary,
      comments_analyzed_at: new Date().toISOString(),
    })
    .eq("id", video.id);
}

async function main() {
  const force = process.argv.includes("--force");
  const curatorId = process.argv.find((a) => a.startsWith("--curator-id="))?.split("=")[1];

  let query = supabase.from("videos").select("id, youtube_video_id, title, curator_id");
  if (!force) query = query.is("comments_analyzed_at", null);
  if (curatorId) query = query.eq("curator_id", curatorId);
  const { data: videos, error } = await query;
  if (error) throw new Error(`Failed to load videos: ${error.message}`);

  for (const video of videos ?? []) {
    process.stdout.write(`Analyzing comments on "${video.title}"... `);
    try {
      await analyzeVideoComments(video);
      console.log("done.");
    } catch (err) {
      console.log(`FAILED: ${String(err)}`);
    }
  }
}

if (import.meta.main) {
  main();
}
