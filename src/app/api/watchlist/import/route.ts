import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { supabase } from "@/lib/pipeline/supabase";
import { findByImdbId, searchTitle, type TmdbCandidate } from "@/lib/pipeline/tmdb";
import { disambiguateCandidates } from "@/lib/pipeline/disambiguate";

const IMDB_ID_COLUMN_HINTS = /^(const|imdb.?id)$/i;
const TITLE_COLUMN_HINTS = /^(title|name)$/i;
const YEAR_COLUMN_HINTS = /^year$/i;
const IMDB_ID_PATTERN = /^tt\d+$/i;

interface ParsedRow {
  imdbId: string | null;
  title: string | null;
  year: number | null;
}

function parseRows(csvText: string): ParsedRow[] {
  const { data } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });
  if (data.length === 0) return [];

  const headers = Object.keys(data[0]);
  const imdbIdKey = headers.find((h) => IMDB_ID_COLUMN_HINTS.test(h.trim()));
  const titleKey = headers.find((h) => TITLE_COLUMN_HINTS.test(h.trim()));
  const yearKey = headers.find((h) => YEAR_COLUMN_HINTS.test(h.trim()));

  return data.map((row) => {
    const imdbIdRaw = imdbIdKey ? row[imdbIdKey]?.trim() : undefined;
    const yearRaw = yearKey ? row[yearKey]?.trim() : undefined;
    return {
      imdbId: imdbIdRaw && IMDB_ID_PATTERN.test(imdbIdRaw) ? imdbIdRaw : null,
      title: titleKey ? (row[titleKey]?.trim() ?? null) : null,
      year: yearRaw && /^\d{4}$/.test(yearRaw) ? Number(yearRaw) : null,
    };
  });
}

async function resolveRow(row: ParsedRow): Promise<TmdbCandidate | null> {
  if (row.imdbId) {
    const exact = await findByImdbId(row.imdbId).catch(() => null);
    if (exact) return exact;
  }

  if (!row.title) return null;

  const candidates = await searchTitle(row.title, "unknown").catch(() => []);
  if (candidates.length === 0) return null;

  const yearFiltered = row.year
    ? candidates.filter((c) => c.year !== null && Math.abs(c.year - row.year!) <= 1)
    : candidates;

  if (candidates.length === 1) return candidates[0];
  if (yearFiltered.length === 1) return yearFiltered[0];

  const shortlistPool = yearFiltered.length > 0 ? yearFiltered : candidates;
  const contextClues = `Imported from a watchlist CSV. Title as listed: "${row.title}"${row.year ? `, year: ${row.year}` : ""}.`;
  const chosenId = await disambiguateCandidates(shortlistPool, contextClues).catch(() => null);
  if (chosenId === null) return null;
  return shortlistPool.find((c) => c.tmdbId === chosenId) ?? null;
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const deviceId = form?.get("deviceId");
  const file = form?.get("file");

  if (typeof deviceId !== "string" || !deviceId) {
    return NextResponse.json({ error: "Missing deviceId." }, { status: 400 });
  }
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing CSV file." }, { status: 400 });
  }

  const csvText = await file.text();
  const rows = parseRows(csvText);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Couldn't find any rows in that file." }, { status: 400 });
  }

  let imported = 0;
  const failed: string[] = [];

  for (const row of rows) {
    const match = await resolveRow(row);
    if (!match) {
      failed.push(row.title ?? row.imdbId ?? "unknown row");
      continue;
    }
    const { error } = await supabase
      .from("watchlist")
      .upsert(
        { device_id: deviceId, tmdb_id: match.tmdbId, media_type: match.mediaType },
        { onConflict: "device_id,tmdb_id,media_type" },
      );
    if (error) {
      failed.push(row.title ?? row.imdbId ?? "unknown row");
      continue;
    }
    imported++;
  }

  return NextResponse.json({ imported, total: rows.length, failed });
}
