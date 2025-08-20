import { apiBase } from "@/lib/api";

export const dynamic = "force-dynamic";

function fmt(ts?: string) {
  if (!ts) return "—";
  try { return new Date(ts).toLocaleString(); } catch { return ts; }
}

async function getData(id: string) {
  const base = apiBase();
  // get monitor info from the list (keeps API minimal)
  const listRes = await fetch(`${base}/v1/monitors`, { cache: "no-store" });
  if (!listRes.ok) return null;
  const all = await listRes.json();
  const m = all.find((x: any) => x.id === id);
  if (!m) return null;

  const [sumRes, statRes] = await Promise.all([
    fetch(`${base}/v1/monitors/${id}/summary?range=24h`, { cache: "no-store" }),
    fetch(`${base}/v1/status/${m.slug}`, { cache: "no-store" }),
  ]);

  const summary = sumRes.ok ? await sumRes.json() : null;
  const statusJson = statRes.ok ? await statRes.json() : null;
  const last = statusJson?.monitors?.[0]?.last ?? null;

  return { m, summary, last };
}

export default async function MonitorDetails({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);

  if (!data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold">Monitor not found</h1>
            <a href="/" className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
              ← Back to dashboard
            </a>
          </div>
        </div>
      </main>
    );
  }

  const { m, summary, last } = data;
  const isUp = last?.ok ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-sky-500 shadow-sm" />
            <span className="text-lg font-semibold tracking-tight">Details · {m.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <a href={`/status/${m.slug}`} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Public status</a>
            <a href="/" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">← Dashboard</a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">{m.name}</h1>
          <a href={m.url} target="_blank" rel="noreferrer" className="mt-1 block max-w-full truncate text-sm text-slate-600 underline-offset-2 hover:underline">
            {m.url}
          </a>

          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <div className="font-medium">Uptime (24h)</div>
              <div className="mt-1 text-slate-700">
                {summary ? (
                  <>
                    {summary.uptime_pct ?? "—"}% · {summary.avg_latency_ms != null ? `${Math.round(summary.avg_latency_ms)} ms` : "—"}
                  </>
                ) : "—"}
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <div className="font-medium">Last check</div>
              <div className="mt-1 text-slate-700">
                {last ? (
                  <>
                    {fmt(last.ts)} · HTTP {last.status_code ?? "—"} · {last.latency_ms} ms
                  </>
                ) : "Waiting for first check…"}
              </div>
            </div>
          </div>
        </section>

        {/* Placeholder for future config / recent checks */}
        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Configuration</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-600">Interval</dt>
                <dd className="font-medium text-slate-900">{m.interval_sec}s</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-600">Expected status</dt>
                <dd className="font-medium text-slate-900">{m.expected_status}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-600">Slug</dt>
                <dd className="font-medium text-slate-900">{m.slug}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent checks</h2>
            <p className="mt-2 text-sm text-slate-600">Coming soon</p>
          </div>
        </section>
      </main>
    </div>
  );
}
