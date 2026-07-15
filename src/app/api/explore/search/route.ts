import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserFromRequest } from "@/lib/auth-server";
import { RateLimitedError, searchPublicLists } from "@/lib/marquee/list-search/search";

const bodySchema = z.object({ query: z.string().trim().min(1).max(80) });

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Give me something to search for." }, { status: 400 });
  }

  try {
    const results = await searchPublicLists(parsed.data.query, user.id);
    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof RateLimitedError) {
      return NextResponse.json({ error: err.message }, { status: 429 });
    }
    return NextResponse.json(
      { error: "The internet is being useless. Try that again." },
      { status: 502 },
    );
  }
}
