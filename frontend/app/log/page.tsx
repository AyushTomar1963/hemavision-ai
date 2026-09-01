"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResultSheet } from "@/components/ResultSheet";
import { clearExamLog, readExamLog, type LoggedExam } from "@/lib/log";

export default function LogPage() {
  const [rows, setRows] = useState<LoggedExam[]>([]);

  useEffect(() => {
    setRows(readExamLog());
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
            Your history
          </p>
          <h1 className="font-serif text-4xl text-[var(--ink)] sm:text-5xl">
            Everything you've captured.
          </h1>
          <p className="mt-3 max-w-xl text-sm text-[var(--muted)]">
            Stays in this browser only — clearing your site data wipes it. The
            server never sees these once the report has come back.
          </p>
        </div>
        {rows.length > 0 && (
          <button
            type="button"
            className="border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--muted)] hover:text-[var(--brick)]"
            onClick={() => {
              clearExamLog();
              setRows([]);
            }}
          >
            Clear history
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="mt-16 border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-center">
          <p className="font-serif text-xl text-[var(--ink)]">Nothing here yet.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Take your first exam to see reports show up here.
          </p>
          <Link
            href="/exam"
            className="mt-6 inline-flex items-center gap-2 bg-[var(--brick)] px-5 py-3 text-sm text-[var(--surface)]"
          >
            Start an exam →
          </Link>
        </div>
      ) : (
        <div className="mt-12 space-y-10">
          {rows.map((row) => (
            <div key={row.scan_id}>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted)]">
                {new Date(row.captured_at).toLocaleString()} · {row.source}
              </p>
              <ResultSheet result={row} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
