import { requireEnv } from "@/lib/pipeline/env";
import type { PublicListSearchProvider, PublicListSearchResult } from "./types";

interface GoogleCseItem {
  title?: string;
  snippet?: string;
  link?: string;
}

interface GoogleCseResponse {
  items?: GoogleCseItem[];
}

/** Google Custom Search JSON API -- the only search backend this feature is wired to today. Swappable via PublicListSearchProvider. */
export class GoogleCseProvider implements PublicListSearchProvider {
  async search(query: string): Promise<PublicListSearchResult[]> {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", requireEnv("GOOGLE_CSE_API_KEY"));
    url.searchParams.set("cx", requireEnv("GOOGLE_CSE_CX"));
    url.searchParams.set("q", query);
    url.searchParams.set("safe", "active");
    url.searchParams.set("num", "10");

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Google CSE ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as GoogleCseResponse;

    return (data.items ?? [])
      .filter((item): item is Required<Pick<GoogleCseItem, "title" | "link">> & GoogleCseItem =>
        Boolean(item.title && item.link),
      )
      .map((item) => ({
        title: item.title,
        description: item.snippet,
        url: item.link,
        provider: "imdb" as const,
      }));
  }
}
