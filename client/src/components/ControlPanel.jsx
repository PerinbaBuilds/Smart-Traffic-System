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
    <div className="rounded-xl bg-slate-800/60 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Dispatch</h2>
        {canChangeRegion ? (
          <select
            value={network?.regionId ?? ""}
            onChange={(event) => onChangeRegion(event.target.value)}
            title="Switch demo region"
            className="rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-300"
          >
            {REGIONS.map((region) => (
              <option key={region.id} value={region.id}>
                {region.cityName}
              </option>
            ))}
          </select>
        ) : (
          network?.cityName && <span className="text-xs text-slate-400">{network.cityName}</span>
        )}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={startId}
            onChange={(event) => setStartId(event.target.value)}
            className="rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm"
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
            className="rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm"
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
          className="w-full rounded-md bg-red-600 py-2 text-sm font-semibold transition-colors hover:bg-red-500"
        >
          🚑 Dispatch emergency vehicle
        </button>
      </form>

      <label className="flex items-center justify-between text-sm text-slate-300">
        <span>Auto-generate scenarios</span>
        <input
          type="checkbox"
          checked={autoEnabled}
          onChange={(event) => onToggleAuto(event.target.checked)}
          className="h-4 w-4 accent-emerald-500"
        />
      </label>

      <div>
        <h3 className="mb-2 text-xs uppercase tracking-wide text-slate-400">Active units ({vehicles.length})</h3>
        <ul className="max-h-40 space-y-1.5 overflow-y-auto">
          {vehicles.length === 0 && <li className="text-xs text-slate-500">No active emergency vehicles</li>}
          {vehicles.map((vehicle) => (
            <li
              key={vehicle.id}
              className="flex items-center justify-between rounded-md bg-slate-900/60 px-2 py-1.5 text-xs"
            >
              <span>
                🚑 <span className="font-medium">{vehicle.label}</span>{" "}
                <span className="text-slate-400">{vehicle.status}</span>
              </span>
              <button onClick={() => onRecall(vehicle.id)} className="text-slate-400 hover:text-red-400">
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
