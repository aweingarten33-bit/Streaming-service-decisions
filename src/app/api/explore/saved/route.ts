import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/pipeline/supabase";
import { getDeviceId } from "@/lib/device-server";
import {
  canonicalizeImdbListUrl,
  isValidImdbListUrl,
} from "@/lib/marquee/list-search/validate-url";

export async function GET(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const { data, error } = await getSupabase()
    .from("saved_lists")
    .select("id, url, title, description, note, created_at")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false });

  if (error)
    return NextResponse.json({ error: "Could not load your saved lists." }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

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
      { device_id: deviceId, url: canonicalizeImdbListUrl(url), title, description, note },
      { onConflict: "device_id,url" },
    );

  if (error) return NextResponse.json({ error: "Could not save that list." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const deviceId = getDeviceId(req);
  if (!deviceId) return NextResponse.json({ error: "Missing device id." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const id: string | undefined = body.id;
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  const { error } = await getSupabase()
    .from("saved_lists")
    .delete()
    .eq("device_id", deviceId)
    .eq("id", id);

  if (error) return NextResponse.json({ error: "Could not remove that list." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
