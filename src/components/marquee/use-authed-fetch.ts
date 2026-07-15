"use client";

import { useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

/** Wraps fetch with the current session's access token -- every /api call that needs to know who's asking uses this instead of raw fetch. */
export function useAuthedFetch() {
  return useCallback(async (input: string, init?: RequestInit) => {
    const { data } = await getBrowserSupabase().auth.getSession();
    const token = data.session?.access_token;
    const headers = new Headers(init?.headers);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  }, []);
}
