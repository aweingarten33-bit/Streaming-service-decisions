import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";

export const metadata: Metadata = {
  title: "Marquee — Stop scrolling. Start watching.",
  description:
    "Personalized movie and TV recommendations pulled from trusted voices across the internet.",
};

export default function WelcomePage() {
  return <Hero />;
}
