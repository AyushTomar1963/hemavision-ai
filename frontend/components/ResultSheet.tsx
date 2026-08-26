import type { AnalyzeResult } from "@/lib/types";

function severityLabel(severity: string) {
  if (severity === "none") return "Not classified as anaemia";
  return `${severity} anaemia`;
}

export function ResultSheet({ result }: { result: AnalyzeResult }) {
  const hb = result.hemoglobin_g_dL;
  const band =
    hb < 7 ? "var(--brick)" : hb < 9 ? "#8a5a12" : "var(--pine)";

  return (
    <section className="border border-[var(--line)] bg-[var(--surface)]">
      <div className="flex items-baseline justify-between gap-4 border-b border-[var(--line)] px-4 py-3">
        <h2 className="font-serif text-lg text-[var(--ink)]">Exam report</h2>
        <p className="font-mono text-[11px] text-[var(--muted)]">
          {result.scan_id}
        </p>
      </div>

      <div className="grid gap-6 px-4 py-5 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[var(--muted)]">
            Estimated haemoglobin
          </p>
          <p className="mt-1 font-serif text-5xl tabular-nums leading-none text-[var(--ink)]">
            {hb.toFixed(1)}
            <span className="ml-2 font-sans text-base text-[var(--muted)]">
              g/dL
            </span>
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            ± {result.uncertainty_g_dL} g/dL from image quality — not a lab
            confidence interval.
          </p>
        </div>
        <div className="self-start border border-[var(--line)] px-3 py-2 text-right">
          <p className="text-[11px] text-[var(--muted)]">Triage</p>
          <p className="mt-1 max-w-[14rem] text-sm text-[var(--ink)]">
            {result.status}
          </p>
        </div>
      </div>

      <div className="mx-4 mb-4 h-2 overflow-hidden bg-[var(--paper)]">
        <div
          className="h-full"
          style={{
            width: `${Math.min(100, (hb / 18) * 100)}%`,
            background: band,
          }}
        />
      </div>
      <div className="mx-4 mb-5 flex justify-between font-mono text-[10px] text-[var(--muted)]">
        <span>5 critical</span>
        <span>7 AABB</span>
        <span>9 Zhao band</span>
        <span>12–13 WHO</span>
        <span>18</span>
      </div>

      <dl className="grid grid-cols-2 border-t border-[var(--line)] text-sm sm:grid-cols-4">
        <div className="border-b border-[var(--line)] px-4 py-3 sm:border-r">
          <dt className="text-[11px] text-[var(--muted)]">WHO class</dt>
          <dd className="mt-1">{severityLabel(result.who.severity)}</dd>
        </div>
        <div className="border-b border-[var(--line)] px-4 py-3 sm:border-r">
          <dt className="text-[11px] text-[var(--muted)]">Cutoff used</dt>
          <dd className="mt-1">
            {result.who.cutoff_g_dL} g/dL ({result.who.sex})
          </dd>
        </div>
        <div className="border-b border-[var(--line)] px-4 py-3 sm:border-r">
          <dt className="text-[11px] text-[var(--muted)]">Image quality</dt>
          <dd className="mt-1 capitalize">
            {result.quality.grade} ({Math.round(result.quality.score * 100)}%)
          </dd>
        </div>
        <div className="border-b border-[var(--line)] px-4 py-3">
          <dt className="text-[11px] text-[var(--muted)]">Glare</dt>
          <dd className="mt-1">{result.quality.glare_pct}%</dd>
        </div>
        <div className="px-4 py-3 sm:border-r">
          <dt className="text-[11px] text-[var(--muted)]">CIELAB a*</dt>
          <dd className="mt-1 font-mono">{result.metrics.cielab_a_star}</dd>
        </div>
        <div className="px-4 py-3 sm:border-r">
          <dt className="text-[11px] text-[var(--muted)]">Erythema index</dt>
          <dd className="mt-1 font-mono">{result.metrics.erythema_index}</dd>
        </div>
        <div className="px-4 py-3 sm:border-r">
          <dt className="text-[11px] text-[var(--muted)]">L*</dt>
          <dd className="mt-1 font-mono">{result.metrics.cielab_L}</dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-[11px] text-[var(--muted)]">b*</dt>
          <dd className="mt-1 font-mono">{result.metrics.cielab_b_star}</dd>
        </div>
      </dl>

      {result.quality.flags.length > 0 && (
        <ul className="border-t border-[var(--line)] px-4 py-3 text-sm text-[var(--brick)]">
          {result.quality.flags.map((flag) => (
            <li key={flag}>{flag}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
