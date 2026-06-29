export default function StatsPanel({ stats }) {
  const items = [
    { label: "Active emergencies", value: stats?.activeVehicles ?? 0, accent: "text-red-600", bar: "bg-red-500", icon: "🚨" },
    { label: "Corridors open now", value: stats?.preemptedIntersections ?? 0, accent: "text-emerald-600", bar: "bg-emerald-500", icon: "🟢" },
    { label: "Total dispatches", value: stats?.totalDispatches ?? 0, accent: "text-slate-900", bar: "bg-slate-400", icon: "🚑" },
    { label: "Total preemptions", value: stats?.totalPreemptions ?? 0, accent: "text-slate-900", bar: "bg-slate-400", icon: "🚦" },
    {
      label: "Avg. detection lead time",
      value: stats?.avgLeadTimeSeconds != null ? `${stats.avgLeadTimeSeconds}s` : "—",
      accent: "text-amber-600",
      bar: "bg-amber-500",
      icon: "⏱",
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Live stats</h2>
      <dl className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="relative overflow-hidden rounded-lg bg-slate-50 px-3 py-2.5 transition-colors hover:bg-slate-100"
          >
            <span className={`absolute inset-y-0 left-0 w-1 ${item.bar}`} />
            <dt className="flex items-center gap-1 text-[11px] text-slate-500">
              <span aria-hidden="true">{item.icon}</span> {item.label}
            </dt>
            <dd className={`text-xl font-bold ${item.accent}`}>{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
