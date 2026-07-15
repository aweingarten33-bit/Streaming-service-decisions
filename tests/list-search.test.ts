import { describe, expect, test } from "bun:test";
import {
  canonicalizeImdbListUrl,
  isValidImdbListUrl,
} from "@/lib/marquee/list-search/validate-url";
import { searchPublicLists, RateLimitedError } from "@/lib/marquee/list-search/search";
import type {
  PublicListSearchProvider,
  PublicListSearchResult,
} from "@/lib/marquee/list-search/types";

describe("isValidImdbListUrl", () => {
  test("accepts a public IMDb list URL", () => {
    expect(isValidImdbListUrl("https://www.imdb.com/list/ls012345678/")).toBe(true);
    expect(isValidImdbListUrl("https://imdb.com/list/ls012345678")).toBe(true);
  });

  test("accepts a list URL with tracking query params", () => {
    expect(isValidImdbListUrl("https://www.imdb.com/list/ls012345678/?ref_=watchlist")).toBe(true);
  });

  test("rejects IMDb title pages", () => {
    expect(isValidImdbListUrl("https://www.imdb.com/title/tt0111161/")).toBe(false);
  });

  test("rejects IMDb name pages", () => {
    expect(isValidImdbListUrl("https://www.imdb.com/name/nm0000209/")).toBe(false);
  });

  test("rejects IMDb search pages", () => {
    expect(isValidImdbListUrl("https://www.imdb.com/find?q=thrillers")).toBe(false);
  });

  test("rejects unrelated domains", () => {
    expect(isValidImdbListUrl("https://www.notimdb.com/list/ls012345678/")).toBe(false);
    expect(isValidImdbListUrl("https://letterboxd.com/list/ls012345678/")).toBe(false);
  });

  test("rejects malformed URLs", () => {
    expect(isValidImdbListUrl("not a url")).toBe(false);
    expect(isValidImdbListUrl("")).toBe(false);
  });

  test("rejects non-https URLs", () => {
    expect(isValidImdbListUrl("http://www.imdb.com/list/ls012345678/")).toBe(false);
  });
});

describe("canonicalizeImdbListUrl", () => {
  test("strips tracking query params so duplicates collapse", () => {
    const a = canonicalizeImdbListUrl("https://www.imdb.com/list/ls012345678/?ref_=watchlist");
    const b = canonicalizeImdbListUrl("https://imdb.com/list/ls012345678");
    expect(a).toBe(b);
    expect(a).toBe("https://www.imdb.com/list/ls012345678/");
  });
});

function fakeProvider(results: PublicListSearchResult[]): PublicListSearchProvider {
  return { search: async () => results };
}

describe("searchPublicLists", () => {
  test("passes a site:imdb.com/list restricted query to the provider", async () => {
    let seenQuery = "";
    const provider: PublicListSearchProvider = {
      search: async (query) => {
        seenQuery = query;
        return [];
      },
    };
    await searchPublicLists("forgotten 90s thrillers", "user-a", provider);
    expect(seenQuery).toBe("forgotten 90s thrillers site:imdb.com/list");
  });

  test("filters out invalid URLs from the provider's raw results", async () => {
    const provider = fakeProvider([
      { title: "Good List", url: "https://www.imdb.com/list/ls000000001/", provider: "imdb" },
      { title: "Title Page", url: "https://www.imdb.com/title/tt0111161/", provider: "imdb" },
      { title: "Bad", url: "not a url", provider: "imdb" },
    ]);
    const results = await searchPublicLists("test query one", "user-b", provider);
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Good List");
  });

  test("dedupes results that point at the same canonical list", async () => {
    const provider = fakeProvider([
      { title: "A", url: "https://www.imdb.com/list/ls000000002/?ref_=a", provider: "imdb" },
      { title: "A again", url: "https://imdb.com/list/ls000000002", provider: "imdb" },
    ]);
    const results = await searchPublicLists("test query two", "user-c", provider);
    expect(results).toHaveLength(1);
  });

  test("enforces a per-user rate limit", async () => {
    const provider = fakeProvider([]);
    const userId = "rate-limit-user";
    for (let i = 0; i < 20; i++) {
      await searchPublicLists(`unique query ${i}`, userId, provider);
    }
    await expect(searchPublicLists("one more query", userId, provider)).rejects.toBeInstanceOf(
      RateLimitedError,
    );
  });
});
