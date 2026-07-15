import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/pipeline/supabase";
import { getDeviceId } from "@/lib/device-server";
import { upsertTitle } from "@/lib/marquee/upsert-title";
import { getWatchlistCandidates } from "@/lib/marquee/watchlist-data";

export async function GET(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const items = await getWatchlistCandidates(deviceId).catch(() => null);
  if (items === null) {
    return NextResponse.json({ error: "Could not load your list." }, { status: 500 });
  }
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const tmdbId: number | undefined = body.tmdbId;
  const mediaType: string | undefined = body.mediaType;
  const source: string = typeof body.source === "string" ? body.source : "manual";

  if (!tmdbId || (mediaType !== "movie" && mediaType !== "tv")) {
    return NextResponse.json({ error: "Missing tmdbId or mediaType." }, { status: 400 });
  }

  await upsertTitle(tmdbId, mediaType).catch((err) => {
    throw err;
  });

  const { error } = await getSupabase()
    .from("watchlist_items")
    .upsert(
      { device_id: deviceId, tmdb_id: tmdbId, media_type: mediaType, source },
      { onConflict: "device_id,tmdb_id,media_type" },
    );

  if (error) {
    return NextResponse.json({ error: "Could not add to your list." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const tmdbId: number | undefined = body.tmdbId;
  const mediaType: string | undefined = body.mediaType;
  const status: string | undefined = body.status;

  if (
    !tmdbId ||
    (mediaType !== "movie" && mediaType !== "tv") ||
    (status !== "active" && status !== "watched")
  ) {
    return NextResponse.json(
      { error: "Missing or invalid tmdbId, mediaType, or status." },
      { status: 400 },
    );
  }

  const { error } = await getSupabase()
    .from("watchlist_items")
    .update({ status })
    .eq("device_id", deviceId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);

  if (error) {
    return NextResponse.json({ error: "Could not update that title." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const tmdbId: number | undefined = body.tmdbId;
  const mediaType: string | undefined = body.mediaType;

  if (!tmdbId || (mediaType !== "movie" && mediaType !== "tv")) {
    return NextResponse.json({ error: "Missing tmdbId or mediaType." }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("watchlist_items")
    .delete()
    .eq("device_id", deviceId)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);

  if (error) {
    return NextResponse.json({ error: "Could not remove from your list." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
