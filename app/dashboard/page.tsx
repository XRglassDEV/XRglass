"use client";

import { useState } from "react";
import { MarketplaceGrid } from "@/components/dashboard/MarketplaceGrid";
import { TrustCard } from "@/components/dashboard/TrustCard";
import { WatchlistSummary } from "@/components/dashboard/WatchlistSummary";

export default function Dashboard() {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleScan() {
    if (!address) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/check?address=${encodeURIComponent(address)}`);
      if (!res.ok) {
        throw new Error("Scan failed");
      }
      // The mock keeps visuals static; integrate dynamic data in production builds.
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid-2">
        <div className="space-y-6">
          <TrustCard />
          <WatchlistSummary />
          <div className="glass flex items-center justify-between gap-4 p-5">
            <div>
              <div className="font-semibold text-slate-700">All-Access Pack - €24.99 / month</div>
              <div className="subtle mt-1">Unlock every add-on with one plan</div>
            </div>
            <button className="btn-blue">Subscribe</button>
          </div>
        </div>
        <div>
          <MarketplaceGrid />
        </div>
      </div>

      <div className="glass flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <label className="sr-only" htmlFor="dashboard-scan">
          Paste wallet to scan
        </label>
        <input
          id="dashboard-scan"
          className="flex-1 bg-transparent outline-none"
          placeholder="Paste wallet to scan…"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
        <button className="btn-blue" onClick={handleScan} disabled={!address || loading}>
          {loading ? "Scanning…" : "Start scan"}
        </button>
      </div>

      <div className="text-xs text-gray-500">© XRglass 2025 — Ripple Ecosystem</div>
    </section>
  );
}
