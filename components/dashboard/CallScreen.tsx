"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/components/dashboard/api";
import { startRingtone } from "@/components/dashboard/ringtone";
import { LANGUAGES, useSpeech } from "@/components/dashboard/useSpeech";

type Turn = { role: "user" | "assistant"; content: string };
type Phase = "ringing" | "connecting" | "speaking" | "listening" | "thinking" | "muted";

export type Incoming = { title: string };

// A hands-free call with Vardaan inside the browser: it speaks, then listens, then replies, on a
// loop, until you hang up. Free: speech runs in the browser and the reply comes from the free model.
// Anything that takes work is handed to the background during the call, so hanging up is fine.
export default function CallScreen({
  firstName,
  lang,
  onLangChange,
  incoming,
  onEnd,
}: {
  firstName: string;
  lang: string;
  onLangChange: (lang: string) => void;
  incoming: Incoming | null;
  onEnd: (summary: { startedTasks: number }) => void;
}) {
  const speech = useSpeech(lang);
  const [phase, setPhase] = useState<Phase>(incoming ? "ringing" : "connecting");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [started, setStarted] = useState(0);

  const active = useRef(false);
  const mutedRef = useRef(false);
  const typedQueue = useRef<string[]>([]);
  const turnsRef = useRef<Turn[]>([]);
  const startedRef = useRef(0);
  const stopRing = useRef<() => void>(() => {});
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, speech.interim]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const nextUtterance = useCallback(async () => {
    // Typed messages take priority; otherwise listen (or wait, if voice isn't available or muted).
    while (active.current) {
      if (typedQueue.current.length) return typedQueue.current.shift()!;
      if (mutedRef.current || !speech.supported) {
        setPhase(mutedRef.current ? "muted" : "listening");
        await sleep(250);
        continue;
      }
      setPhase("listening");
      const heard = await speech.listen();
      if (typedQueue.current.length) return typedQueue.current.shift()!;
      if (heard) return heard;
    }
    return "";
  }, [speech]);

  const runCall = useCallback(
    async (greeting: string) => {
      active.current = true;
      setPhase("speaking");
      setTurns((t) => (turnsRef.current = [...t, { role: "assistant", content: greeting }]));
      await speech.speak(greeting);

      while (active.current) {
        const text = await nextUtterance();
        if (!active.current || !text) break;
        const history = [...turnsRef.current, { role: "user" as const, content: text }];
        turnsRef.current = history;
        setTurns(history);
        setPhase("thinking");
        setError("");
        try {
          // The greeting isn't part of the model's conversation.
          const { reply, startedTaskIds } = await api<{ reply: string; startedTaskIds?: string[] }>("/api/agent/talk", {
            method: "POST",
            body: JSON.stringify({ history: history.filter((t, i) => !(i === 0 && t.role === "assistant")) }),
          });
          if (!active.current) break;
          if (startedTaskIds?.length) {
            startedRef.current += startedTaskIds.length;
            setStarted(startedRef.current);
          }
          turnsRef.current = [...history, { role: "assistant", content: reply }];
          setTurns(turnsRef.current);
          setPhase("speaking");
          await speech.speak(reply);
        } catch (err) {
          setError((err as Error).message);
          await sleep(400);
        }
      }
    },
    [nextUtterance, speech],
  );

  // Outgoing calls connect straight away; incoming ones ring until answered.
  useEffect(() => {
    if (incoming) {
      stopRing.current = startRingtone();
    } else {
      const t = setTimeout(() => runCall(`Hi ${firstName}, Vardaan here. What can I do for you?`), 600);
      return () => clearTimeout(t);
    }
    return () => stopRing.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The call timer runs once the call is connected.
  const live = phase !== "ringing" && phase !== "connecting";
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [live]);

  useEffect(
    () => () => {
      active.current = false;
    },
    [],
  );

  function accept() {
    stopRing.current();
    setPhase("connecting");
    runCall(`Hi ${firstName}, this is your reminder: ${incoming?.title}. Would you like me to do anything about it?`);
  }

  function hangUp() {
    active.current = false;
    stopRing.current();
    speech.abortListening();
    speech.stopSpeaking();
    onEnd({ startedTasks: startedRef.current });
  }

  function toggleMute() {
    setMuted((m) => {
      if (!m) speech.abortListening();
      return !m;
    });
  }

  function sendTyped(e: React.FormEvent) {
    e.preventDefault();
    const text = typed.trim();
    if (!text) return;
    typedQueue.current.push(text);
    setTyped("");
    speech.abortListening();
  }

  const status: Record<Phase, string> = {
    ringing: "Incoming call",
    connecting: "Connecting…",
    speaking: "Vardaan is speaking",
    listening: speech.supported ? "Listening…" : "Type your message below",
    thinking: "Thinking…",
    muted: "You're muted",
  };

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const visible = turns.slice(-6);

  return (
    <div role="dialog" aria-modal="true" aria-label="Call with Vardaan" className="call-screen fixed inset-0 z-50 flex flex-col">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-2.5">
          <span className="font-poster text-[17px] font-semibold uppercase tracking-[0.02em] text-ink">Vardaan</span>
          <span className="text-[13px] text-ink/50">{phase === "ringing" ? "" : clock}</span>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-ink/60">
          <span className="sr-only">Language</span>
          <select value={lang} onChange={(e) => onLangChange(e.target.value)} className="auth-input h-8 rounded-[8px] px-2 text-[13px] text-ink">
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-[#1c1b1a]">
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      <main className="flex min-h-0 flex-1 flex-col items-center px-5">
        <div className="flex flex-col items-center pt-[4vh]">
          <div className="call-orb" data-state={phase} aria-hidden="true">
            <span />
          </div>
          <p className="mt-8 text-[13px] uppercase tracking-[0.18em] text-ink/55" aria-live="polite">
            {status[phase]}
          </p>
          {phase === "ringing" && incoming && (
            <p className="mt-3 max-w-[420px] text-center text-[20px] font-medium text-ink">Reminder: {incoming.title}</p>
          )}
        </div>

        <div ref={transcriptRef} className="mt-8 w-full max-w-[560px] flex-1 space-y-3 overflow-y-auto pb-4">
          {visible.map((t, i) => (
            <p
              key={turns.length - visible.length + i}
              className={`max-w-[85%] rounded-[14px] px-4 py-2.5 text-[15px] leading-[23px] ${
                t.role === "user" ? "ml-auto bg-[#8ccbff] text-[#0b1626]" : "bg-white/[0.07] text-ink"
              }`}
            >
              {t.content}
            </p>
          ))}
          {speech.interim && <p className="ml-auto max-w-[85%] rounded-[14px] bg-[#8ccbff]/30 px-4 py-2.5 text-[15px] text-ink/80">{speech.interim}</p>}
        </div>

        {(error || speech.error) && <p className="mb-3 max-w-[520px] text-center text-[13px] text-[#ffb4a8]">{error || speech.error}</p>}
        {started > 0 && (
          <p className="mb-3 rounded-full bg-[#8fcf3c]/15 px-3 py-1 text-[12px] text-[#c9e877]">
            {started === 1 ? "1 task" : `${started} tasks`} handed off. You can hang up, Vardaan keeps working.
          </p>
        )}
      </main>

      <footer className="px-5 pb-8 pt-2 sm:pb-10">
        {phase === "ringing" ? (
          <div className="flex items-center justify-center gap-16">
            <CallButton label="Decline" tone="end" onClick={hangUp} />
            <CallButton label="Accept" tone="accept" onClick={accept} />
          </div>
        ) : (
          <>
            {typing && (
              <form onSubmit={sendTyped} className="mx-auto mb-5 flex max-w-[520px] gap-2">
                <input
                  autoFocus
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  placeholder="Type instead of speaking…"
                  className="auth-input h-11 min-w-0 flex-1 rounded-[12px] px-4 text-[15px] text-ink outline-none"
                />
                <button className="waitlist-button h-11 cursor-pointer rounded-[12px] px-4 text-[14px]">Send</button>
              </form>
            )}
            <div className="flex items-center justify-center gap-6 sm:gap-10">
              <CallButton label={muted ? "Unmute" : "Mute"} tone={muted ? "on" : "plain"} onClick={toggleMute} icon="mic" />
              <CallButton label="End call" tone="end" onClick={hangUp} />
              <CallButton label="Keyboard" tone={typing ? "on" : "plain"} onClick={() => setTyping((t) => !t)} icon="keys" />
            </div>
          </>
        )}
      </footer>
    </div>
  );
}

function CallButton({
  label,
  tone,
  onClick,
  icon,
}: {
  label: string;
  tone: "plain" | "on" | "end" | "accept";
  onClick: () => void;
  icon?: "mic" | "keys";
}) {
  const styles = {
    plain: "h-14 w-14 bg-white/[0.08] text-ink hover:bg-white/[0.14]",
    on: "h-14 w-14 bg-white text-black",
    end: "h-16 w-16 bg-[#e5484d] text-white shadow-[0_10px_30px_-8px_rgba(229,72,77,0.7)] hover:bg-[#f05257]",
    accept: "h-16 w-16 bg-[#3fb950] text-white shadow-[0_10px_30px_-8px_rgba(63,185,80,0.7)] hover:bg-[#4cc85d] animate-bounce",
  }[tone];
  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={onClick} aria-label={label} className={`flex cursor-pointer items-center justify-center rounded-full transition ${styles}`}>
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon === "mic" ? (
            <>
              <rect x="9" y="3.5" width="6" height="11" rx="3" />
              <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
              {tone === "on" && <path d="m4 4 16 16" />}
            </>
          ) : icon === "keys" ? (
            <>
              <rect x="3" y="6" width="18" height="12" rx="2.5" />
              <path d="M7 10h.01M11 10h.01M15 10h.01M7.5 14h9" />
            </>
          ) : (
            <path
              d="M5 4h3l1.5 4-2 1.3a10 10 0 0 0 5.2 5.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z"
              transform={tone === "end" ? "rotate(135 12 12)" : undefined}
              fill="currentColor"
              stroke="none"
            />
          )}
        </svg>
      </button>
      <span className="text-[12px] text-ink/60">{label}</span>
    </div>
  );
}
