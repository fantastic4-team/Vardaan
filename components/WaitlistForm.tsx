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
      <div className="flex h-12 w-full max-w-md items-center justify-center gap-2 rounded-full border border-black/8 bg-black/[0.02] px-5 text-sm text-ink">
        <span className="inline-block h-2 w-2 rounded-full bg-leaf" />
        {message}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <form
        id={id}
        onSubmit={onSubmit}
        className="flex w-full items-center gap-1.5 rounded-full border border-black/10 bg-white p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition focus-within:border-black/25"
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
          className="h-9 min-w-0 flex-1 bg-transparent px-3.5 text-sm text-ink outline-none placeholder:text-black/35"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="h-9 shrink-0 cursor-pointer rounded-full bg-ink px-4 text-sm font-bold text-white transition hover:bg-black/80 disabled:cursor-wait disabled:opacity-70"
        >
          {status === "loading" ? "Joining…" : "Join waitlist"}
        </button>
      </form>
      {status === "error" && <p className="mt-2 pl-4 text-xs text-red-600">{message}</p>}
    </div>
  );
}
