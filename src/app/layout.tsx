import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Grain } from "@/components/fx/grain";

export const metadata: Metadata = {
  title: "Marquee",
  description: "WTF are you in the mood for? Marquee picks one thing from your own watchlist.",
  openGraph: {
    title: "Marquee",
    description: "WTF are you in the mood for? Marquee picks one thing from your own watchlist.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Grain />
        <main>{children}</main>
      </body>
    </html>
  );
}
