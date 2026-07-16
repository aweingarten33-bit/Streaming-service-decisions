import { AppShell } from "@/components/marquee/app-shell";
import { EntryGate } from "@/components/landing/entry-gate";

export default function Home() {
  return (
    <EntryGate>
      <AppShell />
    </EntryGate>
  );
}
