/**
 * Pulls the real title IDs out of a public IMDb list page. There is no API
 * for this -- IMDb only offers a CSV export for *your own* watchlist/ratings,
 * never for browsing someone else's public list -- so this is a best-effort
 * HTML scrape, done on-demand (once per "Add to my watchlist" click) against
 * a single list a real person chose to save. That's a different risk profile
 * than bulk/commercial scraping, but it's still against IMDb's ToS and still
 * fragile: IMDb can change this markup at any time with no warning.
 *
 * Two independent extraction strategies, tried in order:
 *  1. JSON-LD (`<script type="application/ld+json">` with @type ItemList) --
 *     IMDb has historically embedded this for SEO on list-like pages. Most
 *     precise when present: every entry is unambiguously a real list item.
 *  2. A blunter fallback: every `/title/tt.../` href on the page, in document
 *     order, deduped. Works even if the JSON-LD block disappears entirely,
 *     at the cost of possibly picking up a "more like this" widget if one
 *     happens to render before the list content -- capped tightly to limit
 *     the damage if that happens.
 *
 * Not verified against a live IMDb page from this environment -- this
 * sandbox's outbound network policy blocks imdb.com entirely. Treat this as
 * a first pass that needs a real smoke test (see the console warnings it
 * emits) once it's actually deployed somewhere that can reach IMDb.
 */

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
};

const TITLE_ID_PATTERN = /tt\d+/;
const MAX_TITLES = 500;
const MAX_PAGES = 5;

export function extractFromJsonLd(html: string): { ids: string[]; numberOfItems: number | null } {
  const ids: string[] = [];
  let numberOfItems: number | null = null;
  const blockPattern = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(blockPattern)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue;
    }
    const candidates = Array.isArray(parsed) ? parsed : [parsed];
    for (const candidate of candidates) {
      if (
        typeof candidate !== "object" ||
        candidate === null ||
        (candidate as Record<string, unknown>)["@type"] !== "ItemList"
      ) {
        continue;
      }
      const itemList = candidate as {
        numberOfItems?: number;
        itemListElement?: { url?: string; item?: { url?: string } }[];
      };
      if (typeof itemList.numberOfItems === "number") numberOfItems = itemList.numberOfItems;
      for (const entry of itemList.itemListElement ?? []) {
        const url = entry.url ?? entry.item?.url;
        const id = url?.match(TITLE_ID_PATTERN)?.[0];
        if (id) ids.push(id);
      }
    }
  }
  return { ids, numberOfItems };
}

// Scoped to IMDb's actual current list-item container class (confirmed via
// a real scraping guide targeting IMDb specifically, not guessed) instead of
// scanning the whole page -- avoids picking up unrelated title links from
// "more like this" widgets or footer content the way extractFromHrefs can.
const LIST_ITEM_PATTERN = /<li[^>]*class="[^"]*ipc-metadata-list-summary-item[^"]*"[^>]*>/gi;

export function extractFromListItems(html: string): string[] {
  const ids: string[] = [];
  const itemStarts = [...html.matchAll(LIST_ITEM_PATTERN)].map((m) => m.index);
  for (let i = 0; i < itemStarts.length; i++) {
    const start = itemStarts[i];
    const end = itemStarts[i + 1] ?? html.length;
    const id = html.slice(start, end).match(/\/title\/(tt\d+)\//)?.[1];
    if (id) ids.push(id);
  }
  return ids;
}

export function extractFromHrefs(html: string): string[] {
  const ids: string[] = [];
  for (const match of html.matchAll(/\/title\/(tt\d+)\//g)) {
    ids.push(match[1]);
  }
  return ids;
}

function dedupeInOrder(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

async function fetchListPage(url: string): Promise<string> {
  const res = await fetch(url, { headers: BROWSER_HEADERS });
  if (!res.ok) throw new Error(`IMDb list page fetch failed: ${res.status}`);
  return res.text();
}

/** Scrapes every title id referenced by a public IMDb list, following classic `?page=N` pagination up to a hard cap. Returns imdb ids (tt#######) in list order, deduped. */
export async function scrapeImdbListIds(listUrl: string): Promise<string[]> {
  const html = await fetchListPage(listUrl);
  const { ids: jsonLdIds, numberOfItems } = extractFromJsonLd(html);

  let ids: string[];
  if (jsonLdIds.length > 0) {
    ids = jsonLdIds;
  } else {
    const listItemIds = extractFromListItems(html);
    if (listItemIds.length > 0) {
      ids = listItemIds;
    } else {
      console.warn(
        `imdb-list-scrape: no JSON-LD or list-item markup found for ${listUrl}, fell back to raw href scan -- verify results look right.`,
      );
      ids = extractFromHrefs(html).slice(0, MAX_TITLES);
    }
  }

  // Only chase pagination when the JSON-LD strategy told us there's more --
  // that's the only signal here with a real total to aim for, so the two
  // fallback strategies just return whatever's on page 1.
  for (let page = 2; jsonLdIds.length > 0 && numberOfItems && ids.length < numberOfItems; page++) {
    if (page > MAX_PAGES || ids.length >= MAX_TITLES) break;
    const pageUrl = new URL(listUrl);
    pageUrl.searchParams.set("page", String(page));
    let pageHtml: string;
    try {
      pageHtml = await fetchListPage(pageUrl.toString());
    } catch {
      break;
    }
    const { ids: pageIds } = extractFromJsonLd(pageHtml);
    if (pageIds.length === 0) break;
    const before = ids.length;
    ids = dedupeInOrder([...ids, ...pageIds]);
    if (ids.length === before) break; // no new ids -- pagination isn't doing anything, stop
  }

  return dedupeInOrder(ids).slice(0, MAX_TITLES);
}
