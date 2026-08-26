import type { Metadata } from "next";
import { FEATURES, PAPERS } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Evidence",
};

export default function EvidencePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <h1 className="font-serif text-3xl sm:text-4xl">Evidence</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">
        What this build actually does, and the papers the pipeline is taken
        from. Citations are the published record — not a claim that HemaVision
        has been validated as a medical device.
      </p>

      <div className="mt-6 flex gap-4 text-sm">
        <a href="#features" className="underline decoration-[var(--line)]">
          Features
        </a>
        <a href="#papers" className="underline decoration-[var(--line)]">
          Papers
        </a>
      </div>

      <section id="features" className="mt-12">
        <h2 className="font-serif text-2xl">Implemented features</h2>
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          {FEATURES.map((block) => (
            <div key={block.group}>
              <h3 className="border-b border-[var(--line)] pb-2 font-serif text-lg">
                {block.group}
              </h3>
              <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-[var(--muted)]">
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

      <section id="papers" className="mt-16">
        <h2 className="font-serif text-2xl">Research papers used</h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {PAPERS.length} sources, oldest first. Each note states how it is
          used in this codebase.
        </p>
        <ol className="mt-8 space-y-8">
          {PAPERS.map((paper, i) => (
            <li key={paper.doi} className="grid gap-2 md:grid-cols-[4rem_1fr]">
              <div className="font-mono text-sm text-[var(--muted)]">
                {String(i + 1).padStart(2, "0")}
                <div>{paper.year}</div>
              </div>
              <div>
                <p className="text-[15px] leading-relaxed">{paper.citation}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  In this build: {paper.used_for}
                </p>
                <a
                  href={paper.url}
                  className="mt-1 inline-block font-mono text-[12px] text-[var(--brick)] underline decoration-[var(--line)]"
                  target="_blank"
                  rel="noreferrer"
                >
                  {paper.doi}
                </a>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
