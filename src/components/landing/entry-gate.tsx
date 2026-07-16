"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/** Every load of "/" goes through the WebGL /welcome intro first -- it
 * redirects immediately, so `children` never actually renders here. */
export function EntryGate({ children: _children }: { children: ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    router.replace("/welcome");
  }, [router]);

  return null;
}
