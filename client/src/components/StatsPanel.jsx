export default function StatsPanel({ stats }) {
  const items = [
    { label: "Active emergencies", value: stats?.activeVehicles ?? 0, accent: "text-red-600" },
    { label: "Corridors open now", value: stats?.preemptedIntersections ?? 0, accent: "text-emerald-600" },
    { label: "Total dispatches", value: stats?.totalDispatches ?? 0, accent: "text-slate-900" },
    { label: "Total preemptions", value: stats?.totalPreemptions ?? 0, accent: "text-slate-900" },
    {
      label: "Avg. detection lead time",
      value: stats?.avgLeadTimeSeconds != null ? `${stats.avgLeadTimeSeconds}s` : "—",
      accent: "text-amber-600",
    },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Live stats</h2>
      <dl className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-md bg-slate-50 px-3 py-2 transition-colors hover:bg-slate-100">
            <dt className="text-[11px] text-slate-500">{item.label}</dt>
            <dd className={`text-lg font-bold ${item.accent}`}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
