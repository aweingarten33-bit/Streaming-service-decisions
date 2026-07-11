import type { Metadata } from "next";
import { JourneyBackdrop } from "@/components/journey/backdrop";
import { JourneyLoader } from "@/components/journey/loader";
import { JourneyHero } from "@/components/journey/hero";
import { JourneyChapters } from "@/components/journey/chapters";
import { JourneyFinale } from "@/components/journey/finale";
import { JourneyNav } from "@/components/journey/nav";

export const metadata: Metadata = {
  title: "DFS Strategy Auditor — Play DFS like it's a game of Chess",
  description:
    "Upload your DraftKings or FanDuel contest history and get a full strategy audit — what's making you money, what's costing you, and what to change before your next slate.",
  openGraph: {
    title: "DFS Strategy Auditor — Play DFS like it's a game of Chess",
    description:
      "Upload your DraftKings or FanDuel contest history and get a full strategy audit — what's making you money, what's costing you, and what to change before your next slate.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Index() {
  return (
    <div className="relative isolate -mt-px bg-[#05060a] text-white antialiased">
      <JourneyLoader />
      <JourneyBackdrop />
      <JourneyNav />
      <div className="relative z-10">
        <JourneyHero />
        <JourneyChapters />
        <JourneyFinale />
      </div>
    </div>
  );
}
