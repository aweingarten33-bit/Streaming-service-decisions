import { z } from "zod";
import { callClaudeJSON } from "@/lib/pipeline/llm";

export const intentSchema = z.object({
  mediaType: z.enum(["movie", "tv", "any"]),
  maxRuntimeMinutes: z.number().int().positive().nullable(),
  attentionLevel: z.enum(["low", "medium", "high"]),
  hookSpeed: z.enum(["fast", "medium", "slow"]),
  pace: z.enum(["slow", "slow_or_medium", "medium", "medium_or_fast", "fast"]),
  emotionalWeight: z.enum(["light", "light_or_medium", "medium", "heavy"]),
  moods: z.array(z.string()),
  avoidMoods: z.array(z.string()),
  backgroundFriendly: z.boolean(),
});

export type DecideIntent = z.infer<typeof intentSchema>;

const DEFAULT_INTENT: DecideIntent = {
  mediaType: "any",
  maxRuntimeMinutes: null,
  attentionLevel: "medium",
  hookSpeed: "medium",
  pace: "medium",
  emotionalWeight: "light_or_medium",
  moods: [],
  avoidMoods: [],
  backgroundFriendly: false,
};

const SYSTEM_PROMPT = `Translate a casual, possibly messy or profane movie/TV mood request into structured intent. Do not correct the user's grammar or tone in your understanding of it -- just extract what they mean.

Return ONLY JSON matching exactly:
{
  "mediaType": "movie" | "tv" | "any",
  "maxRuntimeMinutes": number or null,
  "attentionLevel": "low" | "medium" | "high",
  "hookSpeed": "fast" | "medium" | "slow",
  "pace": "slow" | "slow_or_medium" | "medium" | "medium_or_fast" | "fast",
  "emotionalWeight": "light" | "light_or_medium" | "medium" | "heavy",
  "moods": string[] (short lowercase words: cozy, weird, funny, dark, thriller, mind_bending, comfort, uplifting, entertaining, tense, romantic, nostalgic),
  "avoidMoods": string[] (things they explicitly don't want: depressing, gory, slow, boring, sad, scary),
  "backgroundFriendly": boolean (true if they said something like "probably on my phone" -- they want something that survives being half-watched)
}

Do not pick a title. Do not explain. Only return the JSON.`;

/** Fast, free, always-available fallback -- also merged into the AI's parse so a rate limit or missing API key never breaks intent parsing entirely. */
export function localIntent(prompt: string): DecideIntent {
  const text = prompt.toLowerCase();
  const intent: DecideIntent = { ...DEFAULT_INTENT, moods: [], avoidMoods: [] };

  if (/\b(show|series|episode|season|tv)\b/.test(text)) intent.mediaType = "tv";
  if (/\b(movie|film)\b/.test(text)) intent.mediaType = "movie";

  const minutes = text.match(/\b(\d{2,3})\s*(?:min|minutes|m)\b/);
  if (minutes) intent.maxRuntimeMinutes = Number(minutes[1]);
  if (/\b(90|ninety)\b/.test(text) && !intent.maxRuntimeMinutes) intent.maxRuntimeMinutes = 95;

  if (/\b(lazy|tired|couch|don'?t make me think|low effort)\b/.test(text)) {
    intent.attentionLevel = "low";
    intent.moods.push("comfort", "low_effort");
  }
  if (/\b(phone|distracted|probably.*phone|checking my phone)\b/.test(text)) {
    intent.backgroundFriendly = true;
  }
  if (/\b(forget my phone|phone down|locked in|gets good immediately|hook)\b/.test(text)) {
    intent.hookSpeed = "fast";
    intent.backgroundFriendly = false;
  }
  if (
    /\b(lose interest|short attention|attention span|not committing|whole life|seven.season)\b/.test(
      text,
    )
  ) {
    intent.attentionLevel = "low";
    intent.hookSpeed = "fast";
  }
  if (/\b(weird|bizarre|surreal|mind.?bending|wtf|strange)\b/.test(text))
    intent.moods.push("weird", "mind_bending");
  if (/\b(cozy|comfort|warm)\b/.test(text)) intent.moods.push("cozy", "comfort");
  if (/\b(dark|tense|thriller|scary)\b/.test(text)) intent.moods.push("dark", "thriller");
  if (/\b(funny|laugh|comedy)\b/.test(text)) intent.moods.push("funny");
  if (/\b(awesome|great|best)\b/.test(text)) intent.moods.push("entertaining");

  if (/\b(not stupid|not dumb)\b/.test(text)) intent.avoidMoods.push("dumb");
  if (/\b(not depressing|nothing depressing|not bleak|not sad|not a downer)\b/.test(text)) {
    intent.avoidMoods.push("depressing", "bleak");
    intent.emotionalWeight = "light_or_medium";
  }
  if (/\b(no gore|not gory)\b/.test(text)) intent.avoidMoods.push("gory");
  if (/\b(not boring|not slow)\b/.test(text)) intent.avoidMoods.push("boring", "slow");

  intent.moods = [...new Set(intent.moods)];
  intent.avoidMoods = [...new Set(intent.avoidMoods)];
  return intent;
}

/** Single small-model call (Haiku), Zod-validated, merged with the deterministic local parse so a bad/missing response degrades gracefully instead of failing the whole request. */
export async function parseIntent(prompt: string): Promise<DecideIntent> {
  const fallback = localIntent(prompt);
  try {
    const { data } = await callClaudeJSON<unknown>({
      system: SYSTEM_PROMPT,
      user: prompt,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 300,
    });
    const parsed = intentSchema.safeParse(data);
    if (!parsed.success) return fallback;
    return {
      mediaType: parsed.data.mediaType,
      maxRuntimeMinutes: parsed.data.maxRuntimeMinutes ?? fallback.maxRuntimeMinutes,
      attentionLevel: parsed.data.attentionLevel,
      hookSpeed: parsed.data.hookSpeed,
      pace: parsed.data.pace,
      emotionalWeight: parsed.data.emotionalWeight,
      moods: [...new Set([...parsed.data.moods, ...fallback.moods])],
      avoidMoods: [...new Set([...parsed.data.avoidMoods, ...fallback.avoidMoods])],
      backgroundFriendly: parsed.data.backgroundFriendly || fallback.backgroundFriendly,
    };
  } catch {
    return fallback;
  }
}
