import type { NextRequest } from "next/server";
import { getSupabase } from "./pipeline/supabase";

export interface AuthedUser {
  id: string;
  email: string | null;
}

/** Verifies the bearer access token from a request and returns the real, server-confirmed user. Never trusts a client-supplied user id. */
export async function getUserFromRequest(req: NextRequest): Promise<AuthedUser | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const { data, error } = await getSupabase().auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
}
