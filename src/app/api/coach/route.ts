import type { AnalysisReport } from "@/lib/types";

const SYSTEM_PROMPT = `You are the lead advisor behind this report. Your voice fuses two things:
(1) a battle-tested DFS strategist — the kind who has grinded tournaments for years, thinks in
contest selection, bankroll, leverage, and variance, and does not tolerate spew or excuses; and
(2) the analytical rigor of a top management-consulting engagement — evidence first, then implication,
then a prioritized recommendation, every claim tied to a number.

You are given a player's computed statistics as JSON. Every number was calculated in code, not by you.
Never invent numbers. Only reference numbers present in the JSON.
Never recommend specific players or build lineups — you advise capital allocation and process, not picks.
If a bucket is flagged smallSample: true, hedge it explicitly ("small sample, don't overreact").

Your MOST IMPORTANT job: use the "reallocation" object to make the cost of bad allocation concrete.
Do not just say "stop playing X." Say what it cost and where the money should have gone, showing the math.

Tone: direct, financially literate, sharp but constructive.

Return ONLY valid JSON, no markdown fences, no preamble, in exactly this shape:
{"executiveSummary": "2-3 sentences", "narrative": "4-6 short paragraphs, plain text, no markdown headers"}`;

function toMetricsPayload(r: AnalysisReport) {
  return {
    platform: r.platform,
    dateRange: r.dateRange,
    lifetimeEntries: r.lifetimeEntries,
    totalFees: r.totalFees,
    totalWinnings: r.totalWinnings,
    netProfit: r.netProfit,
    roi: r.roi,
    winRate: r.winRate,
    bestSport: r.bestSport,
    worstSport: r.worstSport,
    biggestLeak: r.biggestLeak,
    bestOpportunity: r.bestOpportunity,
    sportBreakdown: r.sportBreakdown,
    contestTypeBreakdown: r.contestTypeBreakdown,
    buyinBreakdown: r.buyinBreakdown,
    entryTypeBreakdown: r.entryTypeBreakdown,
    bankroll: r.bankroll,
    leaks: r.leaks,
    actionPlan: r.actionPlan,
    reallocation: r.reallocation,
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "no_api_key" }, { status: 501 });
  }
  try {
    const report = (await request.json()) as AnalysisReport;
    const metrics = toMetricsPayload(report);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: JSON.stringify(metrics) }],
      }),
    });
    if (!res.ok) {
      return Response.json({ error: "upstream_failed" }, { status: 502 });
    }
    const data = (await res.json()) as {
      content?: { type: string; text: string }[];
    };
    const text = (data.content ?? [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .replace(/```json|```/g, "")
      .trim();
    const parsed = JSON.parse(text);
    if (!parsed.executiveSummary || !parsed.narrative) {
      throw new Error("malformed_response");
    }
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "generation_failed" }, { status: 500 });
  }
}
