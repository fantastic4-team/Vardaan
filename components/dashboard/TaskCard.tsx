"use client";

import { useState } from "react";
import { api } from "@/components/dashboard/api";
import type { Draft, Task } from "@/lib/db";

export const STATUS: Record<Task["status"], { label: string; tone: string; dot: string }> = {
  planning: { label: "Planning", tone: "bg-white/10 text-ink/80", dot: "bg-white/60" },
  working: { label: "Working", tone: "bg-[#8ccbff]/15 text-[#b9e0ff]", dot: "bg-[#8ccbff]" },
  needs_input: { label: "Needs your answer", tone: "bg-[#f6e27a]/15 text-[#f6e27a]", dot: "bg-[#f6e27a]" },
  needs_approval: { label: "Needs approval", tone: "bg-[#f6e27a]/15 text-[#f6e27a]", dot: "bg-[#f6e27a]" },
  done: { label: "Done", tone: "bg-[#8fcf3c]/15 text-[#c9e877]", dot: "bg-[#c9e877]" },
  failed: { label: "Couldn't finish", tone: "bg-[#ff5d6e]/15 text-[#ffb4a8]", dot: "bg-[#ffb4a8]" },
};

export const needsYou = (t: Task) => t.status === "needs_input" || t.status === "needs_approval";
export const inProgress = (t: Task) => t.status === "planning" || t.status === "working";
export const canCancel = (t: Task) => t.status === "planning" || t.status === "working" || t.status === "needs_input";

function ago(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function TaskCard({ task, onChange, onToast }: { task: Task; onChange: () => void; onToast?: (msg: string) => void }) {
  const [answer, setAnswer] = useState("");
  const [err, setErr] = useState("");
  const [cancelling, setCancelling] = useState(false);
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

  async function cancelTask() {
    if (!confirm("Cancel this task?")) return;
    setCancelling(true);
    try {
      await api(`/api/tasks/${task.id}/cancel`, { method: "POST" });
      onToast?.("Task cancelled.");
      onChange();
    } catch (error) {
      setErr((error as Error).message);
    } finally {
      setCancelling(false);
    }
  }

  async function callMeAboutTask() {
    try {
      await api("/api/calls/request", {
        method: "POST",
        body: JSON.stringify({ reason: `Task result: ${task.request.slice(0, 120)}`, taskId: task.id }),
      });
      onToast?.("Calling you now — pick up your phone!");
    } catch (error) {
      onToast?.((error as Error).message);
    }
  }

  return (
    <article className="rounded-[14px] border border-white/10 bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] leading-[22px] text-ink">{task.request}</p>
          <p className="mt-1 text-[12px] text-ink/45">{ago(task.createdAt)}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] ${s.tone}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot} ${inProgress(task) ? "animate-pulse" : ""}`} />
          {s.label}
        </span>
      </div>

      {task.steps.length > 0 && (
        <ol className="mt-4 space-y-1.5 text-[13px] text-ink/60">
          {task.steps.map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-[3px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/15 text-[10px] tabular-nums text-ink/50">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      )}

      {task.status === "needs_input" && task.question && (
        <form onSubmit={sendAnswer} className="mt-4 rounded-[12px] border border-[#f6e27a]/20 bg-[#f6e27a]/[0.04] p-3">
          <p className="text-[14px] text-[#f6e27a]">{task.question}</p>
          <div className="mt-2.5 flex gap-2">
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

      {task.summary && <p className="mt-4 text-[13px] leading-[20px] text-ink/70">{task.summary}</p>}
      {(task.error || err) && <p className="mt-3 text-[13px] text-[#ffb4a8]">{task.error || err}</p>}

      {/* Action row */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3">
        {task.status === "done" && (
          <button
            onClick={callMeAboutTask}
            className="flex items-center gap-1.5 rounded-[8px] bg-[#8ccbff]/10 px-3 py-1.5 text-[12px] text-[#b9e0ff] transition hover:bg-[#8ccbff]/20"
          >
            <PhoneIcon /> Call me about this
          </button>
        )}
        {canCancel(task) && (
          <button
            onClick={cancelTask}
            disabled={cancelling}
            className="ml-auto flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[12px] text-ink/45 transition hover:text-[#ffb4a8] disabled:opacity-50"
          >
            Cancel task
          </button>
        )}
      </div>
    </article>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden>
      <path d="M21 16.4v2.7a1.9 1.9 0 0 1-2.1 1.9 18.8 18.8 0 0 1-8.2-2.9 18.5 18.5 0 0 1-5.7-5.7A18.8 18.8 0 0 1 2.1 4.1 1.9 1.9 0 0 1 4 2h2.7a1.9 1.9 0 0 1 1.9 1.6c.1.9.4 1.8.7 2.7a1.9 1.9 0 0 1-.4 2L7.7 9.4a15.2 15.2 0 0 0 5.7 5.7l1.1-1.1a1.9 1.9 0 0 1 2-.4c.9.3 1.8.6 2.7.7a1.9 1.9 0 0 1 1.8 2.1z" />
    </svg>
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
    <div className="mt-4 rounded-[12px] border border-white/10 bg-black/20 p-3.5">
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
            className="auth-input mt-2 w-full resize-y rounded-[10px] px-3 py-2 text-[13px] leading-[20px] text-ink outline-none"
          />
          <div className="mt-2.5 flex gap-2">
            <button onClick={() => act("approve")} disabled={pending} className="waitlist-button h-9 cursor-pointer rounded-[9px] px-3.5 text-[13px] disabled:opacity-60">
              {draft.channel === "email" ? "Approve & send" : `Open in ${label}`}
            </button>
            <button onClick={() => act("discard")} disabled={pending} className="h-9 cursor-pointer rounded-[9px] px-3 text-[13px] text-ink/60 hover:text-ink">
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
