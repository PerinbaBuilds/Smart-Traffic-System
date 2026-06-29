import { createTrafficSystem, constants, DEFAULT_REGION_ID } from "shared";

// Backend-free runtime used when no traffic-control server is reachable
// (e.g. the static GitHub Pages build). Runs the exact same TrafficEngine
// and DeviceSimulator that the real server uses, ticked from a browser
// interval instead of a Node process. Unlike the real server (which manages
// one fixed region per deployment), this demo runtime lets the user switch
// between any bundled region live, since there's no real-deployment
// constraint client-side.
export function createLocalRuntime() {
  let system = createTrafficSystem(DEFAULT_REGION_ID);
  const listeners = new Set();
  let unsubscribeLog = () => {};
  let timer;

  function networkPayload() {
    return {
      regionId: system.network.regionId,
      cityName: system.network.cityName,
      intersections: Array.from(system.network.intersections.values()),
    };
  }

  function wire() {
    unsubscribeLog = system.engine.on("log", (entry) => listeners.forEach((cb) => cb({ type: "event", payload: entry })));
    timer = setInterval(() => {
      system.simulator.tick(constants.TICK_MS);
      listeners.forEach((cb) => cb({ type: "state", payload: system.engine.getSnapshot() }));
    }, constants.TICK_MS);
  }
  wire();

  return {
    mode: "demo",
    subscribe(cb) {
      listeners.add(cb);
      cb({ type: "state", payload: system.engine.getSnapshot() });
      cb({ type: "events", payload: system.engine.getEvents(50) });
      return () => listeners.delete(cb);
    },
    async getNetwork() {
      return networkPayload();
    },
    async dispatch(payload) {
      return system.simulator.dispatch(payload || {});
    },
    async recall(vehicleId) {
      system.simulator.recall(vehicleId);
    },
    async setAutoDispatch(enabled) {
      system.simulator.setAutoDispatch(enabled);
    },
    async setRegion(regionId) {
      if (regionId === system.network.regionId) return networkPayload();
      clearInterval(timer);
      unsubscribeLog();
      system = createTrafficSystem(regionId);
      wire();
      const payload = networkPayload();
      listeners.forEach((cb) => cb({ type: "network", payload }));
      listeners.forEach((cb) => cb({ type: "state", payload: system.engine.getSnapshot() }));
      listeners.forEach((cb) => cb({ type: "events", payload: system.engine.getEvents(50) }));
      return payload;
    },
    destroy() {
      clearInterval(timer);
      unsubscribeLog();
    },
  };
}
