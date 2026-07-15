import { callClaudeJSON } from "@/lib/pipeline/llm";

export interface DecideIntent {
  mediaType: "movie" | "tv" | "any";
  maxRuntimeMinutes: number | null;
  vibes: string[];
  avoid: string[];
  energy: "low" | "medium" | "high";
  commitment: "tiny" | "normal" | "big";
}

const SYSTEM = `Translate a casual movie/TV mood into structured intent.
Return ONLY JSON:
{
  "mediaType": "movie" | "tv" | "any",
  "maxRuntimeMinutes": number | null,
  "vibes": string[],
  "avoid": string[],
  "energy": "low" | "medium" | "high",
  "commitment": "tiny" | "normal" | "big"
}
Use short lowercase vibe words like cozy, weird, funny, dark, thriller, mind_bending, fast, comfort, low_effort, phone_down, uplifting.
Do not recommend titles. Do not include explanations.`;

const DEFAULT_INTENT: DecideIntent = {
  mediaType: "any",
  maxRuntimeMinutes: null,
  vibes: [],
  avoid: [],
  energy: "medium",
  commitment: "normal",
};

export function localIntent(prompt: string): DecideIntent {
  const text = prompt.toLowerCase();
  const intent: DecideIntent = { ...DEFAULT_INTENT, vibes: [], avoid: [] };

  if (/\b(show|series|episode|tv)\b/.test(text)) intent.mediaType = "tv";
  if (/\b(movie|film)\b/.test(text)) intent.mediaType = "movie";

  const minutes = text.match(/\b(\d{2,3})\s*(?:min|minutes|m)\b/);
  if (minutes) intent.maxRuntimeMinutes = Number(minutes[1]);
  if (/\b(90|ninety)\b/.test(text)) intent.maxRuntimeMinutes = intent.maxRuntimeMinutes ?? 95;
  if (/\b(short|quick|not a whole|commitment|patience)\b/.test(text)) {
    intent.maxRuntimeMinutes = intent.maxRuntimeMinutes ?? 105;
    intent.commitment = "tiny";
  }
  if (/\b(lazy|phone|don't make me think|low effort|tired|couch)\b/.test(text)) {
    intent.energy = "low";
    intent.vibes.push("low_effort", "comfort");
  }
  if (/\b(mind|weird|bizarre|surreal|wtf|strange)\b/.test(text))
    intent.vibes.push("weird", "mind_bending");
  if (/\b(cozy|comfort|warm|nice)\b/.test(text)) intent.vibes.push("cozy", "comfort");
  if (/\b(thriller|dark|tense|scary)\b/.test(text)) intent.vibes.push("dark", "thriller");
  if (/\b(fun|funny|laugh)\b/.test(text)) intent.vibes.push("funny");
  if (/\b(awesome|great|best|win)\b/.test(text)) intent.vibes.push("high_quality");
  if (/\b(phone down|forget my phone|locked in|good immediately)\b/.test(text)) {
    intent.vibes.push("phone_down", "fast");
    intent.energy = "high";
  }
  if (/\b(not depressing|nothing depressing|not bleak|no gore|not punishing)\b/.test(text)) {
    intent.avoid.push("bleak", "gory", "punishing");
  }
  intent.vibes = [...new Set(intent.vibes)];
  intent.avoid = [...new Set(intent.avoid)];
  return intent;
}

export async function parseIntent(prompt: string): Promise<DecideIntent> {
  const fallback = localIntent(prompt);
  try {
    const { data } = await callClaudeJSON<DecideIntent>({
      system: SYSTEM,
      user: prompt,
      model: "claude-haiku-4-5-20251001",
      maxTokens: 240,
    });
    return {
      mediaType: data.mediaType ?? fallback.mediaType,
      maxRuntimeMinutes: data.maxRuntimeMinutes ?? fallback.maxRuntimeMinutes,
      vibes: [...new Set([...(data.vibes ?? []), ...fallback.vibes])],
      avoid: [...new Set([...(data.avoid ?? []), ...fallback.avoid])],
      energy: data.energy ?? fallback.energy,
      commitment: data.commitment ?? fallback.commitment,
    };
  } catch {
    return fallback;
  }
}
