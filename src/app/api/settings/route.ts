import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/pipeline/supabase";
import { getDeviceId } from "@/lib/device-server";

export async function GET(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const { data, error } = await getSupabase()
    .from("user_settings")
    .select("language")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Could not load settings." }, { status: 500 });
  return NextResponse.json({ language: data?.language ?? "unfiltered" });
}

export async function POST(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const language = body.language === "clean" ? "clean" : "unfiltered";

  const { error } = await getSupabase()
    .from("user_settings")
    .upsert(
      { device_id: deviceId, language, updated_at: new Date().toISOString() },
      { onConflict: "device_id" },
    );

  if (error) return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
