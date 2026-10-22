"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "signup";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof TypeError ? "Couldn't reach the server. Check your connection." : (err as Error).message);
      setLoading(false);
    }
  }

  const signup = mode === "signup";

  return (
    <form onSubmit={onSubmit} className="w-full max-w-[400px]" noValidate>
      <div className="space-y-3">
        {signup && (
          <Field label="Name" name="name" type="text" autoComplete="name" placeholder="Your name" />
        )}
        <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          placeholder={signup ? "At least 8 characters" : "Your password"}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-[13px] text-[#ffb4a8]">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="waitlist-button mt-6 h-11 w-full cursor-pointer rounded-[10px] text-[14px] disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? (signup ? "Creating account…" : "Logging in…") : signup ? "Create account" : "Log in"}
      </button>

      <p className="mt-5 text-[13px] text-mute">
        {signup ? "Already have an account? " : "New to Vardaan? "}
        <Link href={signup ? "/login" : "/signup"} className="text-ink underline underline-offset-2">
          {signup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}

function Field({ label, ...input }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-ink/70">{label}</span>
      <input
        {...input}
        required
        className="auth-input h-12 w-full rounded-[12px] px-4 text-[15px] text-ink outline-none placeholder:text-ink/35"
      />
    </label>
  );
}
