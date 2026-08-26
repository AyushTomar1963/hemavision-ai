import type { AnalyzeResult } from "./types";

const KEY = "hemavision.exams";

export type LoggedExam = AnalyzeResult & { source: "camera" | "upload" };

export function readExamLog(): LoggedExam[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LoggedExam[]) : [];
  } catch {
    return [];
  }
}

export function appendExam(entry: LoggedExam) {
  const next = [entry, ...readExamLog()].slice(0, 40);
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearExamLog() {
  localStorage.removeItem(KEY);
}
