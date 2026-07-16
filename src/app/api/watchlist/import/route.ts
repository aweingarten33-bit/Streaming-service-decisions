import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/pipeline/supabase";
import { getDeviceId } from "@/lib/device-server";
import { requireEnv } from "@/lib/pipeline/env";
import { findByImdbId, searchTitle, type TmdbCandidate } from "@/lib/pipeline/tmdb";
import { disambiguateCandidates } from "@/lib/pipeline/disambiguate";
import { upsertTitle } from "@/lib/marquee/upsert-title";
import { parseImdbCsv, type ParsedImportRow } from "@/lib/marquee/imdb-csv";

async function resolveRow(row: ParsedImportRow): Promise<TmdbCandidate | null> {
  if (row.imdbId) {
    const exact = await findByImdbId(row.imdbId).catch(() => null);
    if (exact) return exact;
  }
  if (!row.title) return null;

  const candidates = await searchTitle(row.title, row.typeHint ?? "unknown").catch(() => []);
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
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  try {
    requireEnv("TMDB_API_KEY");
  } catch {
    return NextResponse.json(
      { error: "TMDB isn't configured on the server. Add TMDB_API_KEY and try again." },
      { status: 500 },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const source =
    typeof form?.get("source") === "string" ? (form.get("source") as string) : "imdb_csv";

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing CSV file." }, { status: 400 });
  }

  const csvText = await file.text();
  const rows = parseImdbCsv(csvText);
  if (rows.length === 0) {
    return NextResponse.json({ error: "Couldn't find any rows in that file." }, { status: 400 });
  }

  // Smoke-test a well-known title before churning through the whole file --
  // a bad/expired key should fail loudly here, not silently mark every row
  // as "needs your help" like it's 108 individual matching failures.
  const reachable = await searchTitle("Inception", "movie").catch(() => null);
  if (reachable === null) {
    return NextResponse.json(
      { error: "Couldn't reach TMDB right now. Check TMDB_API_KEY and try again." },
      { status: 502 },
    );
  }

  const supabase = getSupabase();
  const { data: existingRows } = await supabase
    .from("watchlist_items")
    .select("tmdb_id, media_type")
    .eq("device_id", deviceId);
  const existing = new Set((existingRows ?? []).map((r) => `${r.media_type}:${r.tmdb_id}`));

  let imported = 0;
  let duplicates = 0;
  const needHelp: string[] = [];

  for (const row of rows) {
    const match = await resolveRow(row);
    if (!match) {
      needHelp.push(row.title ?? row.imdbId ?? "unknown row");
      await supabase.from("unresolved_imports").insert({
        device_id: deviceId,
        raw_title: row.title,
        raw_year: row.year,
        source,
      });
      continue;
    }

    const key = `${match.mediaType}:${match.tmdbId}`;
    if (existing.has(key)) {
      duplicates++;
      continue;
    }
    existing.add(key);

    await upsertTitle(match.tmdbId, match.mediaType, row.imdbId).catch(() => null);
    const { error } = await supabase
      .from("watchlist_items")
      .upsert(
        { device_id: deviceId, tmdb_id: match.tmdbId, media_type: match.mediaType, source },
        { onConflict: "device_id,tmdb_id,media_type" },
      );
    if (error) {
      needHelp.push(row.title ?? row.imdbId ?? "unknown row");
      continue;
    }
    imported++;
  }

  return NextResponse.json({ imported, duplicates, needHelp, total: rows.length });
}
