import { useState } from "react";
import { useTrafficSystem } from "./hooks/useTrafficSystem.js";
import MapView from "./components/MapView.jsx";
import ControlPanel from "./components/ControlPanel.jsx";
import StatsPanel from "./components/StatsPanel.jsx";
import EventLog from "./components/EventLog.jsx";
import Legend from "./components/Legend.jsx";
import Header from "./components/Header.jsx";
import AboutModal from "./components/AboutModal.jsx";

export default function App() {
  const {
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
  } = useTrafficSystem();
  const [showAbout, setShowAbout] = useState(false);
  const [autoEnabled, setAutoEnabled] = useState(true);

  function handleToggleAuto(enabled) {
    setAutoEnabled(enabled);
    setAutoDispatch(enabled);
  }

  async function handleChangeRegion(regionId) {
    await setRegion(regionId);
    setAutoDispatch(autoEnabled);
  }

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <Header mode={mode} onAbout={() => setShowAbout(true)} />
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <main className="relative min-h-[40vh] flex-1">
          <MapView network={network} state={state} onDispatch={dispatch} />
        </main>
        <aside className="flex max-h-[55vh] w-full flex-shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-white p-4 md:max-h-none md:w-96 md:overflow-hidden">
          {error && (
            <div className="flex items-start justify-between gap-2 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
              <span>{error}</span>
              <button
                onClick={clearError}
                aria-label="Dismiss error"
                className="shrink-0 text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          )}
          <ControlPanel
            network={network}
            vehicles={state?.vehicles ?? []}
            onDispatch={dispatch}
            onRecall={recall}
            onToggleAuto={handleToggleAuto}
            autoEnabled={autoEnabled}
            canChangeRegion={canChangeRegion}
            onChangeRegion={handleChangeRegion}
          />
          <StatsPanel stats={state?.stats} />
          <Legend />
          <EventLog events={events} />
        </aside>
      </div>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
