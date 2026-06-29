const MODE_STYLES = {
  live: "bg-emerald-500/20 text-emerald-300",
  demo: "bg-amber-500/20 text-amber-300",
  connecting: "bg-slate-600/30 text-slate-300",
  reconnecting: "bg-rose-500/20 text-rose-300 animate-pulse",
};

const MODE_LABELS = {
  live: "● LIVE SERVER",
  demo: "● LOCAL DEMO MODE",
  connecting: "Connecting…",
  reconnecting: "● RECONNECTING…",
};

export default function Header({ mode, onAbout }) {
  return (
    <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3">
      <div className="flex items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="h-9 w-9 flex-shrink-0" />
        <div>
          <h1 className="text-lg font-bold leading-tight text-slate-50">Smart Traffic Signal for Emergency Vehicles</h1>
          <p className="text-xs text-slate-400">Real-time green-corridor control room</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${MODE_STYLES[mode] || MODE_STYLES.connecting}`}>
          {MODE_LABELS[mode] || MODE_LABELS.connecting}
        </span>
        <button
          onClick={onAbout}
          className="rounded-md border border-slate-600 px-3 py-1 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800"
        >
          How it works
        </button>
      </div>
    </header>
  );
}
