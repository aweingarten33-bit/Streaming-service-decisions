import { getDetails } from "./tmdb";
import type { TmdbCandidate } from "./tmdb";
import { callClaudeJSON } from "./llm";

const MAX_DISAMBIGUATION_CANDIDATES = 5;

const DISAMBIGUATION_SYSTEM_PROMPT = `You disambiguate a movie/TV title against a shortlist of database candidates.
Return ONLY JSON: {"chosen_index": number or null} — the 0-based index of the candidate that clearly matches, or null if none confidently match. Do not guess if it's ambiguous; return null.`;

/** Uses Claude to pick the correct candidate from an ambiguous TMDB search shortlist. Returns the chosen tmdbId, or null if nothing confidently matches. */
export async function disambiguateCandidates(
  candidates: TmdbCandidate[],
  contextClues: string,
): Promise<number | null> {
  const shortlist = candidates.slice(0, MAX_DISAMBIGUATION_CANDIDATES);
  const detailed = await Promise.all(shortlist.map((c) => getDetails(c.tmdbId, c.mediaType)));
  const user = `CONTEXT CLUES: ${contextClues}\n\nCANDIDATES:\n${detailed
    .map(
      (d, i) =>
        `${i}. "${d.title}" (${d.year ?? "unknown year"}, ${d.mediaType}) — director/creator: ${d.director ?? "unknown"} — ${d.overview.slice(0, 200)}`,
    )
    .join("\n")}`;

  const { data } = await callClaudeJSON<{ chosen_index: number | null }>({
    system: DISAMBIGUATION_SYSTEM_PROMPT,
    user,
    model: "claude-haiku-4-5-20251001",
    maxTokens: 100,
  });
  if (data.chosen_index === null || data.chosen_index === undefined) return null;
  if (data.chosen_index < 0 || data.chosen_index >= shortlist.length) return null;
  return shortlist[data.chosen_index].tmdbId;
}
