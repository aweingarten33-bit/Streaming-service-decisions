import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/pipeline/supabase";
import { getDeviceId } from "@/lib/device-server";
import { findByImdbId } from "@/lib/pipeline/tmdb";
import { upsertTitle } from "@/lib/marquee/upsert-title";
import { scrapeImdbListIds } from "@/lib/pipeline/imdb-list-scrape";

/** Pulls the real titles out of a saved public IMDb list and adds every one TMDB can resolve to the caller's own watchlist. See imdb-list-scrape.ts for why this is a best-effort scrape, not an API call. */
export async function POST(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const id: string | undefined = body.id;
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const supabase = getSupabase();
  const { data: savedList, error: savedListError } = await supabase
    .from("saved_lists")
    .select("url")
    .eq("device_id", deviceId)
    .eq("id", id)
    .single();

  if (savedListError || !savedList) {
    return NextResponse.json({ error: "Couldn't find that saved list." }, { status: 404 });
  }

  const imdbIds = await scrapeImdbListIds(savedList.url).catch(() => null);
  if (imdbIds === null) {
    return NextResponse.json(
      { error: "Couldn't read that list from IMDb right now. Try again in a bit." },
      { status: 502 },
    );
  }
  if (imdbIds.length === 0) {
    return NextResponse.json(
      { error: "Couldn't find any titles on that list. It may be private or empty." },
      { status: 422 },
    );
  }

  const { data: existingRows } = await supabase
    .from("watchlist_items")
    .select("tmdb_id, media_type")
    .eq("device_id", deviceId);
  const existing = new Set((existingRows ?? []).map((r) => `${r.media_type}:${r.tmdb_id}`));

  let imported = 0;
  let duplicates = 0;
  const needHelp: string[] = [];

  for (const imdbId of imdbIds) {
    const match = await findByImdbId(imdbId).catch(() => null);
    if (!match) {
      needHelp.push(imdbId);
      continue;
    }

    const key = `${match.mediaType}:${match.tmdbId}`;
    if (existing.has(key)) {
      duplicates++;
      continue;
    }
    existing.add(key);

    await upsertTitle(match.tmdbId, match.mediaType, imdbId).catch(() => null);
    const { error } = await supabase.from("watchlist_items").upsert(
      {
        device_id: deviceId,
        tmdb_id: match.tmdbId,
        media_type: match.mediaType,
        source: "imdb_list",
      },
      { onConflict: "device_id,tmdb_id,media_type" },
    );
    if (error) {
      needHelp.push(imdbId);
      continue;
    }
    imported++;
  }

  return NextResponse.json({ imported, duplicates, needHelp, total: imdbIds.length });
}
