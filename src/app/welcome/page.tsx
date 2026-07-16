import type { Metadata } from "next";
import { WebglHero } from "@/components/landing/webgl-hero";

export const metadata: Metadata = {
  title: "Marquee — Stop scrolling. Start watching.",
  description:
    "Personalized movie and TV recommendations pulled from trusted voices across the internet.",
};

export default function WelcomePage() {
  return <WebglHero />;
}
