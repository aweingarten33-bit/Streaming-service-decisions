import { GoogleCseProvider } from "./google-provider";
import type { PublicListSearchProvider, PublicListSearchResult } from "./types";
import { canonicalizeImdbListUrl, isValidImdbListUrl } from "./validate-url";

const defaultProvider: PublicListSearchProvider = new GoogleCseProvider();

// Best-effort only -- an in-memory Map resets on cold start, which is fine
// for a single-instance hobby deployment but not a hard guarantee under
// multiple concurrent serverless instances.
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { expiresAt: number; results: PublicListSearchResult[] }>();

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const rateLimitHits = new Map<string, number[]>();

export class RateLimitedError extends Error {}

function checkRateLimit(userId: string): void {
  const now = Date.now();
  const hits = (rateLimitHits.get(userId) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) {
    rateLimitHits.set(userId, hits);
    throw new RateLimitedError("Too many searches. Try again in a few minutes.");
  }
  hits.push(now);
  rateLimitHits.set(userId, hits);
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function dedupeValidResults(raw: PublicListSearchResult[]): PublicListSearchResult[] {
  const seen = new Set<string>();
  const results: PublicListSearchResult[] = [];
  for (const item of raw) {
    if (!isValidImdbListUrl(item.url)) continue;
    const canonical = canonicalizeImdbListUrl(item.url);
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    results.push({ ...item, url: canonical });
  }
  return results;
}

/**
 * Searches for public IMDb list pages matching a topic, entirely server-side.
 * The user never sees Google/Bing or any search-results interface -- this
 * restricts the query to indexed imdb.com/list pages, validates every URL,
 * dedupes, and caches, then hands back clean rows for the Explore screen.
 */
export async function searchPublicLists(
  query: string,
  userId: string,
  provider: PublicListSearchProvider = defaultProvider,
): Promise<PublicListSearchResult[]> {
  checkRateLimit(userId);

  const key = normalizeQuery(query);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.results;

  const restrictedQuery = `${query} site:imdb.com/list`;
  const raw = await provider.search(restrictedQuery);
  const results = dedupeValidResults(raw);

  cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, results });
  return results;
}
