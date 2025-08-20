export default function StatusDot({ ok }: { ok: boolean | null | undefined }) {
    const color = ok == null ? "bg-gray-300" : ok ? "bg-emerald-500" : "bg-red-500";
    const label = ok == null ? "No data" : ok ? "Up" : "Down";
    return (
      <span className="inline-flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span className="text-sm text-gray-600">{label}</span>
      </span>
    );
  }
  