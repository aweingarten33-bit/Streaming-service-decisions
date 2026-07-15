"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Browser-only client using the public anon key. Handles auth (magic-link
 * sign-in, session persistence in localStorage) so a user's watchlist
 * survives a new device or a reinstall -- never used for data queries
 * directly, those go through our own API routes with the access token.
 */
export function getBrowserSupabase(): SupabaseClient {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set -- add them to use sign-in.",
      );
    }
    client = createClient(url, anonKey);
  }
  return client;
}
