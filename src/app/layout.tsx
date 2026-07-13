import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Grain } from "@/components/fx/grain";

export const metadata: Metadata = {
  title: "Watch DJ",
  description: "Your personal movie & TV DJ — tell it what you're in the mood for.",
  openGraph: {
    title: "Watch DJ",
    description: "Your personal movie & TV DJ — tell it what you're in the mood for.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export const viewport: Viewport = {
  themeColor: "#08080c",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#08080c] text-white antialiased">
        <Grain />
        <main>{children}</main>
      </body>
    </html>
  );
}
