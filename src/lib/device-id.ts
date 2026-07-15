const STORAGE_KEY = "marquee_device_id";

/** No accounts, no signup -- a random id stored in this browser is the only thing that scopes a watchlist to "you". */
export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
