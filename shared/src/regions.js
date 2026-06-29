// Catalog of deployable regions. Each entry is a procedurally generated
// grid (same generation technique as the original "Metroville" demo city)
// anchored at real-world coordinates with real street-naming conventions,
// so the same engine can stand up a plausible network for "any place on the
// globe" without depending on a live geocoding/OSM call at runtime.
//
// These are illustrative grids for demo/operational purposes, not surveyed
// intersection data - block spacing is a realistic approximation, not a
// precise survey. A real municipal deployment would replace a region entry
// with its actual signal-controller inventory (see docs/ARCHITECTURE.md).
export const REGIONS = {
  metroville: {
    id: "metroville",
    cityName: "Metroville",
    description: "Fictional reference grid (default demo + test fixture).",
    cols: ["1st Ave", "2nd Ave", "3rd Ave", "4th Ave"],
    rows: ["1st St", "2nd St", "3rd St"],
    baseLat: 40.0,
    baseLng: -83.0,
    latStep: 0.0026, // ~290m per block
    lngStep: 0.0033, // ~280m per block at this latitude
  },
  manhattan: {
    id: "manhattan",
    cityName: "Midtown Manhattan, New York City, USA",
    description: "Illustrative grid anchored near Times Square using real avenue/street names and approximate real block spacing.",
    cols: ["9th Ave", "8th Ave", "7th Ave", "6th Ave"],
    rows: ["42nd St", "41st St", "40th St"],
    baseLat: 40.7565,
    baseLng: -73.9967,
    latStep: 0.00072, // ~80m short block N-S
    lngStep: 0.0031, // ~260m long block E-W
  },
  sydney: {
    id: "sydney",
    cityName: "Sydney CBD, Australia",
    description: "Illustrative grid anchored in the Sydney CBD using real street names; exercises southern-hemisphere negative latitude.",
    cols: ["George St", "Pitt St", "Castlereagh St", "Elizabeth St"],
    rows: ["Market St", "Park St", "Bathurst St"],
    baseLat: -33.87,
    baseLng: 151.206,
    latStep: 0.0018, // ~200m block N-S
    lngStep: 0.0013, // ~120m block E-W
  },
};

export const DEFAULT_REGION_ID = "metroville";

export function getRegion(regionId) {
  const region = REGIONS[regionId || DEFAULT_REGION_ID];
  if (!region) {
    const available = Object.keys(REGIONS).join(", ");
    throw new Error(`Unknown region "${regionId}". Available regions: ${available}`);
  }
  return region;
}

export function listRegions() {
  return Object.values(REGIONS).map(({ id, cityName, description }) => ({ id, cityName, description }));
}
