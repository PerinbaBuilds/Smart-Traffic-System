export default function StatsPanel({ stats }) {
  const items = [
    { label: "Active emergencies", value: stats?.activeVehicles ?? 0 },
    { label: "Corridors open now", value: stats?.preemptedIntersections ?? 0 },
    { label: "Total dispatches", value: stats?.totalDispatches ?? 0 },
    { label: "Total preemptions", value: stats?.totalPreemptions ?? 0 },
    {
      label: "Avg. detection lead time",
      value: stats?.avgLeadTimeSeconds != null ? `${stats.avgLeadTimeSeconds}s` : "—",
    },
  ];

  return (
    <div className="rounded-xl bg-slate-800/60 p-4">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">Live stats</h2>
      <dl className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-md bg-slate-900/60 px-3 py-2">
            <dt className="text-[11px] text-slate-400">{item.label}</dt>
            <dd className="text-lg font-bold text-slate-50">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
