import { apiBase } from "@/lib/api";
import DeleteMonitorButton from "@/components/DeleteMonitorButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

function fmtTs(ts?: string) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return ts;
  }
}

function StatusPill({ ok }: { ok: boolean | null | undefined }) {
  const color = ok == null ? "bg-gray-300" : ok ? "bg-emerald-500" : "bg-red-500";
  const label = ok == null ? "No data yet" : ok ? "Up" : "Down";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
      {children}
    </span>
  );
}

async function getStatus(slug: string) {
  const base = apiBase();
  const res = await fetch(`${base}/v1/status/${slug}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function StatusPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getStatus(slug);

  if (!data) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold">Not found</h1>
            <p className="mt-1 text-sm text-slate-600">
              No status page found for <code>{slug}</code>.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const m = data.monitors[0];
  const last = m?.last ?? null;
  const isUp = last?.ok ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Page title + breadcrumby back link */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="text-sm text-slate-600 underline-offset-2 hover:underline"
            >
              ← Back to dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Status · {m?.name ?? slug}
            </h1>
          </div>
        </div>

        {/* Summary card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{m.name}</h2>
              <Link
                href={m.url}
                target="_blank"
                rel="noreferrer"
                className="mt-1 block max-w-full truncate text-sm text-slate-600 underline-offset-2 hover:underline"
                title={m.url}
              >
                {m.url}
              </Link>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill ok={isUp} />
                <Chip>Every {m.interval_sec}s</Chip>
                <Chip>Expect {m.expected_status}</Chip>
                <Chip>Slug: {slug}</Chip>
              </div>
            </div>
          </div>

          {/* Stable "Last check" slot (no layout shift) */}
          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-700 min-h-[56px] flex items-center">
            {last ? (
              <div className="flex w-full flex-wrap items-center gap-3">
                <span className="font-medium">Last check</span>
                <span className="text-slate-500">•</span>
                <span>{fmtTs(last.ts)}</span>
                <span className="text-slate-500">•</span>
                <span>HTTP {last.status_code ?? "—"}</span>
                <span className="text-slate-500">•</span>
                <span>{last.latency_ms} ms</span>
              </div>
            ) : (
              <div className="flex w-full items-center gap-3 text-slate-500">
                <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-slate-300" />
                First check pending…
                <span className="ml-auto inline-block h-2 w-40 animate-pulse rounded bg-slate-200" />
              </div>
            )}
          </div>
        </section>

        {/* Actions: left = navigation; right = visit + delete */}
        <section className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={`/status/${slug}`}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            title="Refresh"
          >
            Refresh
          </Link>
          <Link
            href={`/`}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View all monitors
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Link
              href={m?.url}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800"
            >
              Visit URL
            </Link>
            {/* 🔴 Delete lives ONLY on the status page */}
            <DeleteMonitorButton id={m.id} name={m.name} redirectTo="/" />
          </div>
        </section>

        {/* Info cards */}
        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Monitor
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-600">Name</dt>
                <dd className="font-medium text-slate-900">{m.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-600">URL</dt>
                <dd className="truncate font-medium text-slate-900" title={m.url}>
                  <Link
                    className="underline-offset-2 hover:underline"
                    href={m.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {m.url}
                  </Link>
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-600">Interval</dt>
                <dd className="font-medium text-slate-900">{m.interval_sec}s</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-600">Expected status</dt>
                <dd className="font-medium text-slate-900">{m.expected_status}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Current State
            </h2>
            <div className="mt-3">
              <StatusPill ok={isUp} />
            </div>
            <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 min-h-[48px] flex items-center">
              {last ? (
                <div className="flex w-full flex-wrap items-center gap-3">
                  <span className="text-slate-600">Last seen:</span>
                  <span>{fmtTs(last.ts)}</span>
                  <span className="text-slate-500">•</span>
                  <span>HTTP {last.status_code ?? "—"}</span>
                  <span className="text-slate-500">•</span>
                  <span>{last.latency_ms} ms</span>
                </div>
              ) : (
                <div className="flex w-full items-center gap-2 text-slate-500">
                  <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-slate-300" />
                  Waiting for first check…
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
