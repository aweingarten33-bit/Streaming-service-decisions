import type { AnalysisReport } from "@/lib/types";

const SYSTEM_PROMPT = `You are a blunt, world-class DFS advisor. A player is about to make a
decision. You have (a) a short plain-English description of the play they are considering, and
(b) their computed lifetime DFS metrics as JSON. Every number in the JSON was calculated in code —
never invent numbers, only cite ones present in the JSON.

Judge the proposed play against THEIR history, not generic DFS wisdom. If a relevant bucket has
smallSample: true, say so and hedge. If the play targets a segment their history shows is
edge-positive, say so plainly. If it targets a segment that has been bleeding them money, say that
in dollars using their own numbers.

Never recommend specific players or lineups. You advise capital allocation, contest selection,
bankroll, and behavior — not picks.

Return ONLY valid JSON, no markdown fences, in exactly this shape:
{
  "verdict": "GREEN" | "YELLOW" | "RED",
  "headline": "one blunt sentence, <120 chars",
  "reasoning": ["2-4 short bullets, each 1-2 sentences, citing numbers from the JSON"],
  "fitScore": 0-100,
  "counterProposal": "one sentence with a smarter version of the same play, or empty string if the play is already good"
}`;

function toMetricsPayload(r: AnalysisReport) {
  return {
    platform: r.platform,
    dateRange: r.dateRange,
    lifetimeEntries: r.lifetimeEntries,
    totalFees: r.totalFees,
    netProfit: r.netProfit,
    roi: r.roi,
    winRate: r.winRate,
    bestSport: r.bestSport,
    worstSport: r.worstSport,
    bestOpportunity: r.bestOpportunity,
    sportBreakdown: r.sportBreakdown,
    contestTypeBreakdown: r.contestTypeBreakdown,
    buyinBreakdown: r.buyinBreakdown,
    entryTypeBreakdown: r.entryTypeBreakdown,
    bankroll: r.bankroll,
    leaks: r.leaks.slice(0, 5),
    reallocation: r.reallocation,
  };
}

type ValidatorResponse = {
  verdict: "GREEN" | "YELLOW" | "RED";
  headline: string;
  reasoning: string[];
  fitScore: number;
  counterProposal: string;
};

export async function POST(request: Request) {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "no_api_key" }, { status: 501 });
  }
  try {
    const { proposedPlay, report } = (await request.json()) as {
      proposedPlay: string;
      report: AnalysisReport;
    };
    if (!proposedPlay || !report) {
      return Response.json({ error: "bad_input" }, { status: 400 });
    }
    const metrics = toMetricsPayload(report);
    const userMsg = `PROPOSED PLAY:\n${proposedPlay}\n\nPLAYER METRICS (JSON):\n${JSON.stringify(metrics)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      if (res.status === 429) {
        return Response.json({ error: "rate_limited" }, { status: 429 });
      }
      if (res.status === 402) {
        return Response.json({ error: "credits_exhausted" }, { status: 402 });
      }
      return Response.json({ error: "upstream_failed" }, { status: 502 });
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = (data.choices?.[0]?.message?.content ?? "")
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(text) as ValidatorResponse;
    if (
      !parsed.verdict ||
      !parsed.headline ||
      !Array.isArray(parsed.reasoning) ||
      typeof parsed.fitScore !== "number"
    ) {
      throw new Error("malformed_response");
    }
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "generation_failed" }, { status: 500 });
  }
}
