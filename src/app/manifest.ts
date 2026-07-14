import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Watch DJ — a tastemaker's film club",
    short_name: "Watch DJ",
    description:
      "Tell the DJ what kind of night you're having. Get a few genuinely great films & shows, hand-picked from trusted human curators.",
    start_url: "/",
    display: "standalone",
    background_color: "#f2ece0",
    theme_color: "#f2ece0",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
