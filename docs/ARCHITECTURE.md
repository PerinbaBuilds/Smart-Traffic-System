# Architecture

This document describes the system design: the IoT concept being simulated,
how that concept maps onto the code in this repo, and the data flow from a
vehicle's sensors to a green light.

## 1. The real-world system being modeled

A production deployment of this system would have three physical layers:

1. **Onboard vehicle unit** (one per emergency vehicle) - a small box with:
   - A GPS/GNSS receiver for absolute position, heading, and speed.
   - A microphone array feeding a siren classifier (a lightweight audio
     model distinguishing siren harmonics from road noise).
   - A cellular or DSRC/C-V2X radio to transmit telemetry.

   It periodically broadcasts a telemetry frame: vehicle id, position,
   speed, which intersection it's approaching, which axis it's approaching
   from, and a *confidence score* for each detection channel (GPS fix
   quality; siren classifier confidence).

2. **Roadside / intersection controller** (one per intersection) - the
   traffic signal's brain. It already runs a normal NS/EW signal-phase
   cycle. It subscribes to nearby vehicle telemetry (directly over
   V2I/DSRC in range, or relayed through a central system) and decides,
   independently, whether to preempt its own phase.

3. **Central traffic management system** - aggregates telemetry and
   intersection state for fleet tracking, dispatch, and operator
   dashboards. Doesn't make preemption decisions itself (those must be
   fast and local) - it observes and coordinates.

This repo's `shared` package *is* layer 2's decision logic plus a simulated
layer 1; `server` is layer 3 plus a real-time transport; `client` is the
operator dashboard.

## 2. Why two detection channels (GPS **or** siren)

A single sensing channel has failure modes:

- **GPS alone** fails in urban canyons (multipath/reflection), tunnels, and
  under dense tree cover - exactly the kind of geography emergency
  vehicles drive through.
- **Siren alone** fails when wind direction, traffic noise, or building
  reflection degrades the acoustic signature, and gives no information
  until the vehicle is already close.

Fusing them with an OR-trigger means either channel can independently
authorize a preemption, so the system degrades gracefully instead of
failing outright when one channel is noisy:

```
gpsTrigger   = distance <= DETECTION_RADIUS_M   (350m) AND gpsConfidence   >= 0.6
sirenTrigger = distance <= ACOUSTIC_RANGE_M      (250m) AND sirenConfidence >= 0.75
preempt      = gpsTrigger OR sirenTrigger
```

GPS has a longer effective range (clean line-of-sight radio) but a lower
confidence bar; siren is shorter-range (sound attenuates faster than it
travels in a useful direction) but requires higher confidence since
false-positive sirens (other emergency vehicles, recordings, TV) are a
real concern. This logic lives in
[`TrafficEngine.ingestTelemetry()`](../shared/src/TrafficEngine.js).

## 3. Signal state machine

Each intersection is one of four states, tracked per-intersection in
`TrafficEngine`:

```
 NORMAL CYCLING ──(GPS or siren trigger fires)──▶ PREEMPTED (green corridor)
       ▲                                                │
       │                                     vehicle passes through
       │                                     (releaseIntersection)
       │                                                ▼
 NORMAL CYCLING ◀──(clearanceMs counts down)──── ALL-RED CLEARANCE
```

- **Normal cycling**: alternates NS/EW green on fixed timers
  (`NS_GREEN_MS`/`EW_GREEN_MS`, 12s each in the demo).
- **Preempted**: the approach axis is forced green (`intersection.axis =
  approachAxis`), `preempted=true` is broadcast so the dashboard renders
  the green-corridor glow, and the controller logs a `preemption` event
  with the detection source and distance.
- **Conflict handling**: if a second vehicle approaches a still-preempted
  intersection from a *different* axis, the engine logs a `conflict` event
  and holds priority for the vehicle already in the intersection rather
  than flapping the signal.
- **Clearance**: once the simulator reports the vehicle has passed
  (`releaseIntersection`), the intersection holds all-red for
  `CLEARANCE_DELAY_MS` (2.5s) before resuming normal cycling - mirroring
  the real-world safety requirement that cross-traffic isn't released
  into the intersection the instant the ambulance clears it.
- **Early warning**: independent of preemption, any intersection within
  `EARLY_WARNING_RADIUS_M` (750m) of an inbound vehicle is flagged
  `preparing` so the dashboard can show an amber "vehicle inbound" cue
  ahead of the actual preemption - the rolling-green-wave effect.

All tunable thresholds live in one place:
[`shared/src/constants.js`](../shared/src/constants.js).

## 4. Code layout and data flow

```
shared/src/
  regions.js           Catalog of region presets (real-world lat/lng anchor + street
                         names per axis); buildNetwork() resolves a regionId through
                         here so the grid generator is the same algorithm everywhere
  network.js          Builds the intersection graph + BFS routing (buildNetwork, findRoute)
  geo.js               Haversine distance, point interpolation
  EventBus.js          Minimal pub/sub
  TrafficEngine.js      Signal state machine + telemetry fusion (the controller logic, §2-3 above)
  DeviceSimulator.js    Simulated fleet: moves vehicles along their route, fabricates
                         GPS/siren confidence with realistic noise/dropout, and calls
                         engine.ingestTelemetry() on every tick - i.e. it plays the role
                         of real onboard hardware
  index.js             createTrafficSystem(regionId) factory wiring the above together
```

### Regions: one engine, any city

`buildNetwork()` always generates the same 4-column x 3-row grid shape, but
the column/row labels and the lat/lng origin + step size come from a region
config (`shared/src/regions.js`) rather than being hardcoded. Detection
radii (`DETECTION_RADIUS_M`, `ACOUSTIC_RANGE_M`, etc., in
`shared/src/constants.js`) are defined in real meters and computed via
Haversine distance, so they're correct regardless of which region's
lat/lng step sizes are in play - nothing about the preemption logic needs
to know which city it's running in.

This intentionally does **not** depend on a live geocoding service: each
region is a small hand-anchored preset (real city, real street names, real
coordinates) baked into the repo, which keeps the system deployable with
zero external dependencies and zero API keys. Adding a new region means
adding one entry to `REGIONS`.

A real deployment fixes its region once via the `REGION_ID` environment
variable - one controller instance manages one city's grid, the same shape
a real municipal traffic-control deployment would take (`GET /api/regions`
reports the active region; there's no endpoint to change it at runtime).
The standalone/static demo is the one place region-switching happens
live: `localRuntime.setRegion()` tears down and rebuilds the in-browser
`createTrafficSystem()` instance, then re-emits `network`/`state`/`events`
so the dashboard redraws against the new city. `socketRuntime` doesn't
implement `setRegion` at all - `ControlPanel` only renders the picker when
the active runtime exposes it (`canChangeRegion`).

`shared` has no Node- or browser-specific APIs, so it runs unmodified in
both places:

```
Node backend:           server/src/server.js → createTrafficSystem(REGION_ID) → setInterval tick loop
                         → broadcasts engine.getSnapshot() over Socket.IO
Browser (static demo):  client/src/runtime/localRuntime.js → same createTrafficSystem()
                         → setInterval tick loop → state lives only in the tab
```

`getSnapshot()` only includes fields that actually change tick to tick
(phase timers, preemption flags, vehicle positions); static fields
(intersection id/name/lat/lng/neighbors, region/city name) are sent once in
the `network` payload and merged back in by id on the client
(`MapView.mergeIntersections`). This keeps the steady-state Socket.IO
traffic (broadcast at `TICK_MS`, 400ms) proportional to what's actually
live, which matters more as a region's grid grows.

### Backend (`server/`)

- `server.js` wires Express + Socket.IO around the shared engine, runs the
  tick loop, and re-broadcasts every `log` event from the engine plus a
  trimmed state snapshot every tick. It also installs `helmet` (with a CSP
  scoped to allow OSM tile loading and same-origin XHR/WebSocket, nothing
  broader), `compression`, and a CORS allowlist derived from `CORS_ORIGIN`
  (both for Express and the Socket.IO handshake) - default `*` for a
  frictionless demo, restrict it for a real deployment.
- `routes.js` exposes the REST surface: `GET /network`, `GET /regions`,
  `GET /state`, `GET /events`, `GET /history`, `POST /dispatch`,
  `POST /recall/:id`, `POST /auto-dispatch`, and `POST /telemetry` - the
  last one is the ingestion contract real onboard hardware would speak; the
  simulator just happens to be the only caller in this demo. A global rate
  limiter (300 req/min) covers all of `/api`; a stricter one (60 req/min)
  plus `requireApiKey` (an `x-api-key` check against `TRAFFIC_API_KEY`, a
  no-op when that's unset) additionally guards the four write endpoints.
- `db.js` persists the event log to SQLite (`node:sqlite`) in WAL mode, so
  `GET /history` survives a server restart and reads aren't blocked by
  concurrent writes.

### Frontend (`client/`)

- `runtime/createRuntime.js` probes `/api/health`; if it answers, it builds
  a `socketRuntime` (real backend over REST + WebSocket); otherwise it
  falls back to `localRuntime` (engine ticking inside the tab). Every
  component downstream consumes the same `{ network, state, events, mode,
  dispatch, recall, setAutoDispatch, setRegion, canChangeRegion }` shape
  regardless of which runtime is active - this is what makes the GitHub
  Pages static deploy fully interactive with zero backend. `mode` also
  tracks Socket.IO's own `connect`/`disconnect` events as a `reconnecting`
  state so the header badge reflects a dropped connection instead of
  silently going stale.
- `components/MapView.jsx` renders the grid (Leaflet `Polyline`s for roads,
  `divIcon` markers colored by intersection state) and vehicles (🚑
  `divIcon` markers, hoisted to a single shared icon instance rather than
  allocated per marker per render). A `RecenterOnChange` helper calls
  `useMap().setView()` whenever the computed center changes, since
  react-leaflet's `MapContainer` only honors `center`/`zoom` on first
  mount - without it, switching regions would leave the viewport stuck
  over the old city while the new markers render off-screen.
- `components/ControlPanel.jsx`, `StatsPanel.jsx`, `EventLog.jsx`,
  `Legend.jsx` make up the sidebar; `Header.jsx` shows the live/demo/
  reconnecting mode badge. `ControlPanel` renders a region `<select>`
  (backed by `shared`'s `listRegions()`) only when the active runtime
  exposes `setRegion` - i.e. only in `localRuntime`, since a real backend's
  region is fixed by its own `REGION_ID`.

## 5. Deployment shapes

The same codebase supports three deployment modes (see the root
[README](../README.md#deployment) for commands):

1. **Static (GitHub Pages)** - `client` only, built with `vite build --mode
   demo` (subpath base), running `localRuntime`. Zero infrastructure.
2. **Docker Compose** - `server` (Express/Socket.IO/SQLite) + `client`
   (nginx, reverse-proxying `/api` and `/socket.io` to `server`). This is
   the shape a real municipal pilot would actually run.
3. **Single Node process** - `server` serves the prebuilt `client/dist`
   directly, for the simplest possible self-hosted deployment.

## 6. Testing strategy

- `shared/test/engine.test.js` exercises the controller logic directly:
  grid topology, BFS routing, vehicle movement, preemption triggering on
  both GPS and siren channels, and clearance/resume behavior - no HTTP or
  browser involved.
- `server/test/api.test.js` spins up a real `http.Server` on an ephemeral
  port and drives it with `fetch`, covering the actual REST contract
  (dispatch, recall, telemetry ingestion, validation errors).
- The dashboard was additionally verified by hand in a real headless
  browser session against the live dev server: map and markers render,
  dispatch produces a moving ambulance marker, preemption turns an
  intersection's marker green with the event log and stats updating live.
  The same session verified demo-mode region switching specifically (kill
  the backend, confirm fallback to `localRuntime`, switch regions, confirm
  the map recenters and redraws with the new city's streets, and confirm a
  dispatch still triggers a green corridor end-to-end there).
