export default function ProPage() {
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold">XRglass Pro</h1>
      <p className="mt-2 text-neutral-400">Membership, add-ons & advanced scanning.</p>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Pro features</h2>
          <ul className="list-disc pl-6 mt-3 text-neutral-300 space-y-2">
            <li>Deeper XRPL ledger heuristics</li>
            <li>Smart dest-tag & trustline checks</li>
            <li>Webhook alerts & exports</li>
            <li>Project reputation graph</li>
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Add-ons</h2>
          <ul className="list-disc pl-6 mt-3 text-neutral-300 space-y-2">
            <li>Domain risk intelligence</li>
            <li>Token holder anomaly detection</li>
            <li>Bulk wallet screening</li>
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <a className="btn" href="/dashboard">Go to dashboard</a>
      </div>
    </main>
  );
}
