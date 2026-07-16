import { callClaudeJSON } from "@/lib/pipeline/llm";
import type { DecideIntent } from "./intent";
import type { WatchlistCandidate } from "./types";
import { explainChoice as explainChoiceFallback } from "./scoring";

const SYSTEM_PROMPT = `You write one short, specific sentence explaining why a single movie/TV pick fits what someone asked for. Ground every claim in the facts you're given -- never invent plot details, quality, or vibes you weren't told. Blunt, funny, conversational, a little sarcastic. Never generic AI copy ("this captivating masterpiece", "an unforgettable journey", "a rollercoaster of emotions"). Max ~30 words.

Return ONLY JSON: {"explanation": "..."}`;

/** AI-written, fact-grounded explanation for the one title chosen -- the picking itself stays fully deterministic (scoring.ts); this only narrates why the deterministic winner fits. Falls back to the canned template if the call fails or no API key is set. */
export async function explainChoiceAI(
  intent: DecideIntent,
  item: WatchlistCandidate,
  originalPrompt: string,
  tasteSourceCount = 0,
): Promise<string> {
  const facts = [
    `Title: ${item.title}${item.year ? ` (${item.year})` : ""}`,
    `Type: ${item.mediaType}`,
    item.runtime ? `Runtime: ${item.runtime} minutes` : null,
    item.genres.length > 0 ? `Genres: ${item.genres.join(", ")}` : null,
    item.tmdbRating ? `Rating: ${item.tmdbRating}/10` : null,
    tasteSourceCount > 0 ? "Also lines up with the user's saved IMDb list taste sources." : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { data } = await callClaudeJSON<{ explanation: unknown }>({
      system: SYSTEM_PROMPT,
      user: `User asked for: "${originalPrompt}"\n\n${facts}`,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 120,
    });
    if (typeof data.explanation === "string" && data.explanation.trim()) {
      return data.explanation.trim();
    }
  } catch {
    // fall through to the deterministic template
  }
  return explainChoiceFallback(intent, item, tasteSourceCount);
}
