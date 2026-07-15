import { NextRequest, NextResponse } from "next/server";
import { getDeviceId } from "@/lib/device-server";
import { getWatchlistCandidates } from "@/lib/marquee/watchlist-data";

/**
 * Backing endpoint for the native iOS widget's daily pick -- see
 * docs/ios-widget-plan.md for the actual WidgetKit implementation this feeds.
 *
 * No mood input (a home-screen widget can't take free text), so this doesn't
 * call the LLM at all -- just a deterministic, date-seeded pick from the
 * user's active watchlist so it's stable across refreshes within the same
 * day but rotates daily.
 */
export async function GET(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const candidates = (await getWatchlistCandidates(deviceId)).filter((c) => c.status !== "watched");
  if (candidates.length === 0) {
    return NextResponse.json({ result: null });
  }

  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000,
  );
  const pick = candidates[dayOfYear % candidates.length];

  return NextResponse.json({
    result: {
      tmdbId: pick.tmdbId,
      title: pick.title,
      year: pick.year,
      mediaType: pick.mediaType,
      runtime: pick.runtime,
      posterPath: pick.posterPath,
      streamingProviders: pick.streamingProviders,
    },
  });
}
