import StatusDot from "./StatusDot";
import Badge from "./Badge";

export type MonitorListItem = {
  id: string;
  name: string;
  url: string;
  slug: string;
  interval_sec: number;
  expected_status: number;
  summary?: { uptime_pct?: number; avg_latency_ms?: number } | null;
  lastOk?: boolean | null;
  lastCode?: number | null;
  lastLatency?: number | null;
};

export default function MonitorCard({ m }: { m: MonitorListItem }) {
  return (
    <li className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-transparent transition hover:shadow-md hover:ring-emerald-100">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold">{m.name}</h3>
            <StatusDot ok={m.lastOk ?? null} />
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

      {/* Stable last-check slot */}
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

      {/* Actions */}
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
  );
}
