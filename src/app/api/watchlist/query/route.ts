import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/pipeline/supabase";
import { getDetails } from "@/lib/pipeline/tmdb";
import { callClaudeJSON } from "@/lib/pipeline/llm";

const QUERY_SYSTEM_PROMPT = `You help someone pick what to watch from their OWN saved watchlist, based on their mood or request. You'll be given their saved titles (with genre, runtime, year, overview) and their message.

Return ONLY JSON: {"matches": [{"tmdb_id": number, "reason": string}]}

Pick 1 to 3 titles from the list, best first. The reason should be short (under 15 words), conversational -- like a friend texting back, not a marketing blurb. Only choose titles that are actually in the list below -- never invent a tmdb_id that isn't present. If nothing fits perfectly, still return your closest 1-2 matches rather than an empty array.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId: string | undefined = body.deviceId;
  const prompt: string = typeof body.prompt === "string" ? body.prompt : "";

  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId." }, { status: 400 });
  }
  if (!prompt.trim()) {
    return NextResponse.json({ error: "Tell me what you're in the mood for." }, { status: 400 });
  }

  const { data: rows, error } = await getSupabase()
    .from("watchlist")
    .select("tmdb_id, media_type")
    .eq("device_id", deviceId);

  if (error) {
    return NextResponse.json({ error: "Could not load your list." }, { status: 500 });
  }
  if (!rows || rows.length === 0) {
    return NextResponse.json({
      error: "Your list is empty -- add a few titles first, then ask me again.",
    });
  }

  const candidates = (
    await Promise.all(
      rows.map(async (row) => {
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
          overview: details.overview,
          posterPath: details.posterPath,
        };
      }),
    )
  ).filter((c): c is NonNullable<typeof c> => c !== null);

  if (candidates.length === 0) {
    return NextResponse.json({
      error: "Couldn't load details for your saved titles -- try again in a moment.",
    });
  }

  const list = candidates
    .map(
      (c, i) =>
        `${i}. tmdb_id=${c.tmdbId} "${c.title}" (${c.year ?? "?"}, ${c.mediaType}, ${c.genres.join("/")}, ${c.runtime ?? "?"} min) — ${c.overview}`,
    )
    .join("\n");

  let matches: { tmdb_id: number; reason: string }[] = [];
  try {
    const { data } = await callClaudeJSON<{ matches: { tmdb_id: number; reason: string }[] }>({
      system: QUERY_SYSTEM_PROMPT,
      user: `REQUEST: ${prompt}\n\nYOUR SAVED TITLES:\n${list}`,
      maxTokens: 600,
    });
    matches = (data.matches ?? []).filter((m) => candidates.some((c) => c.tmdbId === m.tmdb_id));
  } catch {
    return NextResponse.json({ error: "Couldn't figure that one out -- try rephrasing?" });
  }

  if (matches.length === 0) {
    return NextResponse.json({
      error: "Nothing in your list quite fits that -- try a different mood?",
    });
  }

  const results = matches.map((m) => {
    const candidate = candidates.find((c) => c.tmdbId === m.tmdb_id)!;
    return {
      tmdbId: candidate.tmdbId,
      title: candidate.title,
      mediaType: candidate.mediaType,
      year: candidate.year,
      posterPath: candidate.posterPath,
      reason: m.reason,
    };
  });

  return NextResponse.json({ results });
}
