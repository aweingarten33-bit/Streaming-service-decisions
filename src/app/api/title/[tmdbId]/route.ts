import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/pipeline/supabase";
import { getDetails } from "@/lib/pipeline/tmdb";

const QUALIFYING = ["enthusiastic_rec", "qualified_rec"];

interface MentionRow {
  sentiment: string;
  quote_free_summary: string;
  videos: { curator_id: string } | { curator_id: string }[] | null;
}

function buildWhy(mentions: MentionRow[]): string | null {
  if (mentions.length === 0) return null;
  const curators = new Set<string>();
  for (const m of mentions) {
    const v = m.videos;
    if (!v) continue;
    if (Array.isArray(v)) v.forEach((x) => curators.add(x.curator_id));
    else curators.add(v.curator_id);
  }
  const best = mentions.find((m) => m.sentiment === "enthusiastic_rec") ?? mentions[0];
  const source =
    curators.size >= 2
      ? "Multiple trusted recommendation sources independently highlighted this title"
      : "Highlighted by a trusted recommendation source";
  return `${source}. ${best.quote_free_summary}`;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ tmdbId: string }> }) {
  const { tmdbId: idStr } = await params;
  const tmdbId = Number(idStr);
  if (!Number.isFinite(tmdbId)) {
    return NextResponse.json({ error: "Invalid title id." }, { status: 400 });
  }
  const typeParam = req.nextUrl.searchParams.get("type") === "tv" ? "tv" : "movie";

  const { data: row } = await supabase
    .from("titles")
    .select(
      `tmdb_id, title, media_type, year, genres, runtime, poster_path, backdrop_path,
       streaming_providers, imdb_rating, imdb_votes, tmdb_rating, tmdb_vote_count`,
    )
    .eq("tmdb_id", tmdbId)
    .maybeSingle();

  const mediaType = (row?.media_type as "movie" | "tv") ?? typeParam;

  const [{ data: mentionRows }, details] = await Promise.all([
    supabase
      .from("mentions")
      .select("sentiment, quote_free_summary, videos ( curator_id )")
      .eq("tmdb_id", tmdbId)
      .in("sentiment", QUALIFYING),
    getDetails(tmdbId, mediaType).catch(() => null),
  ]);

  const genres: string[] = row?.genres ?? details?.genres ?? [];

  interface SimilarRow {
    tmdb_id: number;
    title: string;
    media_type: string;
    year: number | null;
    poster_path: string | null;
    imdb_rating: number | null;
    mentions: { sentiment: string }[];
  }
  let similar: SimilarRow[] = [];
  if (genres.length > 0) {
    const { data: sim } = await supabase
      .from("titles")
      .select(
        `tmdb_id, title, media_type, year, poster_path, imdb_rating,
         mentions!inner ( sentiment )`,
      )
      .overlaps("genres", genres)
      .neq("tmdb_id", tmdbId)
      .order("imdb_votes", { ascending: false, nullsFirst: false })
      .limit(60);
    similar = ((sim ?? []) as unknown as SimilarRow[])
      .filter((s) => s.mentions.some((m) => QUALIFYING.includes(m.sentiment)))
      .slice(0, 10);
  }

  return NextResponse.json({
    title: {
      tmdbId,
      title: row?.title ?? details?.title ?? "Unknown",
      mediaType,
      year: row?.year ?? details?.year ?? null,
      genres,
      runtime: row?.runtime ?? details?.runtime ?? null,
      posterPath: row?.poster_path ?? details?.posterPath ?? null,
      backdropPath: row?.backdrop_path ?? details?.backdropPath ?? null,
      streamingProviders: row?.streaming_providers ?? [],
      rating: row?.imdb_rating ?? row?.tmdb_rating ?? details?.voteAverage ?? null,
      ratingSource: row?.imdb_rating ? "IMDb" : "TMDB",
      voteCount: row?.imdb_votes ?? row?.tmdb_vote_count ?? details?.voteCount ?? null,
      overview: details?.overview ?? null,
      director: details?.director ?? null,
      topCast: details?.topCast ?? [],
      trailerKey: details?.trailerKey ?? null,
      why: buildWhy((mentionRows ?? []) as unknown as MentionRow[]),
    },
    similar: similar.map((s) => ({
      tmdbId: s.tmdb_id,
      title: s.title,
      mediaType: s.media_type,
      year: s.year,
      posterPath: s.poster_path,
      rating: s.imdb_rating,
    })),
  });
}
