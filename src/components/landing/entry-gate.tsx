"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

// Module-level, not storage-backed: resets on every real page load/reload
// (new JS execution), but survives the client-side navigation back from
// /welcome after clicking "Enter" -- so the splash reappears on every
// reload without bouncing the user right back to it the moment they enter.
let redirectedThisLoad = false;

export function EntryGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (redirectedThisLoad) {
      setReady(true);
      return;
    }
    redirectedThisLoad = true;
    router.replace("/welcome");
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
