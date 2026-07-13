import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/pipeline/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId: string = body.deviceId;
  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId." }, { status: 400 });
  }

  const { error } = await supabase.from("viewer_preferences").upsert(
    {
      device_id: deviceId,
      age_range: body.ageRange ?? null,
      watches_with: body.watchesWith ?? null,
      streaming_services: body.streamingServices ?? [],
      favorite_genres: body.favoriteGenres ?? [],
      avoid_genres: body.avoidGenres ?? [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: "device_id" },
  );

  if (error) {
    return NextResponse.json({ error: "Could not save preferences." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId");
  if (!deviceId) {
    return NextResponse.json({ error: "Missing deviceId." }, { status: 400 });
  }

  const { data } = await supabase
    .from("viewer_preferences")
    .select("*")
    .eq("device_id", deviceId)
    .maybeSingle();

  return NextResponse.json({ preferences: data ?? null });
}
