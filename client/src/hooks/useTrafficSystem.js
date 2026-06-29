import { useEffect, useRef, useState, useCallback } from "react";
import { createRuntime } from "../runtime/createRuntime.js";

export function useTrafficSystem() {
  const [network, setNetwork] = useState(null);
  const [state, setState] = useState(null);
  const [events, setEvents] = useState([]);
  const [mode, setMode] = useState("connecting");
  const [error, setError] = useState(null);
  const runtimeRef = useRef(null);

  useEffect(() => {
    let unsubscribe = () => {};
    let cancelled = false;

    createRuntime().then((runtime) => {
      if (cancelled) {
        runtime.destroy?.();
        return;
      }
      runtimeRef.current = runtime;
      setMode(runtime.mode);
      runtime.getNetwork().then(setNetwork).catch((err) => setError(err.message));
      unsubscribe = runtime.subscribe((msg) => {
        if (msg.type === "state") setState(msg.payload);
        else if (msg.type === "event") setEvents((prev) => [msg.payload, ...prev].slice(0, 80));
        else if (msg.type === "events") setEvents(msg.payload.slice(0, 80));
        else if (msg.type === "network") setNetwork(msg.payload);
        else if (msg.type === "mode") setMode(msg.payload);
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
      runtimeRef.current?.destroy?.();
    };
  }, []);

  const dispatch = useCallback((payload) => {
    setError(null);
    return runtimeRef.current?.dispatch(payload).catch((err) => setError(err.message));
  }, []);

  const recall = useCallback((vehicleId) => runtimeRef.current?.recall(vehicleId), []);

  const setAutoDispatch = useCallback((enabled) => runtimeRef.current?.setAutoDispatch(enabled), []);

  const setRegion = useCallback((regionId) => {
    setError(null);
    return runtimeRef.current?.setRegion?.(regionId).catch((err) => setError(err.message));
  }, []);

  const canChangeRegion = Boolean(runtimeRef.current?.setRegion);
  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(timer);
  }, [error]);

  return {
    network,
    state,
    events,
    mode,
    error,
    dispatch,
    recall,
    setAutoDispatch,
    setRegion,
    canChangeRegion,
    clearError,
  };
}
