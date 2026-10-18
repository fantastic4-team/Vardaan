"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function WaitlistForm({ id }: { id?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setStatus("success");
      setMessage("You're on the list. We'll be in touch soon.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      // fetch rejects with a TypeError when offline; don't show its raw text.
      setMessage(err instanceof TypeError ? "Couldn't reach the server. Check your connection." : (err as Error).message);
    }
  }

  if (status === "success") {
    return (
      <div className="flex h-11 w-full items-center gap-2 rounded-full bg-card px-4 text-ink">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-leaf" />
        {message}
      </div>
    );
  }

  return (
    <div className="w-full">
      <form
        id={id}
        onSubmit={onSubmit}
        className="flex w-full items-center gap-1 rounded-full bg-card p-1 ring-1 ring-transparent transition focus-within:ring-black/10"
      >
        <label htmlFor={`${id ?? "waitlist"}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${id ?? "waitlist"}-email`}
          type="email"
          required
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") setStatus("idle");
          }}
          className="h-9 min-w-0 flex-1 bg-transparent px-3 text-ink outline-none placeholder:text-mute"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-9 shrink-0 cursor-pointer rounded-full bg-white px-4 text-ink shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] disabled:cursor-wait disabled:opacity-70"
        >
          {status === "loading" ? "Joining…" : "Join"}
        </button>
      </form>
      {status === "error" && <p className="mt-2 pl-3 text-red-600">{message}</p>}
    </div>
  );
}
