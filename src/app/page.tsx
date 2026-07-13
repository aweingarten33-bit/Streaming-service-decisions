import { supabase } from "@/lib/pipeline/supabase";
import { WatchDj } from "@/components/dj/watch-dj";

async function getBackdrops(): Promise<string[]> {
  const { data } = await supabase
    .from("titles")
    .select("backdrop_path")
    .not("backdrop_path", "is", null)
    .order("imdb_votes", { ascending: false, nullsFirst: false })
    .limit(8);
  return (data ?? [])
    .map((row) => row.backdrop_path as string | null)
    .filter((p): p is string => Boolean(p));
}

export default async function Home() {
  const backdrops = await getBackdrops().catch(() => []);
  return <WatchDj backdrops={backdrops} />;
}
