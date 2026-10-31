"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import TaskCard, { STATUS, canCancel, inProgress, needsYou } from "@/components/dashboard/TaskCard";
import { api } from "@/components/dashboard/api";
import Integrations from "@/components/dashboard/Integrations";
import Icon from "@/components/docs/Icon";
import type { IconName } from "@/lib/docs-content";
import type { CallLog, Memory, MessageLog, Reminder, Task } from "@/lib/db";

type View = "overview" | "calls" | "tasks" | "messages" | "memory" | "reminders" | "integrations" | "settings";

const NAV: { id: View; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "calls", label: "Calls" },
  { id: "tasks", label: "Tasks" },
  { id: "messages", label: "Messages" },
  { id: "memory", label: "Memory" },
  { id: "reminders", label: "Reminders" },
  { id: "integrations", label: "Integrations" },
  { id: "settings", label: "Settings" },
];

type Data = { tasks: Task[]; memories: Memory[]; reminders: Reminder[]; calls: CallLog[]; messages: MessageLog[] };
type Profile = { phone: string; lang: string };
type Status = { ai: string | null; phone: boolean; phoneNumber: string | null; publicUrl: boolean; email: boolean; search?: string; google?: { configured: boolean; connected: boolean; email: string | null } };
type AgentStatus = { status: string; activeTasks: number; activeCalls: number };

const CALL_LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "à¤¹à¤¿à¤¨à¥à¤¦à¥€ Hindi" },
  { code: "bn-IN", label: "à¦¬à¦¾à¦‚à¦²à¦¾ Bengali" },
  { code: "ta-IN", label: "à®¤à®®à®¿à®´à¯ Tamil" },
  { code: "te-IN", label: "à°¤à±†à°²à±à°—à± Telugu" },
  { code: "mr-IN", label: "à¤®à¤°à¤¾à¤ à¥€ Marathi" },
  { code: "gu-IN", label: "àª—à«àªœàª°àª¾àª¤à«€ Gujarati" },
  { code: "kn-IN", label: "à²•à²¨à³à²¨à²¡ Kannada" },
  { code: "ml-IN", label: "à´®à´²à´¯à´¾à´³à´‚ Malayalam" },
  { code: "pa-IN", label: "à¨ªà©°à¨œà¨¾à¨¬à©€ Punjabi" },
  { code: "od-IN", label: "à¬“à¬¡à¬¼à¬¿à¬† Odia" },
];

const CALL_STATUS: Record<CallLog["status"], { label: string; tone: string }> = {
  queued: { label: "Dialling", tone: "bg-white/10 text-ink/80" },
  ringing: { label: "Ringing", tone: "bg-[#8ccbff]/15 text-[#b9e0ff]" },
  "in-progress": { label: "On call", tone: "bg-[#8ccbff]/15 text-[#b9e0ff]" },
  completed: { label: "Completed", tone: "bg-[#8fcf3c]/15 text-[#c9e877]" },
  busy: { label: "Busy", tone: "bg-[#f6e27a]/15 text-[#f6e27a]" },
  "no-answer": { label: "No answer", tone: "bg-[#f6e27a]/15 text-[#f6e27a]" },
  failed: { label: "Failed", tone: "bg-[#ff5d6e]/15 text-[#ffb4a8]" },
  canceled: { label: "Cancelled", tone: "bg-white/10 text-ink/60" },
};

const live = (c: CallLog) => c.status === "queued" || c.status === "ringing" || c.status === "in-progress";

function when(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : d.toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

const duration = (s?: number) => (s === undefined ? "" : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`);

export default function Dashboard({ user, demo = false }: { user: { name: string; email: string }; demo?: boolean }) {
  const router = useRouter();
  const [view, setView] = useState<View>("overview");
  const [data, setData] = useState<Data>({ tasks: [], memories: [], reminders: [], calls: [], messages: [] });
  const [profile, setProfile] = useState<Profile>({ phone: "", lang: "en-IN" });
  const [status, setStatus] = useState<Status | null>(null);
  const [toast, setToast] = useState("");
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await api<Data>("/api/tasks"));
    } catch {
      /* keep the last good state */
    }
  }, []);

  useEffect(() => {
    refresh();
    api<Profile>("/api/profile").then(setProfile).catch(() => {});
    api<Status>("/api/status").then(setStatus).catch(() => {});
    api<AgentStatus>("/api/agent/status").then(setAgentStatus).catch(() => {});
  }, [refresh]);

  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get("google");
    if (!result) return;
    const messages: Record<string, string> = {
      connected: "Google connected. Ask Vardaan about your calendar or email.",
      denied: "Google access wasn't allowed.",
      expired: "That sign-in expired. Press Connect Google again.",
      failed: "Couldn't connect Google. Check the terminal for details.",
      not_configured: "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local first (docs/GOOGLE_SETUP.md).",
    };
    setView("settings");
    setToast(messages[result] ?? "Google: " + result);
    setTimeout(() => setToast(""), 6000);
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  // Also refresh agent status on the same cadence.
  const agentRefresh = useCallback(() => {
    api<AgentStatus>("/api/agent/status").then(setAgentStatus).catch(() => {});
  }, []);

  // Poll faster while a call or task is in progress.
  const busy = data.tasks.some(inProgress) || data.calls.some(live);
  useEffect(() => {
    const t = setInterval(() => { void refresh(); agentRefresh(); }, busy ? 2500 : 12000);
    return () => clearInterval(t);
  }, [busy, refresh, agentRefresh]);

  function showToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(""), 4500);
  }

  async function callMe() {
    if (!profile.phone) {
      setView("settings");
      showToast("Add your phone number first.");
      return;
    }
    try {
      await api("/api/voice/call-me", { method: "POST" });
      showToast(`Calling ${profile.phone}â€¦ pick up your phone.`);
      refresh();
    } catch (err) {
      showToast((err as Error).message);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const needs = data.tasks.filter(needsYou).length;
  const badge: Partial<Record<View, number>> = { tasks: needs, calls: data.calls.filter(live).length };

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <aside className="nav-grid sticky top-0 hidden h-svh flex-col border-r px-4 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-3">
          <span className="font-poster text-[19px] font-semibold uppercase tracking-[0.02em] text-ink">Vardaan</span>
          <span className="beta-glass">Beta</span>
        </Link>
        <button onClick={callMe} className="waitlist-button mt-8 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[12px] text-[14px]">
          <NavIcon name="calls" className="h-4 w-4" />
          Call me
        </button>
        <nav aria-label="Dashboard" className="mt-6 space-y-0.5">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              aria-current={view === n.id ? "page" : undefined}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] transition ${
                view === n.id ? "bg-white/[0.07] text-ink" : "text-ink/60 hover:bg-white/[0.035] hover:text-ink"
              }`}
            >
              <span className={`glass-tile nav-tile ${NAV_TILES[n.id]} flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] ${view === n.id ? "" : "opacity-80"}`}>
                <NavIcon name={n.id} className="h-4 w-4" />
              </span>
              {n.label}
              {!!badge[n.id] && (
                <span className="ml-auto min-w-[20px] rounded-full bg-[#f6e27a]/15 px-1.5 text-center text-[11px] tabular-nums leading-[18px] text-[#f6e27a]">{badge[n.id]}</span>
              )}
            </button>
          ))}
        </nav>
        <AccountMenu user={user} phone={profile.phone} onSettings={() => setView("settings")} onLogout={logout} />
      </aside>

      <header className="nav-grid lg:hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-poster text-[17px] font-semibold uppercase tracking-[0.02em] text-ink">Vardaan</span>
            <span className="beta-glass">Beta</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={callMe} className="waitlist-button flex h-8 cursor-pointer items-center rounded-[8px] px-3 text-[12px]">
              Call me
            </button>
            <button onClick={logout} className="cursor-pointer text-[12px] text-ink/60 hover:text-ink">
              Log out
            </button>
          </div>
        </div>
        <nav aria-label="Dashboard" className="nav-grid flex overflow-x-auto border-b [scrollbar-width:none]">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              className={`relative shrink-0 cursor-pointer px-4 py-2.5 text-[13px] ${view === n.id ? "text-ink" : "text-ink/55"}`}
            >
              {n.label}
              {view === n.id && <span className="absolute inset-x-3 bottom-0 h-px bg-ink/70" />}
            </button>
          ))}
        </nav>
      </header>

      <main className="min-w-0">
        <div className="sticky top-0 z-30 hidden h-14 items-center justify-between border-b border-white/[0.07] bg-page px-12 lg:flex">
          <p className="text-[13px] text-ink/45">
            Dashboard <span className="px-1.5 text-ink/25">/</span>
            <span className="text-ink/85">{NAV.find((n) => n.id === view)?.label}</span>
          </p>
          <div className="flex items-center gap-2 text-[12px]">
            <StatusChip ok={Boolean(status?.ai)} label={status?.ai ? "AI connected" : "AI not set"} />
            <StatusChip ok={Boolean(status?.phone && profile.phone)} label={status?.phone && profile.phone ? "Phone ready" : "Phone not set"} />
          </div>
        </div>
        <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-8 lg:px-12 lg:pt-10">
        {demo && (
          <div className="mb-6 flex flex-col gap-3 rounded-[14px] border border-[#8ccbff]/25 bg-[#8ccbff]/[0.07] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[14px] text-ink">You&apos;re exploring a demo account.</p>
              <p className="mt-0.5 text-[13px] text-ink/55">The calls, tasks and messages are samples. Changes are turned off.</p>
            </div>
            <Link href="/signup" onClick={() => void fetch("/api/auth/logout", { method: "POST" })} className="waitlist-button flex h-10 shrink-0 items-center justify-center rounded-[10px] px-5 text-[14px]">
              Create free account
            </Link>
          </div>
        )}
        {view === "overview" && <Overview user={user} data={data} profile={profile} status={status} agentStatus={agentStatus} onCall={callMe} onView={setView} onChange={refresh} onToast={showToast} />}
        {view === "calls" && <Calls calls={data.calls} tasks={data.tasks} onCall={callMe} onToast={showToast} />}
        {view === "tasks" && <Tasks tasks={data.tasks} onChange={refresh} onToast={showToast} />}
        {view === "messages" && <Messages messages={data.messages} />}
        {view === "memory" && <MemoryView memories={data.memories} onChange={refresh} />}
        {view === "reminders" && <RemindersView reminders={data.reminders} hasPhone={Boolean(profile.phone)} phoneReady={Boolean(status?.phone)} onChange={refresh} />}
        {view === "integrations" && <Integrations status={status} />}
        {view === "settings" && (
          <Settings
            profile={profile}
            status={status}
            onSaved={setProfile}
            onToast={showToast}
            onStatusChange={() => api<Status>("/api/status").then(setStatus).catch(() => {})}
          />
        )}
        </div>
      </main>

      {toast && (
        <div role="status" className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/10 bg-[#1f1e1c] px-4 py-2.5 text-[13px] text-ink shadow-[0_12px_30px_-10px_rgba(0,0,0,0.8)]">
          {toast}
        </div>
      )}
    </div>
  );
}

// ---- Shared bits -------------------------------------------------------------------------------

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

function AccountMenu({
  user,
  phone,
  onSettings,
  onLogout,
}: {
  user: { name: string; email: string };
  phone: string;
  onSettings: () => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const item = "block w-full cursor-pointer rounded-[8px] px-3 py-2 text-left text-[13px] transition hover:bg-white/[0.06]";

  return (
    <div ref={ref} className="relative mt-auto">
      {open && (
        <div role="menu" className="absolute inset-x-0 bottom-full mb-2 rounded-[12px] border border-white/10 bg-[#1d1c1a] p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.85)]">
          <div className="flex items-start gap-3 border-b border-white/[0.07] px-3 pb-3 pt-2">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8ccbff]/15 text-[12px] font-medium text-[#b9e0ff]">{initials(user.name)}</span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-ink">{user.name}</span>
              <span className="mt-0.5 block break-all text-[12px] text-ink/50">{user.email}</span>
              {phone && <span className="block text-[12px] text-ink/50">{phone}</span>}
            </span>
          </div>
          <div className="pt-1.5">
            <button role="menuitem" onClick={() => (setOpen(false), onSettings())} className={`${item} flex items-center gap-2.5 text-ink/80`}>
              <NavIcon name="settings" className="h-4 w-4 text-ink/60" />
              Settings
            </button>
            <button role="menuitem" onClick={onLogout} className={`${item} flex items-center gap-2.5 text-[#ffb4a8]`}>
              <NavIcon name="logout" className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex w-full cursor-pointer items-center gap-3 rounded-[12px] px-2.5 py-2 text-left transition hover:bg-white/[0.05] ${open ? "bg-white/[0.05]" : ""}`}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8ccbff]/15 text-[12px] font-medium text-[#b9e0ff]">{initials(user.name)}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] text-ink">{user.name}</span>
          {phone && <span className="block text-[12px] text-ink/45">{phone}</span>}
        </span>
      </button>
    </div>
  );
}

// Outline icons for the dashboard navigation, drawn on one 24px grid with the same stroke.
const NAV_ICONS: Record<View | "logout", React.ReactNode> = {
  overview: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.75" />
      <rect x="13.5" y="3" width="7.5" height="5" rx="1.75" />
      <rect x="13.5" y="11" width="7.5" height="10" rx="1.75" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.75" />
    </>
  ),
  calls: (
    <path d="M21 16.4v2.7a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.1 1.9 1.9 0 0 1 4 2h2.7a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.7 9.4a15.2 15.2 0 0 0 5.7 5.7l1.1-1.1a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.8 2.1z" />
  ),
  tasks: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m8 12.2 2.8 2.8L16.5 9.3" />
    </>
  ),
  messages: <path d="M20 15.5a2 2 0 0 1-2 2H8l-4.5 3.5V5.5a2 2 0 0 1 2-2H18a2 2 0 0 1 2 2z" />,
  memory: (
    <>
      <path d="M12 4.5C10.4 3 8 3 6.5 3.5 4.5 4.2 3.5 6 3.5 8c-1 .8-1.5 2-1.5 3.2 0 1.6.9 3 2.2 3.6-.2 2.2 1.4 4.2 3.6 4.4 1.2 1.3 3 1.6 4.2.8" />
      <path d="M12 4.5c1.6-1.5 4-1.5 5.5-1 2 .7 3 2.5 3 4.5 1 .8 1.5 2 1.5 3.2 0 1.6-.9 3-2.2 3.6.2 2.2-1.4 4.2-3.6 4.4-1.2 1.3-3 1.6-4.2.8" />
      <path d="M12 4.5V20" />
    </>
  ),
  reminders: (
    <>
      <path d="M18 8.5a6 6 0 0 0-12 0c0 6.5-2.5 8.5-2.5 8.5h17S18 15 18 8.5" />
      <path d="M10.3 20.5a2 2 0 0 0 3.4 0" />
    </>
  ),
  integrations: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
      <path d="M7 10.5V14a3 3 0 0 0 3 3h3.5M17 13.5V10a3 3 0 0 0-3-3h-3.5" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </>
  ),
  logout: (
    <>
      <path d="M9.5 20.5H6a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2h3.5" />
      <path d="m15.5 16.5 4.5-4.5-4.5-4.5M20 12H9.5" />
    </>
  ),
};

// Each page's tile colour in the sidebar (see .glass-tile in globals.css).
const NAV_TILES: Record<View, string> = {
  overview: "tile-violet",
  calls: "tile-leaf",
  tasks: "tile-sky",
  messages: "tile-teal",
  memory: "tile-rose",
  reminders: "tile-amber",
  integrations: "tile-indigo",
  settings: "tile-slate",
};

const NavIcon = ({ name, className }: { name: View | "logout"; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    {NAV_ICONS[name]}
  </svg>
);

const StatusChip = ({ ok, label }: { ok: boolean; label: string }) => (
  <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-ink/65">
    <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-[#8fcf3c]" : "bg-ink/30"}`} />
    {label}
  </span>
);

function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[clamp(26px,3vw,32px)] font-medium leading-[1.15] tracking-[-0.02em] text-ink">{title}</h1>
        {sub && <p className="mt-2 max-w-[640px] text-[14px] leading-[22px] text-ink/55">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

const SectionLabel = ({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) => (
  <div className="mb-3 flex items-center justify-between">
    <h2 className="text-[12px] font-medium uppercase tracking-[0.14em] text-ink/45">{children}</h2>
    {action}
  </div>
);

const Empty = ({ icon, children }: { icon?: IconName; children: React.ReactNode }) => (
  <div className="app-panel flex flex-col items-center px-6 py-10 text-center">
    {icon && (
      <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.05] text-ink/45">
        <Icon name={icon} className="h-5 w-5" />
      </span>
    )}
    <p className="max-w-[420px] text-[14px] leading-[22px] text-ink/55">{children}</p>
  </div>
);

const Pill = ({ tone, children }: { tone: string; children: React.ReactNode }) => (
  <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] ${tone}`}>{children}</span>
);

// ---- Overview ----------------------------------------------------------------------------------

type Activity = { at: string; icon: IconName; title: string; detail?: string; tone: string };

const TONE = {
  call: "bg-[#8ccbff]/12 text-[#b9e0ff]",
  task: "bg-[#5a63e4]/18 text-[#c7b8ff]",
  text: "bg-[#8fcf3c]/12 text-[#c9e877]",
};

const AGENT_STATUS_COLORS: Record<string, string> = {
  Online: "bg-[#8fcf3c]",
  Idle: "bg-[#8fcf3c]",
  "Executing Task": "bg-[#8ccbff]",
  "Preparing Call": "bg-[#f6e27a]",
  "On Call": "bg-[#8ccbff]",
  Offline: "bg-white/30",
};

function Overview({
  user,
  data,
  profile,
  status,
  agentStatus,
  onCall,
  onView,
  onChange,
  onToast,
}: {
  user: { name: string };
  data: Data;
  profile: Profile;
  status: Status | null;
  agentStatus: AgentStatus | null;
  onCall: () => void;
  onView: (v: View) => void;
  onChange: () => void;
  onToast: (t: string) => void;
}) {
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  const hour = today?.getHours() ?? 12;
  const hello = today ? (hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening") : "Welcome";

  const activity: Activity[] = [
    ...data.calls.map((c) => ({
      at: c.startedAt,
      icon: "phone" as IconName,
      tone: TONE.call,
      title: `${c.direction === "inbound" ? "You called Vardaan" : c.reason === "Call me" ? "Vardaan called you" : `Vardaan called: ${c.reason}`}`,
      detail: `${CALL_STATUS[c.status].label}${c.durationSec ? ` Â· ${duration(c.durationSec)}` : ""}${c.taskIds.length ? ` Â· ${c.taskIds.length} task handed off` : ""}`,
    })),
    ...data.tasks.map((t) => ({ at: t.updatedAt, icon: "capabilities" as IconName, tone: TONE.task, title: t.request, detail: STATUS[t.status].label })),
    ...data.messages.map((m) => ({
      at: m.createdAt,
      icon: "talk" as IconName,
      tone: TONE.text,
      title: m.direction === "outbound" ? "Vardaan texted you" : "You replied",
      detail: m.body,
    })),
  ]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);

  const needing = data.tasks.filter(needsYou);
  const minutes = Math.round(data.calls.reduce((s, c) => s + (c.durationSec ?? 0), 0) / 60);
  const stats: { label: string; value: number; hint: string; view: View; icon: IconName; tone: string }[] = [
    { label: "Calls", value: data.calls.length, hint: `${minutes} min talked`, view: "calls", icon: "phone", tone: "text-[#b9e0ff] bg-[#8ccbff]/10" },
    { label: "Needs you", value: needing.length, hint: needing.length ? "Waiting on your reply" : "All clear", view: "tasks", icon: "bell", tone: "text-[#f6e27a] bg-[#f6e27a]/10" },
    { label: "In progress", value: data.tasks.filter(inProgress).length, hint: "Vardaan is working", view: "tasks", icon: "capabilities", tone: "text-[#c7b8ff] bg-[#5a63e4]/15" },
    { label: "Done", value: data.tasks.filter((t) => t.status === "done").length, hint: `${data.messages.length} texts exchanged`, view: "tasks", icon: "check", tone: "text-[#c9e877] bg-[#8fcf3c]/10" },
  ];
  const lang = CALL_LANGUAGES.find((l) => l.code === profile.lang)?.label.split(" ").slice(-1)[0] ?? "English";

  const ready = Boolean(status?.phone && profile.phone);
  const setup: { title: string; detail: string; done: boolean; action: string; view: View }[] = [
    {
      title: "Your phone number",
      detail: profile.phone || "The number Vardaan calls, set in Settings.",
      done: Boolean(profile.phone),
      action: "Add number",
      view: "settings",
    },
    {
      title: "Sarvam phone line",
      detail: status?.phone ? (status.phoneNumber ?? "Connected") : "The number Vardaan calls from.",
      done: Boolean(status?.phone),
      action: "Connect",
      view: "integrations",
    },
  ];

  return (
    <div className="space-y-8">
      <PageTitle title={`${hello}, ${user.name.split(" ")[0]}.`} sub="Everything Vardaan has done for you, in one place." />

      <section className="call-hero relative overflow-hidden rounded-[18px] border border-white/[0.08]">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:px-6">
          <span className="glass-tile tile-sky flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]">
            <NavIcon name="calls" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-[16px] font-medium tracking-[-0.01em] text-ink">{ready ? "Vardaan will ring your phone" : "Set up calling"}</h2>
              {agentStatus && (
                <span className="flex items-center gap-1.5 text-[12px] text-ink/50">
                  <span className={`h-1.5 w-1.5 rounded-full ${AGENT_STATUS_COLORS[agentStatus.status] ?? "bg-white/30"} ${agentStatus.status === "Executing Task" || agentStatus.status === "On Call" ? "animate-pulse" : ""}`} />
                  {agentStatus.status}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-[13px] leading-[20px] text-ink/55">
              {ready ? (
                <>
                  Rings <span className="text-ink/85">{profile.phone}</span> in {lang}. You can also call{" "}
                  <span className="text-ink/85">{status?.phoneNumber}</span> any time.
                </>
              ) : (
                "Two steps, then Vardaan can ring you and you can call it."
              )}
            </p>
          </div>
          {ready ? (
            <button
              onClick={onCall}
              className="mic-button flex h-10 shrink-0 cursor-pointer items-center justify-center gap-2 self-start rounded-full px-5 text-[14px] font-medium text-[#0b1626] sm:self-auto"
            >
              <Icon name="phone" className="h-4 w-4" />
              Call me
            </button>
          ) : (
            <div className="flex shrink-0 items-center gap-3 sm:w-[150px] sm:flex-col sm:items-end sm:gap-2">
              <span className="text-[12px] text-ink/50 tabular-nums">{setup.filter((s) => s.done).length} of {setup.length} complete</span>
              <span className="h-1 w-24 overflow-hidden rounded-full bg-white/[0.08] sm:w-full">
                <span
                  className="block h-full rounded-full bg-[#8ccbff] transition-[width] duration-500"
                  style={{ width: `${(setup.filter((s) => s.done).length / setup.length) * 100}%` }}
                />
              </span>
            </div>
          )}
        </div>

        {!ready && (
          <ol className="grid border-t border-white/[0.07] sm:grid-cols-2 sm:divide-x sm:divide-white/[0.07]">
            {setup.map((s, i) => (
              <li key={s.title} className={`flex items-center gap-3.5 px-5 py-4 sm:px-6 ${i ? "border-t border-white/[0.07] sm:border-t-0" : ""}`}>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11.5px] font-medium tabular-nums ${
                    s.done ? "bg-[#8fcf3c]/15 text-[#c9e877]" : "border border-white/15 text-ink/60"
                  }`}
                >
                  {s.done ? (
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden>
                      <path d="m3.5 8.5 3 3 6-7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13.5px] ${s.done ? "text-ink/60" : "text-ink"}`}>{s.title}</p>
                  <p className="mt-0.5 truncate text-[12.5px] text-ink/45">{s.detail}</p>
                </div>
                {s.done ? (
                  <span className="shrink-0 text-[12px] text-[#c9e877]/80">Done</span>
                ) : (
                  <button
                    onClick={() => onView(s.view)}
                    className="h-8 shrink-0 cursor-pointer rounded-[9px] border border-white/[0.12] bg-white/[0.05] px-3 text-[12.5px] font-medium text-ink transition hover:border-white/25 hover:bg-white/[0.09]"
                  >
                    {s.action}
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <button key={s.label} onClick={() => onView(s.view)} className="app-panel group cursor-pointer p-5 text-left transition hover:border-white/20 hover:bg-white/[0.035]">
            <div className="flex items-center justify-between">
              <p className="text-[13px] text-ink/60">{s.label}</p>
              <span className={`flex h-8 w-8 items-center justify-center rounded-[9px] ${s.tone}`}>
                <Icon name={s.icon} className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 text-[30px] font-medium leading-none tracking-[-0.02em] text-ink tabular-nums">{s.value}</p>
            <p className="mt-2 truncate text-[12px] text-ink/40">{s.hint}</p>
          </button>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section>
          <SectionLabel>Recent activity</SectionLabel>
          {activity.length ? (
            <ol className="app-panel relative px-5 py-2">
              {activity.map((a, i) => (
                <li key={i} className="relative flex gap-4 py-4">
                  {i < activity.length - 1 && <span className="absolute bottom-[-16px] left-4 top-[52px] w-px bg-white/[0.08]" />}
                  <span className={`relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-[#1a1918] ${a.tone}`}>
                    <Icon name={a.icon} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[14px] leading-[21px] text-ink">{a.title}</p>
                      <span className="shrink-0 text-[12px] text-ink/45">{when(a.at)}</span>
                    </div>
                    {a.detail && <p className="mt-0.5 line-clamp-2 text-[13px] leading-[20px] text-ink/55">{a.detail}</p>}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <Empty icon="overview">No activity yet. Press Call me and tell Vardaan what you need. Every call, task and message shows up here.</Empty>
          )}
        </section>

        <aside>
          <SectionLabel>Needs you</SectionLabel>
          <div className="space-y-3">
            {needing.length ? (
              needing.map((t) => <TaskCard key={t.id} task={t} onChange={onChange} onToast={onToast} />)
            ) : (
              <Empty icon="check">Nothing is waiting on you. When Vardaan has a question or a draft to approve, it shows up here and you get a text.</Empty>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---- Calls -------------------------------------------------------------------------------------

function Calls({ calls, tasks, onCall, onToast }: { calls: CallLog[]; tasks: Task[]; onCall: () => void; onToast: (t: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div>
      <PageTitle
        title="Calls"
        sub="Every call between you and Vardaan, with the full transcript and anything it handed off."
        action={
          <button onClick={onCall} className="waitlist-button flex h-10 cursor-pointer items-center gap-2 rounded-[10px] px-4 text-[14px]">
            <Icon name="phone" className="h-4 w-4" />
            Call me
          </button>
        }
      />
      {calls.length === 0 ? (
        <Empty icon="phone">No calls yet. Press Call me, or call your Vardaan number from your phone.</Empty>
      ) : (
        <div className="app-panel overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,1fr)_140px_90px_110px] gap-4 border-b border-white/[0.07] bg-white/[0.02] px-5 py-2.5 text-[11px] uppercase tracking-[0.12em] text-ink/40 md:grid">
            <span>Call</span>
            <span>When</span>
            <span>Length</span>
            <span>Status</span>
          </div>
        <ul className="divide-y divide-white/[0.06]">
          {calls.map((c) => {
            const s = CALL_STATUS[c.status];
            const isOpen = open === c.id;
            return (
              <li key={c.id} className={isOpen ? "bg-white/[0.015]" : ""}>
                <button
                  onClick={() => setOpen(isOpen ? null : c.id)}
                  aria-expanded={isOpen}
                  className="grid w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 text-left transition hover:bg-white/[0.025] md:grid-cols-[minmax(0,1fr)_140px_90px_110px]"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${c.direction === "inbound" ? TONE.text : TONE.call}`}>
                      <Icon name="phone" className={`h-4 w-4 ${c.direction === "inbound" ? "-scale-x-100" : ""}`} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[14px] text-ink">{c.reason}</p>
                      <p className="truncate text-[12px] text-ink/45">
                        {c.direction === "inbound" ? "Incoming" : "Outgoing"} Â· {c.phone}
                        <span className="md:hidden"> Â· {when(c.startedAt)}</span>
                      </p>
                    </div>
                  </div>
                  <span className="hidden text-[13px] text-ink/60 md:block">{when(c.startedAt)}</span>
                  <span className="hidden text-[13px] tabular-nums text-ink/60 md:block">{duration(c.durationSec) || "â€“"}</span>
                  <span>
                    <Pill tone={s.tone}>{s.label}</Pill>
                  </span>
                </button>
                {isOpen && (
                  <div className="space-y-3 px-5 pb-5 pt-1 sm:pl-[72px]">
                    {c.error && <p className="text-[13px] text-[#ffb4a8]">{c.error}</p>}
                    {c.turns.length ? (
                      c.turns.map((t, i) => (
                        <div key={i} className={`flex ${t.role === "user" ? "justify-end" : ""}`}>
                          <p className={`max-w-[80%] rounded-[12px] px-3.5 py-2 text-[14px] leading-[21px] ${t.role === "user" ? "bg-[#8ccbff] text-[#0b1626]" : "bg-white/[0.06] text-ink"}`}>
                            {t.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[13px] text-ink/50">No conversation recorded.</p>
                    )}
                    {c.taskIds.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[12px] uppercase tracking-[0.12em] text-mute">Handed off on this call</p>
                        <ul className="mt-2 space-y-1.5 text-[13px] text-ink/70">
                          {c.taskIds.map((id) => {
                            const t = tasks.find((x) => x.id === id);
                            return t ? (
                              <li key={id} className="flex items-center gap-2">
                                <span className={`h-1.5 w-1.5 rounded-full ${STATUS[t.status].dot}`} />
                                {t.request} Â· {STATUS[t.status].label}
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        </div>
      )}
    </div>
  );
}

// ---- Tasks -------------------------------------------------------------------------------------

function Tasks({ tasks, onChange, onToast }: { tasks: Task[]; onChange: () => void; onToast: (t: string) => void }) {
  const [filter, setFilter] = useState<"all" | "needs" | "working" | "done">("all");
  const [text, setText] = useState("");
  const filters = [
    { id: "all", label: "All", match: () => true },
    { id: "needs", label: "Needs you", match: needsYou },
    { id: "working", label: "In progress", match: inProgress },
    { id: "done", label: "Done", match: (t: Task) => t.status === "done" || t.status === "failed" },
  ] as const;
  const shown = tasks.filter(filters.find((f) => f.id === filter)!.match);

  async function handOff(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/tasks", { method: "POST", body: JSON.stringify({ request: text }) });
      setText("");
      onToast("Handed off. Vardaan is working on it.");
      onChange();
    } catch (err) {
      onToast((err as Error).message);
    }
  }

  return (
    <div className="space-y-5">
      <PageTitle title="Tasks" sub="Work handed to Vardaan on calls or here. It plans, asks when unsure, and waits for your approval." />
      <form onSubmit={handOff} className="app-panel flex flex-col gap-3 p-4 sm:flex-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Hand off a task by typing, e.g. Email my landlord the tap is leaking"
          className="auth-input h-12 min-w-0 flex-1 rounded-[12px] px-4 text-[15px] text-ink outline-none placeholder:text-ink/35"
        />
        <button disabled={!text.trim()} className="waitlist-button h-12 cursor-pointer rounded-[12px] px-5 text-[14px] disabled:opacity-50">
          Hand off
        </button>
      </form>
      <div role="tablist" className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[13px] transition ${filter === f.id ? "bg-white text-black" : "bg-white/[0.05] text-ink/70 hover:text-ink"}`}
          >
            {f.label}
            <span className="ml-1.5 tabular-nums opacity-60">{tasks.filter(f.match).length}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {shown.map((t) => (
          <TaskCard key={t.id} task={t} onChange={onChange} onToast={onToast} />
        ))}
      </div>
      {shown.length === 0 && <Empty>Nothing here.</Empty>}
    </div>
  );
}

// ---- Messages ----------------------------------------------------------------------------------

function Messages({ messages }: { messages: MessageLog[] }) {
  return (
    <div>
      <PageTitle title="Messages" sub="Updates Vardaan sent you (emailed too, if email is set up). Approve drafts and answer questions from Tasks." />
      {messages.length === 0 ? (
        <Empty>No messages yet. Vardaan texts you when a task is done or needs you.</Empty>
      ) : (
        <ul className="app-panel space-y-3 p-5">
          {[...messages].reverse().map((m) => (
            <li key={m.id} className={`flex ${m.direction === "inbound" ? "justify-end" : ""}`}>
              <div className="max-w-[80%]">
                <p className={`whitespace-pre-wrap rounded-[12px] px-3.5 py-2 text-[14px] leading-[21px] ${m.direction === "inbound" ? "bg-[#8ccbff] text-[#0b1626]" : "bg-white/[0.06] text-ink"}`}>
                  {m.body}
                </p>
                <p className={`mt-1 text-[11px] text-ink/45 ${m.direction === "inbound" ? "text-right" : ""}`}>
                  {when(m.createdAt)}
                  {m.status === "failed" && <span className="text-[#ffb4a8]"> Â· not delivered: {m.error}</span>}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---- Memory ------------------------------------------------------------------------------------

function MemoryView({ memories, onChange }: { memories: Memory[]; onChange: () => void }) {
  const [fact, setFact] = useState("");
  async function add(e: React.FormEvent) {
    e.preventDefault();
    await api("/api/memories", { method: "POST", body: JSON.stringify({ fact }) }).catch(() => {});
    setFact("");
    onChange();
  }
  return (
    <div className="space-y-5">
      <PageTitle title="Memory" sub="What Vardaan remembers about you, so it doesn't have to ask twice." />
      <form onSubmit={add} className="app-panel flex flex-col gap-3 p-4 sm:flex-row">
        <input
          value={fact}
          onChange={(e) => setFact(e.target.value)}
          placeholder="Teach Vardaan something, e.g. My landlord is Mr Sen, landlord@example.com"
          className="auth-input h-12 min-w-0 flex-1 rounded-[12px] px-4 text-[15px] text-ink outline-none placeholder:text-ink/35"
        />
        <button disabled={!fact.trim()} className="waitlist-button h-12 cursor-pointer rounded-[12px] px-5 text-[14px] disabled:opacity-50">
          Remember
        </button>
      </form>
      <ul className="app-panel divide-y divide-white/[0.06]">
        {memories.map((m) => (
          <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="text-[15px] text-ink/85">{m.fact}</span>
            <button
              onClick={async () => {
                await fetch(`/api/memories/${m.id}`, { method: "DELETE" });
                onChange();
              }}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[13px] text-ink/50 hover:text-ink"
            >
              <Icon name="trash" className="h-4 w-4" />
              Forget
            </button>
          </li>
        ))}
        {memories.length === 0 && <li className="px-5 py-6 text-[14px] text-ink/55">Nothing yet. Tell Vardaan on a call, or add something above.</li>}
      </ul>
    </div>
  );
}

// ---- Reminders ---------------------------------------------------------------------------------

function RemindersView({ reminders, hasPhone, phoneReady, onChange }: { reminders: Reminder[]; hasPhone: boolean; phoneReady: boolean; onChange: () => void }) {
  const [title, setTitle] = useState("");
  const [at, setAt] = useState("");
  const [err, setErr] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api("/api/reminders", { method: "POST", body: JSON.stringify({ title, dueAt: at ? new Date(at).toISOString() : undefined }) });
      setTitle("");
      setAt("");
      onChange();
    } catch (error) {
      setErr((error as Error).message);
    }
  }

  const sorted = [...reminders].sort((a, b) => (a.dueAt ? Date.parse(a.dueAt) : Infinity) - (b.dueAt ? Date.parse(b.dueAt) : Infinity));

  return (
    <div className="space-y-5">
      <PageTitle
        title="Reminders"
        sub={phoneReady && hasPhone ? "When a reminder is due, Vardaan phones you about it." : "Connect your phone in Settings and Vardaan will phone you when a reminder is due."}
      />
      <form onSubmit={add} className="app-panel grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What should Vardaan call you about?"
          className="auth-input h-12 min-w-0 rounded-[12px] px-4 text-[15px] text-ink outline-none placeholder:text-ink/35"
        />
        <input
          type="datetime-local"
          value={at}
          onChange={(e) => setAt(e.target.value)}
          className="auth-input h-12 rounded-[12px] px-3 text-[14px] text-ink outline-none [color-scheme:dark]"
        />
        <button disabled={!title.trim()} className="waitlist-button h-12 cursor-pointer rounded-[12px] px-5 text-[14px] disabled:opacity-50">
          Add reminder
        </button>
      </form>
      {err && <p className="text-[13px] text-[#ffb4a8]">{err}</p>}
      <ul className="app-panel divide-y divide-white/[0.06]">
        {sorted.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="flex items-start gap-3">
              <Icon name="bell" className={`mt-0.5 h-4 w-4 shrink-0 ${r.calledAt ? "text-ink/35" : "text-[#b9e0ff]"}`} />
              <div>
                <p className={`text-[15px] ${r.calledAt ? "text-ink/55" : "text-ink"}`}>{r.title}</p>
                <p className="text-[12px] text-ink/45">
                  {r.dueAt ? new Date(r.dueAt).toLocaleString() : "No time set"}
                  {r.calledAt && ` Â· called you ${when(r.calledAt)}`}
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                await fetch(`/api/reminders/${r.id}`, { method: "DELETE" });
                onChange();
              }}
              aria-label={`Delete reminder ${r.title}`}
              className="shrink-0 cursor-pointer text-ink/45 hover:text-ink"
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
          </li>
        ))}
        {reminders.length === 0 && <li className="px-5 py-6 text-[14px] text-ink/55">No reminders yet.</li>}
      </ul>
    </div>
  );
}

// ---- Settings ----------------------------------------------------------------------------------

function Settings({
  profile,
  status,
  onSaved,
  onToast,
  onStatusChange,
}: {
  profile: Profile;
  status: Status | null;
  onSaved: (p: Profile) => void;
  onToast: (t: string) => void;
  onStatusChange: () => void;
}) {
  const [phone, setPhone] = useState(profile.phone);
  const [lang, setLang] = useState(profile.lang);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [origin, setOrigin] = useState("https://your-public-url");

  useEffect(() => {
    setPhone(profile.phone);
    setLang(profile.lang);
  }, [profile]);

  useEffect(() => setOrigin(window.location.origin), []);

  async function disconnectGoogle() {
    try {
      await api("/api/google/disconnect", { method: "POST" });
      onToast("Google disconnected.");
      onStatusChange();
    } catch (error) {
      onToast((error as Error).message);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const saved = await api<Profile>("/api/profile", { method: "POST", body: JSON.stringify({ phone, lang }) });
      onSaved(saved);
      onToast("Saved.");
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const dirty = phone !== profile.phone || lang !== profile.lang;
  const base = status?.publicUrl ? "PUBLIC_URL" : origin;
  const code = "rounded-[5px] bg-white/[0.07] px-1.5 py-0.5 font-mono text-[12px] text-ink/85";

  const checks: { label: string; ok: boolean; optional?: boolean; detail: string; tile: string; icon: React.ReactNode }[] = [
    {
      label: "AI model",
      ok: Boolean(status?.ai),
      detail: status?.ai ? `Using ${status.ai}` : "Add GROQ_API_KEY (free) to .env.local",
      tile: "tile-violet",
      icon: <path d="M12 3.5 13.8 9l5.7 1.5-5.7 1.6L12 17.5l-1.8-5.4L4.5 10.5 10.2 9z" />,
    },
    {
      label: "Your phone number",
      ok: Boolean(profile.phone),
      detail: profile.phone || "Add it in Profile above",
      tile: "tile-sky",
      icon: (
        <>
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
          <path d="M10.5 18.5h3" />
        </>
      ),
    },
    {
      label: "Phone calls",
      ok: Boolean(status?.phone),
      detail: status?.phone ? `Sarvam line ${status.phoneNumber}` : "Add the SARVAM_* settings and PUBLIC_URL to .env.local",
      tile: "tile-leaf",
      icon: NAV_ICONS.calls,
    },
    {
      label: "Email sending",
      ok: Boolean(status?.email),
      optional: true,
      detail: status?.email ? "Sending through Gmail" : "Add Gmail SMTP settings to send approved emails",
      tile: "tile-rose",
      icon: (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2.5" />
          <path d="m4 7 8 6 8-6" />
        </>
      ),
    },
  ];

  return (
    <div>
      <PageTitle title="Settings" sub="Your phone, the language Vardaan speaks on calls, and what's connected." />

      <div className="mt-8 max-w-[1000px] divide-y divide-white/[0.07] border-t border-white/[0.07]">
        <SettingsSection title="Profile" sub="How Vardaan reaches you and the language it speaks on calls.">
          <form onSubmit={save} className="app-panel overflow-hidden">
            <div className="grid gap-5 p-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:p-6">
              <label className="block">
                <span className="text-[13px] font-medium text-ink/80">Mobile number</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="98765 43210"
                  className="auth-input mt-2 h-11 w-full rounded-[10px] px-3.5 text-[14px] text-ink outline-none placeholder:text-ink/35 tabular-nums"
                />
                <span className="mt-2 block text-[12px] leading-[18px] text-ink/45">Vardaan calls this number, and recognises you when you call from it.</span>
              </label>
              <label className="block">
                <span className="text-[13px] font-medium text-ink/80">Language on calls</span>
                <span className="relative mt-2 block">
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="auth-input h-11 w-full cursor-pointer appearance-none rounded-[10px] pl-3.5 pr-9 text-[14px] text-ink outline-none"
                  >
                    {CALL_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code} className="bg-[#1c1b1a]">
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45">
                    <path d="m4.5 6.5 3.5 3.5 3.5-3.5" />
                  </svg>
                </span>
              </label>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-white/[0.07] bg-black/15 px-5 py-3.5 sm:px-6">
              <p className={`text-[12.5px] ${err ? "text-[#ffb4a8]" : "text-ink/40"}`}>{err || (dirty ? "You have unsaved changes." : "All changes saved.")}</p>
              <button
                disabled={!dirty || saving}
                className="h-9 shrink-0 cursor-pointer rounded-[9px] bg-ink px-4 text-[13px] font-medium text-[#141312] transition hover:bg-white disabled:cursor-default disabled:bg-white/[0.08] disabled:text-ink/35"
              >
                {saving ? "Saving" : "Save changes"}
              </button>
            </div>
          </form>
        </SettingsSection>

        <SettingsSection title="Connections" sub="What Vardaan needs to think, call and send for you. Keys live in .env.local on the server.">
          <ul className="app-panel divide-y divide-white/[0.06]">
            {checks.map((c) => (
              <li key={c.label} className="flex items-center gap-3.5 px-5 py-3.5">
                <span className={`glass-tile nav-tile ${c.tile} flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${c.ok ? "" : "opacity-60"}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4">
                    {c.icon}
                  </svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] text-ink">{c.label}</p>
                  <p className="truncate text-[12.5px] text-ink/50">{c.detail}</p>
                </div>
                <SettingsBadge ok={c.ok} label={c.ok ? "Connected" : c.optional ? "Optional" : "Not set up"} />
              </li>
            ))}
          </ul>
        </SettingsSection>

        <SettingsSection title="Apps" sub="Extra abilities Vardaan can use while it works on your tasks.">
          <ul className="app-panel divide-y divide-white/[0.06]">
            <li className="flex items-center gap-3.5 px-5 py-3.5">
              <span className={`glass-tile nav-tile tile-amber flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] ${status?.google?.connected ? "" : "opacity-60"}`}>
                <NavIcon name="reminders" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] text-ink">Google Calendar and Gmail</p>
                <p className="text-[12.5px] leading-[18px] text-ink/50">
                  {status?.google?.connected
                    ? `Connected as ${status.google.email}. Reads your calendar and email, and books events with invites.`
                    : status?.google?.configured
                      ? "Read your calendar, book events with invites, and read your email."
                      : "Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env.local first."}
                </p>
              </div>
              {status?.google?.connected ? (
                <button onClick={disconnectGoogle} className="h-8 shrink-0 cursor-pointer rounded-[9px] border border-white/[0.12] px-3 text-[12.5px] text-ink/80 transition hover:bg-white/[0.06]">
                  Disconnect
                </button>
              ) : status?.google?.configured ? (
                <a href="/api/google/connect" className="flex h-8 shrink-0 items-center rounded-[9px] bg-ink px-3 text-[12.5px] font-medium text-[#141312] transition hover:bg-white">
                  Connect
                </a>
              ) : (
                <SettingsBadge ok={false} label="Not set up" />
              )}
            </li>
            <li className="flex items-center gap-3.5 px-5 py-3.5">
              <span className="glass-tile nav-tile tile-sky flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4">
                  <path d="M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9.5a4.5 4.5 0 0 0 0 9z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] text-ink">Live weather</p>
                <p className="text-[12.5px] text-ink/50">Free with Open-Meteo. Ask &quot;Will it rain in Pune tomorrow?&quot;</p>
              </div>
              <SettingsBadge ok label="Always on" />
            </li>
          </ul>
        </SettingsSection>

        <SettingsSection title="Calling setup" sub="Connect a Sarvam phone number so Vardaan can call you. Full guide in docs/SARVAM_SETUP.md.">
          <ol className="app-panel divide-y divide-white/[0.06]">
            {[
              <>In the Sarvam dashboard, add wallet credit, complete KYC and rent a phone number from Deploy, Phone Numbers.</>,
              <>
                Give this app a stable public address, such as a free ngrok static domain. Put it in <code className={code}>PUBLIC_URL</code> in .env.local with your{" "}
                <code className={code}>SARVAM_*</code> settings, then restart the app.
              </>,
              <>
                Create a voice agent with an API tool named <code className={code}>ask_vardaan</code> and point it and the call webhook at:
                <span className="mt-2.5 block space-y-1.5">
                  {[
                    ["Tool (POST)", `${base}/api/sarvam/turn`],
                    ["Webhook", `${base}/api/sarvam/webhook?token=SARVAM_WEBHOOK_SECRET`],
                  ].map(([k, v]) => (
                    <span key={k} className="flex flex-col gap-1 rounded-[9px] border border-white/[0.06] bg-black/25 px-3 py-2 sm:flex-row sm:gap-3">
                      <span className="w-[84px] shrink-0 text-[11.5px] uppercase tracking-[0.06em] text-ink/40">{k}</span>
                      <span className="break-all font-mono text-[12px] text-ink/85">{v}</span>
                    </span>
                  ))}
                </span>
              </>,
              <>Save your number in Profile and press Call me.</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3.5 px-5 py-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 text-[11.5px] font-medium text-ink/60 tabular-nums">{i + 1}</span>
                <p className="min-w-0 flex-1 pt-0.5 text-[13px] leading-[21px] text-ink/70">{step}</p>
              </li>
            ))}
          </ol>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-4 py-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
      <div>
        <h2 className="text-[15px] font-medium text-ink">{title}</h2>
        <p className="mt-1 text-[13px] leading-[20px] text-ink/50">{sub}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function SettingsBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] ${ok ? "border-[#8fcf3c]/30 bg-[#8fcf3c]/12 text-[#c9e877]" : "border-white/10 bg-white/[0.05] text-ink/55"}`}
    >
      {label}
    </span>
  );
}
