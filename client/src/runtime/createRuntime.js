import { createSocketRuntime } from "./socketRuntime.js";
import { createLocalRuntime } from "./localRuntime.js";

// Picks a live backend if one is reachable, otherwise falls back to a fully
// client-side simulation so the app always works - including as a static
// site with no server at all (e.g. GitHub Pages).
export async function createRuntime() {
  const base = import.meta.env.VITE_BACKEND_URL || "";

  try {
    const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(2500) });
    if (res.ok) return createSocketRuntime(base);
  } catch {
    // No reachable backend - fall through to the local demo engine.
  }

  return createLocalRuntime();
}
