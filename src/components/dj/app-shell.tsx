"use client";

import { useEffect, useState } from "react";
import { Onboarding } from "./onboarding";
import { WatchDj } from "./watch-dj";

export function AppShell({ backdrops }: { backdrops: string[] }) {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    setOnboarded(localStorage.getItem("watchdj_onboarded") === "true");
  }, []);

  if (onboarded === null) return <div className="min-h-screen bg-[#08080c]" />;
  if (!onboarded) return <Onboarding onDone={() => setOnboarded(true)} />;
  return <WatchDj backdrops={backdrops} />;
}
