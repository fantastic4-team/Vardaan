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
      <div className="waitlist-field h-12 w-full items-center gap-2 px-5 text-white">
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
        className="waitlist-field w-full"
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
          className="h-12 min-w-0 flex-1 bg-transparent px-5 text-white caret-white outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="waitlist-button m-1 shrink-0 cursor-pointer rounded-full px-5 disabled:cursor-wait disabled:opacity-70"
        >
          {status === "loading" ? "Joining…" : "Join waitlist"}
        </button>
      </form>
      {status === "error" && <p className="mt-2 pl-5 text-[13px] text-[#ffd2c8]">{message}</p>}
    </div>
  );
}
