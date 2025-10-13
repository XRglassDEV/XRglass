import Watchlist from "@/components/watchlist/Watchlist";
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <main className="space-y-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">XRglass Dashboard</h1>
        <p className="text-slate-600">Watchlists, alerts & live verdicts.</p>
      </section>

      <Watchlist />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">Latest scans</h2>
          <p className="text-slate-600">
            Aggregate view of wallets and projects scanned over the last 24 hours.
          </p>
          <p className="text-sm text-slate-500">Connect XRglass Pro to unlock detailed analytics.</p>
        </div>
        <div className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">Risk signals</h2>
          <p className="text-slate-600">Keep an eye on anomaly flags, heuristics and scoring deltas.</p>
          <p className="text-sm text-slate-500">Alert rules are configurable per item in your watchlist.</p>
        </div>
        <div className="card p-6 space-y-3">
          <h2 className="text-xl font-semibold">Integrations</h2>
          <p className="text-slate-600">Forward verdicts to Slack, Discord or custom webhooks.</p>
          <p className="text-sm text-slate-500">Set <code>WEBHOOK_URL</code> or per-item overrides to deliver alerts.</p>
        </div>
      </div>

      <Suspense>
        <section className="card p-6 space-y-2">
          <h3 className="text-lg font-semibold">Webhook (optional)</h3>
          <p className="text-slate-600">
            Configure a webhook endpoint to fan out notifications from your watchlist.
          </p>
        </section>
      </Suspense>
    </main>
  );
}
