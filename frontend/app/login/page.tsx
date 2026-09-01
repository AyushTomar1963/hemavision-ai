"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("demo@hemavision.ai");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const tokens = await login(email, password);
      signIn(tokens);
      router.push("/exam");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-md place-content-center px-5 py-16 sm:px-8">
      <div className="border border-[var(--line)] bg-[var(--surface)] p-8">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
          Welcome back
        </p>
        <h1 className="font-serif text-3xl text-[var(--ink)]">Sign in</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          The demo account is pre-filled. Click Sign in to jump straight to an
          exam — you can create your own account afterwards.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--muted)]">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 font-mono text-sm focus:border-[var(--brick)] focus:outline-none"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--muted)]">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[var(--line)] bg-[var(--paper)] px-3 py-2 font-mono text-sm focus:border-[var(--brick)] focus:outline-none"
            />
          </label>

          {error && (
            <p className="border border-[var(--brick)]/30 bg-[var(--paper)] px-3 py-2 text-sm text-[var(--brick)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-[var(--brick)] px-5 py-3 text-sm font-medium text-[var(--surface)] disabled:opacity-50"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <p className="pt-2 text-center text-sm text-[var(--muted)]">
            New here?{" "}
            <Link
              href="/signup"
              className="text-[var(--ink)] underline decoration-[var(--line)]"
            >
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
