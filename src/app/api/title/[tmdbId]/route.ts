import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/pipeline/supabase";
import { getDetails } from "@/lib/pipeline/tmdb";

const QUALIFYING = ["enthusiastic_rec", "qualified_rec"];

interface MentionRow {
  sentiment: string;
  quote_free_summary: string;
  descriptors: string[];
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

  const [{ data: mentionRows }, { data: sourceSignal }, details] = await Promise.all([
    supabase
      .from("mentions")
      .select("sentiment, quote_free_summary, descriptors, videos ( curator_id )")
      .eq("tmdb_id", tmdbId)
      .in("sentiment", QUALIFYING),
    supabase
      .from("title_signal_summary")
      .select("descriptor_counts, evidence_score, source_count")
      .eq("tmdb_id", tmdbId)
      .maybeSingle(),
    getDetails(tmdbId, mediaType).catch(() => null),
  ]);

  const genres: string[] = row?.genres ?? details?.genres ?? [];
  const sourceDescriptors = new Set(
    ((mentionRows ?? []) as unknown as MentionRow[]).flatMap((m) => m.descriptors ?? []),
  );
  for (const descriptor of Object.keys(
    (sourceSignal?.descriptor_counts as Record<string, number> | null) ?? {},
  )) {
    sourceDescriptors.add(descriptor);
  }

  interface SimilarTitleRow {
    tmdb_id: number;
    title: string;
    media_type: string;
    year: number | null;
    genres: string[];
    poster_path: string | null;
    backdrop_path: string | null;
    imdb_rating: number | null;
    imdb_votes: number | null;
  }

  interface SimilarSignalRow {
    tmdb_id: number;
    source_count: number;
    positive_mention_count: number;
    descriptor_counts: Record<string, number> | null;
    evidence_score: number;
    titles: SimilarTitleRow | SimilarTitleRow[] | null;
  }

  function titleFromSignal(signal: SimilarSignalRow): SimilarTitleRow | null {
    return Array.isArray(signal.titles) ? (signal.titles[0] ?? null) : signal.titles;
  }
  let similar: SimilarTitleRow[] = [];
  {
    const { data: sim } = await supabase
      .from("title_signal_summary")
      .select(
        `tmdb_id, source_count, positive_mention_count, descriptor_counts, evidence_score,
         titles!inner (
           tmdb_id, title, media_type, year, genres, poster_path, backdrop_path, imdb_rating, imdb_votes
         )`,
      )
      .gt("positive_mention_count", 0)
      .neq("tmdb_id", tmdbId)
      .order("evidence_score", { ascending: false })
      .limit(500);

    // Documentaries are their own world: never mix them with fiction in either direction.
    const sourceIsDoc = genres.includes("Documentary");
    similar = ((sim ?? []) as unknown as SimilarSignalRow[])
      .map((signal) => ({ signal, title: titleFromSignal(signal) }))
      .filter((item): item is { signal: SimilarSignalRow; title: SimilarTitleRow } =>
        Boolean(item.title),
      )
      .filter(({ title }) => title.genres.includes("Documentary") === sourceIsDoc)
      .map(({ signal, title }) => {
        const descriptorOverlap = [...sourceDescriptors].reduce(
          (sum, descriptor) => sum + Number(signal.descriptor_counts?.[descriptor] ?? 0),
          0,
        );
        const sharedGenres = title.genres.filter((g) => genres.includes(g)).length;
        return {
          title,
          descriptorOverlap,
          sharedGenres,
          sameType: title.media_type === mediaType ? 1 : 0,
          evidenceScore: Number(signal.evidence_score ?? 0),
          sourceCount: signal.source_count,
        };
      })
      .filter((candidate) =>
        sourceDescriptors.size > 0
          ? candidate.descriptorOverlap > 0 || candidate.sharedGenres > 0
          : candidate.sharedGenres > 0,
      )
      .sort(
        (a, b) =>
          b.sameType - a.sameType ||
          b.descriptorOverlap - a.descriptorOverlap ||
          b.sharedGenres - a.sharedGenres ||
          b.evidenceScore - a.evidenceScore ||
          b.sourceCount - a.sourceCount ||
          (b.title.imdb_votes ?? 0) - (a.title.imdb_votes ?? 0),
      )
      .map((x) => x.title)
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
      backdropPath: s.backdrop_path,
      rating: s.imdb_rating,
    })),
  });
}
