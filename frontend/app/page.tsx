import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full opacity-[0.18] blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, var(--brick), transparent 62%)",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-16 sm:px-8 sm:pt-24">
          <p className="mb-5 inline-flex items-center gap-2 border border-[var(--line)] bg-[var(--surface)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--pine)" }}
            />
            Screening aid · not a CBC
          </p>
          <h1 className="font-serif text-[2.75rem] leading-[1.05] tracking-tight text-[var(--ink)] sm:text-6xl md:text-7xl">
            Check for anaemia<br />
            <span className="text-[var(--brick)]">with your camera.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)] sm:text-xl">
            Point your phone at your face, pull your lower eyelid down, and hold still
            for three seconds. We estimate your haemoglobin from the colour of the
            inner tissue — no needle, no lab, no waiting room.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              href="/exam"
              className="inline-flex items-center gap-2 bg-[var(--brick)] px-7 py-4 text-[15px] font-medium text-[var(--surface)] shadow-[0_1px_0_rgba(0,0,0,0.15)] transition hover:translate-y-[-1px]"
            >
              Start a free exam
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 border border-[var(--line)] bg-[var(--surface)] px-6 py-4 text-[15px] text-[var(--ink)] hover:border-[var(--brick)]"
            >
              How it works
            </Link>
          </div>
          <p className="mt-6 max-w-xl text-[13px] text-[var(--muted)]">
            Nothing leaves your device without your click. Low haemoglobin readings
            should be confirmed by a lab blood test before any treatment decision.
          </p>
        </div>
      </section>

      {/* Stakes / impact numbers */}
      <section className="border-y border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
          <p className="mb-8 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Why we built this
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                figure: "1.6B",
                caption:
                  "people live with anaemia today — most in places a lab test never reaches.",
                source: "WHO, 2024",
              },
              {
                figure: "40%",
                caption:
                  "of children under five in low-income countries. Diagnosis usually comes too late.",
                source: "WHO Global Nutrition Report",
              },
              {
                figure: "30s",
                caption:
                  "from opening the app to a triage-ready report. Any modern phone; no add-on hardware.",
                source: "This is what we ship.",
              },
            ].map((s) => (
              <div key={s.figure}>
                <p className="font-serif text-5xl leading-none tabular-nums text-[var(--ink)]">
                  {s.figure}
                </p>
                <p className="mt-4 text-[15px] leading-relaxed text-[var(--ink)]">
                  {s.caption}
                </p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                  {s.source}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Three steps
          </p>
          <h2 className="font-serif text-4xl leading-tight text-[var(--ink)] sm:text-5xl">
            Faster than opening the calculator app.
          </h2>
        </div>
        <ol className="grid gap-8 md:grid-cols-3">
          {[
            {
              n: "01",
              h: "Point the camera",
              p: "Front camera is fine. Sit near a window — daylight is the friendliest lens.",
            },
            {
              n: "02",
              h: "Pull down the lid",
              p: "Frame the pink inner surface inside the oval. Not the iris, not the white of the eye.",
            },
            {
              n: "03",
              h: "Read the report",
              p: "Estimated Hb in g/dL, WHO anaemia class, transfusion band, and flags if the image is off.",
            },
          ].map((step) => (
            <li
              key={step.n}
              className="border border-[var(--line)] bg-[var(--surface)] p-6"
            >
              <p className="font-mono text-[13px] tracking-widest text-[var(--brick)]">
                {step.n}
              </p>
              <h3 className="mt-4 font-serif text-xl text-[var(--ink)]">
                {step.h}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)]">
                {step.p}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* Proof */}
      <section className="border-t border-[var(--line)] bg-[var(--paper)]">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-12 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                Built on the science
              </p>
              <h2 className="font-serif text-4xl leading-tight text-[var(--ink)] sm:text-5xl">
                Not a chatbot with a stethoscope.
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-[var(--muted)]">
                Every step of the pipeline — where to crop, which colour axis to
                read, how to grade the image — comes from a peer-reviewed paper.
                We list them all on the Evidence page, with one line each about
                how they inform this build.
              </p>
              <Link
                href="/evidence"
                className="mt-6 inline-flex items-center gap-2 border-b border-[var(--brick)] pb-0.5 text-sm text-[var(--brick)]"
              >
                Read the evidence trail →
              </Link>
            </div>
            <dl className="grid grid-cols-2 gap-6">
              {[
                {
                  k: "13",
                  v: "peer-reviewed studies inform the pipeline",
                },
                {
                  k: "AUC 0.92",
                  v: "at the 7 g/dL transfusion threshold (Zhao 2024)",
                },
                {
                  k: "WHO 2024",
                  v: "adult cutoffs baked into the triage",
                },
                {
                  k: "AABB 2023",
                  v: "restrictive transfusion band marked on the report",
                },
              ].map((f) => (
                <div key={f.k} className="border-t border-[var(--line)] pt-4">
                  <dt className="font-serif text-2xl text-[var(--ink)]">{f.k}</dt>
                  <dd className="mt-2 text-[13px] leading-snug text-[var(--muted)]">
                    {f.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
          Who this is for
        </p>
        <h2 className="max-w-3xl font-serif text-4xl leading-tight text-[var(--ink)] sm:text-5xl">
          For anyone who can't wait a week for a blood test.
        </h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              t: "Community health workers",
              d: "Screen a village in an afternoon. Refer only the flags. No consumables to reorder.",
            },
            {
              t: "Prenatal and paediatric clinics",
              d: "Catch iron deficiency between routine visits. Attach the report to the chart.",
            },
            {
              t: "You, at home",
              d: "Check on a family member without a clinic run. Escalate if the number is low.",
            },
          ].map((who) => (
            <div key={who.t}>
              <h3 className="font-serif text-xl text-[var(--ink)]">{who.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
                {who.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[var(--line)] bg-[var(--surface)]">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8">
          <h2 className="font-serif text-4xl leading-tight text-[var(--ink)] sm:text-5xl">
            Ready in ninety seconds.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-relaxed text-[var(--muted)]">
            You'll get a haemoglobin estimate, a WHO anaemia class, a triage
            note, and honest flags if the frame is bad. No sign-up needed to
            try it.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/exam"
              className="inline-flex items-center gap-2 bg-[var(--brick)] px-7 py-4 text-[15px] font-medium text-[var(--surface)]"
            >
              Take the exam
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 border border-[var(--line)] bg-[var(--paper)] px-6 py-4 text-[15px] text-[var(--ink)]"
            >
              Sign in to save reports
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
