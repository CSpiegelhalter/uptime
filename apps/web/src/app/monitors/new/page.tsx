"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiBase } from "@/lib/api";

export default function NewMonitor() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://");
  const [intervalSec, setIntervalSec] = useState(60);
  const [expected, setExpected] = useState(200);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function normalizeUrl(u: string) {
    if (!u) return u;
    if (!/^https?:\/\//i.test(u)) return `https://${u}`;
    return u;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!name.trim()) return setErr("Please enter a name.");
    if (!url.trim()) return setErr("Please enter a URL.");
    if (intervalSec < 10 || intervalSec > 3600) return setErr("Interval must be between 10s and 3600s.");

    const base = apiBase();
    setLoading(true);
    try {
      const res = await fetch(`${base}/v1/monitors`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          url: normalizeUrl(url.trim()),
          interval_sec: intervalSec,
          expected_status: expected,
        }),
      });
      if (!res.ok) {
        setErr("Failed to create monitor.");
        return;
      }
      const created = await res.json();
      router.push(`/status/${created.slug}`);
      router.refresh();
    } catch {
      setErr("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-emerald-500 to-sky-500 shadow-sm" />
            <span className="text-lg font-semibold tracking-tight">Uptime Monitor</span>
          </div>
          <a
            href="/"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            ← Dashboard
          </a>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Create a Monitor</h1>
          <p className="mt-1 text-sm text-slate-600">
            We’ll ping your URL on a schedule, track uptime & latency, and publish a shareable status page.
          </p>

          {err && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-800">Name</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm shadow-sm outline-none ring-0 transition focus:border-emerald-400"
                placeholder="My Homepage"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
              />
              <p className="mt-1 text-xs text-slate-500">Shown on the dashboard & status page.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-800">URL</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm shadow-sm outline-none focus:border-emerald-400"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.currentTarget.value)}
                onBlur={(e) => setUrl(normalizeUrl(e.currentTarget.value))}
              />
              <p className="mt-1 text-xs text-slate-500">We’ll perform a GET request to this URL.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-800">Interval (seconds)</label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="number"
                    min={10}
                    max={3600}
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Number(e.currentTarget.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm shadow-sm outline-none focus:border-emerald-400"
                  />
                  {/* Quick presets */}
                  <div className="hidden gap-2 sm:flex">
                    {[30, 60, 300, 600].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setIntervalSec(s)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        {s >= 60 ? `${s / 60}m` : `${s}s`}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">How often to ping the URL.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-800">Expected HTTP status</label>
                <select
                  value={expected}
                  onChange={(e) => setExpected(Number(e.currentTarget.value))}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm shadow-sm outline-none focus:border-emerald-400"
                >
                  {[200, 204, 301, 302].map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">We’ll mark checks OK if response matches.</p>
              </div>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-800 disabled:opacity-50"
              >
                {loading ? "Creating…" : "Create monitor"}
              </button>
              <a
                href="/"
                className="inline-flex items-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
