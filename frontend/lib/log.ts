import type { AnalyzeResult } from "./types";

const KEY = "hemavision.exams";
const MAX_ENTRIES = 40;

export type LoggedExam = AnalyzeResult & { source: "camera" | "upload" };

function isLoggedExam(value: unknown): value is LoggedExam {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<LoggedExam>;
  return (
    typeof v.scan_id === "string" &&
    typeof v.captured_at === "string" &&
    typeof v.hemoglobin_g_dL === "number" &&
    (v.source === "camera" || v.source === "upload") &&
    !!v.who &&
    !!v.quality &&
    !!v.metrics
  );
}

export function readExamLog(): LoggedExam[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLoggedExam);
  } catch {
    return [];
  }
}

export function appendExam(entry: LoggedExam) {
  if (typeof window === "undefined") return;
  const next = [entry, ...readExamLog()].slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked (private mode). Try to shed history and retry once.
    try {
      window.localStorage.setItem(KEY, JSON.stringify([entry]));
    } catch {
      /* Give up silently — the log is best-effort. */
    }
  }
}

export function clearExamLog() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
