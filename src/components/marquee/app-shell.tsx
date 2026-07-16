"use client";

import { useEffect, useState } from "react";
import { useDeviceFetch } from "./use-device-fetch";
import { useLanguage } from "./use-language";
import { Onboarding } from "./onboarding";
import { Home } from "./home";
import { WatchlistScreen } from "./watchlist-screen";
import { ExploreScreen } from "./explore-screen";
import { SettingsScreen } from "./settings-screen";
import { NavMenu, type Tab } from "./nav-menu";

export function AppShell() {
  const deviceFetch = useDeviceFetch();
  const { language, setLanguage } = useLanguage();
  const [hasWatchlist, setHasWatchlist] = useState<boolean | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [tab, setTab] = useState<Tab>("home");

  useEffect(() => {
    deviceFetch("/api/watchlist")
      .then((res) => res.json())
      .then((data) => setHasWatchlist((data.items ?? []).length > 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (hasWatchlist === null) {
    return <div className="min-h-screen bg-paper" />;
  }

  // Opt-in only -- reached via "Get My IMDb Watchlist" from Home's empty
  // state or "Import Again" from Watchlist. An empty watchlist never forces
  // this screen; Home is always the default landing page.
  if (showOnboarding) {
    return (
      <Onboarding
        onDone={() => {
          setShowOnboarding(false);
          setHasWatchlist(true);
          setTab("home");
        }}
        onCancel={() => setShowOnboarding(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {tab === "home" && <Home language={language} onNeedsImport={() => setShowOnboarding(true)} />}
      {tab === "watchlist" && <WatchlistScreen onImportAgain={() => setShowOnboarding(true)} />}
      {tab === "explore" && <ExploreScreen language={language} />}
      {tab === "settings" && <SettingsScreen language={language} onLanguageChange={setLanguage} />}
      <NavMenu tab={tab} onChange={setTab} />
    </div>
  );
}
