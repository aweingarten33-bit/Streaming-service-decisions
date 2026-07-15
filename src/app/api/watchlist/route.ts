import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/marquee/supabase";

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  const search = req.nextUrl.searchParams.get("search")?.trim();
  const sort = req.nextUrl.searchParams.get("sort") ?? "recent";
  if (!deviceId) return NextResponse.json({ items: [] });
  await supabase.from("devices").upsert({ id: deviceId });

  let query = supabase
    .from("viewer_watchlist")
    .select(
      `id, tmdb_id, status, imported_title, imported_year, created_at,
       titles!inner ( tmdb_id, title, media_type, year, genres, runtime, poster_path, backdrop_path )`,
    )
    .eq("device_id", deviceId);

  if (search) query = query.ilike("titles.title", `%${search}%`);
  if (sort === "title") query = query.order("title", { foreignTable: "titles", ascending: true });
  else if (sort === "runtime")
    query = query.order("runtime", { foreignTable: "titles", ascending: true, nullsFirst: false });
  else if (sort === "unwatched")
    query = query.order("status", { ascending: false }).order("created_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
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
  await supabase.from("devices").upsert({ id: deviceId });

  const { error } = await supabase.from("viewer_watchlist").upsert(
    {
      device_id: deviceId,
      tmdb_id: tmdbId,
      provider: typeof body.provider === "string" ? body.provider : "manual",
      source: typeof body.source === "string" ? body.source : "manual",
      status: body.status === "watched" ? "watched" : "unwatched",
    },
    { onConflict: "device_id,tmdb_id" },
  );

  if (error) return NextResponse.json({ error: "Could not save to watchlist." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : null;
  const tmdbId = Number(body.tmdbId);
  const status = body.status === "watched" ? "watched" : "unwatched";
  if (!deviceId || !Number.isFinite(tmdbId)) {
    return NextResponse.json({ error: "Missing watchlist item." }, { status: 400 });
  }
  await supabase.from("devices").upsert({ id: deviceId });

  const { error } = await supabase
    .from("viewer_watchlist")
    .update({ status })
    .eq("device_id", deviceId)
    .eq("tmdb_id", tmdbId);

  if (error) return NextResponse.json({ error: "Could not update watchlist." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : null;
  const tmdbId = Number(body.tmdbId);
  if (!deviceId || !Number.isFinite(tmdbId)) {
    return NextResponse.json({ error: "Missing watchlist item." }, { status: 400 });
  }
  await supabase.from("devices").upsert({ id: deviceId });

  const { error } = await supabase
    .from("viewer_watchlist")
    .delete()
    .eq("device_id", deviceId)
    .eq("tmdb_id", tmdbId);

  if (error)
    return NextResponse.json({ error: "Could not remove from watchlist." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
