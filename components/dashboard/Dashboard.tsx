"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import TaskCard, { STATUS, inProgress, needsYou } from "@/components/dashboard/TaskCard";
import { api } from "@/components/dashboard/api";
import Icon from "@/components/docs/Icon";
import type { IconName } from "@/lib/docs-content";
import type { CallLog, Memory, MessageLog, Reminder, Task } from "@/lib/db";

type View = "overview" | "calls" | "tasks" | "messages" | "memory" | "reminders" | "settings";

const NAV: { id: View; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "home" },
  { id: "calls", label: "Calls", icon: "phone" },
  { id: "tasks", label: "Tasks", icon: "capabilities" },
  { id: "messages", label: "Messages", icon: "talk" },
  { id: "memory", label: "Memory", icon: "agent" },
  { id: "reminders", label: "Reminders", icon: "bell" },
  { id: "settings", label: "Settings", icon: "config" },
];

type Data = { tasks: Task[]; memories: Memory[]; reminders: Reminder[]; calls: CallLog[]; messages: MessageLog[] };
type Profile = { phone: string; lang: string };
type Status = { ai: string | null; phone: boolean; twilioNumber: string | null; publicUrl: boolean; email: boolean };

const CALL_LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "हिन्दी Hindi" },
  { code: "bn-IN", label: "বাংলা Bengali" },
  { code: "ta-IN", label: "தமிழ் Tamil" },
  { code: "te-IN", label: "తెలుగు Telugu" },
  { code: "mr-IN", label: "मराठी Marathi" },
  { code: "gu-IN", label: "ગુજરાતી Gujarati" },
  { code: "kn-IN", label: "ಕನ್ನಡ Kannada" },
  { code: "ml-IN", label: "മലയാളം Malayalam" },
  { code: "pa-IN", label: "ਪੰਜਾਬੀ Punjabi" },
  { code: "en-US", label: "English (US)" },
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

export default function Dashboard({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const [view, setView] = useState<View>("overview");
  const [data, setData] = useState<Data>({ tasks: [], memories: [], reminders: [], calls: [], messages: [] });
  const [profile, setProfile] = useState<Profile>({ phone: "", lang: "en-IN" });
  const [status, setStatus] = useState<Status | null>(null);
  const [toast, setToast] = useState("");

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
  }, [refresh]);

  // Poll faster while a call or task is in progress.
  const busy = data.tasks.some(inProgress) || data.calls.some(live);
  useEffect(() => {
    const t = setInterval(refresh, busy ? 2500 : 12000);
    return () => clearInterval(t);
  }, [busy, refresh]);

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
      showToast(`Calling ${profile.phone}… pick up your phone.`);
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
          <Icon name="phone" className="h-[18px] w-[18px]" />
          Call me
        </button>
        <nav aria-label="Dashboard" className="mt-7 space-y-0.5">
          <p className="px-3 pb-2 text-[11px] uppercase tracking-[0.16em] text-ink/35">Workspace</p>
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              aria-current={view === n.id ? "page" : undefined}
              className={`relative flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] transition ${
                view === n.id ? "bg-white/[0.07] text-ink" : "text-ink/60 hover:bg-white/[0.035] hover:text-ink"
              }`}
            >
              {view === n.id && <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-[#8ccbff]" />}
              <Icon name={n.icon} className={`h-[18px] w-[18px] ${view === n.id ? "text-[#b9e0ff]" : ""}`} />
              {n.label}
              {!!badge[n.id] && (
                <span className="ml-auto min-w-[20px] rounded-full bg-[#f6e27a]/15 px-1.5 text-center text-[11px] tabular-nums leading-[18px] text-[#f6e27a]">{badge[n.id]}</span>
              )}
            </button>
          ))}
          <p className="px-3 pb-2 pt-6 text-[11px] uppercase tracking-[0.16em] text-ink/35">Help</p>
          <Link href="/docs" className="flex items-center gap-3 rounded-[10px] px-3 py-2 text-[14px] text-ink/60 transition hover:bg-white/[0.035] hover:text-ink">
            <Icon name="roadmap" className="h-[18px] w-[18px]" />
            Docs
          </Link>
        </nav>
        <div className="mt-auto flex items-center gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#8ccbff]/15 text-[13px] font-medium text-[#b9e0ff]">{initials(user.name)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-ink">{user.name}</p>
            <p className="truncate text-[12px] text-ink/45">{profile.phone || user.email}</p>
          </div>
          <button onClick={logout} aria-label="Log out" title="Log out" className="shrink-0 cursor-pointer rounded-[8px] p-1.5 text-ink/50 transition hover:bg-white/[0.06] hover:text-ink">
            <Icon name="logout" className="h-4 w-4" />
          </button>
        </div>
      </aside>

      <header className="nav-grid lg:hidden">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-poster text-[17px] font-semibold uppercase tracking-[0.02em] text-ink">Vardaan</span>
            <span className="beta-glass">Beta</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={callMe} className="waitlist-button flex h-8 cursor-pointer items-center gap-1.5 rounded-[8px] px-3 text-[12px]">
              <Icon name="phone" className="h-4 w-4" />
              Call me
            </button>
            <button onClick={logout} aria-label="Log out" className="cursor-pointer text-ink/60 hover:text-ink">
              <Icon name="logout" className="h-5 w-5" />
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
        {view === "overview" && <Overview user={user} data={data} profile={profile} status={status} onCall={callMe} onView={setView} onChange={refresh} />}
        {view === "calls" && <Calls calls={data.calls} tasks={data.tasks} onCall={callMe} />}
        {view === "tasks" && <Tasks tasks={data.tasks} onChange={refresh} onToast={showToast} />}
        {view === "messages" && <Messages messages={data.messages} />}
        {view === "memory" && <MemoryView memories={data.memories} onChange={refresh} />}
        {view === "reminders" && <RemindersView reminders={data.reminders} hasPhone={Boolean(profile.phone)} phoneReady={Boolean(status?.phone)} onChange={refresh} />}
        {view === "settings" && <Settings profile={profile} status={status} onSaved={setProfile} onToast={showToast} />}
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

function Overview({
  user,
  data,
  profile,
  status,
  onCall,
  onView,
  onChange,
}: {
  user: { name: string };
  data: Data;
  profile: Profile;
  status: Status | null;
  onCall: () => void;
  onView: (v: View) => void;
  onChange: () => void;
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
      detail: `${CALL_STATUS[c.status].label}${c.durationSec ? ` · ${duration(c.durationSec)}` : ""}${c.taskIds.length ? ` · ${c.taskIds.length} task handed off` : ""}`,
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

  return (
    <div className="space-y-8">
      <PageTitle title={`${hello}, ${user.name.split(" ")[0]}.`} sub="Everything Vardaan has done for you, in one place." />

      <section className="call-hero relative overflow-hidden rounded-[20px] border border-white/10 p-6 sm:p-8">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-[540px]">
            <div className="flex flex-wrap items-center gap-2 text-[12px]">
              <StatusChip ok={ready} label={ready ? "Calling ready" : "Calling not set up"} />
              {ready && <StatusChip ok label={`Speaks ${lang}`} />}
            </div>
            <h2 className="mt-4 text-[clamp(22px,2.6vw,30px)] font-medium leading-tight tracking-[-0.02em] text-ink">
              {ready ? "Vardaan will ring your phone." : "Set up calling to your phone."}
            </h2>
            <p className="mt-2 text-[14px] leading-[22px] text-ink/65">
              {ready ? (
                <>
                  Press Call me and Vardaan rings <span className="text-ink">{profile.phone}</span>. Talk, or tell it what to do and hang
                  up. You can also call <span className="text-ink">{status?.twilioNumber}</span> any time.
                </>
              ) : (
                "Add your number in Settings and connect Twilio. Then Vardaan can call you, you can call it, and it texts you updates."
              )}
            </p>
          </div>
          <button
            onClick={ready ? onCall : () => onView("settings")}
            className="mic-button flex h-14 shrink-0 cursor-pointer items-center justify-center gap-2.5 self-start rounded-full px-7 text-[15px] font-medium text-[#0b1626] sm:self-auto"
          >
            <Icon name={ready ? "phone" : "config"} className="h-5 w-5" />
            {ready ? "Call me" : "Set up"}
          </button>
        </div>
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
              needing.map((t) => <TaskCard key={t.id} task={t} onChange={onChange} />)
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

function Calls({ calls, tasks, onCall }: { calls: CallLog[]; tasks: Task[]; onCall: () => void }) {
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
                        {c.direction === "inbound" ? "Incoming" : "Outgoing"} · {c.phone}
                        <span className="md:hidden"> · {when(c.startedAt)}</span>
                      </p>
                    </div>
                  </div>
                  <span className="hidden text-[13px] text-ink/60 md:block">{when(c.startedAt)}</span>
                  <span className="hidden text-[13px] tabular-nums text-ink/60 md:block">{duration(c.durationSec) || "–"}</span>
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
                                {t.request} · {STATUS[t.status].label}
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
          <TaskCard key={t.id} task={t} onChange={onChange} />
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
      <PageTitle title="Messages" sub="Texts Vardaan sent you, and your replies. Reply YES to approve a draft, or answer its question." />
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
                  {m.status === "failed" && <span className="text-[#ffb4a8]"> · not delivered: {m.error}</span>}
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
                  {r.calledAt && ` · called you ${when(r.calledAt)}`}
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
}: {
  profile: Profile;
  status: Status | null;
  onSaved: (p: Profile) => void;
  onToast: (t: string) => void;
}) {
  const [phone, setPhone] = useState(profile.phone);
  const [lang, setLang] = useState(profile.lang);
  const [err, setErr] = useState("");
  const [origin, setOrigin] = useState("https://your-public-url");

  useEffect(() => {
    setPhone(profile.phone);
    setLang(profile.lang);
  }, [profile]);

  useEffect(() => setOrigin(window.location.origin), []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      const saved = await api<Profile>("/api/profile", { method: "POST", body: JSON.stringify({ phone, lang }) });
      onSaved(saved);
      onToast("Saved.");
    } catch (error) {
      setErr((error as Error).message);
    }
  }

  const checks: { label: string; ok: boolean; detail: string }[] = [
    { label: "AI model", ok: Boolean(status?.ai), detail: status?.ai ? `Connected: ${status.ai}` : "Add GROQ_API_KEY (free) to .env.local" },
    { label: "Your phone number", ok: Boolean(profile.phone), detail: profile.phone || "Add it below" },
    {
      label: "Twilio (calls and SMS)",
      ok: Boolean(status?.phone),
      detail: status?.phone ? `Connected: ${status.twilioNumber}` : "Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER and PUBLIC_URL",
    },
    { label: "Email sending", ok: Boolean(status?.email), detail: status?.email ? "Connected" : "Optional: add Gmail SMTP settings" },
  ];

  return (
    <div className="space-y-8">
      <PageTitle title="Settings" sub="Your phone, the language Vardaan speaks on calls, and what's connected." />

      <form onSubmit={save} className="app-panel max-w-[760px] p-6">
        <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_240px]">
        <label className="block">
          <span className="text-[13px] text-ink/70">Your mobile number</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            className="auth-input mt-1.5 h-12 w-full rounded-[12px] px-4 text-[15px] text-ink outline-none placeholder:text-ink/35"
          />
          <span className="mt-1.5 block text-[12px] text-ink/45">Vardaan calls and texts this number, and recognises you when you call from it.</span>
        </label>
        <label className="block">
          <span className="text-[13px] text-ink/70">Language on calls</span>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="auth-input mt-1.5 h-12 w-full rounded-[12px] px-3 text-[15px] text-ink">
            {CALL_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-[#1c1b1a]">
                {l.label}
              </option>
            ))}
          </select>
        </label>
        </div>
        {err && <p className="mt-4 text-[13px] text-[#ffb4a8]">{err}</p>}
        <div className="mt-6 flex items-center justify-end border-t border-white/[0.07] pt-5">
          <button className="waitlist-button h-10 cursor-pointer rounded-[10px] px-5 text-[14px]">Save changes</button>
        </div>
      </form>

      <section className="max-w-[760px]">
        <SectionLabel>Connections</SectionLabel>
        <ul className="app-panel divide-y divide-white/[0.06]">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-3 px-5 py-4">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${c.ok ? "bg-[#8fcf3c]/20 text-[#c9e877]" : "bg-white/[0.08] text-ink/40"}`}>
                {c.ok ? <Icon name="check" className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
              </span>
              <div className="min-w-0">
                <p className="text-[14px] text-ink">{c.label}</p>
                <p className="break-words text-[13px] text-ink/55">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-[760px]">
        <SectionLabel>Twilio setup</SectionLabel>
        <ol className="app-panel space-y-4 p-6 text-[14px] leading-[22px] text-ink/70">
          <li>
            <span className="text-ink">1.</span> Create a free trial at twilio.com, verify your own mobile number, and get a Twilio phone number.
          </li>
          <li>
            <span className="text-ink">2.</span> Run <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-ink">ngrok http 3000</code> and copy its https address into <code className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[13px] text-ink">PUBLIC_URL</code> in .env.local, with your Twilio keys. Restart the app.
          </li>
          <li>
            <span className="text-ink">3.</span> In Twilio, open your number and set these webhooks (method POST):
            <div className="mt-2 space-y-1.5 font-mono text-[12.5px] text-ink/85">
              <p className="break-all rounded-[8px] bg-black/30 px-3 py-2">A call comes in → {status?.publicUrl ? "PUBLIC_URL" : origin}/api/voice/incoming</p>
              <p className="break-all rounded-[8px] bg-black/30 px-3 py-2">A message comes in → {status?.publicUrl ? "PUBLIC_URL" : origin}/api/sms/incoming</p>
            </div>
          </li>
          <li>
            <span className="text-ink">4.</span> Save your number above and press Call me.
          </li>
        </ol>
      </section>
    </div>
  );
}
