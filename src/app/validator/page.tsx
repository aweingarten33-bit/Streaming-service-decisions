import type { Metadata } from "next";
import { ValidatorClient } from "./validator-client";

export const metadata: Metadata = {
  title: "Decision Validator — DFS Advisory",
  description:
    "Describe a DFS play you're about to make. Get a blunt Green/Yellow/Red verdict grounded in your own uploaded history.",
  openGraph: {
    title: "Decision Validator — DFS Advisory",
    description: "Green/Yellow/Red verdict on any DFS play, grounded in your history.",
  },
};

export default function ValidatorPage() {
  return <ValidatorClient />;
}
