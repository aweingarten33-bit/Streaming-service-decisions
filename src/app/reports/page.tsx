import type { Metadata } from "next";
import { ReportsClient } from "./reports-client";

export const metadata: Metadata = {
  title: "Reports — DFS Analysis Engine",
  description:
    "Your DFS diagnostic report: health scorecard, quantified leaks, and a prioritized action plan.",
  openGraph: {
    title: "Reports — DFS Analysis Engine",
    description: "Health scorecard, quantified leaks, prioritized action plan.",
  },
};

export default function ReportsPage() {
  return <ReportsClient />;
}
