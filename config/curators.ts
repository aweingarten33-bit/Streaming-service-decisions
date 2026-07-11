import type { CuratorConfig } from "@/lib/pipeline/types";

/**
 * Seed list of curator channels. Adding a curator is one entry here — the
 * pipeline resolves the handle to a channel ID via the YouTube Data API at
 * ingestion time, so no channel IDs need to be looked up by hand.
 */
export const curators: CuratorConfig[] = [
  {
    name: "Christie Boschman",
    youtubeHandle: "@thatdocumentarygirl",
    url: "https://www.instagram.com/thatdocumentarygirl",
    active: true,
  },
  {
    name: "Darren Van Dam",
    youtubeHandle: "@darrenvandam",
    url: "https://www.darrenvandam.com/blog/rental-gems-for-your-next-movie-night",
    active: true,
  },
  // Add the remaining 3 curators here — same shape, active: true to include
  // them in the next pipeline run.
];
