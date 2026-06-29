export default function StatsPanel({ stats }) {
  const items = [
    { label: "Active emergencies", value: stats?.activeVehicles ?? 0, accent: "text-red-400" },
    { label: "Corridors open now", value: stats?.preemptedIntersections ?? 0, accent: "text-emerald-400" },
    { label: "Total dispatches", value: stats?.totalDispatches ?? 0, accent: "text-slate-50" },
    { label: "Total preemptions", value: stats?.totalPreemptions ?? 0, accent: "text-slate-50" },
    {
      label: "Avg. detection lead time",
      value: stats?.avgLeadTimeSeconds != null ? `${stats.avgLeadTimeSeconds}s` : "—",
      accent: "text-amber-400",
    },
  ];

  return (
    <div className="rounded-xl bg-slate-800/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Live stats</h2>
      <dl className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-md bg-slate-900/60 px-3 py-2 transition-colors hover:bg-slate-900">
            <dt className="text-[11px] text-slate-400">{item.label}</dt>
            <dd className={`text-lg font-bold ${item.accent}`}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
