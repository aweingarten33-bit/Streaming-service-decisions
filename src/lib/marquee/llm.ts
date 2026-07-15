import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";

// SDK retries network errors and 429/5xx internally with backoff.
const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 5 });

export interface LlmJsonResult<T> {
  data: T;
  inputTokens: number;
  outputTokens: number;
}

function stripFences(text: string): string {
  return text.replace(/```json|```/g, "").trim();
}

/**
 * Calls Claude and parses the response as JSON. Retries once with a corrective
 * instruction if the model returns non-JSON — a distinct failure mode from the
 * transport-level retries the SDK already handles.
 */
export async function callClaudeJSON<T>(opts: {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
}): Promise<LlmJsonResult<T>> {
  const model = opts.model ?? "claude-sonnet-4-6";
  const maxTokens = opts.maxTokens ?? 2000;
  let user = opts.user;
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: opts.system,
      messages: [{ role: "user", content: user }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    try {
      const data = JSON.parse(stripFences(text)) as T;
      return {
        data,
        inputTokens: res.usage.input_tokens,
        outputTokens: res.usage.output_tokens,
      };
    } catch (err) {
      lastError = err;
      user = `${opts.user}\n\nYour previous response was not valid JSON. Return ONLY the raw JSON, no prose, no markdown fences.`;
    }
  }
  throw new Error(`LLM did not return valid JSON after retries: ${String(lastError)}`);
}
