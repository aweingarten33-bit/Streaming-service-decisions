import { NextRequest, NextResponse } from "next/server";
import { searchTitle } from "@/lib/pipeline/tmdb";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const results = await searchTitle(query, "unknown").catch(() => []);

  return NextResponse.json({
    results: results.slice(0, 15).map((r) => ({
      tmdbId: r.tmdbId,
      title: r.title,
      mediaType: r.mediaType,
      year: r.year,
      posterPath: r.posterPath,
      overview: r.overview,
    })),
  });
}
