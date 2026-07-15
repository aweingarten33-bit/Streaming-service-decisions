const LIST_PATH_PATTERN = /^\/list\/ls\d+\/?$/i;

/** Accepts only public IMDb list pages (imdb.com/list/ls...). Rejects title/name/search pages, other domains, and malformed URLs. Query strings (tracking/ref params) are ignored here and stripped in canonicalizeImdbListUrl instead. */
export function isValidImdbListUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (!/^(www\.)?imdb\.com$/i.test(url.hostname)) return false;
  return LIST_PATH_PATTERN.test(url.pathname);
}

/** Strips query params/fragments so the same list found twice (with different ref_= tracking params) dedupes to one URL. Assumes isValidImdbListUrl(raw) already passed. */
export function canonicalizeImdbListUrl(raw: string): string {
  const url = new URL(raw);
  const id = url.pathname.match(/ls\d+/i)?.[0] ?? "";
  return `https://www.imdb.com/list/${id}/`;
}
