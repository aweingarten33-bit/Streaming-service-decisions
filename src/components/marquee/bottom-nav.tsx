"use client";

import { Compass, Home as HomeIcon, ListVideo, Settings as SettingsIcon } from "lucide-react";

export type Tab = "home" | "watchlist" | "explore" | "settings";

export function BottomNav({ tab, onChange }: { tab: Tab; onChange: (tab: Tab) => void }) {
  const items: { key: Tab; label: string; icon: typeof HomeIcon }[] = [
    { key: "home", label: "Home", icon: HomeIcon },
    { key: "watchlist", label: "My Watchlist", icon: ListVideo },
    { key: "explore", label: "Explore", icon: Compass },
    { key: "settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-rule bg-paper/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-xl">
        {items.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-current={tab === key ? "page" : undefined}
            className={`btn-press flex flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium transition-colors ${
              tab === key ? "text-gold" : "text-ink/40"
            }`}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
