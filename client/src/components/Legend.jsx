export default function Legend() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Legend</h2>
      <div className="space-y-2">
        <div className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-slate-50">
          <span className="inline-block h-3 w-3 rounded-full bg-slate-500 shadow-inner" />
          Signal lamp lit red - normal cycling
        </div>
        <div className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-slate-50">
          <span className="inline-block h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.7)]" />
          Signal lamp lit amber - ambulance inbound
        </div>
        <div className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-slate-50">
          <span className="inline-block h-3 w-3 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.7)]" />
          Signal lamp lit green - corridor open, ambulance has right of way
        </div>
        <div className="flex items-center gap-2 rounded-md px-1 py-0.5 transition-colors hover:bg-slate-50">
          <span>🚑</span> Emergency vehicle, moving along the route
        </div>
      </div>
    </div>
  );
}
