import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";

// A real traffic-signal head (pole + red/amber/green lamp stack) instead of
// an abstract "NS"/"EW" badge - the lit lamp communicates the actual state
// (normal cycling / vehicle inbound / green corridor open) the way a driver
// would actually read it at a junction.
function intersectionIcon(node) {
  const lit = node.preempted ? "green" : node.preparing ? "amber" : "red";
  const lamp = (color, isLit) => {
    const colors = { red: "#ef4444", amber: "#f59e0b", green: "#22c55e" };
    return `<span style="display:block;width:9px;height:9px;border-radius:50%;margin:1.5px auto;background:${isLit ? colors[color] : "#475569"};box-shadow:${isLit ? `0 0 6px ${colors[color]}` : "none"};"></span>`;
  };
  const pulse = node.preempted ? "animation:pulse 1.4s ease-in-out infinite;" : "";
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="background:#1e293b;border-radius:4px;padding:3px 4px;box-shadow:0 1px 3px rgba(0,0,0,0.4);${pulse}">
        ${lamp("red", lit === "red")}
        ${lamp("amber", lit === "amber")}
        ${lamp("green", lit === "green")}
      </div>
      <div style="width:2px;height:7px;background:#1e293b;"></div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [22, 38], iconAnchor: [11, 38] });
}

// Identical on every call - build once and reuse rather than allocating a
// fresh L.divIcon per vehicle marker on every render.
const VEHICLE_ICON = L.divIcon({
  html: `<div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:#dc2626;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-size:15px;">🚑</div>`,
  className: "",
  iconSize: [30, 30],
  iconAnchor: [15, 15],
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

// A dead-straight line between two intersections reads as a graph-paper
// grid, not a street. Bowing each segment slightly outward at its midpoint
// (deterministically, from the segment's own endpoints, so it's stable
// across renders) makes roads look like they were actually surveyed rather
// than ruled with a straightedge.
function bendMidpoint([lat1, lng1], [lat2, lng2]) {
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const seed = Math.sin(lat1 * 1000 + lng2 * 1000);
  const bow = seed * 0.07;
  return [midLat - dLng * bow, midLng + dLat * bow];
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
      if (!neighbor) continue;
      const from = [node.lat, node.lng];
      const to = [neighbor.lat, neighbor.lng];
      edges.push([from, bendMidpoint(from, to), to]);
    }
  }
  return edges;
}

export default function MapView({ network, state, onDispatch }) {
  const edges = useMemo(() => buildEdges(network), [network]);
  const center = useMemo(() => {
    const nodes = network?.intersections;
    if (!nodes?.length) return [13.0418, 80.2341];
    const lats = nodes.map((n) => n.lat);
    const lngs = nodes.map((n) => n.lng);
    return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
  }, [network]);
  const intersections = useMemo(() => mergeIntersections(network, state), [network, state]);

  if (!network) {
    return (
      <div className="flex h-full w-full items-center justify-center text-slate-500">
        Connecting to traffic network…
      </div>
    );
  }

  const noActiveVehicles = (state?.vehicles ?? []).length === 0;
  // Zoomed in tight on just the simulated block so the dashboard reads as
  // "this junction cluster" rather than implying the whole visible city is
  // wired up - the grid is a simulation overlay, not a claim about every
  // street on the basemap.
  const zoom = 18;

  return (
    <div className="relative h-full w-full">
      {noActiveVehicles && (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-[1000] flex justify-center">
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
      <MapContainer center={center} zoom={zoom} className="h-full w-full" preferCanvas>
        <RecenterOnChange center={center} zoom={zoom} />
        {/* Voyager basemap: real streets, labels and building footprints in
            a familiar, Google Maps-style light palette. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
          detectRetina
        />
        {edges.map((positions, idx) => (
          <Polyline
            key={idx}
            positions={positions}
            pathOptions={{ color: "#1e293b", weight: 9, opacity: 0.85, lineCap: "round" }}
          />
        ))}
        {edges.map((positions, idx) => (
          <Polyline
            key={`lane-${idx}`}
            positions={positions}
            pathOptions={{ color: "#fbbf24", weight: 1.5, opacity: 0.9, dashArray: "10 12" }}
          />
        ))}
        {intersections.map((node) => (
          <Marker key={node.id} position={[node.lat, node.lng]} icon={intersectionIcon(node)}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{node.name}</p>
                {node.preempted && <p className="font-semibold text-emerald-600">Green corridor active - ambulance has right of way</p>}
                {node.preparing && !node.preempted && <p className="text-amber-600">Ambulance inbound - signal preparing to switch</p>}
                {!node.preempted && !node.preparing && <p className="text-slate-500">Normal signal cycling</p>}
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
