const MODE_STYLES = {
  live: "bg-emerald-100 text-emerald-700",
  demo: "bg-amber-100 text-amber-700",
  connecting: "bg-slate-200 text-slate-600",
  reconnecting: "bg-rose-100 text-rose-700 animate-pulse",
};

const MODE_LABELS = {
  live: "● Live server",
  demo: "● Demo mode (running in your browser)",
  connecting: "Connecting…",
  reconnecting: "● Reconnecting…",
};

export default function Header({ mode, onAbout, cityName }) {
  return (
    <header className="relative flex items-center justify-between border-b border-slate-200 bg-white px-5 py-3 shadow-sm">
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-600" />
      <div className="flex items-center gap-3">
        <img
          src={`${import.meta.env.BASE_URL}favicon.svg`}
          alt=""
          className="h-10 w-10 flex-shrink-0 rounded-xl shadow-sm ring-1 ring-black/5"
        />
        <div>
          <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-900">Emergency Green Corridor</h1>
          <p className="text-xs text-slate-500">
            Watching <span className="font-medium text-slate-600">{cityName || "the network"}</span> so ambulances
            don't have to wait
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${MODE_STYLES[mode] || MODE_STYLES.connecting}`}
        >
          {MODE_LABELS[mode] || MODE_LABELS.connecting}
        </span>
        <button
          onClick={onAbout}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
        >
          How it works
        </button>
      </div>
    </header>
  );
}
