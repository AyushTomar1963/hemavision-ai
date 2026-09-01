/**
 * Thin client for the HemaVision Next.js API proxy.
 *
 * All requests go through /api/* so the backend URL and CORS stay
 * server-side; the browser only ever talks to same-origin routes.
 */

import type { AnalyzeResult } from "./types";

export type BackendError = { detail: string; request_id?: string };

async function parseError(response: Response): Promise<never> {
  let body: BackendError | null = null;
  try {
    body = (await response.json()) as BackendError;
  } catch {
    /* non-JSON */
  }
  throw new Error(body?.detail || `Request failed (${response.status})`);
}

export type AuthTokens = {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  email: string;
};

export type MePayload = { email: string; created_at: string };

export async function analyze(
  blob: Blob,
  sex: "female" | "male" | "unspecified",
  token: string | null,
): Promise<AnalyzeResult> {
  const formData = new FormData();
  formData.append("file", blob, "capture.jpg");
  formData.append("sex", sex);
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData,
    headers,
  });
  if (!response.ok) await parseError(response);
  return (await response.json()) as AnalyzeResult;
}

export async function signup(email: string, password: string): Promise<AuthTokens> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) await parseError(response);
  return (await response.json()) as AuthTokens;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) await parseError(response);
  return (await response.json()) as AuthTokens;
}

export async function me(token: string): Promise<MePayload> {
  const response = await fetch("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) await parseError(response);
  return (await response.json()) as MePayload;
}
