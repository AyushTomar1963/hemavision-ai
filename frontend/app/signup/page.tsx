"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { signup } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const tokens = await signup(email, password);
      signIn(tokens);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:px-8">
      <h1 className="font-serif text-3xl">Create an account</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Local sqlite user store — no third-party identity provider.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 font-mono text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-[var(--muted)]">
            Password (min 8 characters)
          </span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-[var(--line)] bg-[var(--surface)] px-3 py-2 font-mono text-sm"
          />
        </label>

        {error && (
          <p className="border border-[var(--brick)]/30 bg-[var(--surface)] px-3 py-2 text-sm text-[var(--brick)]">
            {error}
          </p>
        )}

        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="bg-[var(--brick)] px-5 py-2.5 text-sm text-[var(--surface)] disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
          <Link
            href="/login"
            className="text-sm underline decoration-[var(--line)]"
          >
            I already have one
          </Link>
        </div>
      </form>
    </div>
  );
}
