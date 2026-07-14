import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Grain } from "@/components/fx/grain";

const TITLE = "Watch DJ — a tastemaker's film club";
const DESCRIPTION =
  "Tell the DJ what kind of night you're having. Get a few genuinely great films & shows, hand-picked from trusted human curators — never popularity, never sponsored.";

export const metadata: Metadata = {
  metadataBase: new URL("https://watch-dj.vercel.app"),
  title: {
    default: TITLE,
    template: "%s · Watch DJ",
  },
  description: DESCRIPTION,
  applicationName: "Watch DJ",
  keywords: [
    "movie recommendations",
    "tv recommendations",
    "what to watch",
    "curated film",
    "streaming picks",
  ],
  appleWebApp: {
    capable: true,
    title: "Watch DJ",
    statusBarStyle: "default",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    siteName: "Watch DJ",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f2ece0",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground antialiased">
        <Grain />
        <main>{children}</main>
      </body>
    </html>
  );
}
