"use client";

import { useState } from "react";
import { apiBase } from "@/lib/api";

export default function NewMonitor() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://");
  const [intervalSec, setIntervalSec] = useState(60);
  const [expected, setExpected] = useState(200);
  const base = apiBase()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`${base}/v1/monitors`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, url, interval_sec: intervalSec, expected_status: expected })
    });
    if (res.ok) {
      window.location.href = "/";
    } else {
      alert("Failed to create monitor");
    }
  }

  return (
    <main className="p-8 max-w-lg">
      <h1 className="text-xl font-semibold mb-4">New Monitor</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="border p-2 w-full" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border p-2 w-full" placeholder="https://example.com" value={url} onChange={e=>setUrl(e.target.value)} />
        <div className="flex gap-3">
          <input className="border p-2 w-1/2" type="number" min={10} max={3600} value={intervalSec} onChange={e=>setIntervalSec(parseInt(e.target.value))} />
          <input className="border p-2 w-1/2" type="number" value={expected} onChange={e=>setExpected(parseInt(e.target.value))} />
        </div>
        <button className="bg-black text-white rounded px-4 py-2">Create</button>
      </form>
    </main>
  );
}
