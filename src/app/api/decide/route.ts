import { NextRequest, NextResponse } from "next/server";
import { getDeviceId } from "@/lib/device-server";
import { getSavedTasteSources, getWatchlistCandidates } from "@/lib/marquee/watchlist-data";
import { parseIntent } from "@/lib/marquee/intent";
import { chooseOne, explainChoice } from "@/lib/marquee/scoring";

export async function POST(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const prompt: string = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const excludeTmdbIds: number[] = Array.isArray(body.excludeTmdbIds) ? body.excludeTmdbIds : [];
  const relax: boolean = body.relax === true;
  const useSavedLists: boolean = body.useSavedLists === true;
  const rejectionReason: string =
    typeof body.rejectionReason === "string" ? body.rejectionReason : "";

  if (!prompt) {
    return NextResponse.json({ error: "Tell me what you're in the mood for." }, { status: 400 });
  }

  const candidates = await getWatchlistCandidates(deviceId);
  if (candidates.length === 0) {
    return NextResponse.json({ emptyWatchlist: true });
  }

  const tasteSources = useSavedLists ? await getSavedTasteSources(deviceId).catch(() => []) : [];
  const tasteSourceText = tasteSources.map((source) =>
    [source.title, source.description, source.note].filter(Boolean).join(" "),
  );
  const adjustedPrompt = rejectionReason
    ? `${prompt}. Avoid this rejected option because: ${rejectionReason}.`
    : prompt;
  const intent = await parseIntent(adjustedPrompt);
  const choice = chooseOne(intent, candidates, { excludeTmdbIds, relax, tasteSourceText });

  if (!choice) {
    return NextResponse.json({ noMatch: true, intent, relaxed: relax });
  }

  const { item } = choice;
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
      explanation: explainChoice(intent, item, tasteSources.length),
      tasteSourceCount: tasteSources.length,
    },
  });
}
