"use client";

import { useCallback } from "react";
import { getDeviceId } from "@/lib/device-id";

/** Wraps fetch with this browser's device id -- no login, no session, just a header every /api call attaches so the server knows which local watchlist to touch. */
export function useDeviceFetch() {
  return useCallback(async (input: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set("X-Device-Id", getDeviceId());
    return fetch(input, { ...init, headers });
  }, []);
}
