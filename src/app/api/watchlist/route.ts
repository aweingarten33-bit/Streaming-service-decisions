import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/pipeline/supabase";
import { getUserFromRequest } from "@/lib/auth-server";
import { upsertTitle } from "@/lib/marquee/upsert-title";
import { getWatchlistCandidates } from "@/lib/marquee/watchlist-data";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const items = await getWatchlistCandidates(user.id).catch(() => null);
  if (items === null) {
    return NextResponse.json({ error: "Could not load your list." }, { status: 500 });
  }
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

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
      { user_id: user.id, tmdb_id: tmdbId, media_type: mediaType, source },
      { onConflict: "user_id,tmdb_id,media_type" },
    );

  if (error) {
    return NextResponse.json({ error: "Could not add to your list." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

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
    .eq("user_id", user.id)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);

  if (error) {
    return NextResponse.json({ error: "Could not update that title." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tmdbId: number | undefined = body.tmdbId;
  const mediaType: string | undefined = body.mediaType;

  if (!tmdbId || (mediaType !== "movie" && mediaType !== "tv")) {
    return NextResponse.json({ error: "Missing tmdbId or mediaType." }, { status: 400 });
  }

  const { error } = await getSupabase()
    .from("watchlist_items")
    .delete()
    .eq("user_id", user.id)
    .eq("tmdb_id", tmdbId)
    .eq("media_type", mediaType);

  if (error) {
    return NextResponse.json({ error: "Could not remove from your list." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
