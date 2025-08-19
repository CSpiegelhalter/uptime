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
            {monitors.map((m: any) => (
              <li
                key={m.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-emerald-100"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold">{m.name}</h3>
                      <StatusDot ok={m.lastOk} />
                    </div>
                    <a
                      href={m.url}
                      target="_blank"
                      className="mt-1 block max-w-full truncate text-sm text-slate-600 underline-offset-2 hover:underline"
                      rel="noreferrer"
                    >
                      {m.url}
                    </a>
                  </div>
                  <a
                    href={`/status/${m.slug}`}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    title="Public status"
                  >
                    Status
                  </a>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge>
                    24h Uptime:&nbsp;
                    <span className="font-semibold">
                      {m.summary?.uptime_pct != null ? `${m.summary.uptime_pct}%` : "—"}
                    </span>
                  </Badge>
                  <Badge>
                    Avg latency:&nbsp;
                    <span className="font-semibold">
                      {m.summary?.avg_latency_ms != null ? `${Math.round(m.summary.avg_latency_ms)} ms` : "—"}
                    </span>
                  </Badge>
                  <Badge>Every {m.interval_sec}s</Badge>
                  <Badge>Expect {m.expected_status}</Badge>
                </div>

                {/* Stable last-check slot (no layout shift) */}
                <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 min-h-[44px] flex items-center">
                  {m.lastLatency != null ? (
                    <>Last check: {m.lastCode ?? "—"} · {m.lastLatency} ms</>
                  ) : (
                    <div className="w-full flex items-center gap-2 text-slate-500">
                      <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-slate-300" />
                      First check pending…
                      <span className="ml-auto inline-block h-2 w-28 animate-pulse rounded bg-slate-200" />
                    </div>
                  )}
                </div>

                {/* Actions stay in the same place now */}
                <div className="mt-5 flex items-center gap-2">
                  <a
                    href={`/status/${m.slug}`}
                    className="inline-flex flex-1 items-center justify-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
                  >
                    View status
                  </a>
                  <a
                    href={`/monitors/${m.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Details
                  </a>
                </div>

              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
