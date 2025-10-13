const WATCHLIST_ITEMS = [
  { name: "XRPL DEX Bot", change: "+4.3%", status: "Stable" },
  { name: "Ledger City", change: "+2.1%", status: "Growing" },
  { name: "Ripple Labs", change: "-1.2%", status: "Monitoring" },
];

export function WatchlistSummary() {
  return (
    <div className="glass space-y-4 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="pill">Watchlist Summary</div>
        <span className="subtle">Updated 2 mins ago</span>
      </div>
      <ul className="space-y-3">
        {WATCHLIST_ITEMS.map((item) => (
          <li key={item.name} className="glass flex items-center justify-between gap-3 p-4">
            <div>
              <div className="font-semibold text-slate-700">{item.name}</div>
              <div className="subtle">{item.status}</div>
            </div>
            <span className="text-sm font-semibold" style={{ color: item.change.startsWith("-") ? "#dc2626" : "#16a34a" }}>
              {item.change}
            </span>
          </li>
        ))}
      </ul>
      <button className="btn-blue w-full">Open Watchlist</button>
    </div>
  );
}
