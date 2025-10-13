import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold">XRglass Dashboard</h1>
      <p className="mt-2 text-neutral-400">Watchlists, alerts & last verdicts.</p>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Watchlist</h2>
          <p className="text-neutral-400 mt-2">No items yet. Add wallets or domains to monitor.</p>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Latest scans</h2>
          <div className="mt-3 text-neutral-400">Coming soon…</div>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Risk signals</h2>
          <div className="mt-3 text-neutral-400">Heuristics & flags preview.</div>
        </div>
      </div>

      <Suspense>
        <section className="card p-6 mt-8">
          <h3 className="text-lg font-semibold">Webhook (optional)</h3>
          <p className="text-neutral-400 mt-2">Post alerts to your endpoint when thresholds are crossed.</p>
        </section>
      </Suspense>
    </main>
  );
}
