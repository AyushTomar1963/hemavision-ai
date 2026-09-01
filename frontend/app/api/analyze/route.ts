export const runtime = "nodejs";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://127.0.0.1:8000";

export async function POST(request: Request) {
  const formData = await request.formData();
  const headers: HeadersInit = {};
  const auth = request.headers.get("authorization");
  if (auth) headers["authorization"] = auth;

  try {
    const res = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      body: formData,
      headers,
    });
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
      {
        detail:
          "Cannot reach FastAPI at port 8000. Start the backend with uvicorn.",
      },
      { status: 502 },
    );
  }
}
