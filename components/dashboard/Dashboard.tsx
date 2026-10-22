"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import CallScreen, { type Incoming } from "@/components/dashboard/CallScreen";
import TaskCard, { STATUS, inProgress, needsYou } from "@/components/dashboard/TaskCard";
import { api } from "@/components/dashboard/api";
import Icon from "@/components/docs/Icon";
import type { IconName } from "@/lib/docs-content";
import type { Memory, Reminder, Task } from "@/lib/db";

type View = "home" | "tasks" | "memory" | "reminders";

const NAV: { id: View; label: string; icon: IconName }[] = [
  { id: "home", label: "Home", icon: "home" },
  { id: "tasks", label: "Tasks", icon: "capabilities" },
  { id: "memory", label: "Memory", icon: "agent" },
  { id: "reminders", label: "Reminders", icon: "bell" },
];

const RUNG_KEY = "vardaan-rung-reminders";

function greeting(d: Date) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function Dashboard({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const firstName = user.name.split(" ")[0];
  const [view, setView] = useState<View>("home");
  const [lang, setLang] = useState("en-IN");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [call, setCall] = useState<{ incoming: Incoming | null } | null>(null);
  const [toast, setToast] = useState("");

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ tasks: Task[]; memories: Memory[]; reminders: Reminder[] }>("/api/tasks");
      setTasks(data.tasks);
      setMemories(data.memories);
      setReminders(data.reminders);
    } catch {
      /* keep the last good state */
    }
  }, []);

  useEffect(() => {
    refresh();
    try {
      const saved = localStorage.getItem("vardaan-lang");
      if (saved) setLang(saved);
    } catch {}
  }, [refresh]);

  const changeLang = (l: string) => {
    setLang(l);
    try {
      localStorage.setItem("vardaan-lang", l);
    } catch {}
  };

  // Poll while the agent is working in the background, and slowly otherwise to pick up changes.
  const busy = tasks.some(inProgress);
  useEffect(() => {
    const t = setInterval(refresh, busy ? 2500 : 15000);
    return () => clearInterval(t);
  }, [busy, refresh]);

  // Vardaan calls you: when a reminder comes due, ring like an incoming call (free, in the browser).
  const callRef = useRef(call);
  callRef.current = call;
  useEffect(() => {
    const check = () => {
      if (callRef.current) return;
      let rung: string[] = [];
      try {
        rung = JSON.parse(localStorage.getItem(RUNG_KEY) || "[]");
      } catch {}
      const due = reminders.find((r) => r.dueAt && Date.parse(r.dueAt) <= Date.now() && !rung.includes(r.id));
      if (!due) return;
      try {
        localStorage.setItem(RUNG_KEY, JSON.stringify([...rung, due.id]));
      } catch {}
      if (typeof Notification !== "undefined" && Notification.permission === "granted" && document.hidden) {
        new Notification("Vardaan is calling", { body: `Reminder: ${due.title}`, tag: due.id });
      }
      setCall({ incoming: { title: due.title } });
    };
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, [reminders]);

  function showToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(""), 4000);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const counts = {
    needs: tasks.filter(needsYou).length,
    working: tasks.filter(inProgress).length,
    done: tasks.filter((t) => t.status === "done").length,
    memories: memories.length,
  };

  return (
    <div className="min-h-svh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      {/* Sidebar (desktop) */}
      <aside className="nav-grid sticky top-0 hidden h-svh flex-col border-r px-4 py-6 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-3">
          <span className="font-poster text-[19px] font-semibold uppercase tracking-[0.02em] text-ink">Vardaan</span>
          <span className="beta-glass">Beta</span>
        </Link>
        <button
          onClick={() => setCall({ incoming: null })}
          className="waitlist-button mt-8 flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[12px] text-[14px]"
        >
          <Icon name="phone" className="h-[18px] w-[18px]" />
          Call Vardaan
        </button>
        <nav aria-label="Dashboard" className="mt-6 space-y-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setView(n.id)}
              aria-current={view === n.id ? "page" : undefined}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] transition ${
                view === n.id ? "bg-white/[0.08] text-ink" : "text-ink/60 hover:bg-white/[0.04] hover:text-ink"
              }`}
            >
              <Icon name={n.icon} className="h-[18px] w-[18px]" />
              {n.label}
              {n.id === "tasks" && counts.needs > 0 && (
                <span className="ml-auto rounded-full bg-[#f6e27a]/20 px-2 text-[11px] text-[#f6e27a]">{counts.needs}</span>
              )}
            </button>
          ))}
          <Link href="/docs" className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[14px] text-ink/60 transition hover:bg-white/[0.04] hover:text-ink">
            <Icon name="roadmap" className="h-[18px] w-[18px]" />
            Docs
          </Link>
        </nav>
        <div className="nav-grid mt-auto border-t px-3 pt-4">
          <p className="truncate text-[14px] text-ink">{user.name}</p>
          <p className="truncate text-[12px] text-ink/50">{user.email}</p>
          <button onClick={logout} className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] text-ink/60 hover:text-ink">
            <Icon name="logout" className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      {/* Top bar (phones and tablets) */}
      <header className="nav-grid flex items-center justify-between border-b px-4 py-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-poster text-[17px] font-semibold uppercase tracking-[0.02em] text-ink">Vardaan</span>
          <span className="beta-glass">Beta</span>
        </Link>
        <button onClick={logout} aria-label="Log out" className="cursor-pointer text-ink/60 hover:text-ink">
          <Icon name="logout" className="h-5 w-5" />
        </button>
      </header>

      <main className="min-w-0 px-4 pb-28 pt-6 sm:px-8 lg:px-12 lg:pb-12 lg:pt-10">
        {view === "home" && (
          <Home
            firstName={firstName}
            counts={counts}
            tasks={tasks}
            reminders={reminders}
            onCall={() => setCall({ incoming: null })}
            onView={setView}
            onChange={refresh}
            onToast={showToast}
          />
        )}
        {view === "tasks" && <Tasks tasks={tasks} onChange={refresh} onToast={showToast} />}
        {view === "memory" && <MemoryView memories={memories} onChange={refresh} />}
        {view === "reminders" && <RemindersView reminders={reminders} onChange={refresh} />}
      </main>

      {/* Bottom tab bar (phones) */}
      <nav aria-label="Dashboard" className="nav-grid fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-page/95 backdrop-blur lg:hidden">
        {NAV.slice(0, 2).map((n) => (
          <TabButton key={n.id} item={n} active={view === n.id} onClick={() => setView(n.id)} />
        ))}
        <div className="flex items-center justify-center">
          <button
            onClick={() => setCall({ incoming: null })}
            aria-label="Call Vardaan"
            className="mic-button -mt-6 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full text-[#0b1626]"
          >
            <Icon name="phone" className="h-6 w-6" />
          </button>
        </div>
        {NAV.slice(2).map((n) => (
          <TabButton key={n.id} item={n} active={view === n.id} onClick={() => setView(n.id)} />
        ))}
      </nav>

      {call && (
        <CallScreen
          firstName={firstName}
          lang={lang}
          onLangChange={changeLang}
          incoming={call.incoming}
          onEnd={({ startedTasks }) => {
            setCall(null);
            refresh();
            if (startedTasks) showToast(`Vardaan is working on ${startedTasks === 1 ? "your task" : `${startedTasks} tasks`}. Watch it under Tasks.`);
          }}
        />
      )}

      {toast && (
        <div role="status" className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full border border-white/10 bg-[#1f1e1c] px-4 py-2.5 text-[13px] text-ink shadow-[0_12px_30px_-10px_rgba(0,0,0,0.8)] lg:bottom-8">
          {toast}
        </div>
      )}
    </div>
  );
}

function TabButton({ item, active, onClick }: { item: (typeof NAV)[number]; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-current={active ? "page" : undefined} className={`flex cursor-pointer flex-col items-center gap-1 py-2.5 text-[11px] ${active ? "text-ink" : "text-ink/50"}`}>
      <Icon name={item.icon} className="h-5 w-5" />
      {item.label}
    </button>
  );
}

function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[clamp(26px,3vw,34px)] font-medium tracking-[-0.02em] text-ink">{title}</h1>
        {sub && <p className="mt-1.5 text-[14px] text-ink/55">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function Home({
  firstName,
  counts,
  tasks,
  reminders,
  onCall,
  onView,
  onChange,
  onToast,
}: {
  firstName: string;
  counts: { needs: number; working: number; done: number; memories: number };
  tasks: Task[];
  reminders: Reminder[];
  onCall: () => void;
  onView: (v: View) => void;
  onChange: () => void;
  onToast: (t: string) => void;
}) {
  // Time-of-day text uses the visitor's clock, so it's filled in after the page loads in the browser.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => setToday(new Date()), []);
  const needing = tasks.filter(needsYou);
  const upcoming = reminders
    .filter((r) => r.dueAt && Date.parse(r.dueAt) > Date.now())
    .sort((a, b) => Date.parse(a.dueAt!) - Date.parse(b.dueAt!))
    .slice(0, 4);

  return (
    <div className="space-y-8">
      <PageTitle
        title={`${today ? greeting(today) : "Welcome"}, ${firstName}.`}
        sub={today ? today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) : " "}
      />

      <section className="call-hero relative overflow-hidden rounded-[22px] border border-white/10 p-6 sm:p-8">
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-[480px]">
            <p className="text-[12px] uppercase tracking-[0.18em] text-[#b9e0ff]">Free call · in your browser</p>
            <h2 className="mt-2 text-[clamp(22px,2.6vw,30px)] font-medium leading-tight tracking-[-0.02em] text-ink">
              Talk to Vardaan. Hang up whenever you like.
            </h2>
            <p className="mt-2 text-[14px] leading-[22px] text-ink/65">
              Speak in your own language. Ask anything, or tell it what to do and hang up. It keeps working and
              you&apos;ll see the result here.
            </p>
          </div>
          <button
            onClick={onCall}
            className="mic-button flex h-16 shrink-0 cursor-pointer items-center justify-center gap-2.5 self-start rounded-full px-7 text-[15px] font-medium text-[#0b1626] sm:self-auto"
          >
            <Icon name="phone" className="h-5 w-5" />
            Call Vardaan
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Needs you", value: counts.needs, tone: "text-[#f6e27a]", view: "tasks" as View },
          { label: "In progress", value: counts.working, tone: "text-[#b9e0ff]", view: "tasks" as View },
          { label: "Done", value: counts.done, tone: "text-[#c9e877]", view: "tasks" as View },
          { label: "Remembered", value: counts.memories, tone: "text-ink", view: "memory" as View },
        ].map((s) => (
          <button key={s.label} onClick={() => onView(s.view)} className="app-panel cursor-pointer p-5 text-left transition hover:border-white/20">
            <p className={`text-[30px] font-medium leading-none tracking-[-0.02em] ${s.tone}`}>{s.value}</p>
            <p className="mt-2 text-[13px] text-ink/55">{s.label}</p>
          </button>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-4">
          <HandOff onChange={onChange} onToast={onToast} />
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] uppercase tracking-[0.14em] text-mute">{needing.length ? "Needs you" : "Recent tasks"}</h2>
              {tasks.length > 0 && (
                <button onClick={() => onView("tasks")} className="cursor-pointer text-[13px] text-ink/60 hover:text-ink">
                  View all
                </button>
              )}
            </div>
            <div className="mt-3 space-y-3">
              {(needing.length ? needing : tasks.slice(0, 3)).map((t) => (
                <TaskCard key={t.id} task={t} onChange={onChange} />
              ))}
              {tasks.length === 0 && (
                <p className="app-panel p-6 text-[14px] text-ink/55">No tasks yet. Call Vardaan or hand one off above.</p>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="app-panel p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[13px] uppercase tracking-[0.14em] text-mute">Upcoming</h2>
              <button onClick={() => onView("reminders")} className="cursor-pointer text-[13px] text-ink/60 hover:text-ink">
                Add
              </button>
            </div>
            {upcoming.length ? (
              <ul className="mt-4 space-y-3">
                {upcoming.map((r) => (
                  <li key={r.id} className="flex items-start gap-3">
                    <Icon name="bell" className="mt-0.5 h-4 w-4 shrink-0 text-[#b9e0ff]" />
                    <div>
                      <p className="text-[14px] text-ink">{r.title}</p>
                      <p className="text-[12px] text-ink/50">{new Date(r.dueAt!).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[14px] leading-[21px] text-ink/55">No reminders coming up. Vardaan rings you here when one is due.</p>
            )}
          </div>
          <div className="app-panel p-5">
            <h2 className="text-[13px] uppercase tracking-[0.14em] text-mute">Status</h2>
            <ul className="mt-4 space-y-2.5 text-[13px] text-ink/65">
              {(Object.keys(STATUS) as Task["status"][]).map((k) => (
                <li key={k} className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 rounded-full ${STATUS[k].dot}`} />
                  {STATUS[k].label}
                  <span className="ml-auto tabular-nums text-ink/45">{tasks.filter((t) => t.status === k).length}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

function HandOff({ onChange, onToast }: { onChange: () => void; onToast: (t: string) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await api("/api/tasks", { method: "POST", body: JSON.stringify({ request: text }) });
      setText("");
      onToast("Handed off. Vardaan is working on it.");
      onChange();
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="app-panel p-4">
      <label htmlFor="handoff" className="text-[13px] uppercase tracking-[0.14em] text-mute">
        Hand off a task
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
        <textarea
          id="handoff"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="e.g. Email my landlord that the kitchen tap is leaking and ask when it can be fixed."
          className="auth-input min-h-12 flex-1 resize-none rounded-[12px] px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink/35"
        />
        <button disabled={busy || !text.trim()} className="waitlist-button h-12 shrink-0 cursor-pointer rounded-[12px] px-5 text-[14px] disabled:opacity-50">
          {busy ? "Handing off…" : "Hand off"}
        </button>
      </div>
      {err && <p className="mt-2 text-[13px] text-[#ffb4a8]">{err}</p>}
    </form>
  );
}

function Tasks({ tasks, onChange, onToast }: { tasks: Task[]; onChange: () => void; onToast: (t: string) => void }) {
  const [filter, setFilter] = useState<"all" | "needs" | "working" | "done">("all");
  const filters = [
    { id: "all", label: "All", match: () => true },
    { id: "needs", label: "Needs you", match: needsYou },
    { id: "working", label: "In progress", match: inProgress },
    { id: "done", label: "Done", match: (t: Task) => t.status === "done" || t.status === "failed" },
  ] as const;
  const shown = tasks.filter(filters.find((f) => f.id === filter)!.match);

  return (
    <div className="space-y-6">
      <PageTitle title="Tasks" sub="Everything you've handed to Vardaan, newest first." />
      <HandOff onChange={onChange} onToast={onToast} />
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
      {shown.length === 0 && <p className="app-panel p-6 text-[14px] text-ink/55">Nothing here.</p>}
    </div>
  );
}

function MemoryView({ memories, onChange }: { memories: Memory[]; onChange: () => void }) {
  const [fact, setFact] = useState("");
  const [err, setErr] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api("/api/memories", { method: "POST", body: JSON.stringify({ fact }) });
      setFact("");
      onChange();
    } catch (error) {
      setErr((error as Error).message);
    }
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Memory" sub="What Vardaan remembers about you. It uses this to get things right without asking twice." />
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
      {err && <p className="text-[13px] text-[#ffb4a8]">{err}</p>}
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

function RemindersView({ reminders, onChange }: { reminders: Reminder[]; onChange: () => void }) {
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState("");
  const [err, setErr] = useState("");
  const [perm, setPerm] = useState<string>("default");

  useEffect(() => {
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await api("/api/reminders", {
        method: "POST",
        body: JSON.stringify({ title, dueAt: when ? new Date(when).toISOString() : undefined }),
      });
      setTitle("");
      setWhen("");
      onChange();
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        setPerm(await Notification.requestPermission());
      }
    } catch (error) {
      setErr((error as Error).message);
    }
  }

  const sorted = [...reminders].sort((a, b) => (a.dueAt ? Date.parse(a.dueAt) : Infinity) - (b.dueAt ? Date.parse(b.dueAt) : Infinity));

  return (
    <div className="space-y-6">
      <PageTitle title="Reminders" sub="When one is due, Vardaan rings you here like an incoming call. Keep this tab open." />
      <form onSubmit={add} className="app-panel grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What should Vardaan remind you about?"
          className="auth-input h-12 min-w-0 rounded-[12px] px-4 text-[15px] text-ink outline-none placeholder:text-ink/35"
        />
        <input
          type="datetime-local"
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className="auth-input h-12 rounded-[12px] px-3 text-[14px] text-ink outline-none [color-scheme:dark]"
        />
        <button disabled={!title.trim()} className="waitlist-button h-12 cursor-pointer rounded-[12px] px-5 text-[14px] disabled:opacity-50">
          Add reminder
        </button>
      </form>
      {err && <p className="text-[13px] text-[#ffb4a8]">{err}</p>}
      {perm !== "granted" && (
        <p className="text-[13px] text-ink/55">
          Tip: allow notifications so Vardaan can alert you even when this tab is in the background.
          {perm === "default" && (
            <button
              onClick={async () => setPerm(await Notification.requestPermission())}
              className="ml-2 cursor-pointer text-[#b9e0ff] underline underline-offset-2"
            >
              Allow notifications
            </button>
          )}
        </p>
      )}
      <ul className="app-panel divide-y divide-white/[0.06]">
        {sorted.map((r) => {
          const past = r.dueAt && Date.parse(r.dueAt) <= Date.now();
          return (
            <li key={r.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-start gap-3">
                <Icon name="bell" className={`mt-0.5 h-4 w-4 shrink-0 ${past ? "text-ink/35" : "text-[#b9e0ff]"}`} />
                <div>
                  <p className={`text-[15px] ${past ? "text-ink/50" : "text-ink"}`}>{r.title}</p>
                  <p className="text-[12px] text-ink/45">{r.dueAt ? new Date(r.dueAt).toLocaleString() : "No time set"}</p>
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
          );
        })}
        {reminders.length === 0 && <li className="px-5 py-6 text-[14px] text-ink/55">No reminders yet.</li>}
      </ul>
    </div>
  );
}
