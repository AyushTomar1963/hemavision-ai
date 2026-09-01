import type { Metadata } from "next";
import Link from "next/link";
import { FEATURES, PAPERS } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Evidence",
};

export default function EvidencePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
        Evidence
      </p>
      <h1 className="max-w-3xl font-serif text-4xl leading-tight text-[var(--ink)] sm:text-5xl">
        The receipts.
      </h1>
      <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[var(--muted)]">
        Every design choice in HemaVision — the region we crop, the colour
        axis we read, the thresholds we flag — comes from a peer-reviewed paper
        or a published guideline. Here's what we built and where it comes from.
      </p>

      <div className="mt-8 flex gap-6 text-sm">
        <a
          href="#features"
          className="border-b border-[var(--brick)] pb-0.5 text-[var(--brick)]"
        >
          What we built
        </a>
        <a
          href="#papers"
          className="border-b border-[var(--line)] pb-0.5 text-[var(--ink)] hover:border-[var(--brick)] hover:text-[var(--brick)]"
        >
          What we cite
        </a>
      </div>

      <section id="features" className="mt-16">
        <h2 className="font-serif text-3xl text-[var(--ink)]">What we built</h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          The pipeline in plain terms, grouped by what it does.
        </p>
        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {FEATURES.map((block) => (
            <div
              key={block.group}
              className="border border-[var(--line)] bg-[var(--surface)] p-6"
            >
              <h3 className="border-b border-[var(--line)] pb-3 font-serif text-lg">
                {block.group}
              </h3>
              <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-[var(--muted)]">
                {block.items.map((item) => (
                  <li key={item} className="pl-4 -indent-4">
                    — {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="papers" className="mt-20">
        <h2 className="font-serif text-3xl text-[var(--ink)]">
          What we cite
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">
          {PAPERS.length} sources, oldest first. Each note says how the paper
          informs this build.
        </p>
        <ol className="mt-10 space-y-10">
          {PAPERS.map((paper, i) => (
            <li key={paper.doi} className="grid gap-3 md:grid-cols-[5rem_1fr]">
              <div className="font-mono text-sm text-[var(--muted)]">
                {String(i + 1).padStart(2, "0")}
                <div className="mt-1 text-[var(--brick)]">{paper.year}</div>
              </div>
              <div>
                <p className="text-[15px] leading-relaxed text-[var(--ink)]">
                  {paper.citation}
                </p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  <span className="font-medium text-[var(--ink)]">
                    In HemaVision:
                  </span>{" "}
                  {paper.used_for}
                </p>
                <a
                  href={paper.url}
                  className="mt-2 inline-block font-mono text-[12px] text-[var(--brick)] underline decoration-[var(--line)] hover:decoration-[var(--brick)]"
                  target="_blank"
                  rel="noreferrer"
                >
                  {paper.doi} ↗
                </a>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-20 border-t border-[var(--line)] pt-12 text-sm">
        <Link
          href="/exam"
          className="inline-flex items-center gap-2 bg-[var(--brick)] px-6 py-3 text-[var(--surface)]"
        >
          Ready to try it →
        </Link>
      </div>
    </div>
  );
}
