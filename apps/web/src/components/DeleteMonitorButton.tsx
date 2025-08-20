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
      const res = await fetch(`/api/monitors/${id}`, { method: "DELETE" });
      if (res.status === 204 || res.ok) {
        router.push(redirectTo);
        router.refresh();
        return;
      }
      if (res.status === 401) {
        alert("You must be signed in to delete this monitor.");
        return;
      }
      const body = await res.json().catch(() => ({}));
      alert(body?.detail || "Failed to delete monitor.");
    } catch {
      alert("Network error. Please try again.");
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
