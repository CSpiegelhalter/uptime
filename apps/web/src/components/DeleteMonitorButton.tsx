"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteMonitorButton({
  id,
  name,
  redirectTo = "/",
}: { id: string; name: string; redirectTo?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onDelete() {
    if (!confirm(`Delete "${name}"?\nAll checks and incidents will be removed.`)) return;
    setLoading(true);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
      const res = await fetch(`${base}/v1/monitors/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Delete failed");
      router.push(redirectTo);
      router.refresh();
    } catch (e) {
      alert("Failed to delete monitor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className="inline-flex items-center rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      title="Delete monitor"
    >
      {loading ? "Deleting…" : "Delete"}
    </button>
  );
}
