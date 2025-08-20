import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiBase } from "@/lib/api";
type Params = { id: string };

export async function DELETE(_req: Request, ctx: unknown) {
    const { id } = (ctx as { params: Params }).params;


  const token = (await cookies()).get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = apiBase()

  const r = await fetch(`${base}/v1/monitors/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (r.status === 204) {
    return new Response(null, { status: 204 });
  }

  // bubble up backend error details if present
  const body = await r.json().catch(() => ({}));
  return NextResponse.json(body, { status: r.status });
}
