export const dynamic = "force-dynamic";

function apiBase() {
  // When running on the server (in the container), use the internal URL.
  return process.env.API_BASE_INTERNAL
    ?? process.env.NEXT_PUBLIC_API_BASE
    ?? "http://localhost:8000";
}

async function getMonitors() {
  const base = apiBase();
  const res = await fetch(`${base}/v1/monitors`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export default async function Home() {
  const monitors = await getMonitors();
  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Uptime Dashboard</h1>
      <a href="/monitors/new" className="underline text-blue-600">+ New Monitor</a>
      <ul className="space-y-3">
        {monitors.map((m: any) => (
          <li key={m.id} className="border rounded p-4">
            <div className="font-medium">{m.name}</div>
            <div className="text-sm text-gray-600">{m.url}</div>
            <div className="text-sm">Every {m.interval_sec}s · Expect {m.expected_status}</div>
            <a className="text-blue-600 underline" href={`/status/${m.slug}`}>Public status</a>
          </li>
        ))}
        {monitors.length === 0 && <li>No monitors yet.</li>}
      </ul>
    </main>
  );
}
