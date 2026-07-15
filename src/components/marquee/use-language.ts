"use client";

import { useEffect, useState } from "react";
import type { Language } from "@/lib/marquee/copy";
import { useDeviceFetch } from "./use-device-fetch";

export function useLanguage() {
  const deviceFetch = useDeviceFetch();
  const [language, setLanguageState] = useState<Language>("unfiltered");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    deviceFetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.language === "clean" || data.language === "unfiltered") {
          setLanguageState(data.language);
        }
      })
      .finally(() => setLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setLanguage(next: Language) {
    setLanguageState(next);
    await deviceFetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language: next }),
    });
  }

  return { language, setLanguage, loaded };
}
