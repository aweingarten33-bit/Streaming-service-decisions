import Papa from "papaparse";

const IMDB_ID_COLUMN_HINTS = /^(const|imdb.?id)$/i;
const TITLE_COLUMN_HINTS = /^(title|name)$/i;
const YEAR_COLUMN_HINTS = /^year$/i;
const TYPE_COLUMN_HINTS = /^(title.?type|type)$/i;
const IMDB_ID_PATTERN = /^tt\d+$/i;

export interface ParsedImportRow {
  imdbId: string | null;
  title: string | null;
  year: number | null;
  /** Best-effort hint from the CSV's own type column ("movie"/"tvSeries"/etc), used only to help resolution -- never trusted over TMDB's own classification. */
  typeHint: "movie" | "tv" | null;
}

function normalizeTypeHint(raw: string | undefined): "movie" | "tv" | null {
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower.includes("movie") || lower.includes("feature")) return "movie";
  if (lower.includes("tv") || lower.includes("series") || lower.includes("episode")) return "tv";
  return null;
}

/** Pure CSV parser -- works on IMDb's export format (Const/Title/Year/Title Type columns) and degrades gracefully for any other site's export that at least has a title column. */
export function parseImdbCsv(csvText: string): ParsedImportRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  if (data.length === 0) return [];

  const headers = Object.keys(data[0]);
  const imdbIdKey = headers.find((h) => IMDB_ID_COLUMN_HINTS.test(h.trim()));
  const titleKey = headers.find((h) => TITLE_COLUMN_HINTS.test(h.trim()));
  const yearKey = headers.find((h) => YEAR_COLUMN_HINTS.test(h.trim()));
  const typeKey = headers.find((h) => TYPE_COLUMN_HINTS.test(h.trim()));

  return data.map((row) => {
    const imdbIdRaw = imdbIdKey ? row[imdbIdKey]?.trim() : undefined;
    const yearRaw = yearKey ? row[yearKey]?.trim() : undefined;
    return {
      imdbId: imdbIdRaw && IMDB_ID_PATTERN.test(imdbIdRaw) ? imdbIdRaw : null,
      title: titleKey ? (row[titleKey]?.trim() ?? null) : null,
      year: yearRaw && /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null,
      typeHint: normalizeTypeHint(typeKey ? row[typeKey] : undefined),
    };
  });
}
