import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Protocol",
};

export default function ProtocolPage() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <h1 className="font-serif text-3xl sm:text-4xl">Capture protocol</h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--muted)]">
        Adapted from Collings et al. (2016) and Zhao et al. (2021, 2024):
        photograph the palpebral conjunctiva under ambient light, isolate the
        inner eyelid, then estimate haemoglobin from colour — not from the
        white of the eye.
      </p>

      <ol className="mt-10 space-y-8">
        <li>
          <h2 className="font-serif text-xl">1. Light</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
            Face a window or a diffuse lamp. Avoid a point flash on the lid —
            specular glare is inpainted, but large hotspots still degrade a*
            and the erythema index.
          </p>
        </li>
        <li>
          <h2 className="font-serif text-xl">2. Evert the lid</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
            Pull the lower lid down until the palpebral mucosa is seen. That
            tissue is highly vascular and has little melanin, which is why it
            is preferred over skin or the forniceal fold (Collings 2016).
          </p>
        </li>
        <li>
          <h2 className="font-serif text-xl">3. Frame</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
            Use the zoom control so the dashed oval is filled with pink mucosa.
            The backend crops the centre of the frame to match this oval; if
            the iris sits in the middle, the redness signal is wrong.
          </p>
        </li>
        <li>
          <h2 className="font-serif text-xl">4. Capture</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
            Hold still through the three-count. The workstation sends a JPEG to
            FastAPI. Processing: glare mask → Telea inpaint → high-pass
            sharpen → CIELAB → erythema index → chromophore Hb. ConvNeXt-Tiny
            runs as the regression architecture; the number on the sheet is the
            chromophore map, not an ImageNet score.
          </p>
        </li>
        <li>
          <h2 className="font-serif text-xl">5. Read the sheet</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--muted)]">
            Quality flags matter more than a tenth of a g/dL. Zhao et al. 2024
            reported limits of agreement of about ±4.8 g/dL in an ED cohort —
            this demo is a screener, not a CBC. Confirm low values in a lab
            before any transfusion decision (AABB 2023: 7 g/dL band).
          </p>
        </li>
      </ol>

      <p className="mt-12 text-sm">
        <Link href="/" className="underline decoration-[var(--line)]">
          Return to the exam
        </Link>
      </p>
    </article>
  );
}
