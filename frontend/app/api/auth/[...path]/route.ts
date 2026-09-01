/**
 * Catch-all proxy for /api/auth/* → FastAPI /auth/*
 * Same-origin so cookies and CORS stay simple.
 */

export const runtime = "nodejs";

const BACKEND_URL =
  process.env.BACKEND_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://hemavision-api.onrender.com"
    : "http://127.0.0.1:8000");

async function forward(request: Request, path: string[]) {
  const url = `${BACKEND_URL}/auth/${path.join("/")}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  const init: RequestInit = { method: request.method, headers };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.text();
  }

  try {
    const res = await fetch(url, init);
    const text = await res.text();
    try {
      return Response.json(JSON.parse(text), { status: res.status });
    } catch {
      return Response.json(
        { detail: text || "Backend returned a non-JSON response." },
        { status: res.status || 502 },
      );
    }
  } catch {
    return Response.json(
      { detail: "Cannot reach FastAPI at port 8000. Start the backend." },
      { status: 502 },
    );
  }
}

type Params = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, { params }: Params) {
  const { path } = await params;
  return forward(request, path);
}

export async function POST(request: Request, { params }: Params) {
  const { path } = await params;
  return forward(request, path);
}
