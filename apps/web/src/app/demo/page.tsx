export const dynamic = "force-dynamic";

import { apiBase } from "@/lib/api";

async function getDemo() {
  const base = apiBase();
  const res = await fetch(`${base}/v1/demo/snapshot`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

function Dot({ ok }: { ok: boolean }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-red-500"}`} />;
}

export default async function DemoPage() {
  const items = await getDemo();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-sky-500 shadow-sm" />
            <span className="text-lg font-semibold tracking-tight">Demo</span>
          </div>
          <a href="/" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">← Dashboard</a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Live snapshot</h1>
        <p className="mt-1 text-sm text-slate-600">A few public sites to showcase status & latency.</p>

        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((x: any) => (
            <li key={x.url} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{x.name}</h3>
                    <Dot ok={!!x.ok} />
                  </div>
                  <a href={x.url} target="_blank" rel="noreferrer" className="mt-1 block max-w-full truncate text-sm text-slate-600 underline-offset-2 hover:underline">
                    {x.url}
                  </a>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-700 min-h-[44px] flex items-center">
                {x.status_code ? (
                  <>HTTP {x.status_code} · {x.latency_ms} ms</>
                ) : (
                  <div className="w-full flex items-center gap-2 text-slate-500">
                    <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-slate-300" />
                    Unable to reach site
                    <span className="ml-auto inline-block h-2 w-28 animate-pulse rounded bg-slate-200" />
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
