import { describe, expect, test } from "bun:test";
import { chooseOne, explainChoice } from "@/lib/marquee/scoring";
import type { DecideIntent } from "@/lib/marquee/intent";
import type { WatchlistCandidate } from "@/lib/marquee/types";

const baseIntent: DecideIntent = {
  mediaType: "any",
  maxRuntimeMinutes: null,
  attentionLevel: "medium",
  hookSpeed: "medium",
  pace: "medium",
  emotionalWeight: "light_or_medium",
  moods: [],
  avoidMoods: [],
  backgroundFriendly: false,
};

function candidate(overrides: Partial<WatchlistCandidate>): WatchlistCandidate {
  return {
    id: overrides.tmdbId?.toString() ?? "1",
    tmdbId: 1,
    mediaType: "movie",
    status: "active",
    title: "Untitled",
    year: 2020,
    genres: [],
    runtime: 100,
    posterPath: null,
    backdropPath: null,
    streamingProviders: [],
    tmdbRating: 6,
    ...overrides,
  };
}

describe("chooseOne", () => {
  test("returns exactly one result, never a list", () => {
    const pool = [
      candidate({ tmdbId: 1, title: "A" }),
      candidate({ tmdbId: 2, title: "B" }),
      candidate({ tmdbId: 3, title: "C" }),
    ];
    const choice = chooseOne(baseIntent, pool);
    expect(choice).not.toBeNull();
    expect(typeof choice?.item.tmdbId).toBe("number");
  });

  test("returns null on an empty watchlist", () => {
    expect(chooseOne(baseIntent, [])).toBeNull();
  });

  test("hard-filters by mediaType when specified", () => {
    const pool = [candidate({ tmdbId: 1, mediaType: "tv" })];
    const intent = { ...baseIntent, mediaType: "movie" as const };
    expect(chooseOne(intent, pool)).toBeNull();
  });

  test("relax=true drops the mediaType hard filter", () => {
    const pool = [candidate({ tmdbId: 1, mediaType: "tv" })];
    const intent = { ...baseIntent, mediaType: "movie" as const };
    expect(chooseOne(intent, pool, [], true)).not.toBeNull();
  });

  test("never returns an item marked watched", () => {
    const pool = [candidate({ tmdbId: 1, status: "watched" })];
    expect(chooseOne(baseIntent, pool)).toBeNull();
  });

  test("Give Me Another: excluding the current pick surfaces a different one", () => {
    const pool = [
      candidate({ tmdbId: 1, title: "A", tmdbRating: 9 }),
      candidate({ tmdbId: 2, title: "B", tmdbRating: 5 }),
    ];
    const first = chooseOne(baseIntent, pool);
    expect(first?.item.tmdbId).toBe(1);
    const second = chooseOne(baseIntent, pool, [1]);
    expect(second?.item.tmdbId).toBe(2);
  });

  test("avoidMoods penalizes a matching genre even when nothing else fits better", () => {
    const pool = [
      candidate({ tmdbId: 1, genres: ["War"], tmdbRating: 8 }),
      candidate({ tmdbId: 2, genres: ["Comedy"], tmdbRating: 6 }),
    ];
    const intent = { ...baseIntent, avoidMoods: ["depressing"] };
    const choice = chooseOne(intent, pool);
    expect(choice?.item.tmdbId).toBe(2);
  });

  test("runtime fit is rewarded when maxRuntimeMinutes is set", () => {
    const pool = [candidate({ tmdbId: 1, runtime: 200 }), candidate({ tmdbId: 2, runtime: 95 })];
    const intent = { ...baseIntent, maxRuntimeMinutes: 90 };
    // both exceed the +5 grace window except the second, which is within it
    const choice = chooseOne(intent, pool);
    expect(choice?.item.tmdbId).toBe(2);
  });
});

describe("explainChoice", () => {
  test("never returns generic AI-slop copy", () => {
    const item = candidate({ tmdbId: 1 });
    const text = explainChoice(baseIntent, item);
    expect(text.toLowerCase()).not.toContain("captivating masterpiece");
    expect(text.toLowerCase()).not.toContain("unforgettable journey");
    expect(text.length).toBeGreaterThan(0);
  });

  test("mentions the actual runtime when a max runtime was requested", () => {
    const item = candidate({ tmdbId: 1, runtime: 95 });
    const intent = { ...baseIntent, maxRuntimeMinutes: 100 };
    expect(explainChoice(intent, item)).toContain("95 minutes");
  });
});
