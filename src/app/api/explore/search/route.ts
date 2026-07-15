import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDeviceId } from "@/lib/device-server";
import { RateLimitedError, searchPublicLists } from "@/lib/marquee/list-search/search";

const bodySchema = z.object({ query: z.string().trim().min(1).max(80) });

export async function POST(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Give me something to search for." }, { status: 400 });
  }

  try {
    const results = await searchPublicLists(parsed.data.query, deviceId);
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
