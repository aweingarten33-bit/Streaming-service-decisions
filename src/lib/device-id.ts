const KEY = "watchdj_device_id";

/** Anonymous, client-only identifier — no accounts, no auth. Persists in localStorage. */
export function getDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
