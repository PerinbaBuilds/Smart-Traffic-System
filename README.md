# Smart Traffic Signal for Emergency Vehicles

An IoT-enabled traffic control system that detects approaching ambulances via
**GPS and siren-acoustic telemetry**, fuses the two signals, and opens a
real-time **green corridor** through the intersections ahead of the vehicle -
then clears and resumes normal cycling once it has passed.

This repo contains a complete, runnable simulation of that system: a
reactive traffic-control engine, a fleet of simulated emergency vehicles
broadcasting telemetry, a Node/Express/Socket.IO backend, and a React +
Leaflet control-room dashboard. The same detection/preemption logic that
would drive real roadside controllers and onboard vehicle units drives this
demo - the only difference is the telemetry source (simulated vs. real
hardware).

**Live demo:** runs entirely client-side on GitHub Pages (no backend
required) - see [Deployment](#deployment) below for the URL once enabled on
your fork/repo.

> **🚧 Status: MVP.** This is a working proof of concept, not a
> production-ready traffic-control product. The simulation, routing, and
> preemption logic are functional end to end, but the project still needs
> real-world hardening before it could touch an actual intersection - see
> [Roadmap](#roadmap--known-limitations) for what's still missing.

## What it does

- A downtown grid (4 avenues x 3 streets = 12 intersections) cycles its
  lights normally (NS green / EW green / all-red clearance) like any
  signalized network. The grid generator is data-driven
  ([`shared/src/regions.js`](shared/src/regions.js)) and ships with three
  real-world-anchored presets - Metroville (fictional default), Midtown
  Manhattan, and Sydney CBD - so the same engine can stand up a plausible
  network anywhere on the globe, not just one fixed city. A real deployment
  picks its region once via `REGION_ID`; the standalone demo lets you switch
  between presets live from the dashboard.
- Dispatching an emergency vehicle computes a route across the grid and
  starts streaming telemetry (position, speed, GPS confidence, siren
  confidence) toward each intersection ahead of it.
- Each intersection independently fuses that telemetry: it preempts to a
  green corridor when the vehicle is **within ~350m and GPS-confident, OR
  within ~250m and the siren classifier is confident** - so detection
  degrades gracefully if either channel is noisy (GPS multipath in an urban
  canyon, siren occlusion, etc).
- The corridor clears automatically a couple of seconds after the vehicle
  passes through, and the intersection resumes normal cycling.
- A control-room dashboard shows the live map, dispatch controls, rolling
  stats (active emergencies, corridors open, total preemptions, average
  detection lead time), and a real-time event log.

## Architecture at a glance

```
shared/   Isomorphic traffic engine + device simulator (runs identically in Node and the browser)
          regions.js holds the region catalog (real-world coordinates + street names)
server/   Express REST API + Socket.IO live state, SQLite (WAL) event log
          helmet, rate limiting, optional API-key auth, CORS allowlist
client/   React + Leaflet dashboard, with two interchangeable runtimes:
            - socketRuntime: talks to the real backend over REST + WebSocket
            - localRuntime:  runs the same shared engine in-browser via setInterval
```

The frontend auto-detects which runtime to use by probing `/api/health` on
load. Point it at a real backend and you get a genuine live system; deploy
it standalone (e.g. GitHub Pages) and it falls back to an in-browser
simulation using the exact same engine code - no server required for the
public demo to be fully interactive.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full design,
including the conceptual IoT hardware layer this simulates.

## Getting started

Requires Node.js >= 22.

```bash
npm install
npm run dev
```

This starts the API/Socket.IO server on `http://localhost:4000` and the
Vite dev server on `http://localhost:5173` (which proxies `/api` and
`/socket.io` to the server). Open `http://localhost:5173`.

Click **"Dispatch emergency vehicle"** to send an ambulance across the grid,
or leave **"Auto-generate scenarios"** checked to watch the system run
itself.

### Other scripts

```bash
npm test             # unit tests for the shared engine + the API
npm run build         # production client build (root-relative paths)
npm run build:demo    # production client build for GitHub Pages (subpath base)
npm run lint           # lint the client
```

### Configuration

Nothing is required for local dev - every variable below has a working
default. Copy [`.env.example`](.env.example) to `.env` to customize a real
deployment:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `4000` | Port the Express/Socket.IO server listens on. |
| `DATA_DIR` | `./server/data` | Where the SQLite event-log database is stored. |
| `REGION_ID` | `metroville` | Which region preset this server instance serves (`metroville`, `manhattan`, `sydney` - see `shared/src/regions.js`). One controller manages one region, same as a real municipal deployment. |
| `CORS_ORIGIN` | `*` | Comma-separated allowlist of dashboard origins permitted to call the API / open a Socket.IO connection. Lock this down for a public deployment. |
| `TRAFFIC_API_KEY` | unset (no auth) | When set, write endpoints require this value in an `x-api-key` header. |
| `VITE_BACKEND_URL` | page origin | Build-time only: base URL of the backend the dashboard should talk to. |

### Try the ingestion API directly

Roadside hardware (or your own script) talks to the same endpoint the
simulated vehicles use:

```bash
curl -X POST http://localhost:4000/api/telemetry \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"ext-1","lat":40.0,"lng":-83.0,"status":"en-route"}'
```

If `TRAFFIC_API_KEY` is set, add `-H "x-api-key: <key>"` to every write
request (`/dispatch`, `/recall/:id`, `/auto-dispatch`, `/telemetry`).

Other endpoints: `GET /api/network`, `GET /api/regions`, `GET /api/state`,
`GET /api/events`, `GET /api/history`, `POST /api/dispatch`,
`POST /api/recall/:id`, `POST /api/auto-dispatch`.

## Deployment

### Option A - static demo (GitHub Pages, no backend)

`.github/workflows/deploy-pages.yml` builds the client with
`npm run build:demo` (which bakes in the `/Smart-Traffic-System/` base path)
and publishes `client/dist` to GitHub Pages on every push to `main` /
`feature/emergency-vehicle-traffic-system`, or manually via
**Actions -> Deploy live demo to GitHub Pages -> Run workflow**. Enable
Pages once for the repo: **Settings -> Pages -> Source: GitHub Actions**.
The app detects there's no `/api`, and transparently runs the full traffic
engine inside the browser tab instead.

### Option B - full stack (Docker Compose)

Runs the real Express/Socket.IO backend plus an nginx-served client, wired
together exactly like a self-hosted production deployment:

```bash
docker compose up --build
```

Client: `http://localhost:8080` (proxies `/api` and `/socket.io` to the
`server` container). Event history persists to a named volume
(`traffic-data`) backed by SQLite (WAL mode, for concurrent read/write).
Both containers have healthchecks; the client waits for the server to
report healthy before starting. The server runs behind `helmet` (scoped
CSP), gzip/Brotli-friendly `compression`, a CORS allowlist, and two tiers
of rate limiting (global + a stricter one on write endpoints) - see
[Configuration](#configuration) to lock down `CORS_ORIGIN` and
`TRAFFIC_API_KEY` for a real deployment. nginx serves the client with
long-lived immutable caching on content-hashed assets and `no-cache` on
`index.html`, so redeploys are picked up immediately.

### Option C - single Node process

Build the client and let the API server serve it directly:

```bash
npm run build
npm start
```

Serves both the API and the static client from `http://localhost:4000`.

## Testing

```bash
npm test
```

Runs the shared-engine unit tests (grid topology, routing, vehicle
movement, preemption triggers, arrival/retirement) and the server's HTTP
API tests against a real `http.Server` instance.

## Roadmap / known limitations

This project is an MVP: the core detection-and-preemption loop works and is
tested, but it has not been hardened for a real deployment. Before this
could control real intersections, it still needs:

- **Real hardware integration.** The "GPS + siren" telemetry is simulated
  ([`DeviceSimulator`](shared/src/DeviceSimulator.js)); a production system
  needs actual onboard GPS units and an acoustic siren classifier posting
  to the same `/api/telemetry` contract, plus a fallback when telemetry
  goes stale or a device drops offline.
- **Surveyed road networks.** Grids are procedurally generated from a
  region preset ([`regions.js`](shared/src/regions.js)), not real
  intersection geometry, signal-phase plans, or lane data - a real rollout
  needs each municipality's actual controller inventory and phasing.
- **Multi-vehicle conflict resolution.** Two emergency vehicles approaching
  the same intersection from conflicting directions aren't reconciled
  beyond first-come priority; a real system needs a proper arbitration
  policy (and likely manual operator override).
- **AuthN/authZ and auditing.** The optional `TRAFFIC_API_KEY` is a single
  shared secret, fine for a demo but not for multi-agency access control or
  a tamper-evident audit trail of who preempted what, when.
- **Operational monitoring/alerting.** There's an event log, but no
  metrics/alerting pipeline for controller health, missed detections, or
  preemption failures in the field.
- **Field validation.** Detection radii and confidence thresholds in
  [`constants.js`](shared/src/constants.js) are reasonable starting
  defaults, not calibrated against real sensor noise or city traffic
  patterns.

Contributions and issues that move any of the above forward are welcome.
