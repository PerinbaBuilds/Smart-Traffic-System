export default function Legend() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Legend</h2>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-slate-500" />
          Signal lamp lit red - normal cycling
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-400" />
          Signal lamp lit amber - ambulance inbound
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-emerald-500" />
          Signal lamp lit green - corridor open, ambulance has right of way
        </div>
        <div className="flex items-center gap-2">
          <span>🚑</span> Emergency vehicle, moving along the route
        </div>
      </div>
    </div>
  );
}
