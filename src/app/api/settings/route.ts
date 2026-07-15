import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/pipeline/supabase";
import { getUserFromRequest } from "@/lib/auth-server";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { data } = await getSupabase()
    .from("user_settings")
    .select("language")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ language: data?.language ?? "unfiltered" });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const language = body.language === "clean" ? "clean" : "unfiltered";

  const { error } = await getSupabase()
    .from("user_settings")
    .upsert(
      { user_id: user.id, language, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );

  if (error) return NextResponse.json({ error: "Could not save settings." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
