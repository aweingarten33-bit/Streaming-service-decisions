import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/pipeline/supabase";
import { callClaudeJSON } from "@/lib/pipeline/llm";
import { descriptors as allDescriptors } from "../../../../config/descriptors";
import { genres as allGenres } from "../../../../config/genres";

const PARSE_SYSTEM_PROMPT = `You convert a casual request for a movie/TV recommendation into structured search filters.
Return ONLY JSON matching:
{
  "media_type": "movie" | "tv" | "any",
  "descriptors": string[] (zero or more from this exact list: ${allDescriptors.join(", ")}),
  "max_runtime_minutes": number or null (only if a time constraint is mentioned, e.g. "90 minutes" or "short"),
  "genre_hints": string[] (zero or more from this exact list: ${allGenres.join(", ")} — map the request's vibe onto these, e.g. "mind-bending" → Science Fiction, Mystery, Thriller)
}
Only include descriptors that clearly match the request's intent. Do not guess wildly.

If PREVIOUS FILTERS are given, the user is continuing a conversation, not starting fresh. If their new message is feedback on what was just shown (e.g. "too serious", "lighter", "shorter"), adjust the previous filters rather than discarding them. If it's clearly an unrelated new request, replace them entirely.`;

interface ParsedQuery {
  media_type: "movie" | "tv" | "any";
  descriptors: string[];
  max_runtime_minutes: number | null;
  genre_hints: string[];
}

interface TitleRow {
  tmdb_id: number;
  title: string;
  media_type: string;
  year: number | null;
  genres: string[];
  runtime: number | null;
  poster_path: string | null;
  imdb_rating: number | null;
  imdb_votes: number | null;
  tmdb_rating: number | null;
  tmdb_vote_count: number | null;
  streaming_providers: string[];
  mentions: {
    id: string;
    sentiment: string;
    descriptors: string[];
    quote_free_summary: string;
    videos: { curator_id: string } | { curator_id: string }[] | null;
  }[];
}

interface ViewerPreferences {
  streaming_services: string[];
  favorite_genres: string[];
  avoid_genres: string[];
  watches_with: string | null;
}

// Who someone usually watches with maps onto vibe descriptors the curators
// already tag — a soft boost, never a hard filter.
const WATCHES_WITH_DESCRIPTOR: Record<string, string> = {
  Partner: "date_night_safe",
  Family: "parents_safe",
};

// The LLM writes genre hints in casual English ("sci-fi") but titles store
// TMDB's exact names ("Science Fiction"), and array overlap is case-sensitive.
const GENRE_LOOKUP = new Map(allGenres.map((g) => [g.toLowerCase(), g]));
const GENRE_SYNONYMS: Record<string, string> = {
  "sci-fi": "Science Fiction",
  scifi: "Science Fiction",
  "sci fi": "Science Fiction",
  "science-fiction": "Science Fiction",
  "rom-com": "Romance",
  romcom: "Romance",
  romantic: "Romance",
  documentaries: "Documentary",
  doc: "Documentary",
  docs: "Documentary",
  "true crime": "Crime",
  historical: "History",
  musical: "Music",
  scary: "Horror",
  funny: "Comedy",
  kids: "Family",
  animated: "Animation",
  anime: "Animation",
};

function normalizeGenres(hints: string[]): string[] {
  const out = new Set<string>();
  for (const hint of hints) {
    const key = hint.trim().toLowerCase();
    const match = GENRE_LOOKUP.get(key) ?? GENRE_SYNONYMS[key];
    if (match) out.add(match);
  }
  return [...out];
}

const RERANK_SYSTEM_PROMPT = `You pick the movies/TV shows that best fit a viewer's request from a candidate shortlist.
Return ONLY JSON: {"chosen_indices": number[]} — the 0-based indices of the 3 candidates that genuinely fit the request's tone and intent, best first.
Judge tone honestly: if they asked for funny, pick things that are actually funny — not heavy dramas that happen to carry a comedy label. Never invent candidates; only choose from the list.`;

const SENTIMENT_WEIGHT: Record<string, number> = {
  enthusiastic_rec: 3,
  qualified_rec: 1.5,
  notable_mention: 0.5,
  neutral_reference: 0,
  pan: -5,
};

function curatorIdsForTitle(row: TitleRow): Set<string> {
  const ids = new Set<string>();
  for (const m of row.mentions) {
    const v = m.videos;
    if (!v) continue;
    if (Array.isArray(v)) v.forEach((x) => ids.add(x.curator_id));
    else ids.add(v.curator_id);
  }
  return ids;
}

function bestMention(row: TitleRow) {
  return row.mentions.reduce((best, m) =>
    (SENTIMENT_WEIGHT[m.sentiment] ?? 0) > (SENTIMENT_WEIGHT[best.sentiment] ?? 0) ? m : best,
  );
}

function buildWhy(row: TitleRow, matchedDescriptors: string[]): string {
  const curatorCount = curatorIdsForTitle(row).size;
  const mention = bestMention(row);
  const vibePhrase =
    matchedDescriptors.length > 0
      ? ` for its ${matchedDescriptors.map((d) => d.replace(/_/g, " ")).join(" and ")}`
      : "";

  const source =
    curatorCount >= 2
      ? "Multiple trusted recommendation sources independently highlighted this title"
      : "Highlighted by a trusted recommendation source";

  return `${source}${vibePhrase}. ${mention.quote_free_summary}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const prompt: string = typeof body.prompt === "string" ? body.prompt : "";
  const selectedGenres: string[] = Array.isArray(body.genres) ? body.genres : [];
  const excludeIds: number[] = Array.isArray(body.excludeIds) ? body.excludeIds : [];
  const deviceId: string | undefined =
    typeof body.deviceId === "string" ? body.deviceId : undefined;
  const previousFilters: ParsedQuery | undefined = body.previousFilters;

  if (!prompt.trim() && selectedGenres.length === 0) {
    return NextResponse.json({ error: "Tell us what you're in the mood for." }, { status: 400 });
  }

  let preferences: ViewerPreferences | null = null;
  if (deviceId) {
    const { data } = await supabase
      .from("viewer_preferences")
      .select("streaming_services, favorite_genres, avoid_genres, watches_with")
      .eq("device_id", deviceId)
      .maybeSingle();
    preferences = data;
  }

  let parsed: ParsedQuery = {
    media_type: "any",
    descriptors: [],
    max_runtime_minutes: null,
    genre_hints: [],
  };
  if (prompt.trim()) {
    try {
      const user = previousFilters
        ? `PREVIOUS FILTERS: ${JSON.stringify(previousFilters)}\n\nUSER'S NEW MESSAGE: ${prompt}`
        : prompt;
      const { data } = await callClaudeJSON<ParsedQuery>({
        system: PARSE_SYSTEM_PROMPT,
        user,
        maxTokens: 500,
      });
      parsed = data;
      // Never let an invented tag zero out results — only real taxonomy entries count.
      parsed.descriptors = (parsed.descriptors ?? []).filter((d) => allDescriptors.includes(d));
      parsed.genre_hints = parsed.genre_hints ?? [];
    } catch {
      // Fall back to unfiltered (genre-only) search rather than failing the whole request.
    }
  }

  const wantedGenres = normalizeGenres([...selectedGenres, ...parsed.genre_hints]);

  async function fetchCandidates(genreFilter: string[]) {
    let query = supabase
      .from("titles")
      .select(
        `tmdb_id, title, media_type, year, genres, runtime, poster_path, streaming_providers,
         imdb_rating, imdb_votes, tmdb_rating, tmdb_vote_count,
         mentions!inner ( id, sentiment, descriptors, quote_free_summary, videos ( curator_id ) )`,
      )
      .order("imdb_votes", { ascending: false, nullsFirst: false })
      .limit(300);

    if (parsed.media_type !== "any") query = query.eq("media_type", parsed.media_type);
    if (parsed.max_runtime_minutes) query = query.lte("runtime", parsed.max_runtime_minutes);
    if (genreFilter.length > 0) query = query.overlaps("genres", genreFilter);
    if (excludeIds.length > 0) query = query.not("tmdb_id", "in", `(${excludeIds.join(",")})`);
    return query;
  }

  const { data, error } = await fetchCandidates(wantedGenres);
  if (error) {
    console.error("recommend: titles query failed:", error.message, error.details, error.hint);
    return NextResponse.json({ error: `Search failed: ${error.message}` }, { status: 500 });
  }

  let rows = (data ?? []) as unknown as TitleRow[];
  // Genre interpretation too narrow for our catalog? Relax it rather than coming back empty.
  if (rows.length === 0 && wantedGenres.length > 0) {
    const { data: relaxed } = await fetchCandidates([]);
    rows = (relaxed ?? []) as unknown as TitleRow[];
  }
  const avoidGenres = preferences?.avoid_genres ?? [];
  const favoriteGenres = preferences?.favorite_genres ?? [];
  const myServices = preferences?.streaming_services ?? [];

  function scoreRows(requiredDescriptors: string[]) {
    return rows
      .map((row) => {
        if (avoidGenres.length > 0 && row.genres.some((g) => avoidGenres.includes(g))) return null;
        // Only exclude on services when we actually KNOW the availability and none
        // match — an empty providers array means unknown, not unavailable.
        const onMyService =
          myServices.length > 0 && row.streaming_providers.some((p) => myServices.includes(p));
        if (myServices.length > 0 && row.streaming_providers.length > 0 && !onMyService)
          return null;

        const qualifying = row.mentions.filter((m) =>
          ["enthusiastic_rec", "qualified_rec"].includes(m.sentiment),
        );
        if (qualifying.length === 0) return null;

        const matchedDescriptors = requiredDescriptors.filter((d) =>
          qualifying.some((m) => m.descriptors.includes(d)),
        );
        if (requiredDescriptors.length > 0 && matchedDescriptors.length === 0) return null;

        const rating = row.imdb_rating ?? row.tmdb_rating ?? 0;
        const sentimentScore = Math.max(
          ...qualifying.map((m) => SENTIMENT_WEIGHT[m.sentiment] ?? 0),
        );
        const favoriteBoost = row.genres.some((g) => favoriteGenres.includes(g)) ? 1.5 : 0;
        // A requested genre in first position is the title's real identity; buried
        // third it's often a token label (the dramedy problem).
        const primaryGenreBoost =
          wantedGenres.length > 0 && row.genres[0] && wantedGenres.includes(row.genres[0])
            ? 1.5
            : 0;
        const companionDescriptor = preferences?.watches_with
          ? WATCHES_WITH_DESCRIPTOR[preferences.watches_with]
          : undefined;
        const companionBoost =
          companionDescriptor && qualifying.some((m) => m.descriptors.includes(companionDescriptor))
            ? 1.5
            : 0;
        const score =
          sentimentScore * 2 +
          rating +
          favoriteBoost +
          primaryGenreBoost +
          companionBoost +
          Math.random() * 1.5;

        return { row: { ...row, mentions: qualifying }, score, matchedDescriptors };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.score - a.score);
  }

  // Strict interpretation first; if the vibe requirement filtered everything out,
  // relax it and still hand back strong picks instead of an empty answer.
  let scored = scoreRows(parsed.descriptors);
  if (scored.length === 0 && parsed.descriptors.length > 0) {
    scored = scoreRows([]);
  }

  // Genre labels lie about tone (dramedies carry a Comedy tag), so let the model
  // read the shortlist and judge fit honestly instead of trusting metadata alone.
  const pool = scored.slice(0, 12);
  let chosen = pool.slice(0, 3);
  if (prompt.trim() && pool.length > 3) {
    try {
      const list = pool
        .map(
          (c, i) =>
            `${i}. "${c.row.title}" (${c.row.year ?? "?"}, ${c.row.genres.join("/")}) — ${bestMention(c.row).quote_free_summary}`,
        )
        .join("\n");
      const { data } = await callClaudeJSON<{ chosen_indices: number[] }>({
        system: RERANK_SYSTEM_PROMPT,
        user: `REQUEST: ${prompt}\n\nCANDIDATES:\n${list}`,
        model: "claude-haiku-4-5-20251001",
        maxTokens: 100,
      });
      const idx = (data.chosen_indices ?? [])
        .filter((i) => Number.isInteger(i) && i >= 0 && i < pool.length)
        .slice(0, 3);
      if (idx.length === 3) chosen = idx.map((i) => pool[i]);
    } catch {
      // Keep score order — a rerank failure should never fail the request.
    }
  }

  const top = chosen.map(({ row, matchedDescriptors }) => ({
    tmdbId: row.tmdb_id,
    title: row.title,
    year: row.year,
    mediaType: row.media_type,
    posterPath: row.poster_path,
    rating: row.imdb_rating ?? row.tmdb_rating ?? null,
    ratingSource: row.imdb_rating ? "IMDb" : row.tmdb_rating ? "TMDB" : null,
    voteCount: row.imdb_votes ?? row.tmdb_vote_count ?? null,
    genres: row.genres,
    streamingProviders: row.streaming_providers,
    why: buildWhy(row, matchedDescriptors),
  }));

  return NextResponse.json({ results: top, filters: parsed });
}
