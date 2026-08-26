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
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl">Exam log</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Stored in this browser only. Nothing is sent to a server after the
            analysis call.
          </p>
        </div>
        {rows.length > 0 && (
          <button
            type="button"
            className="text-sm underline decoration-[var(--line)]"
            onClick={() => {
              clearExamLog();
              setRows([]);
            }}
          >
            Clear
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-[var(--muted)]">
          No exams yet.{" "}
          <Link href="/" className="underline decoration-[var(--line)]">
            Capture one
          </Link>
          .
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {rows.map((row) => (
            <div key={row.scan_id}>
              <p className="mb-2 font-mono text-[11px] text-[var(--muted)]">
                {row.captured_at} · {row.source}
              </p>
              <ResultSheet result={row} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
