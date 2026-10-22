import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function config(phase: string): NextConfig {
  return {
    // `next dev` gets its own output folder so running `next build` alongside it
    // can't delete files the dev server is still serving.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    // Keep the dev badge clear of the dashboard sidebar.
    devIndicators: { position: "bottom-right" },
  };
}
