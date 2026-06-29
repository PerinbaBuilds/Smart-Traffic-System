import { getRegion } from "./regions.js";

function nodeId(col, row) {
  return `${String.fromCharCode(65 + col)}${row + 1}`;
}

// Builds a rectangular grid network for the given region (defaults to
// "chennai" for zero-config/backward-compatible callers).
// Same procedural generation regardless of region - only the anchor
// coordinates, block spacing, and street names differ - so this works for
// any region preset in shared/src/regions.js, or a custom config object
// shaped like a region entry (cols/rows/baseLat/baseLng/latStep/lngStep).
export function buildNetwork(regionIdOrConfig) {
  const region = typeof regionIdOrConfig === "object" && regionIdOrConfig !== null
    ? regionIdOrConfig
    : getRegion(regionIdOrConfig);
  const { cols: COLS, rows: ROWS, baseLat: BASE_LAT, baseLng: BASE_LNG, latStep: LAT_STEP, lngStep: LNG_STEP } = region;

  const intersections = new Map();

  for (let row = 0; row < ROWS.length; row += 1) {
    for (let col = 0; col < COLS.length; col += 1) {
      const id = nodeId(col, row);
      intersections.set(id, {
        id,
        name: `${COLS[col]} & ${ROWS[row]}`,
        lat: BASE_LAT - row * LAT_STEP,
        lng: BASE_LNG + col * LNG_STEP,
        col,
        row,
        neighbors: {}, // neighborId -> axis ('NS' | 'EW')
      });
    }
  }

  const edges = [];
  for (let row = 0; row < ROWS.length; row += 1) {
    for (let col = 0; col < COLS.length; col += 1) {
      const id = nodeId(col, row);
      if (col + 1 < COLS.length) {
        const rightId = nodeId(col + 1, row);
        intersections.get(id).neighbors[rightId] = "EW";
        intersections.get(rightId).neighbors[id] = "EW";
        edges.push({ from: id, to: rightId, axis: "EW" });
      }
      if (row + 1 < ROWS.length) {
        const downId = nodeId(col, row + 1);
        intersections.get(id).neighbors[downId] = "NS";
        intersections.get(downId).neighbors[id] = "NS";
        edges.push({ from: id, to: downId, axis: "NS" });
      }
    }
  }

  return { regionId: region.id, cityName: region.cityName, intersections, edges };
}

export function getAxisBetween(network, fromId, toId) {
  return network.intersections.get(fromId)?.neighbors[toId];
}

// Unweighted BFS shortest path over the grid graph.
export function findRoute(network, startId, endId) {
  if (startId === endId) return [startId];
  const queue = [startId];
  const visited = new Set([startId]);
  const parent = new Map();

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === endId) break;
    const node = network.intersections.get(current);
    if (!node) continue;
    for (const neighborId of Object.keys(node.neighbors)) {
      if (visited.has(neighborId)) continue;
      visited.add(neighborId);
      parent.set(neighborId, current);
      queue.push(neighborId);
    }
  }

  if (!visited.has(endId)) return null;

  const path = [endId];
  let cursor = endId;
  while (cursor !== startId) {
    cursor = parent.get(cursor);
    path.push(cursor);
  }
  return path.reverse();
}

export function listIntersectionIds(network) {
  return Array.from(network.intersections.keys());
}
