import { useState } from "react";
import { listRegions } from "shared";

const REGIONS = listRegions();

export default function ControlPanel({
  network,
  vehicles,
  onDispatch,
  onRecall,
  onToggleAuto,
  autoEnabled,
  canChangeRegion,
  onChangeRegion,
}) {
  const [startId, setStartId] = useState("");
  const [endId, setEndId] = useState("");
  const options = network?.intersections ?? [];

  function handleSubmit(event) {
    event.preventDefault();
    onDispatch({ startId: startId || undefined, endId: endId || undefined });
    setStartId("");
    setEndId("");
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Dispatch</h2>
        {canChangeRegion ? (
          <select
            value={network?.regionId ?? ""}
            onChange={(event) => onChangeRegion(event.target.value)}
            title="Switch demo region"
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          >
            {REGIONS.map((region) => (
              <option key={region.id} value={region.id}>
                {region.cityName}
              </option>
            ))}
          </select>
        ) : (
          network?.cityName && <span className="text-xs text-slate-500">{network.cityName}</span>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={startId}
            onChange={(event) => setStartId(event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400"
          >
            <option value="">Random start</option>
            {options.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
          <select
            value={endId}
            onChange={(event) => setEndId(event.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 transition-colors hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30"
          >
            <option value="">Random destination</option>
            {options.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-red-700 hover:shadow active:scale-[0.99]"
        >
          🚑 Dispatch emergency vehicle
        </button>
      </form>

      <label className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
        <span>Auto-generate scenarios</span>
        <input
          type="checkbox"
          checked={autoEnabled}
          onChange={(event) => onToggleAuto(event.target.checked)}
          className="h-4 w-4 accent-emerald-600"
        />
      </label>

      <div>
        <h3 className="mb-2 text-xs uppercase tracking-wide text-slate-500">Active units ({vehicles.length})</h3>
        <ul className="max-h-40 space-y-1.5 overflow-y-auto">
          {vehicles.length === 0 && <li className="text-xs text-slate-400">No active emergency vehicles</li>}
          {vehicles.map((vehicle) => (
            <li
              key={vehicle.id}
              className="flex items-center justify-between rounded-md bg-slate-50 px-2 py-1.5 text-xs transition-colors hover:bg-slate-100"
            >
              <span>
                🚑 <span className="font-medium text-slate-800">{vehicle.label}</span>{" "}
                <span className="text-slate-500">{vehicle.status}</span>
              </span>
              <button
                onClick={() => onRecall(vehicle.id)}
                aria-label={`Recall ${vehicle.label}`}
                className="text-slate-400 transition-colors hover:text-red-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
