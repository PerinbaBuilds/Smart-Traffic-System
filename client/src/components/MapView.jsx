import { useMemo, useState } from "react";

// state.intersections only carries fields that change tick to tick (see
// TrafficEngine.getSnapshot); merge it onto the static network nodes
// (id/name/lat/lng/col/row, fetched once) by id so markers always have
// everything.
function mergeIntersections(network, state) {
  const staticNodes = network?.intersections;
  if (!staticNodes) return [];
  if (!state?.intersections) return staticNodes;
  const dynamicById = new Map(state.intersections.map((node) => [node.id, node]));
  return staticNodes.map((node) => ({ ...node, ...dynamicById.get(node.id) }));
}

// The intersection grid is a procedural simulation, not a survey of real
// road centerlines - earlier we anchored it to real Chennai coordinates and
// drew it over a real OpenStreetMap basemap, which made the simulated grid
// look like it was cutting through actual buildings. Rather than fake a
// precision it doesn't have, this renders the network as a clean schematic
// diagram (like a metro map) using the grid's own col/row layout, with the
// real street names kept as labels. A linear lat/lng -> grid-unit transform
// (derived from any two same-row/same-col nodes) lets vehicle positions,
// which are still simulated in lat/lng, plot correctly between intersections.
function buildProjection(network) {
  const nodes = network?.intersections ?? [];
  if (nodes.length < 2) {
    return { toXY: () => [0, 0], cols: 1, rows: 1 };
  }
  const sameRow = nodes.find((n) => n.row === nodes[0].row && n.col !== nodes[0].col);
  const sameCol = nodes.find((n) => n.col === nodes[0].col && n.row !== nodes[0].row);
  const lngPerCol = sameRow ? (sameRow.lng - nodes[0].lng) / (sameRow.col - nodes[0].col) : 1;
  const latPerRow = sameCol ? (sameCol.lat - nodes[0].lat) / (sameCol.row - nodes[0].row) : -1;
  const originLng = nodes[0].lng - nodes[0].col * lngPerCol;
  const originLat = nodes[0].lat - nodes[0].row * latPerRow;
  const cols = Math.max(...nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...nodes.map((n) => n.row)) + 1;
  return {
    toXY: (lat, lng) => [(lng - originLng) / lngPerCol, (lat - originLat) / latPerRow],
    cols,
    rows,
  };
}

const UNIT = 120; // px per grid block at viewBox scale
const PAD = 70;

function statusStyle(node) {
  if (node.preempted) return { fill: "#10b981", ring: "#a7f3d0", r: 15, pulse: true };
  if (node.preparing) return { fill: "#f59e0b", ring: "#fde68a", r: 13, pulse: false };
  return { fill: "#ffffff", ring: "#94a3b8", r: 11, pulse: false };
}

export default function MapView({ network, state, onDispatch }) {
  const [selected, setSelected] = useState(null);
  const projection = useMemo(() => buildProjection(network), [network]);
  const intersections = useMemo(() => mergeIntersections(network, state), [network, state]);

  if (!network) {
    return (
      <div className="flex h-full w-full items-center justify-center text-slate-500">
        Connecting to traffic network…
      </div>
    );
  }

  const width = (projection.cols - 1) * UNIT + PAD * 2;
  const height = (projection.rows - 1) * UNIT + PAD * 2;
  const px = (col) => col * UNIT + PAD;
  const py = (row) => row * UNIT + PAD;

  const byId = new Map(network.intersections.map((node) => [node.id, node]));
  const seen = new Set();
  const edges = [];
  for (const node of network.intersections) {
    for (const neighborId of Object.keys(node.neighbors || {})) {
      const key = [node.id, neighborId].sort().join("-");
      if (seen.has(key)) continue;
      seen.add(key);
      const neighbor = byId.get(neighborId);
      if (!neighbor) continue;
      edges.push({ x1: px(node.col), y1: py(node.row), x2: px(neighbor.col), y2: py(neighbor.row) });
    }
  }

  const noActiveVehicles = (state?.vehicles ?? []).length === 0;
  const selectedNode = selected ? intersections.find((n) => n.id === selected) : null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-100">
      {noActiveVehicles && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-20 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-white px-4 py-2 text-sm text-slate-700 shadow-lg ring-1 ring-slate-200">
            <span>No emergency vehicles en route right now.</span>
            {onDispatch && (
              <button
                onClick={() => onDispatch({})}
                className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-700"
              >
                🚑 Dispatch one
              </button>
            )}
          </div>
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="grid-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="1.2" fill="#cbd5e1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width={width} height={height} fill="url(#grid-dots)" />

        {edges.map((edge, idx) => (
          <g key={idx}>
            <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} stroke="#cbd5e1" strokeWidth="22" strokeLinecap="round" />
            <line x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} stroke="#94a3b8" strokeWidth="2" strokeDasharray="10 10" />
          </g>
        ))}

        {intersections.map((node) => {
          const style = statusStyle(node);
          const x = px(node.col);
          const y = py(node.row);
          return (
            <g key={node.id} onClick={() => setSelected(node.id)} className="cursor-pointer">
              <circle cx={x} cy={y} r={style.r + 5} fill={style.ring} opacity={style.pulse ? 0.5 : 0.35}>
                {style.pulse && (
                  <animate attributeName="r" values={`${style.r + 5};${style.r + 12};${style.r + 5}`} dur="1.4s" repeatCount="indefinite" />
                )}
              </circle>
              <circle cx={x} cy={y} r={style.r} fill={style.fill} stroke="#475569" strokeWidth="2.5" />
              {node.preempted && (
                <text x={x} y={y + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill="#ffffff">
                  ⚡
                </text>
              )}
            </g>
          );
        })}

        {(state?.vehicles ?? []).map((vehicle) => {
          const [col, row] = projection.toXY(vehicle.lat, vehicle.lng);
          const x = px(col);
          const y = py(row);
          return (
            <g key={vehicle.id} onClick={() => setSelected(`vehicle:${vehicle.id}`)} className="cursor-pointer">
              <circle cx={x} cy={y} r="16" fill="#dc2626" stroke="#ffffff" strokeWidth="3" />
              <text x={x} y={y + 6} textAnchor="middle" fontSize="16">
                🚑
              </text>
            </g>
          );
        })}
      </svg>

      {selectedNode && (
        <div className="absolute bottom-4 left-4 z-20 max-w-xs rounded-lg bg-white p-3 text-sm shadow-lg ring-1 ring-slate-200">
          <button onClick={() => setSelected(null)} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
            ✕
          </button>
          <p className="font-semibold text-slate-900">{selectedNode.name}</p>
          <p className="text-slate-500">Green axis: {selectedNode.axis}</p>
          {selectedNode.preempted && <p className="font-semibold text-emerald-600">Green corridor active</p>}
          {selectedNode.preparing && !selectedNode.preempted && <p className="text-amber-600">Vehicle inbound</p>}
        </div>
      )}
      {selected?.startsWith?.("vehicle:") && (() => {
        const vehicle = (state?.vehicles ?? []).find((v) => `vehicle:${v.id}` === selected);
        if (!vehicle) return null;
        return (
          <div className="absolute bottom-4 left-4 z-20 max-w-xs rounded-lg bg-white p-3 text-sm shadow-lg ring-1 ring-slate-200">
            <button onClick={() => setSelected(null)} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
              ✕
            </button>
            <p className="font-semibold text-slate-900">{vehicle.label}</p>
            <p className="text-slate-500">{vehicle.status}</p>
            {vehicle.detectionSource && <p className="text-slate-500">Detected via {vehicle.detectionSource}</p>}
          </div>
        );
      })()}
    </div>
  );
}
