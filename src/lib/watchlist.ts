"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "watchdj_watchlist";
const EVENT = "watchdj_watchlist_change";

export interface WatchlistItem {
  tmdbId: number;
  title: string;
  year: number | null;
  mediaType: string;
  posterPath: string | null;
  addedAt: number;
}

function read(): WatchlistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WatchlistItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: WatchlistItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

/** Reactive watchlist hook — syncs across all components in the tab. */
export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    setItems(read());
    const sync = () => setItems(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const has = useCallback((tmdbId: number) => items.some((i) => i.tmdbId === tmdbId), [items]);

  const toggle = useCallback((item: Omit<WatchlistItem, "addedAt">) => {
    const current = read();
    const exists = current.some((i) => i.tmdbId === item.tmdbId);
    if (exists) {
      write(current.filter((i) => i.tmdbId !== item.tmdbId));
    } else {
      write([{ ...item, addedAt: Date.now() }, ...current]);
    }
  }, []);

  const remove = useCallback((tmdbId: number) => {
    write(read().filter((i) => i.tmdbId !== tmdbId));
  }, []);

  return { items, has, toggle, remove };
}
