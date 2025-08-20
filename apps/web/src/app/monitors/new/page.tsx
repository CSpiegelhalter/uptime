"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiBase } from "@/lib/api";

export default function NewMonitor() {
  const router = useRouter();

  // form state
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://");
  const [intervalSec, setIntervalSec] = useState<number | "">(60);
  const [expected, setExpected] = useState(200);

  // ui state
  const [loading, setLoading] = useState(false);
  const [bannerErr, setBannerErr] = useState<string | null>(null);

  // field errors
  const [urlErr, setUrlErr] = useState<string | null>(null);
  const [intErr, setIntErr] = useState<string | null>(null);

  // refs for focusing first invalid field
  const urlRef = useRef<HTMLInputElement | null>(null);
  const intRef = useRef<HTMLInputElement | null>(null);

  // ---- validation helpers ----
  function normalizeUrl(u: string) {
    if (!u) return u;
    return /^https?:\/\//i.test(u) ? u : `https://${u}`;
  }

  function validateUrl(u: string): string | null {
    if (!u || !u.trim()) return "URL is required.";
    try {
      // accept host-only by normalizing, then test parse
      // but keep the normalized value only onBlur/submit to avoid jumpy typing
      new URL(normalizeUrl(u.trim()));
      return null;
    } catch {
      return "Enter a valid URL (e.g. https://example.com).";
    }
  }

  function validateInterval(v: number | ""): string | null {
    if (v === "" || Number.isNaN(v)) return "Interval is required.";
    if (!Number.isInteger(Number(v))) return "Interval must be a whole number.";
    const n = Number(v);
    if (n < 10 || n > 3600) return "Interval must be between 10 and 3600 seconds.";
    return null;
  }

  const base = apiBase();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBannerErr(null);
  
    // run validation
    const uErr = validateUrl(url);
    const iErr = validateInterval(intervalSec);
    setUrlErr(uErr);
    setIntErr(iErr);
  
    if (uErr) urlRef.current?.focus();
    else if (iErr) intRef.current?.focus();
    if (uErr || iErr) return;
  
    setLoading(true);
    try {
      const res = await fetch(`/api/monitors`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "Untitled",
          url: normalizeUrl(url.trim()),
          interval_sec: Number(intervalSec),
          expected_status: expected,
        }),
      });
  
      if (!res.ok) {
        if (res.status === 409) {
          const body = await res.json().catch(() => ({}));
          setBannerErr(
            body?.detail || "A monitor with that name already exists. Try a different name."
          );
        } else if (res.status === 401) {
          setBannerErr("You must be signed in to create a monitor.");
        } else {
          setBannerErr("Failed to create monitor. Please try again.");
        }
        return;
      }
  
      const created = await res.json();
      router.push(`/status/${created.slug}`);
      router.refresh();
    } catch {
      setBannerErr("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }
  

  // live validation on blur
  function onUrlBlur() {
    setUrl((prev) => normalizeUrl(prev.trim()));
    setUrlErr(validateUrl(url));
  }
  function onIntervalBlur() {
    setIntErr(validateInterval(intervalSec));
  }

  // quick preset helper
  function setPreset(n: number) {
    setIntervalSec(n);
    setIntErr(null);
  }

  const formInvalid = Boolean(urlErr || intErr || loading);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* Content */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Create a Monitor</h1>
          <p className="mt-1 text-sm text-slate-600">
            We’ll ping your URL on a schedule, track uptime & latency, and publish a shareable status page.
          </p>

          {bannerErr && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {bannerErr}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
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
              <label className="block text-sm font-medium text-slate-800">URL <span className="text-red-500">*</span></label>
              <input
                ref={urlRef}
                inputMode="url"
                className={`mt-1 w-full rounded-xl bg-white p-2.5 text-sm shadow-sm outline-none transition ${
                  urlErr ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-emerald-400"
                }`}
                placeholder="https://example.com"
                value={url}
                onChange={(e) => {
                  setUrl(e.currentTarget.value);
                  if (urlErr) setUrlErr(null);
                }}
                onBlur={onUrlBlur}
                aria-invalid={Boolean(urlErr)}
                aria-describedby={urlErr ? "url-error" : undefined}
                required
              />
              <div className="mt-1 flex items-center justify-between">
                <p className={`text-xs ${urlErr ? "text-red-600" : "text-slate-500"}`}>
                  {urlErr ?? "We’ll perform a GET request to this URL."}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-800">
                  Interval (seconds) <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    ref={intRef}
                    type="number"
                    min={10}
                    max={3600}
                    step={1}
                    value={intervalSec}
                    onChange={(e) => {
                      const val = e.currentTarget.value;
                      setIntervalSec(val === "" ? "" : Number(val));
                      if (intErr) setIntErr(null);
                    }}
                    onBlur={onIntervalBlur}
                    className={`w-full rounded-xl bg-white p-2.5 text-sm shadow-sm outline-none transition ${
                      intErr ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-emerald-400"
                    }`}
                    aria-invalid={Boolean(intErr)}
                    aria-describedby={intErr ? "interval-error" : undefined}
                    required
                  />
                  {/* Quick presets */}
                  <div className="hidden gap-2 sm:flex">
                    {[30, 60, 300, 600].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setPreset(s)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        {s >= 60 ? `${s / 60}m` : `${s}s`}
                      </button>
                    ))}
                  </div>
                </div>
                <p id="interval-error" className={`mt-1 text-xs ${intErr ? "text-red-600" : "text-slate-500"}`}>
                  {intErr ?? "How often to ping the URL (10–3600 seconds)."}
                </p>
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
                disabled={formInvalid}
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
