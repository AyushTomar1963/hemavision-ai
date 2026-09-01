"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/exam", label: "Start exam" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/evidence", label: "Evidence" },
  { href: "/log", label: "Log" },
];

export function SiteHeader() {
  const path = usePathname();
  const { email, loading, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[color-mix(in_oklab,var(--surface),transparent_10%)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3 sm:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--surface)]"
            style={{
              background:
                "linear-gradient(135deg, var(--brick) 0%, #a24343 100%)",
            }}
          >
            <span className="font-serif text-lg leading-none">H</span>
          </span>
          <span className="min-w-0">
            <span className="block font-serif text-[1.25rem] leading-none text-[var(--ink)]">
              HemaVision
            </span>
            <span className="mt-1 block text-[11px] text-[var(--muted)]">
              Anaemia screening in a snapshot
            </span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-[13px]">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? path === "/" : path.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 transition ${
                  active
                    ? "text-[var(--ink)] underline decoration-[var(--brick)] decoration-2 underline-offset-8"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <span className="ml-3 hidden h-4 w-px bg-[var(--line)] sm:inline-block" />

          {!loading && email ? (
            <span className="ml-2 flex items-center gap-2 text-[12px] text-[var(--muted)]">
              <span className="hidden max-w-[14ch] truncate font-mono sm:inline">
                {email}
              </span>
              <button
                type="button"
                onClick={signOut}
                className="px-2 py-1 underline decoration-[var(--line)] hover:text-[var(--ink)]"
              >
                Sign out
              </button>
            </span>
          ) : (
            !loading && (
              <Link
                href="/login"
                className="ml-2 border border-[var(--line)] bg-[var(--paper)] px-3 py-1.5 text-[var(--ink)] hover:border-[var(--brick)]"
              >
                Sign in
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-[12px] text-[var(--muted)] sm:px-8">
        <p>
          © {new Date().getFullYear()} HemaVision. A screening aid, not a
          replacement for a laboratory CBC.
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em]">
          Do not use for transfusion decisions without a confirmatory assay.
        </p>
      </div>
    </footer>
  );
}
