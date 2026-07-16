import { afterEach, describe, expect, test } from "bun:test";
import {
  extractFromHrefs,
  extractFromJsonLd,
  extractFromListItems,
  scrapeImdbListIds,
} from "@/lib/pipeline/imdb-list-scrape";

function listItemHtml(ids: string[]): string {
  return ids
    .map(
      (id) =>
        `<li class="ipc-metadata-list-summary-item foo-bar"><a href="/title/${id}/">Title</a></li>`,
    )
    .join("\n");
}

function itemListHtml(ids: string[], numberOfItems: number): string {
  const itemListElement = ids.map((id, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `https://www.imdb.com/title/${id}/`,
  }));
  return `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems,
    itemListElement,
  })}</script>`;
}

const originalFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("extractFromJsonLd", () => {
  test("pulls tconsts out of an ItemList block, in order, and reports numberOfItems", () => {
    const html = `
      <html><head>
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "numberOfItems": 3,
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "url": "https://www.imdb.com/title/tt0111161/" },
          { "@type": "ListItem", "position": 2, "item": { "url": "https://www.imdb.com/title/tt0068646/" } },
          { "@type": "ListItem", "position": 3, "url": "https://www.imdb.com/title/tt0071562/" }
        ]
      }
      </script>
      </head><body></body></html>
    `;
    const { ids, numberOfItems } = extractFromJsonLd(html);
    expect(ids).toEqual(["tt0111161", "tt0068646", "tt0071562"]);
    expect(numberOfItems).toBe(3);
  });

  test("ignores non-ItemList JSON-LD blocks and malformed JSON without throwing", () => {
    const html = `
      <script type="application/ld+json">{"@type": "Person", "name": "not a list"}</script>
      <script type="application/ld+json">{ this is not valid json </script>
    `;
    const { ids, numberOfItems } = extractFromJsonLd(html);
    expect(ids).toEqual([]);
    expect(numberOfItems).toBeNull();
  });

  test("returns an empty result when there's no JSON-LD at all", () => {
    const { ids, numberOfItems } = extractFromJsonLd("<html><body>plain page</body></html>");
    expect(ids).toEqual([]);
    expect(numberOfItems).toBeNull();
  });
});

describe("extractFromListItems", () => {
  test("pulls one id per list-item container, ignoring links outside any item", () => {
    const html = `
      <a href="/title/tt9999999/">unrelated recommendation widget above the list</a>
      ${listItemHtml(["tt0111161", "tt0068646"])}
    `;
    expect(extractFromListItems(html)).toEqual(["tt0111161", "tt0068646"]);
  });

  test("returns an empty array when no list-item containers are present", () => {
    expect(extractFromListItems("<html><body>nothing here</body></html>")).toEqual([]);
  });
});

describe("extractFromHrefs", () => {
  test("finds every title href on the page, in document order, including duplicates", () => {
    const html = `
      <a href="/title/tt0111161/">The Shawshank Redemption</a>
      <a href="/title/tt0068646/?ref_=ttls">The Godfather</a>
      <a href="/title/tt0111161/mediaviewer">poster link, same title again</a>
    `;
    expect(extractFromHrefs(html)).toEqual(["tt0111161", "tt0068646", "tt0111161"]);
  });

  test("returns an empty array when no title links are present", () => {
    expect(extractFromHrefs("<html><body>nothing here</body></html>")).toEqual([]);
  });
});

describe("scrapeImdbListIds", () => {
  test("follows pagination while numberOfItems says there's more, and stops once satisfied", async () => {
    let calls = 0;
    globalThis.fetch = (async (url: string | URL) => {
      calls++;
      const page = new URL(url.toString()).searchParams.get("page") ?? "1";
      const html =
        page === "1"
          ? itemListHtml(["tt0000001", "tt0000002"], 4)
          : itemListHtml(["tt0000001", "tt0000002", "tt0000003", "tt0000004"], 4);
      return new Response(html, { status: 200 });
    }) as unknown as typeof fetch;

    const ids = await scrapeImdbListIds("https://www.imdb.com/list/ls123/");
    expect(ids).toEqual(["tt0000001", "tt0000002", "tt0000003", "tt0000004"]);
    expect(calls).toBe(2);
  });

  test("stops pagination immediately if a later page adds nothing new, instead of looping forever", async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls++;
      // Every page claims 100 items but only ever returns the same 2 -- a
      // real-world case of numberOfItems being stale/wrong. Must not hang.
      return new Response(itemListHtml(["tt0000001", "tt0000002"], 100), { status: 200 });
    }) as unknown as typeof fetch;

    const ids = await scrapeImdbListIds("https://www.imdb.com/list/ls123/");
    expect(ids).toEqual(["tt0000001", "tt0000002"]);
    expect(calls).toBe(2); // page 1, then one repeat page that adds nothing new, then stop
  });

  test("falls back to list-item scoped extraction when there's no JSON-LD but list markup exists", async () => {
    globalThis.fetch = (async () =>
      new Response(listItemHtml(["tt0111161", "tt0068646"]), {
        status: 200,
      })) as unknown as typeof fetch;

    const ids = await scrapeImdbListIds("https://www.imdb.com/list/ls123/");
    expect(ids).toEqual(["tt0111161", "tt0068646"]);
  });

  test("falls back to a raw href scan when neither JSON-LD nor list-item markup is present", async () => {
    globalThis.fetch = (async () =>
      new Response(`<a href="/title/tt0111161/">A</a><a href="/title/tt0068646/">B</a>`, {
        status: 200,
      })) as unknown as typeof fetch;

    const ids = await scrapeImdbListIds("https://www.imdb.com/list/ls123/");
    expect(ids).toEqual(["tt0111161", "tt0068646"]);
  });
});
