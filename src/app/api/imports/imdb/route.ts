import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/marquee/supabase";
import { getDetails, getWatchProviders, searchTitle } from "@/lib/marquee/tmdb";
import type { MediaType, ResolvedMediaType } from "@/lib/marquee/types";

interface ImportRow {
  title: string;
  year?: number | null;
  imdbId?: string | null;
  mediaType?: MediaType;
}

function normalizeType(type: ImportRow["mediaType"]): MediaType {
  if (type === "movie" || type === "tv") return type;
  return "unknown";
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : null;
  const rows = Array.isArray(body.rows) ? (body.rows as ImportRow[]) : [];
  if (!deviceId) return NextResponse.json({ error: "Missing deviceId." }, { status: 400 });
  await supabase.from("devices").upsert({ id: deviceId });
  if (rows.length === 0)
    return NextResponse.json({ error: "No IMDb rows found." }, { status: 400 });

  let imported = 0;
  let matched = 0;
  let skipped = 0;
  const failures: string[] = [];

  for (const row of rows.slice(0, 500)) {
    const title = typeof row.title === "string" ? row.title.trim() : "";
    if (!title) {
      skipped += 1;
      continue;
    }
    imported += 1;
    try {
      const candidates = await searchTitle(title, normalizeType(row.mediaType));
      const chosen =
        candidates.find(
          (candidate) => row.year && candidate.year && Math.abs(candidate.year - row.year) <= 1,
        ) ?? candidates[0];
      if (!chosen) {
        failures.push(title);
        continue;
      }
      const mediaType = chosen.mediaType as ResolvedMediaType;
      const [details, providers] = await Promise.all([
        getDetails(chosen.tmdbId, mediaType),
        getWatchProviders(chosen.tmdbId, mediaType).catch(() => []),
      ]);

      await supabase.from("titles").upsert({
        tmdb_id: details.tmdbId,
        imdb_id: row.imdbId ?? null,
        title: details.title,
        media_type: details.mediaType,
        year: details.year,
        genres: details.genres,
        runtime: details.runtime,
        poster_path: details.posterPath,
        backdrop_path: details.backdropPath,
        streaming_providers: providers,
        tmdb_rating: details.voteAverage,
        tmdb_vote_count: details.voteCount,
        updated_at: new Date().toISOString(),
      });

      await supabase.from("viewer_watchlist").upsert(
        {
          device_id: deviceId,
          tmdb_id: details.tmdbId,
          provider: "imdb",
          source: "imdb_csv",
          provider_item_id: row.imdbId ?? null,
          imported_title: title,
          imported_year: row.year ?? null,
          media_type: details.mediaType,
          status: "unwatched",
        },
        { onConflict: "device_id,tmdb_id" },
      );
      matched += 1;
    } catch (error) {
      failures.push(title);
      console.warn("imdb import: failed row", title, error);
    }
  }

  return NextResponse.json({ imported, matched, skipped, unmatched: failures.slice(0, 25) });
}
