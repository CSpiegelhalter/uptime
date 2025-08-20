import MonitorCard, { type MonitorListItem } from "@/components/MonitorCard";
import { apiBase } from "@/lib/api";
import { readTokenServer } from "@/lib/session";

export const dynamic = "force-dynamic";

async function fetchMonitors(): Promise<MonitorListItem[]> {
  const base = apiBase();
  const token = await readTokenServer();
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : undefined;

  // List monitors (private)
  const res = await fetch(`${base}/v1/monitors`, {
    cache: "no-store",
    headers: authHeaders
  });
  console.log(authHeaders)
  
  if (!res.ok) return [];
  console.log('after')
  const monitors = await res.json();

  // Enrich each monitor with summary (private) + last check via public status
  const enriched = await Promise.all(
    monitors.map(async (m: any) => {
      const [sumRes, statRes] = await Promise.all([
        fetch(`${base}/v1/monitors/${m.id}/summary?range=24h`, {
          cache: "no-store",
          headers: authHeaders,
        }),
        fetch(`${base}/v1/status/${m.slug}`, { cache: "no-store" }),
      ]);

      const summary = sumRes.ok ? await sumRes.json() : null;
      const statusJson = statRes.ok ? await statRes.json() : null;
      const last = statusJson?.monitors?.[0]?.last ?? null;

      return {
        ...m,
        summary,
        lastOk: last?.ok ?? null,
        lastCode: last?.status_code ?? null,
        lastLatency: last?.latency_ms ?? null,
      };
    })
  );

  return enriched;
}

export default async function Home() {
  const monitors = await fetchMonitors();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Track uptime, latency, and incidents for your endpoints.
            </p>
          </div>
        </div>

        {monitors.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-slate-100 p-2.5">
              <div className="h-full w-full rounded-full bg-gradient-to-tr from-emerald-400 to-sky-400" />
            </div>
            <h2 className="text-lg font-medium">No monitors yet</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
              Create your first monitor to start collecting checks and uptime.
            </p>
            <a
              href="/monitors/new"
              className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
            >
              Create monitor
            </a>
          </div>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {monitors.map((m: MonitorListItem) => (
              <MonitorCard key={m.id} m={m} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
