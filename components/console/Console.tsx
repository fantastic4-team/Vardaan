"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LANGUAGES, useSpeech } from "@/components/console/useSpeech";
import type { Draft, Memory, Reminder, Task } from "@/lib/db";

type Turn = { role: "user" | "assistant"; content: string };
type Mode = "talk" | "cut";

const STATUS: Record<Task["status"], { label: string; tone: string }> = {
  planning: { label: "Planning", tone: "bg-white/10 text-ink/80" },
  working: { label: "Working", tone: "bg-[#8ccbff]/15 text-[#b9e0ff]" },
  needs_input: { label: "Needs your answer", tone: "bg-[#f6e27a]/15 text-[#f6e27a]" },
  needs_approval: { label: "Needs your approval", tone: "bg-[#f6e27a]/15 text-[#f6e27a]" },
  done: { label: "Done", tone: "bg-[#8fcf3c]/15 text-[#c9e877]" },
  failed: { label: "Couldn't finish", tone: "bg-[#ff5d6e]/15 text-[#ffb4a8]" },
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
  return data as T;
}

export default function Console({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("talk");
  const [lang, setLang] = useState("en-IN");
  const [speakReplies, setSpeakReplies] = useState(true);
  const speech = useSpeech(lang);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [thinking, setThinking] = useState(false);
  const [draftText, setDraftText] = useState("");
  const [error, setError] = useState("");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);

  const transcriptRef = useRef<HTMLDivElement>(null);

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
  }, [refresh]);

  // Poll while the agent is working on something in the background.
  const busy = tasks.some((t) => t.status === "planning" || t.status === "working");
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
  }, [busy, refresh]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  // ---- Talk & Help ------------------------------------------------------------------------

  async function sendTalk(text: string) {
    const content = text.trim();
    if (!content || thinking) return;
    const next = [...turns, { role: "user" as const, content }];
    setTurns(next);
    setDraftText("");
    setThinking(true);
    setError("");
    try {
      const { reply, taskId } = await api<{ reply: string; taskId?: string }>("/api/agent/talk", {
        method: "POST",
        body: JSON.stringify({ history: next }),
      });
      setTurns([...next, { role: "assistant", content: reply }]);
      if (speakReplies) speech.speak(reply);
      if (taskId) refresh();
      refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setThinking(false);
    }
  }

  // ---- Call & Cut ---------------------------------------------------------------------------

  async function handOff(text: string) {
    const request = text.trim();
    if (!request) return;
    setError("");
    try {
      await api("/api/tasks", { method: "POST", body: JSON.stringify({ request }) });
      setDraftText("");
      if (speakReplies) speech.speak("Got it. You can hang up, I'll work on it and let you know.");
      refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function onMic() {
    if (speech.listening) {
      speech.stop();
      return;
    }
    const heard = await speech.listen();
    if (!heard) return;
    if (mode === "talk") sendTalk(heard);
    else setDraftText((t) => (t ? `${t} ${heard}` : heard));
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const firstName = user.name.split(" ")[0];

  return (
    <div className="min-h-svh">
      <header className="nav-grid flex items-stretch border-b">
        <Link href="/" className="nav-grid ml-[max(1rem,6vw)] flex items-center gap-3 border-x px-4 py-3.5 sm:px-7">
          <span className="font-poster text-[19px] font-semibold uppercase leading-none tracking-[0.02em] text-ink sm:text-[21px]">
            Vardaan
          </span>
          <span className="beta-glass">Beta</span>
        </Link>
        <div className="ml-auto mr-[max(1rem,6vw)] flex items-center gap-4">
          <span className="hidden text-[13px] text-ink/60 sm:inline">{user.email}</span>
          <button onClick={logout} className="cursor-pointer text-[13px] text-ink/70 underline underline-offset-2 hover:text-ink">
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1280px] gap-6 px-4 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-10">
        <section className="app-panel flex min-h-[560px] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
            <div role="tablist" aria-label="Mode" className="flex rounded-full bg-white/[0.05] p-1">
              {(
                [
                  ["talk", "Talk & Help"],
                  ["cut", "Call & Cut"],
                ] as const
              ).map(([m, label]) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => setMode(m)}
                  className={`cursor-pointer rounded-full px-4 py-1.5 text-[13px] transition ${
                    mode === m ? "bg-white text-black" : "text-ink/70 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 text-[13px] text-ink/70">
              <label className="flex items-center gap-2">
                <span className="sr-only">Language</span>
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value)}
                  className="auth-input h-8 rounded-[8px] px-2 text-[13px] text-ink"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-[#1c1b1a]">
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex cursor-pointer items-center gap-1.5">
                <input type="checkbox" checked={speakReplies} onChange={(e) => setSpeakReplies(e.target.checked)} />
                Speak replies
              </label>
            </div>
          </div>

          {mode === "talk" ? (
            <div ref={transcriptRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
              {turns.length === 0 && (
                <div className="mx-auto max-w-[460px] pt-8 text-center">
                  <p className="text-[22px] font-medium text-ink">Hi {firstName}, what can I help with?</p>
                  <p className="mt-3 text-[14px] leading-[22px] text-ink/60">
                    Tap the mic and speak in your own language. Ask me to explain a bill, think through a decision,
                    draft a message or set a reminder.
                  </p>
                </div>
              )}
              {turns.map((t, i) => (
                <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                  <p
                    className={`max-w-[80%] whitespace-pre-wrap rounded-[14px] px-4 py-2.5 text-[15px] leading-[23px] ${
                      t.role === "user" ? "bg-[#8ccbff] text-[#0b1626]" : "bg-white/[0.06] text-ink"
                    }`}
                  >
                    {t.content}
                  </p>
                </div>
              ))}
              {thinking && <p className="text-[14px] text-ink/50">Vardaan is thinking…</p>}
            </div>
          ) : (
            <div className="flex-1 px-4 py-6 sm:px-6">
              <p className="text-[22px] font-medium text-ink">Hand it off.</p>
              <p className="mt-2 max-w-[520px] text-[14px] leading-[22px] text-ink/60">
                Describe the task by voice or text. Vardaan plans it, works on it in the background and checks
                with you before anything is sent. Follow along on the right.
              </p>
            </div>
          )}

          <div className="border-t border-white/10 px-4 py-4 sm:px-6">
            {(speech.interim || speech.error || error) && (
              <p className={`mb-3 text-[13px] ${speech.error || error ? "text-[#ffb4a8]" : "text-ink/60"}`}>
                {speech.error || error || speech.interim}
              </p>
            )}
            {!speech.supported && (
              <p className="mb-3 text-[13px] text-ink/50">Voice input works in Chrome and Edge. You can type instead.</p>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (mode === "talk") sendTalk(draftText);
                else handOff(draftText);
              }}
              className="flex items-end gap-3"
            >
              <button
                type="button"
                onClick={onMic}
                disabled={!speech.supported}
                aria-label={speech.listening ? "Stop listening" : "Start speaking"}
                className={`mic-button flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#0b1626] disabled:cursor-not-allowed disabled:opacity-40 ${
                  speech.listening ? "is-listening" : ""
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="currentColor">
                  <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.93V21h2v-2.07A7 7 0 0 0 19 12h-2Z" />
                </svg>
              </button>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
                rows={mode === "cut" ? 3 : 1}
                placeholder={mode === "talk" ? "Or type a message…" : "e.g. Email my landlord that the kitchen tap is leaking and ask when it can be fixed."}
                className="auth-input min-h-12 flex-1 resize-none rounded-[12px] px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink/35"
              />
              <button
                type="submit"
                disabled={!draftText.trim() || thinking}
                className="waitlist-button h-12 shrink-0 cursor-pointer rounded-[12px] px-5 text-[14px] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mode === "talk" ? "Send" : "Hand off"}
              </button>
            </form>
          </div>
        </section>

        <aside className="space-y-6">
          <TaskList tasks={tasks} onChange={refresh} />
          <MemoryList memories={memories} onChange={refresh} />
          {reminders.length > 0 && (
            <section className="app-panel p-5">
              <h2 className="text-[13px] uppercase tracking-[0.14em] text-mute">Reminders</h2>
              <ul className="mt-3 space-y-2 text-[14px] text-ink/80">
                {reminders.map((r) => (
                  <li key={r.id}>
                    {r.title}
                    {r.dueAt && <span className="text-ink/50"> · {new Date(r.dueAt).toLocaleString()}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </main>
    </div>
  );
}

function TaskList({ tasks, onChange }: { tasks: Task[]; onChange: () => void }) {
  return (
    <section className="app-panel p-5">
      <h2 className="text-[13px] uppercase tracking-[0.14em] text-mute">Tasks</h2>
      {tasks.length === 0 ? (
        <p className="mt-3 text-[14px] text-ink/55">Nothing yet. Hand off a task and it will show up here.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onChange={onChange} />
          ))}
        </ul>
      )}
    </section>
  );
}

function TaskCard({ task, onChange }: { task: Task; onChange: () => void }) {
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState("");
  const s = STATUS[task.status];

  async function sendAnswer(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api(`/api/tasks/${task.id}/answer`, { method: "POST", body: JSON.stringify({ answer }) });
      setAnswer("");
      onChange();
    } catch (error) {
      setErr((error as Error).message);
    }
  }

  return (
    <li className="rounded-[12px] border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[14px] leading-[21px] text-ink">{task.request}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${s.tone}`}>{s.label}</span>
      </div>

      {task.steps.length > 0 && (
        <ol className="mt-3 space-y-1 text-[13px] text-ink/60">
          {task.steps.map((step, i) => (
            <li key={i} className="flex gap-2">
              <span className="tabular-nums text-ink/35">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      )}

      {task.status === "needs_input" && task.question && (
        <form onSubmit={sendAnswer} className="mt-3">
          <p className="text-[14px] text-[#f6e27a]">{task.question}</p>
          <div className="mt-2 flex gap-2">
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer"
              className="auth-input h-10 min-w-0 flex-1 rounded-[10px] px-3 text-[14px] text-ink outline-none"
            />
            <button disabled={!answer.trim()} className="waitlist-button h-10 cursor-pointer rounded-[10px] px-4 text-[13px] disabled:opacity-50">
              Reply
            </button>
          </div>
        </form>
      )}

      {task.drafts.map((d) => (
        <DraftCard key={d.id} taskId={task.id} draft={d} onChange={onChange} />
      ))}

      {task.summary && <p className="mt-3 text-[13px] leading-[20px] text-ink/70">{task.summary}</p>}
      {(task.error || err) && <p className="mt-3 text-[13px] text-[#ffb4a8]">{task.error || err}</p>}
    </li>
  );
}

function DraftCard({ taskId, draft, onChange }: { taskId: string; draft: Draft; onChange: () => void }) {
  const [body, setBody] = useState(draft.body);
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState("");
  const label = draft.channel === "email" ? "Email" : draft.channel === "sms" ? "SMS" : "WhatsApp";

  async function act(action: "approve" | "discard") {
    setPending(true);
    setErr("");
    try {
      const { link } = await api<{ link?: string }>(`/api/tasks/${taskId}/drafts/${draft.id}`, {
        method: "POST",
        body: JSON.stringify({ action, body }),
      });
      if (link) window.open(link, "_blank", "noopener");
      onChange();
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 rounded-[10px] border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[12px] text-ink/55">
        {label} to <span className="text-ink/85">{draft.to}</span>
        {draft.subject && <> · {draft.subject}</>}
      </p>
      {draft.status === "draft" ? (
        <>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="auth-input mt-2 w-full resize-y rounded-[8px] px-3 py-2 text-[13px] leading-[20px] text-ink outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => act("approve")}
              disabled={pending}
              className="waitlist-button h-9 cursor-pointer rounded-[8px] px-3 text-[13px] disabled:opacity-60"
            >
              {draft.channel === "email" ? "Approve & send" : `Open in ${label}`}
            </button>
            <button
              onClick={() => act("discard")}
              disabled={pending}
              className="h-9 cursor-pointer rounded-[8px] px-3 text-[13px] text-ink/60 hover:text-ink"
            >
              Discard
            </button>
          </div>
        </>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-[20px] text-ink/70">{draft.body}</p>
      )}
      {draft.status === "sent" && <p className="mt-2 text-[12px] text-[#c9e877]">Sent by Vardaan</p>}
      {draft.status === "approved" && <p className="mt-2 text-[12px] text-[#c9e877]">Approved and opened in your {label} app</p>}
      {(draft.error || err) && <p className="mt-2 text-[12px] text-[#ffb4a8]">{draft.error || err}</p>}
    </div>
  );
}

function MemoryList({ memories, onChange }: { memories: Memory[]; onChange: () => void }) {
  if (!memories.length) return null;
  return (
    <section className="app-panel p-5">
      <h2 className="text-[13px] uppercase tracking-[0.14em] text-mute">What Vardaan remembers</h2>
      <ul className="mt-3 space-y-2">
        {memories.map((m) => (
          <li key={m.id} className="flex items-start justify-between gap-3 text-[14px] text-ink/80">
            {m.fact}
            <button
              onClick={async () => {
                await fetch(`/api/memories/${m.id}`, { method: "DELETE" });
                onChange();
              }}
              className="shrink-0 cursor-pointer text-[12px] text-ink/45 hover:text-ink"
            >
              Forget
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
