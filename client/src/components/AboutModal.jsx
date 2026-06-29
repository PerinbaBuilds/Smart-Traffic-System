export default function AboutModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-w-2xl rounded-xl bg-white p-6 text-slate-700 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-1 text-xl font-bold text-slate-900">How this actually works</h2>
        <p className="mb-4 text-sm text-slate-500">
          Picture an ambulance pulling out of a hospital on Usman Road during evening traffic. Here's what
          happens between then and the moment it clears the last junction.
        </p>
        <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed">
          <li>
            Every ambulance carries a GPS receiver and a small microphone-based siren classifier. Both
            stream readings - position, speed, heading, and a confidence score for each channel - toward
            the road network as the vehicle moves.
          </li>
          <li>
            A roadside controller (this backend) takes in that stream over{" "}
            <code className="rounded bg-slate-100 px-1 text-slate-700">POST /api/telemetry</code>, the same
            endpoint real detector hardware would call.
          </li>
          <li>
            Each junction decides for itself whether to preempt: it trusts GPS once the vehicle is within
            ~350m and confident, or falls back to the siren classifier within ~250m if GPS is shaky - the
            kind of multipath drop you'd actually get between tall buildings on a street like this one.
          </li>
          <li>
            Once triggered, the green corridor kicks in - the approach direction turns and holds green, the
            cross street holds red, and the next junction up the road shows an early-warning cue so it's
            ready before the ambulance even arrives.
          </li>
          <li>
            After the vehicle clears the junction, there's a short all-red pause for safety, then the
            signal goes back to its normal cycle like nothing happened.
          </li>
        </ol>
        <p className="mt-4 rounded-md bg-slate-100 p-3 text-xs text-slate-500">
          Want to poke at the API yourself?
          <br />
          <code className="text-slate-700">
            curl -X POST /api/telemetry -H &quot;Content-Type: application/json&quot; -d
            {' \'{"vehicleId":"ext-1","lat":13.0418,"lng":80.2341,"status":"en-route"}\''}
          </code>
        </p>
        <button onClick={onClose} className="mt-5 w-full rounded-md bg-slate-800 py-2 text-sm text-white hover:bg-slate-700">
          Close
        </button>
      </div>
    </div>
  );
}
