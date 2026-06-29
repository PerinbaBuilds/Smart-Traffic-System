const SEVERITY_COLORS = {
  info: "bg-sky-500",
  alert: "bg-emerald-500",
  warning: "bg-amber-500",
  success: "bg-emerald-500",
};

function timeAgo(ts) {
  const seconds = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)}m ago`;
}

export default function EventLog({ events }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Event log</h2>
      <ul className="flex-1 space-y-2 overflow-y-auto pr-1">
        {events.length === 0 && <li className="text-xs text-slate-400">Waiting for activity…</li>}
        {events.map((event) => (
          <li key={event.id} className="flex gap-2 text-xs">
            <span
              className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${SEVERITY_COLORS[event.severity] || "bg-slate-400"}`}
            />
            <div>
              <p className="text-slate-700">{event.message}</p>
              <p className="text-slate-400">{timeAgo(event.ts)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
