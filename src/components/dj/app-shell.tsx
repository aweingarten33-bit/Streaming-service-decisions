import { WatchDj } from "./watch-dj";

export function AppShell({ backdrops }: { backdrops: string[] }) {
  return <WatchDj backdrops={backdrops} />;
}
