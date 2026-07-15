import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/pipeline/supabase";
import { getUserFromRequest } from "@/lib/auth-server";
import {
  canonicalizeImdbListUrl,
  isValidImdbListUrl,
} from "@/lib/marquee/list-search/validate-url";

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const { data, error } = await getSupabase()
    .from("saved_lists")
    .select("id, url, title, description, note, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: "Could not load your saved lists." }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const url: string | undefined = body.url;
  const title: string | undefined = body.title;
  const description: string | undefined = body.description;
  const note: string | undefined = body.note;

  if (!url || !isValidImdbListUrl(url) || !title) {
    return NextResponse.json(
      { error: "That doesn't look like a public IMDb list." },
      { status: 400 },
    );
  }

  const { error } = await getSupabase()
    .from("saved_lists")
    .upsert(
      { user_id: user.id, url: canonicalizeImdbListUrl(url), title, description, note },
      { onConflict: "user_id,url" },
    );

  if (error) return NextResponse.json({ error: "Could not save that list." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id: string | undefined = body.id;
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const { error } = await getSupabase()
    .from("saved_lists")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Could not remove that list." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
