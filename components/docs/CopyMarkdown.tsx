"use client";

import { useState } from "react";
import Icon from "@/components/docs/Icon";

// Copies the whole docs page as Markdown, with a View link to the raw /docs.md file.
export default function CopyMarkdown({ markdown }: { markdown: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(markdown);
      ok = true;
    } catch {
      // Fallback for browsers or contexts where the async clipboard API is unavailable.
      const area = document.createElement("textarea");
      area.value = markdown;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      ok = document.execCommand("copy");
      area.remove();
    }
    setState(ok ? "copied" : "failed");
    setTimeout(() => setState("idle"), 2200);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[10px] border border-white/12 bg-white/[0.05] px-3.5 text-[13px] text-ink/85 transition hover:border-white/25 hover:bg-white/[0.08] hover:text-ink"
      >
        {state === "copied" ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-[#c9e877]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
            <path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" />
          </svg>
        )}
        <span aria-live="polite">{state === "copied" ? "Copied" : state === "failed" ? "Couldn't copy" : "Copy as Markdown"}</span>
      </button>
      <a
        href="/docs.md"
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center gap-2 rounded-[10px] px-3 text-[13px] text-ink/65 transition hover:text-ink"
      >
        <Icon name="api" className="h-4 w-4" />
        View .md
      </a>
    </div>
  );
}
