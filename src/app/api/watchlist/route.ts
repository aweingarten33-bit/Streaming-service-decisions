import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/pipeline/supabase";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) return NextResponse.json({ items: [] });

  const { data, error } = await supabase
    .from("viewer_watchlist")
    .select(
      `tmdb_id, created_at,
       titles!inner ( tmdb_id, title, media_type, year, genres, poster_path, backdrop_path )`,
    )
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Could not load watchlist." }, { status: 500 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : null;
  const tmdbId = Number(body.tmdbId);
  if (!deviceId || !Number.isFinite(tmdbId)) {
    return NextResponse.json({ error: "Missing watchlist item." }, { status: 400 });
  }

  const { error } = await supabase.from("viewer_watchlist").upsert(
    {
      device_id: deviceId,
      tmdb_id: tmdbId,
      source: typeof body.source === "string" ? body.source : "manual",
    },
    { onConflict: "device_id,tmdb_id" },
  );

  if (error) return NextResponse.json({ error: "Could not save to watchlist." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : null;
  const tmdbId = Number(body.tmdbId);
  if (!deviceId || !Number.isFinite(tmdbId)) {
    return NextResponse.json({ error: "Missing watchlist item." }, { status: 400 });
  }

  const { error } = await supabase
    .from("viewer_watchlist")
    .delete()
    .eq("device_id", deviceId)
    .eq("tmdb_id", tmdbId);

  if (error)
    return NextResponse.json({ error: "Could not remove from watchlist." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
