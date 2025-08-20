import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const base = process.env.API_BASE_INTERNAL || process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";
  const r = await fetch(`${base}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    return NextResponse.json({ error: data?.detail || "Login failed" }, { status: r.status });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("token", data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
