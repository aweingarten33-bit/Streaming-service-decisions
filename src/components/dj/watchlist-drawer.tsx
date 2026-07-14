"use client";

import { useEffect } from "react";
import { X, Trash2, ChevronRight } from "lucide-react";
import { useWatchlist } from "@/lib/watchlist";
import { Kicker, MetaLine, Sprockets, TMDB_IMG, Wordmark } from "./ui";

export function WatchlistDrawer({
  onClose,
  onOpenTitle,
}: {
  onClose: () => void;
  onOpenTitle: (tmdbId: number, mediaType: string) => void;
}) {
  const { items, remove } = useWatchlist();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Scrim */}
      <button
        aria-label="Close watchlist"
        onClick={onClose}
        className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
      />

      {/* Panel */}
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l-[1.5px] border-ink bg-background shadow-ink">
        <div className="bg-background/95 backdrop-blur-md">
          <Sprockets />
          <div className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="flex items-baseline gap-3">
              <Wordmark size="sm" />
              <Kicker className="hidden sm:inline">Your List</Kicker>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="focus-ink grid h-9 w-9 place-items-center border-[1.5px] border-ink text-ink transition-colors hover:bg-ink hover:text-primary-foreground"
            >
              <X size={16} />
            </button>
          </div>
          <hr className="rule-ink" />
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <Kicker className="text-ink">The Marquee</Kicker>
          <Kicker>
            {String(items.length).padStart(2, "0")} saved
          </Kicker>
        </div>
        <hr className="rule-hair mx-5" />

        <div className="flex-1 overflow-y-auto px-5 py-3">
          {items.length === 0 ? (
            <div className="mt-16 flex flex-col items-center px-6 text-center">
              <div className="border-[1.5px] border-dashed border-ink/40 px-6 py-8">
                <p className="font-display text-lg font-bold text-ink">Your marquee is empty</p>
                <p className="mt-2 font-serif italic leading-relaxed text-muted-foreground">
                  Add picks as the DJ spins them and they&apos;ll be waiting here for later.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.tmdbId} className="group flex items-center gap-3 py-3">
                  <button
                    onClick={() => onOpenTitle(item.tmdbId, item.mediaType)}
                    className="focus-ink flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div className="h-20 w-14 flex-none overflow-hidden frame-ink bg-secondary">
                      {item.posterPath ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${TMDB_IMG}/w200${item.posterPath}`}
                          alt=""
                          aria-hidden
                          loading="lazy"
                          className="img-duotone h-full w-full object-cover group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-display font-bold leading-tight text-ink group-hover:text-vermilion">
                        {item.title}
                      </p>
                      <MetaLine className="mt-1" items={[item.year ? String(item.year) : null, item.mediaType]} />
                    </div>
                    <ChevronRight
                      size={16}
                      className="flex-none text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-vermilion"
                    />
                  </button>
                  <button
                    onClick={() => remove(item.tmdbId)}
                    aria-label={`Remove ${item.title}`}
                    className="focus-ink grid h-9 w-9 flex-none place-items-center text-muted-foreground transition-colors hover:text-destructive"
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
}
