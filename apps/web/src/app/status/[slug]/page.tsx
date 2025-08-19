import { apiBase } from "@/lib/api";

export const dynamic = "force-dynamic";

async function getStatus(slug: string) {
  const base = apiBase()
  const res = await fetch(`${base}/v1/status/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function StatusPage(
    { params }: { params: Promise<{ slug: string }> }
  ) {
    const { slug } = await params;          // ← await params before using it
    const data = await getStatus(slug);
  
  if (!data) return <main className="p-8">Not found</main>;
  const m = data.monitors[0];
  const last = m?.last;
  const color = last?.ok ? "bg-green-500" : "bg-red-500";
  return (
    <main className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold">Status: {m.name}</h1>
      <div className={`inline-block w-3 h-3 rounded-full ${color}`} />{" "}
      <span>{last?.ok ? "Up" : "Down"}</span>
      <div className="text-sm text-gray-600">
        URL: {m.url} · Expected {m.expected_status} · Every {m.interval_sec}s
      </div>
      {last && (
        <div className="text-sm">
          Last check: {last.ts} · {last.status_code} · {last.latency_ms} ms
        </div>
      )}
      <a className="underline text-blue-600" href="/">← Back</a>
    </main>
  );
}
