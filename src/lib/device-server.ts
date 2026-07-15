import type { NextRequest } from "next/server";

/** Reads the client-generated device id from a request header. Not a security boundary -- there's no login, so this is just the key that scopes a watchlist to a browser. */
export function getDeviceId(req: NextRequest): string | null {
  const id = req.headers.get("x-device-id");
  return id && id.trim() ? id.trim() : null;
}
