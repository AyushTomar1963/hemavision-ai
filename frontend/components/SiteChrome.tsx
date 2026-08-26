"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Exam" },
  { href: "/protocol", label: "Protocol" },
  { href: "/evidence", label: "Evidence" },
  { href: "/log", label: "Log" },
];

export function SiteHeader() {
  const path = usePathname();

  return (
    <header className="border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-3 sm:px-8">
        <Link href="/" className="min-w-0">
          <div className="font-serif text-[1.35rem] leading-none text-[var(--ink)]">
            HemaVision
          </div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">
            Palpebral conjunctiva exam
          </div>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-[13px]">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? path === "/" : path.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 ${
                  active
                    ? "text-[var(--ink)] underline decoration-[var(--brick)] underline-offset-8"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-5 py-4 text-[12px] leading-relaxed text-[var(--muted)] sm:px-8">
        Screening aid only. A laboratory complete blood count remains the
        reference standard. Not for transfusion decisions without a confirmatory
        assay.
      </div>
    </footer>
  );
}
