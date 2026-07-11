import { discoveryQueries } from "../../config/discovery-queries";
import { supabase } from "@/lib/pipeline/supabase";
import { searchChannels } from "@/lib/pipeline/youtube";

/** Runs the query rotation, inserting any channel not already tracked as a candidate. */
async function main() {
  const { data: existing } = await supabase.from("candidate_channels").select("youtube_channel_id");
  const seen = new Set((existing ?? []).map((c) => c.youtube_channel_id as string));

  let totalNew = 0;
  for (const query of discoveryQueries) {
    process.stdout.write(`Searching "${query}"... `);
    try {
      const results = await searchChannels(query);
      const fresh = results.filter((r) => !seen.has(r.channelId));
      for (const r of fresh) seen.add(r.channelId);

      if (fresh.length > 0) {
        const { error } = await supabase
          .from("candidate_channels")
          .insert(fresh.map((r) => ({ youtube_channel_id: r.channelId, discovery_query: query })));
        if (error) throw new Error(error.message);
      }
      totalNew += fresh.length;
      console.log(`${fresh.length} new candidate(s).`);
    } catch (err) {
      console.log(`FAILED: ${String(err)}`);
    }
  }

  console.log(`\nDone. ${totalNew} new candidate(s) discovered.`);
}

if (import.meta.main) {
  main();
}
