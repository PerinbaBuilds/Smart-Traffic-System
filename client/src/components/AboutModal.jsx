export default function AboutModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-w-2xl rounded-xl bg-slate-800 p-6 text-slate-200 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="mb-3 text-xl font-bold">How the system works</h2>
        <ol className="list-inside list-decimal space-y-2 text-sm leading-relaxed">
          <li>
            <strong>Onboard IoT unit</strong> in each ambulance pairs a GPS receiver with a microphone-based
            siren classifier and streams telemetry (position, speed, heading, GPS confidence, siren
            confidence) toward the road network.
          </li>
          <li>
            <strong>Roadside / V2I controller</strong> (this backend) consumes that telemetry over{" "}
            <code className="rounded bg-slate-900 px-1">POST /api/telemetry</code>, the same contract real
            detector hardware would speak.
          </li>
          <li>
            <strong>Sensor fusion</strong>: an intersection preempts when the vehicle is within ~350m and
            GPS-confident, <em>or</em> within ~250m and the siren classifier is confident - so detection
            keeps working even if one channel degrades, e.g. GPS multipath in an urban canyon.
          </li>
          <li>
            <strong>Green corridor</strong>: the approach axis is forced green, the cross axis held red, and
            the next intersection ahead shows an early-warning cue - a rolling wave of green lights.
          </li>
          <li>
            <strong>Clear &amp; resume</strong>: once the vehicle passes through, the intersection holds a
            short all-red clearance window and then resumes its normal signal cycle.
          </li>
        </ol>
        <p className="mt-4 rounded-md bg-slate-900 p-3 text-xs text-slate-400">
          Try the ingestion API yourself:
          <br />
          <code>
            curl -X POST /api/telemetry -H &quot;Content-Type: application/json&quot; -d
            {' \'{"vehicleId":"ext-1","lat":40.0,"lng":-83.0,"status":"en-route"}\''}
          </code>
        </p>
        <button onClick={onClose} className="mt-5 w-full rounded-md bg-slate-700 py-2 text-sm hover:bg-slate-600">
          Close
        </button>
      </div>
    </div>
  );
}
