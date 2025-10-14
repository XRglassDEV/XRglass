export default function Pricing() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-extrabold">Pricing</h1>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="p-6 rounded-2xl border border-white/60 bg-white/60 backdrop-blur">
          <div className="text-lg font-semibold">Free</div>
          <ul className="mt-3 text-sm text-slate-700 space-y-1">
            <li>✓ 3 scans/day</li><li>✓ Basic TrustScore</li><li>✗ Alerts</li><li>✗ Watchlists</li>
          </ul>
        </div>
        <div className="p-6 rounded-2xl border border-sky-200 bg-gradient-to-b from-white/70 to-sky-50 backdrop-blur">
          <div className="text-lg font-semibold">XRglass Pro</div>
          <ul className="mt-3 text-sm text-slate-700 space-y-1">
            <li>✓ Unlimited scans</li><li>✓ Realtime alerts</li><li>✓ Watchlists</li><li>✓ Add-Ons Marketplace</li>
          </ul>
          <a href="/marketplace" className="mt-5 inline-flex px-4 py-2 rounded-lg text-white bg-gradient-to-r from-sky-500 to-blue-700">Start Trial</a>
        </div>
      </div>
    </div>
  );
}
