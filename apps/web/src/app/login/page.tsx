"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        setErr(d?.error || "Login failed");
        return;
      }
      router.push("/");
      router.refresh();
    } finally { setLoading(false); }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {err && <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-800">{err}</div>}
        <div>
          <label className="block text-sm font-medium text-slate-800">Email</label>
          <input className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-emerald-400" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-800">Password</label>
          <input type="password" className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:border-emerald-400" value={pw} onChange={(e)=>setPw(e.target.value)} />
        </div>
        <button disabled={loading} className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50">
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <p className="text-xs text-slate-500">No account? Use the Register button in the header (or add a quick /register page similarly).</p>
      </form>
    </main>
  );
}
