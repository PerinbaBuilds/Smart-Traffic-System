import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";

function intersectionIcon(node) {
  const base = "flex items-center justify-center rounded-full font-bold shadow-lg border-2";
  let classes = `${base} bg-slate-700 border-slate-400 text-slate-100`;
  let size = 24;
  let label = node.axis;

  if (node.preempted) {
    classes = `${base} bg-emerald-500 border-emerald-200 text-white animate-pulse`;
    size = 30;
    label = "⚡";
  } else if (node.preparing) {
    classes = `${base} bg-amber-400 border-amber-100 text-slate-900`;
    size = 26;
  }

  return L.divIcon({
    html: `<div class="${classes}" style="width:${size}px;height:${size}px;font-size:10px;">${label}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Identical on every call - build once and reuse rather than allocating a
// fresh L.divIcon per vehicle marker on every render.
const VEHICLE_ICON = L.divIcon({
  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-lg" style="font-size:16px;">🚑</div>`,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// state.intersections only carries fields that change tick to tick (see
// TrafficEngine.getSnapshot); merge it onto the static network nodes
// (id/name/lat/lng, fetched once) by id so markers always have everything.
function mergeIntersections(network, state) {
  const staticNodes = network?.intersections;
  if (!staticNodes) return [];
  if (!state?.intersections) return staticNodes;
  const dynamicById = new Map(state.intersections.map((node) => [node.id, node]));
  return staticNodes.map((node) => ({ ...node, ...dynamicById.get(node.id) }));
}

// MapContainer's center/zoom props only apply on first mount - react-leaflet
// won't re-pan an already-mounted map when they change later. Without this,
// switching regions leaves the viewport stuck over the old city while the
// new markers render off-screen.
function RecenterOnChange({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function buildEdges(network) {
  if (!network?.intersections) return [];
  const byId = new Map(network.intersections.map((n) => [n.id, n]));
  const seen = new Set();
  const edges = [];
  for (const node of network.intersections) {
    for (const neighborId of Object.keys(node.neighbors || {})) {
      const key = [node.id, neighborId].sort().join("-");
      if (seen.has(key)) continue;
      seen.add(key);
      const neighbor = byId.get(neighborId);
      if (neighbor) edges.push([[node.lat, node.lng], [neighbor.lat, neighbor.lng]]);
    }
  }
  return edges;
}

export default function MapView({ network, state, onDispatch }) {
  const edges = useMemo(() => buildEdges(network), [network]);
  const center = useMemo(() => {
    const nodes = network?.intersections;
    if (!nodes?.length) return [40, -83];
    const lats = nodes.map((n) => n.lat);
    const lngs = nodes.map((n) => n.lng);
    return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
  }, [network]);
  const intersections = useMemo(() => mergeIntersections(network, state), [network, state]);

  if (!network) {
    return (
      <div className="flex h-full w-full items-center justify-center text-slate-400">
        Connecting to traffic network…
      </div>
    );
  }

  const noActiveVehicles = (state?.vehicles ?? []).length === 0;

  return (
    <div className="relative h-full w-full">
      {noActiveVehicles && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center">
          <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-slate-900/90 px-4 py-2 text-sm text-slate-200 shadow-lg ring-1 ring-slate-700">
            <span>No emergency vehicles en route right now.</span>
            {onDispatch && (
              <button
                onClick={() => onDispatch({})}
                className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold transition-colors hover:bg-red-500"
              >
                🚑 Dispatch one
              </button>
            )}
          </div>
        </div>
      )}
      <MapContainer center={center} zoom={15} className="h-full w-full" preferCanvas>
      <RecenterOnChange center={center} zoom={15} />
      {/* A building-detail basemap (the default OSM raster style) makes the
          synthetic grid's mismatch with real road centerlines obvious at
          street zoom - intersections and vehicles can render on top of real
          buildings since this network is a procedural approximation (see
          shared/src/regions.js), not surveyed road geometry. A no-buildings,
          no-labels basemap removes that contradiction and matches the dark
          control-room theme. */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
        detectRetina
      />
      {edges.map((positions, idx) => (
        <Polyline key={idx} positions={positions} pathOptions={{ color: "#475569", weight: 6, opacity: 0.55 }} />
      ))}
      {intersections.map((node) => (
        <Marker key={node.id} position={[node.lat, node.lng]} icon={intersectionIcon(node)}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{node.name}</p>
              <p>Green axis: {node.axis}</p>
              {node.preempted && <p className="font-semibold text-emerald-600">Green corridor active</p>}
              {node.preparing && !node.preempted && <p className="text-amber-600">Vehicle inbound</p>}
            </div>
          </Popup>
        </Marker>
      ))}
      {(state?.vehicles ?? []).map((vehicle) => (
        <Marker key={vehicle.id} position={[vehicle.lat, vehicle.lng]} icon={VEHICLE_ICON}>
          <Tooltip direction="top" offset={[0, -10]}>
            <div className="text-xs">
              <p className="font-semibold">{vehicle.label}</p>
              <p>{vehicle.status}</p>
              {vehicle.detectionSource && <p>Detected via {vehicle.detectionSource}</p>}
            </div>
          </Tooltip>
        </Marker>
      ))}
      </MapContainer>
    </div>
  );
}
