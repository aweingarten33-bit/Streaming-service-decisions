import { subreddits as subredditConfigs } from "../../config/subreddits";
import { supabase } from "@/lib/pipeline/supabase";
import { listTopThreads, listHotThreads } from "@/lib/pipeline/reddit";
import type { SubredditConfig } from "../../config/subreddits";

/**
 * Pulls top-of-year and hot threads for one subreddit and inserts any not
 * already stored. Only metadata is stored — selftext/comments are re-fetched
 * live at extraction time, never persisted here.
 */
export async function ingestSubreddit(config: SubredditConfig): Promise<{ newThreads: number }> {
  const [topThreads, hotThreads] = await Promise.all([
    listTopThreads(config.name),
    listHotThreads(config.name),
  ]);

  const byId = new Map([...topThreads, ...hotThreads].map((t) => [t.redditThreadId, t]));

  const { data: existing } = await supabase
    .from("reddit_threads")
    .select("reddit_thread_id")
    .eq("subreddit", config.name);
  const existingIds = new Set((existing ?? []).map((r) => r.reddit_thread_id as string));

  const newThreads = [...byId.values()].filter((t) => !existingIds.has(t.redditThreadId));
  if (newThreads.length > 0) {
    const { error } = await supabase.from("reddit_threads").insert(
      newThreads.map((t) => ({
        subreddit: config.name,
        reddit_thread_id: t.redditThreadId,
        title: t.title,
        permalink: t.permalink,
        score: t.score,
        num_comments: t.numComments,
      })),
    );
    if (error) throw new Error(`Failed to insert threads for r/${config.name}: ${error.message}`);
  }

  return { newThreads: newThreads.length };
}

async function main() {
  const only = process.argv.find((a) => a.startsWith("--subreddit="))?.split("=")[1];
  const targets = subredditConfigs.filter((c) => c.active && (!only || c.name === only));
  if (targets.length === 0) {
    console.log("No active subreddits matched.");
    return;
  }

  for (const config of targets) {
    process.stdout.write(`Ingesting r/${config.name}... `);
    try {
      const { newThreads } = await ingestSubreddit(config);
      console.log(`${newThreads} new thread(s).`);
    } catch (err) {
      console.log(`FAILED: ${String(err)}`);
    }
  }
}

if (import.meta.main) {
  main();
}
