export default function ProPage() {
  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">XRglass Pro</h1>
        <p className="text-slate-600">Enhance your dashboard with add-ons and deeper analysis.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "TrustShield Badge", price: "€2.99/m", desc: "Public badge showing your verified status." },
          { name: "WhaleScope Alerts", price: "€4.99/m", desc: "Large holder movements & smart alerts." },
          { name: "VaultGuard AI", price: "€5.99/m", desc: "Heuristic scanning and anomaly hints." },
          { name: "Verify API", price: "€1.99/m", desc: "Lightweight API to embed basic checks." },
          { name: "Reports", price: "€3.99/m", desc: "Periodic PDF summaries and CSV exports." },
          { name: "All-Access Pack", price: "€24.99/m", desc: "Everything unlocked for one price." },
        ].map((p) => (
          <div key={p.name} className="card p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <span className="badge">{p.price}</span>
            </div>
            <p className="text-slate-600">{p.desc}</p>
            <button className="btn w-full">Activate</button>
          </div>
        ))}
      </section>
    </main>
  );
}
