export interface ExploreCategory {
  label: string;
  query: string;
}

/** One-tap curated searches -- the user never has to type "site:imdb.com/list" themselves. */
export const EXPLORE_CATEGORIES: ExploreCategory[] = [
  { label: "Horror Lists", query: "great horror movies" },
  { label: "Thriller Lists", query: "forgotten thrillers" },
  { label: "Documentary Lists", query: "documentaries" },
  { label: "Hidden Gems", query: "hidden gems nobody talks about" },
  { label: "Under Two Hours", query: "best movies under 100 minutes" },
  { label: "Weird but Good", query: "weird movies that are actually good" },
  { label: "One-Season Shows", query: "one-season television shows" },
  { label: "'90s Movies", query: "1990s action movies" },
];
