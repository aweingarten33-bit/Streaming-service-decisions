"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const SEEN_KEY = "marquee-seen-welcome";

/** First-ever visit to the app goes through the WebGL /welcome intro once; every visit after that (the flag persists in localStorage) lands straight on the app, same as before this existed. */
export function EntryGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY)) {
      setReady(true);
    } else {
      router.replace("/welcome");
    }
  }, [router]);

  if (!ready) return null;
  return <>{children}</>;
}
