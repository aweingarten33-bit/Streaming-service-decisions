import type { Metadata } from "next";
import { UploadClient } from "./upload-client";

export const metadata: Metadata = {
  title: "Upload — DFS Analysis Engine",
  description: "Drag in your DFS contest history CSV. The analysis runs in your browser.",
  openGraph: {
    title: "Upload — DFS Analysis Engine",
    description: "Drag in your contest history CSV. Analysis runs locally.",
  },
};

export default function UploadPage() {
  return <UploadClient />;
}
