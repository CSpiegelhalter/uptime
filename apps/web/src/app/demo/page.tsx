import MonitorCard, { type MonitorListItem } from "@/components/MonitorCard";
import { apiBase } from "@/lib/api";

export const dynamic = "force-dynamic";

async function getDemo() {
  const base = apiBase();
  const res = await fetch(`${base}/v1/demo/snapshot`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function toDemoMonitorItem(x: any): MonitorListItem {
  // Provide a MonitorListItem shape that MonitorCard expects.
  // We fake some fields that don’t exist for demo items.
  const host = (() => {
    try {
      return new URL(x.url).hostname;
    } catch {
      return slugify(x.name || "site");
    }
  })();

  return {
    id: `demo-${Buffer.from(x.url).toString("base64url")}`,
    slug: `demo-${slugify(host)}`,        // not a real status page; demo-only
    name: x.name ?? host,
    url: x.url,
    interval_sec: 60,
    expected_status: 200,
    summary: {
      // Best-effort snapshot values so badges render something meaningful
      uptime_pct: x.ok === true ? 100 : x.ok === false ? 0 : undefined,
      avg_latency_ms: x.latency_ms ?? undefined,
    },
    lastOk: x.ok ?? null,
    lastCode: x.status_code ?? null,
    lastLatency: x.latency_ms ?? null,
  } as MonitorListItem;
}

export default async function DemoPage() {
  const items = await getDemo();
  const monitors: MonitorListItem[] = items.map(toDemoMonitorItem);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Live snapshot</h1>
        <p className="mt-1 text-sm text-slate-600">
          A few public sites to showcase status &amp; latency.
        </p>

        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {monitors.map((m) => (
            // pass readOnly if you add the optional prop below
            <MonitorCard key={m.id} m={m} readOnly />
          ))}
        </ul>
      </main>
    </div>
  );
}
