import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { Nav } from "@/components/punk/nav";
import { Footer } from "@/components/punk/footer";
import { SmoothScroll } from "@/components/fx/smooth-scroll";
import { CustomCursor } from "@/components/fx/cursor";
import { Grain } from "@/components/fx/grain";
import { ScrollProgress } from "@/components/fx/scroll-progress";
import { PageWipe } from "@/components/fx/page-wipe";

const socialImage =
  "https://storage.googleapis.com/gpt-engineer-file-uploads/uDL3R3aSZbX40JemDmrMPyARK563/social-images/social-1783608242342-627408FF-46E1-454D-93F4-F8D1775FA93E.webp";

export const metadata: Metadata = {
  title: "DFS decision engine",
  description:
    "A cinematic, mobile-first journey through the intelligence layer beneath every DFS entry. Scroll to enter.",
  authors: [{ name: "DFS Analysis Engine" }],
  openGraph: {
    title: "DFS decision engine",
    description:
      "A cinematic, mobile-first journey through the intelligence layer beneath every DFS entry. Scroll to enter.",
    type: "website",
    images: [socialImage],
  },
  twitter: {
    card: "summary_large_image",
    title: "DFS decision engine",
    description:
      "A cinematic, mobile-first journey through the intelligence layer beneath every DFS entry. Scroll to enter.",
    images: [socialImage],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SmoothScroll />
        <ScrollProgress />
        <Grain />
        <CustomCursor />
        <PageWipe />
        <Nav />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
