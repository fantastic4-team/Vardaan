import type { IconName } from "@/lib/docs-content";

// A small set of 24px line icons in one consistent style (1.6 stroke, round caps and joins).
const PATHS: Record<IconName, React.ReactNode> = {
  overview: (
    <>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="M12 8l1.5 2.5L16 12l-2.5 1.5L12 16l-1.5-2.5L8 12l2.5-1.5z" />
    </>
  ),
  modes: (
    <>
      <rect x="3" y="5" width="8" height="14" rx="2" />
      <rect x="13" y="5" width="8" height="14" rx="2" />
    </>
  ),
  architecture: (
    <>
      <path d="M12 3 3 8l9 5 9-5-9-5z" />
      <path d="m3 13 9 5 9-5" />
      <path d="m3 17.5 9 4.5 9-4.5" opacity=".55" />
    </>
  ),
  callflow: (
    <>
      <path d="M5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.2 5.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
      <path d="M15 3.5a5.5 5.5 0 0 1 5.5 5.5M15 7a2 2 0 0 1 2 2" />
    </>
  ),
  lifecycle: (
    <>
      <path d="M20 12a8 8 0 0 1-14.6 4.5M4 12A8 8 0 0 1 18.6 7.5" />
      <path d="M19 3.5v4h-4M5 20.5v-4h4" />
    </>
  ),
  agent: (
    <>
      <rect x="5" y="7" width="14" height="12" rx="3" />
      <path d="M12 3v4M9 12h.01M15 12h.01M9.5 15.5h5" />
      <path d="M3 12v3M21 12v3" />
    </>
  ),
  capabilities: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="m8 12 2.8 2.8L16.5 9" />
    </>
  ),
  free: (
    <>
      <path d="M20.5 13.5 13.5 20.5a1.5 1.5 0 0 1-2.1 0L3.5 12.6V3.5h9.1l7.9 7.9a1.5 1.5 0 0 1 0 2.1z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  limits: (
    <>
      <path d="M12 3.5 2.8 19.5h18.4L12 3.5z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  setup: (
    <>
      <path d="M5 19c1-3 2.5-4.5 5-5.5M14.5 9.5 19.5 4.5" />
      <path d="M9.5 14.5 7 12c2-5 6.5-8.5 13-8.5 0 6.5-3.5 11-8.5 13z" />
      <circle cx="15" cy="9" r="1.4" />
    </>
  ),
  config: (
    <>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  api: (
    <>
      <path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4.5l-3 15" />
    </>
  ),
  data: (
    <>
      <ellipse cx="12" cy="6" rx="7.5" ry="2.8" />
      <path d="M4.5 6v12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8V6" />
      <path d="M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" />
    </>
  ),
  security: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8 7.5 9.5 4.4-1.5 7.5-4.9 7.5-9.5V6L12 3z" />
      <path d="m9 12 2.2 2.2L15.5 10" />
    </>
  ),
  stack: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  roadmap: (
    <>
      <path d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13l-5.5 2-6-2z" />
      <path d="M9 4.5v13M15 6.5v13" />
    </>
  ),
  principles: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2z" />
    </>
  ),
  talk: (
    <>
      <path d="M4 5.5h16v10H9.5L5.5 19v-3.5H4z" />
      <path d="M8.5 10.5h.01M12 10.5h.01M15.5 10.5h.01" />
    </>
  ),
  cut: (
    <>
      <path d="M5 9.5a13 13 0 0 1 14 0l-1.2 3.3-3.3-1.1V9.8a10 10 0 0 0-5 0v1.9l-3.3 1.1L5 9.5z" />
      <path d="M12 14v6M9 17.5l3 3 3-3" />
    </>
  ),
  key: (
    <>
      <circle cx="8" cy="15" r="4" />
      <path d="m11 12 8.5-8.5M16 7l2.5 2.5M18.5 4.5 21 7" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <path d="m7 9.5 3 2.5-3 2.5M12.5 15h4.5" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M10 8.5v7l5.5-3.5L10 8.5z" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m3.5 7 8.5 6.5L20.5 7" />
    </>
  ),
  phone: (
    <path d="M5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.2 5.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
  ),
  tunnel: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5S9.6 5.9 12 3.5z" />
    </>
  ),
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
    </>
  ),
  cookie: (
    <>
      <path d="M20.5 12A8.5 8.5 0 1 1 12 3.5a3 3 0 0 0 4 3.5 3 3 0 0 0 4.5 5z" />
      <path d="M8.5 10h.01M14 15h.01M9.5 15.5h.01" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.5" r="3.5" />
      <path d="M3 19.5a6 6 0 0 1 12 0M16 5.2a3.5 3.5 0 0 1 0 6.6M18 14a6 6 0 0 1 3 5.5" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
      <path d="m4 20 16-16" />
    </>
  ),
  trash: (
    <>
      <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5" />
      <path d="M10.5 11v5M13.5 11v5" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2z" />
    </>
  ),
  language: (
    <>
      <path d="M4 5.5h8M8 4v1.5M10.5 5.5c-.8 3.5-3 6-6 7.5M6 8.5c1 2 2.8 3.6 4.5 4.5" />
      <path d="m12 20 4-9 4 9M13.4 17h5.2" />
    </>
  ),
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.2 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />,
};

export default function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

/** An icon in a soft rounded tile, used beside headings and in cards. */
export function IconTile({ name, size = "md" }: { name: IconName; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-9 w-9 rounded-[10px]" : "h-11 w-11 rounded-[12px]";
  return (
    <span
      className={`flex shrink-0 items-center justify-center border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] text-[#b9e0ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ${box}`}
    >
      <Icon name={name} className={size === "sm" ? "h-[18px] w-[18px]" : "h-5 w-5"} />
    </span>
  );
}
