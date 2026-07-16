import { callClaudeJSON } from "@/lib/pipeline/llm";
import { fallbackTeaser, type Language } from "./copy";

const SYSTEM_PROMPT = `You write one short, punchy line for the home screen of a movie-picking app. It should riff on the size of the user's watchlist -- not their taste, not specific titles, just the number. Blunt, funny, a little sarcastic, conversational. Never generic AI copy or motivational-poster energy. Max ~14 words.

Return ONLY JSON: {"line": "..."}`;

/** Fresh, AI-written line under the Home headline -- pure flavor, never used for picking. Falls back to a deterministic template when there's no API key or the call fails. */
export async function generateHomeTeaser(
  activeCount: number,
  watchedCount: number,
  language: Language,
): Promise<string> {
  try {
    const { data } = await callClaudeJSON<{ line: unknown }>({
      system: SYSTEM_PROMPT,
      user: `Active (unwatched) titles: ${activeCount}. Already marked watched: ${watchedCount}. Language mode: ${language === "clean" ? "no profanity" : "profanity okay, don't overdo it"}.`,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 60,
    });
    if (typeof data.line === "string" && data.line.trim()) {
      return data.line.trim();
    }
  } catch {
    // fall through to the deterministic template
  }
  return fallbackTeaser(activeCount, language);
}
