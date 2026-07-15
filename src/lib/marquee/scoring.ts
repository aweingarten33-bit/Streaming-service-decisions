import type { DecideIntent } from "./intent";

export interface WatchlistDecisionItem {
  id?: string;
  tmdb_id: number;
  status?: string | null;
  created_at?: string | null;
  titles: {
    tmdb_id: number;
    title: string;
    media_type: string;
    year: number | null;
    genres: string[];
    runtime: number | null;
    poster_path: string | null;
    streaming_providers: string[];
    tmdb_rating?: number | null;
    tmdb_vote_count?: number | null;
  } | null;
}

function textFor(item: WatchlistDecisionItem): string {
  const title = item.titles;
  return [title?.title, title?.media_type, ...(title?.genres ?? [])].join(" ").toLowerCase();
}

function vibeScore(intent: DecideIntent, item: WatchlistDecisionItem): number {
  const title = item.titles;
  if (!title) return -999;
  const text = textFor(item);
  let score = 0;
  for (const vibe of intent.vibes) {
    if (vibe === "funny" && title.genres.includes("Comedy")) score += 5;
    if (
      vibe === "thriller" &&
      title.genres.some((g) => ["Thriller", "Mystery", "Crime"].includes(g))
    )
      score += 5;
    if (
      vibe === "dark" &&
      title.genres.some((g) => ["Thriller", "Horror", "Crime", "Mystery"].includes(g))
    )
      score += 3;
    if (
      vibe === "weird" &&
      title.genres.some((g) => ["Science Fiction", "Fantasy", "Mystery"].includes(g))
    )
      score += 3;
    if (
      vibe === "mind_bending" &&
      title.genres.some((g) => ["Science Fiction", "Mystery", "Thriller"].includes(g))
    )
      score += 5;
    if (
      vibe === "cozy" &&
      title.genres.some((g) => ["Comedy", "Romance", "Family", "Animation"].includes(g))
    )
      score += 4;
    if (
      vibe === "comfort" &&
      title.genres.some((g) => ["Comedy", "Romance", "Animation", "Adventure"].includes(g))
    )
      score += 3;
    if (vibe === "fast" && title.runtime != null && title.runtime <= 110) score += 4;
    if (vibe === "low_effort" && title.runtime != null && title.runtime <= 115) score += 3;
    if (vibe === "phone_down" && (title.tmdb_rating ?? 0) >= 7) score += 3;
    if (vibe === "high_quality" && (title.tmdb_rating ?? 0) >= 7) score += 4;
    if (text.includes(vibe.replace(/_/g, " "))) score += 2;
  }
  for (const avoid of intent.avoid) {
    if (avoid === "gory" && title.genres.includes("Horror")) score -= 8;
    if (avoid === "bleak" && title.genres.some((g) => ["War", "Horror"].includes(g))) score -= 5;
    if (text.includes(avoid.replace(/_/g, " "))) score -= 4;
  }
  return score;
}

export function chooseOne(intent: DecideIntent, items: WatchlistDecisionItem[]) {
  const candidates = items
    .filter((item) => item.titles)
    .filter((item) => item.status !== "watched")
    .filter((item) => intent.mediaType === "any" || item.titles?.media_type === intent.mediaType)
    .filter(
      (item) =>
        !intent.maxRuntimeMinutes ||
        !item.titles?.runtime ||
        item.titles.runtime <= intent.maxRuntimeMinutes + 5,
    )
    .map((item) => {
      const title = item.titles!;
      const runtimeFit =
        intent.maxRuntimeMinutes && title.runtime
          ? Math.max(0, 8 - Math.abs(title.runtime - intent.maxRuntimeMinutes) / 12)
          : 0;
      const rating = title.tmdb_rating ? title.tmdb_rating * 0.6 : 0;
      const recency = item.created_at
        ? Math.max(0, 2 - (Date.now() - Date.parse(item.created_at)) / 1000 / 60 / 60 / 24 / 180)
        : 0;
      const score = vibeScore(intent, item) + runtimeFit + rating + recency;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || a.item.tmdb_id - b.item.tmdb_id);

  return candidates[0] ?? null;
}

export function explainChoice(intent: DecideIntent, item: WatchlistDecisionItem): string {
  const title = item.titles;
  if (!title) return "This is the cleanest match from your list tonight.";
  const runtime = title.runtime ? `${title.runtime} minutes` : null;
  if (intent.maxRuntimeMinutes && runtime)
    return `${runtime}, so it fits the window. It also matches the vibe better than the rest of your list tonight.`;
  if (intent.vibes.includes("low_effort"))
    return "Low commitment and easy to start. Good enough reason to stop scrolling.";
  if (intent.vibes.includes("phone_down"))
    return "This is the one most likely to actually hold your attention. Put the phone down and press play.";
  if (intent.vibes.includes("weird") || intent.vibes.includes("mind_bending"))
    return "It scratches the weird itch without making you dig through the whole list.";
  return "It is the strongest fit from your watchlist right now. Stop negotiating with the couch.";
}
