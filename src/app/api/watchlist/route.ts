import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/pipeline/supabase";
import { getDetails } from "@/lib/pipeline/tmdb";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId." }, { status: 400 });
  }

  const { data: rows, error } = await supabase
    .from("watchlist")
    .select("tmdb_id, media_type, added_at")
    .eq("device_id", deviceId)
    .order("added_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Could not load your list." }, { status: 500 });
  }

  const titles = await Promise.all(
    (rows ?? []).map(async (row) => {
      const details = await getDetails(row.tmdb_id, row.media_type as "movie" | "tv").catch(
        () => null,
      );
      if (!details) return null;
      return {
        tmdbId: details.tmdbId,
        title: details.title,
        mediaType: details.mediaType,
        year: details.year,
        genres: details.genres,
        runtime: details.runtime,
        posterPath: details.posterPath,
        overview: details.overview,
      };
    }),
  );

  return NextResponse.json({ titles: titles.filter((t) => t !== null) });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId: string | undefined = body.deviceId;
  const tmdbId: number | undefined = body.tmdbId;
  const mediaType: string | undefined = body.mediaType;

  if (!deviceId || !tmdbId || (mediaType !== "movie" && mediaType !== "tv")) {
    return NextResponse.json({ error: "Missing deviceId, tmdbId, or mediaType." }, { status: 400 });
  }

  const { error } = await supabase
    .from("watchlist")
    .upsert(
      { device_id: deviceId, tmdb_id: tmdbId, media_type: mediaType },
      { onConflict: "device_id,tmdb_id,media_type" },
    );

  if (error) {
    return NextResponse.json({ error: "Could not add to your list." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId: string | undefined = body.deviceId;
  const tmdbId: number | undefined = body.tmdbId;
  const mediaType: string | undefined = body.mediaType;

  if (!deviceId || !tmdbId || (mediaType !== "movie" && mediaType !== "tv")) {
    return NextResponse.json({ error: "Missing deviceId, tmdbId, or mediaType." }, { status: 400 });
  }

  const { error } = await supabase
    .from("watchlist")
    .delete()
    .eq("device_id", deviceId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);

  if (error) {
    return NextResponse.json({ error: "Could not remove from your list." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
