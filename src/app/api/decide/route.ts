import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/pipeline/supabase";
import { parseIntent } from "@/lib/marquee/intent";
import { chooseOne, explainChoice, type WatchlistDecisionItem } from "@/lib/marquee/scoring";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : null;
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!deviceId) return NextResponse.json({ error: "Missing deviceId." }, { status: 400 });
  if (!prompt)
    return NextResponse.json(
      { error: "Tell Marquee what kind of night this is." },
      { status: 400 },
    );

  const intent = await parseIntent(prompt);
  const { data, error } = await supabase
    .from("viewer_watchlist")
    .select(
      `tmdb_id, status, created_at,
       titles!inner (
         tmdb_id, title, media_type, year, genres, runtime, poster_path, streaming_providers,
         tmdb_rating, tmdb_vote_count
       )`,
    )
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not read your watchlist." }, { status: 500 });
  const items = (data ?? []) as unknown as WatchlistDecisionItem[];
  if (items.length === 0) {
    return NextResponse.json(
      { error: "Import your watchlist first.", needsImport: true },
      { status: 409 },
    );
  }

  const choice = chooseOne(intent, items);
  if (!choice) {
    return NextResponse.json(
      { error: "Nothing in your watchlist fits that tonight.", emptyMatch: true },
      { status: 404 },
    );
  }

  const title = choice.item.titles!;
  const explanation = explainChoice(intent, choice.item);

  await supabase
    .from("recommendation_traces")
    .insert({
      device_id: deviceId,
      prompt,
      parsed_filters: intent,
      candidate_source: "watchlist_decision",
      wanted_genres: title.genres ?? [],
      requested_descriptors: intent.vibes,
      avoided_descriptors: intent.avoid,
      watchlist_count: items.length,
      used_watchlist: true,
      candidate_count: items.length,
      scored_count: items.filter((item) => item.status !== "watched").length,
      rerank_used: false,
      chosen_tmdb_ids: [title.tmdb_id],
    })
    .then(undefined, () => undefined);

  return NextResponse.json({
    result: {
      tmdbId: title.tmdb_id,
      title: title.title,
      year: title.year,
      mediaType: title.media_type,
      runtime: title.runtime,
      posterPath: title.poster_path,
      genres: title.genres,
      streamingProviders: title.streaming_providers,
      explanation,
    },
    intent,
  });
}
