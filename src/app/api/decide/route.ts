import { NextRequest, NextResponse } from "next/server";
import { getDeviceId } from "@/lib/device-server";
import { getWatchlistCandidates } from "@/lib/marquee/watchlist-data";
import { parseIntent } from "@/lib/marquee/intent";
import { chooseOne } from "@/lib/marquee/scoring";
import { explainChoiceAI } from "@/lib/marquee/explain";

export async function POST(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const prompt: string = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const excludeTmdbIds: number[] = Array.isArray(body.excludeTmdbIds) ? body.excludeTmdbIds : [];
  const relax: boolean = body.relax === true;
  const mediaType: "movie" | "tv" | "any" | undefined =
    body.mediaType === "movie" || body.mediaType === "tv" || body.mediaType === "any"
      ? body.mediaType
      : undefined;
  const rejectionReason: string =
    typeof body.rejectionReason === "string" ? body.rejectionReason : "";

  if (!prompt) {
    return NextResponse.json({ error: "Tell me what you're in the mood for." }, { status: 400 });
  }

  const candidates = await getWatchlistCandidates(deviceId);
  if (candidates.length === 0) {
    return NextResponse.json({ emptyWatchlist: true });
  }

  const adjustedPrompt = rejectionReason
    ? `${prompt}. Avoid this rejected option because: ${rejectionReason}.`
    : prompt;

  const parsed = await parseIntent(adjustedPrompt);
  // An explicit Movie/TV toggle always wins over whatever the text implies --
  // the user shouldn't have to phrase their mood to also carry the media
  // type.
  const intent = mediaType ? { ...parsed, mediaType } : parsed;
  const choice = chooseOne(intent, candidates, { excludeTmdbIds, relax });

  if (!choice) {
    return NextResponse.json({ noMatch: true, intent, relaxed: relax });
  }

  const { item } = choice;
  const explanation = await explainChoiceAI(intent, item, prompt);
  return NextResponse.json({
    intent,
    result: {
      tmdbId: item.tmdbId,
      title: item.title,
      year: item.year,
      mediaType: item.mediaType,
      runtime: item.runtime,
      posterPath: item.posterPath,
      backdropPath: item.backdropPath,
      streamingProviders: item.streamingProviders,
      tmdbRating: item.tmdbRating,
      imdbRating: item.imdbRating,
      overview: item.overview,
      trailerKey: item.trailerKey,
      explanation,
    },
  });
}
