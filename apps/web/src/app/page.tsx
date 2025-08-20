import MonitorCard, { MonitorListItem } from "@/components/MonitorCard";
import { apiBase } from "@/lib/api";

export const dynamic = "force-dynamic";

async function fetchMonitors() {
  const base = apiBase();
  const res = await fetch(`${base}/v1/monitors`, { cache: "no-store" });
  if (!res.ok) return [];
  const monitors = await res.json();

  // Enrich each monitor with summary + last check (status page)
  const enriched = await Promise.all(
    monitors.map(async (m: any) => {
      const [sumRes, statRes] = await Promise.all([
        fetch(`${base}/v1/monitors/${m.id}/summary?range=24h`, { cache: "no-store" }),
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

function StatusDot({ ok }: { ok: boolean | null }) {
  const color = ok === null ? "bg-gray-300" : ok ? "bg-emerald-500" : "bg-red-500";
  const label = ok === null ? "No data" : ok ? "Up" : "Down";
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      <span className="text-sm text-gray-600">{label}</span>
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">
      {children}
    </span>
  );
}

export default async function Home() {
  const monitors = await fetchMonitors();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-sky-500 shadow-sm" />
            <span className="text-lg font-semibold tracking-tight">Uptime Monitor</span>
          </div>
          <a
            href="/monitors/new"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800"
          >
            + New Monitor
          </a>
        </div>
      </header>

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
