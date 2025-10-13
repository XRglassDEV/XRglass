"use client";
import { TrustCard } from "@/components/dashboard/TrustCard";
import { MarketplaceGrid } from "@/components/dashboard/MarketplaceGrid";
import { WatchlistSummary } from "@/components/dashboard/WatchlistSummary";

export default function Dashboard(){
  return (
    <section className="space-y-6">
      <div className="grid-2">
        <div className="space-y-6">
          <TrustCard/>
          <WatchlistSummary/>
          <div className="glass p-5 flex items-center justify-between">
            <div>
              <div className="font-semibold">All-Access Pack - €24.99 / month</div>
              <div className="subtle mt-1">Unlock every add-on with one plan</div>
            </div>
            <button className="btn-blue">Subscribe</button>
          </div>
        </div>
        <div><MarketplaceGrid/></div>
      </div>
    </section>
  );
}
