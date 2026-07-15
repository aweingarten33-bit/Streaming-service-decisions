export type PublicListSearchResult = {
  title: string;
  description?: string;
  url: string;
  provider: "imdb";
};

/** Kept provider-neutral so the underlying search backend (Google today) can be swapped without touching callers. */
export interface PublicListSearchProvider {
  search(query: string): Promise<PublicListSearchResult[]>;
}
