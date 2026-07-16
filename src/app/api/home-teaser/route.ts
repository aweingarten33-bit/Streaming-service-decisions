import { NextRequest, NextResponse } from "next/server";
import { getDeviceId } from "@/lib/device-server";
import { getWatchlistCandidates } from "@/lib/marquee/watchlist-data";
import { generateHomeTeaser } from "@/lib/marquee/teaser";
import type { Language } from "@/lib/marquee/copy";

// Best-effort, in-memory only -- avoids regenerating a fresh line every time
// Home remounts (e.g. switching tabs), while still feeling new across real
// app opens. Resets on cold start, which is fine for flavor text.
const CACHE_TTL_MS = 30 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; teaser: string }>();

export async function GET(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const language: Language =
    req.nextUrl.searchParams.get("language") === "clean" ? "clean" : "unfiltered";

  const candidates = await getWatchlistCandidates(deviceId).catch(() => []);
  const activeCount = candidates.filter((c) => c.status !== "watched").length;
  if (activeCount === 0) {
    return NextResponse.json({ teaser: null });
  }
  const watchedCount = candidates.length - activeCount;

  const key = `${deviceId}:${language}:${activeCount}:${watchedCount}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ teaser: cached.teaser });
  }

  const teaser = await generateHomeTeaser(activeCount, watchedCount, language);
  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, teaser });
  return NextResponse.json({ teaser });
}
