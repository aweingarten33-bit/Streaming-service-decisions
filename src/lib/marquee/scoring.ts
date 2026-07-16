import type { DecideIntent } from "./intent";
import type { WatchlistCandidate } from "./types";

const MOOD_GENRES: Record<string, string[]> = {
  funny: ["Comedy"],
  dark: ["Thriller", "Horror", "Crime", "Mystery"],
  thriller: ["Thriller", "Mystery", "Crime"],
  weird: ["Science Fiction", "Fantasy", "Mystery"],
  mind_bending: ["Science Fiction", "Mystery", "Thriller"],
  cozy: ["Comedy", "Romance", "Family", "Animation"],
  comfort: ["Comedy", "Romance", "Animation", "Family"],
  romantic: ["Romance"],
  nostalgic: ["Family", "Animation"],
  entertaining: ["Action", "Adventure", "Comedy"],
  uplifting: ["Comedy", "Family", "Animation"],
  low_effort: [],
};

const AVOID_GENRES: Record<string, string[]> = {
  depressing: ["War", "History"],
  bleak: ["War", "Horror"],
  gory: ["Horror"],
  scary: ["Horror"],
  sad: ["War", "History", "Drama"],
  boring: [],
  slow: [],
  dumb: [],
};

function matchesGenre(item: WatchlistCandidate, genres: string[]): boolean {
  return genres.length > 0 && item.genres.some((g) => genres.includes(g));
}

/** Real evidence a mood word matches -- either a mapped genre, or the word literally appears in the title's own genre list (case-insensitive substring), never just "no genre mismatch penalty." */
function moodScore(item: WatchlistCandidate, mood: string): number {
  const mapped = MOOD_GENRES[mood];
  if (mapped && matchesGenre(item, mapped)) return 5;
  if (mood === "low_effort" && item.runtime != null && item.runtime <= 115) return 3;
  if (mood === "entertaining" && (item.tmdbRating ?? 0) >= 7) return 2;
  return 0;
}

function avoidPenalty(item: WatchlistCandidate, avoid: string): number {
  const mapped = AVOID_GENRES[avoid];
  if (mapped && matchesGenre(item, mapped)) return -8;
  if (avoid === "boring" && (item.tmdbRating ?? 10) < 6) return -3;
  if (avoid === "slow" && item.runtime != null && item.runtime > 150) return -3;
  return 0;
}

export interface ScoredCandidate {
  item: WatchlistCandidate;
  score: number;
}

export interface ChooseOptions {
  excludeTmdbIds?: number[];
  relax?: boolean;
  tasteSourceText?: string[];
}

/**
 * Soft bonus from saved Explore Lists metadata (title/description/note the
 * user chose to save -- never the list's actual contents, per the
 * never-scrape rule). Substring-matching a candidate's own title against
 * that text is too noisy to be real signal, so this only rewards a genre or
 * movie/tv keyword actually appearing in what the user saved.
 */
function tasteSourceScore(item: WatchlistCandidate, tasteSourceText: string[] = []): number {
  if (tasteSourceText.length === 0) return 0;
  const haystack = tasteSourceText.join(" ").toLowerCase();
  let score = 0;
  for (const genre of item.genres) {
    if (haystack.includes(genre.toLowerCase())) score += 1.5;
  }
  if (item.mediaType === "tv" && /\b(tv|show|series|season|episode)\b/.test(haystack)) score += 1;
  if (item.mediaType === "movie" && /\b(movie|film|cinema)\b/.test(haystack)) score += 1;
  return Math.min(score, 4);
}

/**
 * Deterministic, non-LLM scoring. `relax` drops the hard mediaType/runtime
 * filters (used only after the user explicitly agrees via "Fine. Do Your
 * Best.") but avoidMoods penalties still apply -- explicit exclusions never
 * get silently dropped just because nothing else fits.
 */
export function chooseOne(
  intent: DecideIntent,
  candidates: WatchlistCandidate[],
  options: ChooseOptions = {},
): ScoredCandidate | null {
  const { excludeTmdbIds = [], relax = false, tasteSourceText = [] } = options;
  const pool = candidates
    .filter((c) => c.status !== "watched")
    .filter((c) => !excludeTmdbIds.includes(c.tmdbId))
    .filter((c) => relax || intent.mediaType === "any" || c.mediaType === intent.mediaType)
    .filter(
      (c) =>
        relax ||
        !intent.maxRuntimeMinutes ||
        (c.runtime != null && c.runtime <= intent.maxRuntimeMinutes + 5),
    );

  const scored = pool
    .map((item) => {
      let score = 0;
      for (const mood of intent.moods) score += moodScore(item, mood);
      for (const avoid of intent.avoidMoods) score += avoidPenalty(item, avoid);

      if (intent.maxRuntimeMinutes && item.runtime) {
        const delta = Math.abs(item.runtime - intent.maxRuntimeMinutes);
        score += Math.max(0, 6 - delta / 15);
      }
      if (intent.hookSpeed === "fast" && (item.tmdbRating ?? 0) >= 7) score += 2;
      if (intent.backgroundFriendly && item.genres.some((g) => ["Comedy", "Animation"].includes(g)))
        score += 2;
      score += tasteSourceScore(item, tasteSourceText);
      score += (item.tmdbRating ?? 0) * 0.3;

      return { item, score };
    })
    .sort((a, b) => b.score - a.score || a.item.tmdbId - b.item.tmdbId);

  return scored[0] ?? null;
}

/** Practical, specific explanations -- never generic "this captivating masterpiece" AI copy. */
export function explainChoice(
  intent: DecideIntent,
  item: WatchlistCandidate,
  tasteSourceCount = 0,
): string {
  const runtime = item.runtime ? `${item.runtime} minutes` : null;

  if (tasteSourceCount > 0) {
    return `This lines up with your saved IMDb list taste sources and still fits the mood you asked for.`;
  }
  if (intent.maxRuntimeMinutes && runtime) {
    return `You said you had about ${intent.maxRuntimeMinutes} minutes. This is ${runtime}, so it actually fits.`;
  }
  if (intent.avoidMoods.includes("depressing") || intent.avoidMoods.includes("bleak")) {
    return `You wanted something dark without it ruining your night. This has the edge without the gut-punch ending.`;
  }
  if (intent.moods.includes("low_effort") || intent.attentionLevel === "low") {
    return `Low commitment, easy to follow. It's already sitting in your list -- no more scrolling required.`;
  }
  if (intent.backgroundFriendly) {
    return `This one's forgiving if you check your phone -- you won't lose the plot.`;
  }
  if (intent.hookSpeed === "fast") {
    return `It gets moving fast and won't punish you for checking your phone once.`;
  }
  if (intent.moods.includes("weird") || intent.moods.includes("mind_bending")) {
    return `It scratches the weird itch without you having to dig through your whole list.`;
  }
  if (intent.moods.includes("funny")) {
    return `Actually funny, not just labeled that way. It's been sitting on your list long enough.`;
  }
  return `It's the strongest fit from your list right now. Stop negotiating with the couch.`;
}
