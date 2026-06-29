import { io } from "socket.io-client";

export function createSocketRuntime(base = "") {
  const socket = io(base || undefined, { transports: ["websocket", "polling"] });
  const listeners = new Set();

  socket.on("state", (state) => listeners.forEach((cb) => cb({ type: "state", payload: state })));
  socket.on("event", (entry) => listeners.forEach((cb) => cb({ type: "event", payload: entry })));
  socket.on("events", (entries) => listeners.forEach((cb) => cb({ type: "events", payload: entries })));
  // Socket.IO auto-reconnects under the hood; surface the in-between state
  // so the dashboard can show something more honest than a frozen "LIVE".
  socket.on("disconnect", () => listeners.forEach((cb) => cb({ type: "mode", payload: "reconnecting" })));
  socket.on("connect", () => listeners.forEach((cb) => cb({ type: "mode", payload: "live" })));

  async function api(path, options) {
    const res = await fetch(`${base}/api${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed (${res.status})`);
    }
    return res.json();
  }

  return {
    mode: "live",
    subscribe(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getNetwork() {
      return api("/network");
    },
    dispatch(payload) {
      return api("/dispatch", { method: "POST", body: JSON.stringify(payload || {}) });
    },
    recall(vehicleId) {
      return api(`/recall/${vehicleId}`, { method: "POST" });
    },
    setAutoDispatch(enabled) {
      return api("/auto-dispatch", { method: "POST", body: JSON.stringify({ enabled }) });
    },
    destroy() {
      socket.disconnect();
    },
  };
}
