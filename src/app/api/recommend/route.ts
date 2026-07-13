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
  "genre_hints": string[] (zero or more from this exact list: ${allGenres.join(", ")} — map the request's vibe onto these, e.g. "mind-bending" → Science Fiction, Mystery, Thriller),
  "reference_title": string or null (only when the user explicitly asks for something like a specific movie/show)
}
Only include descriptors that clearly match the request's intent. Do not guess wildly.

If PREVIOUS FILTERS are given, the user is continuing a conversation, not starting fresh. If their new message is feedback on what was just shown (e.g. "too serious", "lighter", "shorter"), adjust the previous filters rather than discarding them. If it's clearly an unrelated new request, replace them entirely.`;

interface ParsedQuery {
  media_type: "movie" | "tv" | "any";
  descriptors: string[];
  max_runtime_minutes: number | null;
  genre_hints: string[];
  reference_title?: string | null;
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
}

interface SignalRow {
  tmdb_id: number;
  source_count: number;
  positive_mention_count: number;
  negative_mention_count: number;
  strongest_sentiment: string | null;
  descriptor_counts: Record<string, number> | null;
  representative_summaries: string[];
  latest_mention_at: string | null;
  evidence_score: number;
  titles: TitleRow | TitleRow[] | null;
}

interface ReferenceTitleSignal {
  descriptor_counts: Record<string, number> | null;
  titles: { genres: string[] } | { genres: string[] }[] | null;
}

interface RawMentionCandidateRow {
  tmdb_id: number;
  sentiment: string;
  descriptors: string[] | null;
  quote_free_summary: string | null;
  videos: { curator_id: string } | { curator_id: string }[] | null;
  titles: TitleRow | TitleRow[] | null;
}

const SENTIMENT_RANK: Record<string, number> = {
  enthusiastic_rec: 5,
  qualified_rec: 4,
  notable_mention: 3,
  neutral_reference: 2,
  pan: 1,
};

function curatorIdsFromVideos(videos: RawMentionCandidateRow["videos"]): string[] {
  if (!videos) return [];
  return Array.isArray(videos) ? videos.map((v) => v.curator_id) : [videos.curator_id];
}

function aggregateRawMentionCandidates(rawRows: RawMentionCandidateRow[]): SignalRow[] {
  const byTitle = new Map<number, SignalRow & { _curators?: Set<string> }>();

  for (const mention of rawRows) {
    if (!mention.tmdb_id) continue;
    const title = titleFromSignal({ titles: mention.titles } as SignalRow);
    if (!title) continue;

    const existing = byTitle.get(mention.tmdb_id) ?? {
      tmdb_id: mention.tmdb_id,
      source_count: 0,
      positive_mention_count: 0,
      negative_mention_count: 0,
      strongest_sentiment: null,
      descriptor_counts: {},
      representative_summaries: [],
      latest_mention_at: null,
      evidence_score: 0,
      titles: title,
      _curators: new Set<string>(),
    };

    for (const curatorId of curatorIdsFromVideos(mention.videos))
      existing._curators?.add(curatorId);
    if (mention.sentiment === "enthusiastic_rec" || mention.sentiment === "qualified_rec") {
      existing.positive_mention_count += 1;
    }
    if (mention.sentiment === "pan") existing.negative_mention_count += 1;
    if (
      !existing.strongest_sentiment ||
      (SENTIMENT_RANK[mention.sentiment] ?? 0) > (SENTIMENT_RANK[existing.strongest_sentiment] ?? 0)
    ) {
      existing.strongest_sentiment = mention.sentiment;
    }
    for (const descriptor of mention.descriptors ?? []) {
      if (!allDescriptors.includes(descriptor)) continue;
      existing.descriptor_counts = existing.descriptor_counts ?? {};
      existing.descriptor_counts[descriptor] =
        Number(existing.descriptor_counts[descriptor] ?? 0) + 1;
    }
    if (
      mention.quote_free_summary &&
      !existing.representative_summaries.includes(mention.quote_free_summary) &&
      existing.representative_summaries.length < 3
    ) {
      existing.representative_summaries.push(mention.quote_free_summary);
    }

    byTitle.set(mention.tmdb_id, existing);
  }

  return [...byTitle.values()].map((signal) => {
    const sourceCount = signal._curators?.size ?? 0;
    const strongest = strongestSentimentScore(signal);
    const descriptorTotal = Object.values(signal.descriptor_counts ?? {}).reduce(
      (sum, count) => sum + Number(count),
      0,
    );
    const evidenceScore =
      signal.positive_mention_count * 2 +
      sourceCount * 1.5 +
      strongest +
      descriptorTotal * 0.2 -
      signal.negative_mention_count * 2;
    const { _curators, ...clean } = signal;
    return { ...clean, source_count: sourceCount, evidence_score: evidenceScore };
  });
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

function titleFromSignal(row: SignalRow): TitleRow | null {
  return Array.isArray(row.titles) ? (row.titles[0] ?? null) : row.titles;
}

function descriptorCount(row: SignalRow, descriptor: string): number {
  return Number(row.descriptor_counts?.[descriptor] ?? 0);
}

function topDescriptors(counts: Record<string, number> | null, limit: number): string[] {
  return Object.entries(counts ?? {})
    .filter(([descriptor]) => allDescriptors.includes(descriptor))
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, limit)
    .map(([descriptor]) => descriptor);
}

function titleGenresFromReference(row: ReferenceTitleSignal): string[] {
  const title = Array.isArray(row.titles) ? row.titles[0] : row.titles;
  return title?.genres ?? [];
}

}

function topDescriptors(counts: Record<string, number> | null, limit: number): string[] {
  return Object.entries(counts ?? {})
    .filter(([descriptor]) => allDescriptors.includes(descriptor))
    .sort((a, b) => Number(b[1]) - Number(a[1]))
    .slice(0, limit)
    .map(([descriptor]) => descriptor);
}

function titleGenresFromReference(row: ReferenceTitleSignal): string[] {
  const title = Array.isArray(row.titles) ? row.titles[0] : row.titles;
  return title?.genres ?? [];
}

function strongestSentimentScore(row: SignalRow): number {
  return row.strongest_sentiment ? (SENTIMENT_WEIGHT[row.strongest_sentiment] ?? 0) : 0;
}

function buildWhy(signal: SignalRow, matchedDescriptors: string[]): string {
  const vibePhrase =
    matchedDescriptors.length > 0
      ? ` for its ${matchedDescriptors.map((d) => d.replace(/_/g, " ")).join(" and ")}`
      : "";

  const source =
    signal.source_count >= 2
      ? "Multiple trusted recommendation sources independently highlighted this title"
      : "Highlighted by a trusted recommendation source";

  const summary = signal.representative_summaries[0] ?? "Curators described it as worth watching.";
  const caveat =
    signal.negative_mention_count > 0
      ? ` Balanced against ${signal.negative_mention_count} negative mention${signal.negative_mention_count === 1 ? "" : "s"}.`
      : "";

  return `${source}${vibePhrase}. ${summary}${caveat}`;
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
      parsed.reference_title =
        typeof parsed.reference_title === "string" && parsed.reference_title.trim()
          ? parsed.reference_title.trim()
          : null;
    } catch {
      // Fall back to unfiltered (genre-only) search rather than failing the whole request.
    }
  }

  const referenceTitle = parsed.reference_title;
  if (referenceTitle) {
    const { data: reference } = await supabase
      .from("title_signal_summary")
      .select("descriptor_counts, titles!inner ( genres )")
      .ilike("titles.title", `%${referenceTitle}%`)
      .order("evidence_score", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (reference) {
      const referenceSignal = reference as unknown as ReferenceTitleSignal;
      parsed.descriptors = [
        ...new Set([
          ...parsed.descriptors,
          ...topDescriptors(referenceSignal.descriptor_counts, 4),
        ]),
      ];
      parsed.genre_hints = [
        ...new Set([
          ...parsed.genre_hints,
          ...titleGenresFromReference(referenceSignal).slice(0, 2),
        ]),
      ];
    }
  }

  const wantedGenres = normalizeGenres([...selectedGenres, ...parsed.genre_hints]);

  async function fetchSummaryCandidates(genreFilter: string[]) {
    let query = supabase
      .from("title_signal_summary")
      .select(
        `tmdb_id, source_count, positive_mention_count, negative_mention_count,
         strongest_sentiment, descriptor_counts, representative_summaries, latest_mention_at,
         evidence_score,
         titles!inner (
           tmdb_id, title, media_type, year, genres, runtime, poster_path, streaming_providers,
           imdb_rating, imdb_votes, tmdb_rating, tmdb_vote_count
         )`,
      )
      .gt("positive_mention_count", 0)
      .order("evidence_score", { ascending: false })
      .limit(1000);

    if (parsed.media_type !== "any") query = query.eq("titles.media_type", parsed.media_type);
    if (parsed.max_runtime_minutes) query = query.lte("titles.runtime", parsed.max_runtime_minutes);
    if (genreFilter.length > 0) query = query.overlaps("titles.genres", genreFilter);
    if (excludeIds.length > 0)
      query = query.filter("tmdb_id", "not.in", `(${excludeIds.join(",")})`);
    return query;
  }

  async function fetchRawMentionCandidates(genreFilter: string[]): Promise<SignalRow[]> {
    let query = supabase
      .from("mentions")
      .select(
        `tmdb_id, sentiment, descriptors, quote_free_summary, videos!inner ( curator_id ),
         titles!inner (
           tmdb_id, title, media_type, year, genres, runtime, poster_path, streaming_providers,
           imdb_rating, imdb_votes, tmdb_rating, tmdb_vote_count
         )`,
      )
      .not("tmdb_id", "is", null)
      .in("sentiment", ["enthusiastic_rec", "qualified_rec", "pan"])
      .limit(5000);

    if (parsed.media_type !== "any") query = query.eq("titles.media_type", parsed.media_type);
    if (parsed.max_runtime_minutes) query = query.lte("titles.runtime", parsed.max_runtime_minutes);
    if (genreFilter.length > 0) query = query.overlaps("titles.genres", genreFilter);
    if (excludeIds.length > 0)
      query = query.filter("tmdb_id", "not.in", `(${excludeIds.join(",")})`);

    const { data, error } = await query;
    if (error) {
      console.error(
        "recommend: raw mention fallback failed:",
        error.message,
        error.details,
        error.hint,
      );
      return [];
    }
    return aggregateRawMentionCandidates((data ?? []) as unknown as RawMentionCandidateRow[])
      .filter((signal) => signal.positive_mention_count > 0)
      .sort((a, b) => b.evidence_score - a.evidence_score)
      .slice(0, 1000);
  }

  let candidateSource = "title_signal_summary";

  async function fetchCandidates(genreFilter: string[]): Promise<SignalRow[]> {
    const { data, error } = await fetchSummaryCandidates(genreFilter);
    if (!error && (data ?? []).length > 0) {
      candidateSource = "title_signal_summary";
      return (data ?? []) as unknown as SignalRow[];
    }

    if (error) {
      console.warn(
        "recommend: title_signal_summary unavailable; falling back to raw YouTube mentions:",
        error.message,
        error.details,
        error.hint,
      );
    } else {
      console.warn(
        "recommend: title_signal_summary is empty; falling back to raw YouTube mentions",
      );
    }
    candidateSource = "raw_mentions_fallback";
    return fetchRawMentionCandidates(genreFilter);
  }

  }

  async function fetchCandidates(genreFilter: string[]): Promise<SignalRow[]> {
    const { data, error } = await fetchSummaryCandidates(genreFilter);
    if (!error && (data ?? []).length > 0) return (data ?? []) as unknown as SignalRow[];

    if (error) {
      console.warn(
        "recommend: title_signal_summary unavailable; falling back to raw YouTube mentions:",
        error.message,
        error.details,
        error.hint,
      );
    } else {
      console.warn(
        "recommend: title_signal_summary is empty; falling back to raw YouTube mentions",
      );
    }
    return fetchRawMentionCandidates(genreFilter);
  }

  let rows = await fetchCandidates(wantedGenres);
  // Genre interpretation too narrow for our catalog? Relax it rather than coming back empty.
  if (rows.length === 0 && wantedGenres.length > 0) {
    rows = await fetchCandidates([]);
  }
  const avoidGenres = preferences?.avoid_genres ?? [];
  const favoriteGenres = preferences?.favorite_genres ?? [];
  const myServices = preferences?.streaming_services ?? [];

  function scoreRows(requiredDescriptors: string[]) {
    return rows
      .map((signal) => {
        const row = titleFromSignal(signal);
        if (!row) return null;
        if (avoidGenres.length > 0 && row.genres.some((g) => avoidGenres.includes(g))) return null;
        // Only exclude on services when we actually KNOW the availability and none
        // match — an empty providers array means unknown, not unavailable.
        const onMyService =
          myServices.length > 0 && row.streaming_providers.some((p) => myServices.includes(p));
        if (myServices.length > 0 && row.streaming_providers.length > 0 && !onMyService)
          return null;

        const matchedDescriptors = requiredDescriptors.filter(
          (d) => descriptorCount(signal, d) > 0,
        );
        if (requiredDescriptors.length > 0 && matchedDescriptors.length === 0) return null;

        const rating = row.imdb_rating ?? row.tmdb_rating ?? 0;
        const descriptorStrength = matchedDescriptors.reduce(
          (sum, descriptor) => sum + descriptorCount(signal, descriptor),
          0,
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
          companionDescriptor && descriptorCount(signal, companionDescriptor) > 0 ? 1.5 : 0;
        const score =
          signal.evidence_score +
          strongestSentimentScore(signal) * 2 +
          signal.source_count * 1.5 +
          descriptorStrength * 1.25 +
          rating * 0.35 +
          favoriteBoost +
          primaryGenreBoost +
          companionBoost;

        return { row, signal, score, matchedDescriptors };
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
  let rerankUsed = false;
  if (prompt.trim() && pool.length > 3) {
    try {
      const list = pool
        .map(
          (c, i) =>
            `${i}. "${c.row.title}" (${c.row.year ?? "?"}, ${c.row.genres.join("/")}) — ${buildWhy(c.signal, c.matchedDescriptors)}`,
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
      if (idx.length === 3) {
        chosen = idx.map((i) => pool[i]);
        rerankUsed = true;
      }
    } catch {
      // Keep score order — a rerank failure should never fail the request.
    }
  }

  const top = chosen.map(({ row, signal, matchedDescriptors }) => ({
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
    why: buildWhy(signal, matchedDescriptors),
  }));

  const trace = {
    candidateSource,
    wantedGenres,
    requestedDescriptors: parsed.descriptors,
    candidateCount: rows.length,
    scoredCount: scored.length,
    rerankUsed,
    chosenTmdbIds: top.map((item) => item.tmdbId),
  };

  supabase
    .from("recommendation_traces")
    .insert({
      device_id: deviceId ?? null,
      prompt,
      parsed_filters: parsed,
      candidate_source: candidateSource,
      wanted_genres: wantedGenres,
      requested_descriptors: parsed.descriptors,
      candidate_count: rows.length,
      scored_count: scored.length,
      rerank_used: rerankUsed,
      chosen_tmdb_ids: top.map((item) => item.tmdbId),
    })
    .then(
      () => undefined,
      (error) => console.warn("recommend: trace logging skipped:", error.message),
    );

  return NextResponse.json({
    results: top,
    filters: parsed,
    ...(body.debug === true ? { trace } : {}),
  });
}
