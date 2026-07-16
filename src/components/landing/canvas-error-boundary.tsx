"use client";

import { ErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";

function ErrorFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#05050f]">
      {/* Silent fallback if WebGL fails */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#05050f] to-[#0a0a16]" />
    </div>
  );
}

export function CanvasErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary FallbackComponent={ErrorFallback}>{children}</ErrorBoundary>;
}
