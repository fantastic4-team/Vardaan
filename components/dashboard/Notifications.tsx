"use client";

import { useEffect } from "react";

// The bell in the dashboard top bar and the panel it slides in from the right: things waiting on
// you, setup that's missing, and what Vardaan finished recently.

export type Notice = {
  id: string;
  group: "Needs you" | "Setup" | "Recent";
  title: string;
  detail?: string;
  at?: string;
  kind: "question" | "approval" | "ai" | "calling" | "call" | "done";
  onOpen: () => void;
};

const PHONE = (
  <path d="M21 16.4v2.7a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.1 1.9 1.9 0 0 1 4 2h2.7a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.7 9.4a15.2 15.2 0 0 0 5.7 5.7l1.1-1.1a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.8 2.1z" />
);

// Each kind of notification gets its own glossy tile and icon.
const KINDS: Record<Notice["kind"], { tile: string; icon: React.ReactNode }> = {
  // Vardaan asked a question.
  question: {
    tile: "tile-amber",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.6 9.5a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.1-2.4 3.6M12 16.8v.2" />
      </>
    ),
  },
  // A draft is waiting for approval.
  approval: {
    tile: "tile-amber",
    icon: (
      <>
        <path d="M14 3.5H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.5z" />
        <path d="M14 3.5v5h5M9 14l2 2 4-4.5" />
      </>
    ),
  },
  ai: {
    tile: "tile-violet",
    icon: (
      <>
        <path d="M12 3.5 13.8 9l5.7 1.5-5.7 1.6L12 17.5l-1.8-5.4L4.5 10.5 10.2 9z" />
        <path d="M18.5 16.5 19.2 18.6 21 19.2 19.2 19.9 18.5 22 17.8 19.9 16 19.2 17.8 18.6z" />
      </>
    ),
  },
  calling: { tile: "tile-leaf", icon: PHONE },
  call: { tile: "tile-sky", icon: PHONE },
  done: { tile: "tile-leaf", icon: <path d="m5.5 12.5 4 4 9-9.5" /> },
};

const GROUPS: Notice["group"][] = ["Needs you", "Setup", "Recent"];

function ago(iso?: string) {
  if (!iso) return "";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  if (m < 60 * 24) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / (60 * 24))}d`;
}

export function Bell({ count, onClick }: { count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={count ? `Notifications, ${count} new` : "Notifications"}
      className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-white/[0.09] bg-white/[0.03] text-ink/70 transition hover:border-white/20 hover:text-ink"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-[18px] w-[18px]">
        <path d="M6 9.5a6 6 0 0 1 12 0c0 4.5 1.8 6 1.8 6H4.2S6 14 6 9.5z" />
        <path d="M10 19a2.2 2.2 0 0 0 4 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff8a7a] px-1 text-[10.5px] font-medium leading-none text-[#1a0f0c] tabular-nums">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

export default function Notifications({ open, items, onClose }: { open: boolean; items: Notice[]; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`} />
      <aside
        role="dialog"
        aria-label="Notifications"
        className={`drawer-panel absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col border-l border-white/[0.09] transition-[transform,visibility] duration-300 ease-out ${
          open ? "visible translate-x-0 shadow-[-24px_0_60px_-20px_rgba(0,0,0,0.6)]" : "invisible translate-x-full"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.07] px-5">
          <p className="text-[15px] font-medium text-ink">Notifications</p>
          <button
            onClick={onClose}
            aria-label="Close notifications"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[8px] text-ink/55 transition hover:bg-white/[0.06] hover:text-ink"
          >
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden className="h-4 w-4">
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-8 text-center">
              <p className="text-[14px] text-ink">You&apos;re all caught up</p>
              <p className="mt-1 text-[13px] leading-[20px] text-ink/50">Questions, drafts to approve and finished tasks show up here.</p>
            </div>
          ) : (
            GROUPS.filter((g) => items.some((i) => i.group === g)).map((g) => (
              <section key={g} className="mb-3">
                <h3 className="px-2 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-[0.12em] text-ink/40">{g}</h3>
                <ul>
                  {items
                    .filter((i) => i.group === g)
                    .map((n) => (
                      <li key={n.id}>
                        <button
                          onClick={() => (n.onOpen(), onClose())}
                          className="flex w-full cursor-pointer items-start gap-3 rounded-[12px] px-2 py-2.5 text-left transition hover:bg-white/[0.05]"
                        >
                          <span className={`glass-tile nav-tile ${KINDS[n.kind].tile} flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4">
                              {KINDS[n.kind].icon}
                            </svg>
                          </span>
                          <span className="min-w-0 flex-1 pt-[1px]">
                            <span className="block text-[13.5px] font-medium leading-[20px] text-ink">{n.title}</span>
                            {n.detail && <span className="mt-0.5 block line-clamp-2 text-[12.5px] leading-[18px] text-ink/50">{n.detail}</span>}
                          </span>
                          {n.at && <span className="shrink-0 pt-0.5 text-[11.5px] text-ink/40 tabular-nums">{ago(n.at)}</span>}
                        </button>
                      </li>
                    ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
