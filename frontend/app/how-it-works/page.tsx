import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works",
};

const STEPS = [
  {
    n: "01",
    h: "Find the light",
    p: "Sit near a window or under a lamp with a diffuser — the sort of light you'd use for a video call. Skip point flashes and overhead spots; big hotspots on the lid throw the colour off.",
  },
  {
    n: "02",
    h: "Pull the lower lid down",
    p: "Gently pull your lower eyelid down until the inner pink surface is on show. That tissue is thin and heavily vascular, which is exactly why the colour there tracks haemoglobin.",
  },
  {
    n: "03",
    h: "Fill the oval",
    p: "Zoom until the reticle is mostly pink — no iris, no white of the eye. If the oval doesn't fill, the reading is wrong before we even start.",
  },
  {
    n: "04",
    h: "Hold still for the three-count",
    p: "We snap the frame at zero. The pipeline cleans up specular glare, sharpens the vessels, converts to CIELAB and reads the redness against a linear map trained on published cohorts.",
  },
  {
    n: "05",
    h: "Read the report — not just the number",
    p: "The quality flags matter more than a tenth of a g/dL. If we say the frame was underexposed or the ROI was too small, retake it. If the number is low, get a lab CBC before treating.",
  },
];

const FAQ = [
  {
    q: "Is this a diagnosis?",
    a: "No. It's a screening estimate to flag people who probably need a real blood test. WHO cutoffs and the AABB transfusion band are marked on the report so you know when to escalate.",
  },
  {
    q: "How accurate is it?",
    a: "Published smartphone-only methods have an AUC around 0.92 at the 7 g/dL transfusion threshold and 0.90 at 9 g/dL (Zhao 2024). Limits of agreement against a CBC in the emergency-department cohort were roughly ±4.8 g/dL. Good for triage, not for dosing iron.",
  },
  {
    q: "Does my photo go anywhere?",
    a: "The image is sent to our analysis server, run through the pipeline, and thrown away. The report — no image — is saved in your browser only, unless you signed in and we later add cloud sync.",
  },
  {
    q: "Which phones work?",
    a: "Any phone with a modern browser and a front camera. Newer Android/iPhone cameras that expose an optical-zoom capability drive it directly through the browser; older cameras fall back to a digital crop.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
      <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
        How it works
      </p>
      <h1 className="font-serif text-4xl leading-tight text-[var(--ink)] sm:text-5xl">
        Five moves and a number you can act on.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
        HemaVision reads the colour of the inner surface of your lower eyelid,
        maps it to a haemoglobin estimate, and grades the picture so you know
        whether to trust it. Here's what happens between hitting Capture and
        seeing the report.
      </p>

      <ol className="mt-14 space-y-10">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="grid gap-4 md:grid-cols-[6rem_1fr]"
          >
            <p className="font-mono text-[15px] tracking-[0.2em] text-[var(--brick)]">
              {s.n}
            </p>
            <div>
              <h2 className="font-serif text-2xl text-[var(--ink)]">{s.h}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
                {s.p}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-20 border-t border-[var(--line)] pt-12">
        <h2 className="font-serif text-3xl text-[var(--ink)]">
          Straight answers
        </h2>
        <dl className="mt-8 space-y-8">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt className="font-serif text-lg text-[var(--ink)]">{f.q}</dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
                {f.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="mt-16 text-sm">
        <Link
          href="/exam"
          className="inline-flex items-center gap-2 bg-[var(--brick)] px-6 py-3 text-[var(--surface)]"
        >
          Try it now →
        </Link>
      </p>
    </div>
  );
}
