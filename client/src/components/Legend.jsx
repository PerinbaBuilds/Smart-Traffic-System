export default function Legend() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Legend</h2>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full border-2 border-slate-400 bg-white" />
          Normal signal cycling
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full border-2 border-amber-200 bg-amber-400" />
          Vehicle inbound (early warning)
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-pulse rounded-full border-2 border-emerald-200 bg-emerald-500" />
          Green corridor active
        </div>
        <div className="flex items-center gap-2">
          <span>🚑</span> Emergency vehicle
        </div>
      </div>
    </div>
  );
}
