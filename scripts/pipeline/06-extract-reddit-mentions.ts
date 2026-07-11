import { supabase } from "@/lib/pipeline/supabase";
import { getThreadDetail } from "@/lib/pipeline/reddit";
import { chunkTranscript } from "@/lib/pipeline/transcript";
import { callClaudeJSON } from "@/lib/pipeline/llm";
import { subreddits as subredditConfigs } from "../../config/subreddits";
import type { MentionExtraction } from "@/lib/pipeline/types";

interface RedditMentionExtraction extends MentionExtraction {
  source_score: number;
}

const REDDIT_EXTRACTION_SYSTEM_PROMPT = `You extract structured film/TV mentions from a Reddit thread (the original post plus its top comments) about movie/TV recommendations.

You will be given the THREAD TITLE and a block of text containing the original post (if any) and top-level comments, each prefixed with its upvote count like "[Comment, 245 upvotes]: <text>".

Return ONLY a JSON array (no prose, no markdown fences) of mention objects — one per distinct movie, TV show, or documentary discussed. If nothing is mentioned, return [].

Each object must match exactly:
{
  "title_mentioned": string,
  "media_type": "movie" | "tv" | "documentary" | "unknown",
  "year_hint": number or null,
  "context_clues": string (director, actors, plot details mentioned nearby),
  "sentiment": "enthusiastic_rec" | "qualified_rec" | "notable_mention" | "pan" | "neutral_reference" | "taste_anchor",
  "descriptors": string[] (short tags — use any that fit: hidden_gem, comfort_watch, great_ending, weak_ending, slow_burn, visually_stunning, gets_good_immediately, slow_start_worth_it, complete_story, canceled_on_cliffhanger, phone_down_tv, background_watchable, date_night_safe, parents_safe, suspense_no_gore, aged_well, aged_poorly, rewatchable, divisive),
  "quote_free_summary": string, at most 15 words, written entirely in YOUR OWN words,
  "source_score": number — copy the upvote count from the "[..., N upvotes]" prefix of whichever post/comment this mention came from
}

Reddit-specific rules — apply these carefully, this text is much noisier than a curator's own commentary:
- THE THREAD TITLE SETS THE POLARITY. If the title is framed negatively ("most overrated show ever?", "unpopular opinions", "worst movies you've seen"), a mention agreeing with that framing is a "pan" — never a rec — even if the comment's tone sounds enthusiastic.
- If the original post is ASKING for recommendations similar to a title ("shows like Dark?", "looking for something like Breaking Bad"), that title is the OP's taste anchor, not something being recommended — tag it "taste_anchor", never "enthusiastic_rec".
- Sarcasm and jokes ("watch Emoji Movie, it changed my life") are never a real recommendation — tag as "neutral_reference", or skip entirely if it's pure noise.
- A comment that's just a list of many titles with no real commentary is low-signal — tag each as "notable_mention", never "enthusiastic_rec", regardless of the comment's own upvotes.
- Never copy a sentence verbatim into any field, especially quote_free_summary — always paraphrase. Only include actual films, TV shows, or documentaries — skip books, games, podcasts, and unrelated chatter.`;

function normalizeKey(title: string): string {
  return title.trim().toLowerCase();
}

async function extractFromChunk(
  chunk: string,
  threadTitle: string,
): Promise<{ mentions: RedditMentionExtraction[]; inputTokens: number; outputTokens: number }> {
  const user = `THREAD TITLE: ${threadTitle}\n\nTHREAD CONTENT:\n${chunk}`;
  const { data, inputTokens, outputTokens } = await callClaudeJSON<RedditMentionExtraction[]>({
    system: REDDIT_EXTRACTION_SYSTEM_PROMPT,
    user,
    maxTokens: 4000,
  });
  return { mentions: Array.isArray(data) ? data : [], inputTokens, outputTokens };
}

/** Re-fetches a thread's body + qualifying comments live, extracts mentions, and writes results. */
export async function extractThread(
  thread: {
    id: string;
    subreddit: string;
    reddit_thread_id: string;
    title: string;
    permalink: string;
    score: number;
  },
  upvoteThreshold: number,
): Promise<{ mentionsExtracted: number; inputTokens: number; outputTokens: number }> {
  const detail = await getThreadDetail(thread.subreddit, thread.reddit_thread_id, upvoteThreshold);

  const parts: string[] = [];
  if (detail.selftext.trim()) {
    parts.push(`[Original post, ${thread.score} upvotes]: ${detail.selftext.trim()}`);
  }
  for (const c of detail.comments) {
    parts.push(`[Comment, ${c.score} upvotes]: ${c.body}`);
  }

  if (parts.length === 0) {
    await supabase
      .from("reddit_threads")
      .update({ extracted_at: new Date().toISOString() })
      .eq("id", thread.id);
    return { mentionsExtracted: 0, inputTokens: 0, outputTokens: 0 };
  }

  const chunks = chunkTranscript(parts.join("\n\n"));
  const byKey = new Map<string, RedditMentionExtraction>();
  let inputTokens = 0;
  let outputTokens = 0;

  for (const chunk of chunks) {
    const result = await extractFromChunk(chunk, thread.title);
    inputTokens += result.inputTokens;
    outputTokens += result.outputTokens;
    for (const mention of result.mentions) {
      const key = normalizeKey(mention.title_mentioned);
      if (!byKey.has(key)) byKey.set(key, mention);
    }
  }

  const mentions = [...byKey.values()];
  if (mentions.length > 0) {
    const { error } = await supabase.from("mentions").insert(
      mentions.map((m) => ({
        reddit_thread_id: thread.id,
        title_mentioned: m.title_mentioned,
        media_type: m.media_type,
        year_hint: m.year_hint,
        context_clues: m.context_clues,
        sentiment: m.sentiment,
        descriptors: m.descriptors,
        quote_free_summary: m.quote_free_summary,
        weight: 1 + Math.log10(Math.max(m.source_score, 1)),
        source_url: thread.permalink,
      })),
    );
    if (error)
      throw new Error(`Failed to insert mentions for thread ${thread.id}: ${error.message}`);
  }

  await supabase
    .from("reddit_threads")
    .update({ extracted_at: new Date().toISOString() })
    .eq("id", thread.id);

  return { mentionsExtracted: mentions.length, inputTokens, outputTokens };
}

const INPUT_COST_PER_MTOK = 3;
const OUTPUT_COST_PER_MTOK = 15;

/**
 * Prints an estimated cost for re-extracting already-processed threads, based
 * on historical per-thread cost from past runs — no LLM calls made.
 */
async function estimateReextractionCost(): Promise<void> {
  const { count: totalThreads } = await supabase
    .from("reddit_threads")
    .select("id", { count: "exact", head: true })
    .not("extracted_at", "is", null);

  const { data: pastRuns } = await supabase
    .from("pipeline_runs")
    .select("rows_updated, cost_estimate")
    .eq("run_type", "reddit_extraction")
    .gt("rows_updated", 0);

  const pastThreads = (pastRuns ?? []).reduce((sum, r) => sum + (r.rows_updated ?? 0), 0);
  const pastCost = (pastRuns ?? []).reduce((sum, r) => sum + (r.cost_estimate ?? 0), 0);

  if (pastThreads === 0) {
    console.log("No historical extraction runs yet — can't estimate. Run a small batch first.");
    return;
  }

  const avgCostPerThread = pastCost / pastThreads;
  const estimatedCost = avgCostPerThread * (totalThreads ?? 0);
  console.log(
    `Re-extraction (--force) would reprocess ${totalThreads} already-extracted thread(s).`,
  );
  console.log(
    `Based on $${avgCostPerThread.toFixed(4)}/thread average across ${pastThreads} historically processed thread(s):`,
  );
  console.log(`  Estimated cost: ~$${estimatedCost.toFixed(2)}`);
}

async function main() {
  const force = process.argv.includes("--force");
  const only = process.argv.find((a) => a.startsWith("--subreddit="))?.split("=")[1];

  if (process.argv.includes("--estimate")) {
    await estimateReextractionCost();
    return;
  }

  const thresholdBySubreddit = new Map(subredditConfigs.map((c) => [c.name, c.upvoteThreshold]));

  let query = supabase
    .from("reddit_threads")
    .select("id, subreddit, reddit_thread_id, title, permalink, score");
  if (!force) query = query.is("extracted_at", null);
  if (only) query = query.eq("subreddit", only);
  const { data: threads, error } = await query;
  if (error) throw new Error(`Failed to load reddit_threads: ${error.message}`);

  let threadsProcessed = 0;
  let mentionsExtracted = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  const start = Date.now();

  for (const thread of threads ?? []) {
    process.stdout.write(`Extracting r/${thread.subreddit} "${thread.title}"... `);
    try {
      const threshold = thresholdBySubreddit.get(thread.subreddit) ?? 20;
      const result = await extractThread(thread, threshold);
      threadsProcessed++;
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
  const durationMs = Date.now() - start;

  await supabase.from("pipeline_runs").insert({
    run_type: "reddit_extraction",
    rows_updated: threadsProcessed,
    mentions_extracted: mentionsExtracted,
    tokens_used: tokensUsed,
    cost_estimate: costEstimate,
    duration_ms: durationMs,
  });

  console.log(
    `\nDone. ${threadsProcessed} thread(s) processed, ${mentionsExtracted} mention(s) extracted, ~$${costEstimate.toFixed(4)} spent.`,
  );
}

if (import.meta.main) {
  main();
}
