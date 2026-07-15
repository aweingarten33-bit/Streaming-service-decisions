import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "Marquee",
  description: "One answer from your own watchlist.",
  openGraph: {
    title: "Marquee",
    description: "One answer from your own watchlist.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#08080c" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#08080c] text-white antialiased">
        <main>{children}</main>
      </body>
    </html>
  );
}
