const ITEMS = [
  { name: "TrustShield Badge", price: "€2.99 /mn" },
  { name: "WhaleScope", price: "€4.99 /mn" },
  { name: "VaultGuard AI", price: "€5.99 /mn" },
  { name: "Verify API", price: "€19.99 /mn" },
];

export function MarketplaceGrid() {
  return (
    <div className="glass space-y-4 p-5">
      <h3 className="h-title text-lg">XRglass Marketplace</h3>
      <p className="subtle">Enhance your Pro Dashboard with Power Ups</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ITEMS.map((item) => (
          <div key={item.name} className="glass p-4">
            <div className="font-semibold text-slate-700">{item.name}</div>
            <div className="subtle mt-1">{item.price}</div>
            <button className="btn-blue mt-3 w-full">Activate</button>
          </div>
        ))}
      </div>
      <div className="glass flex items-center justify-between gap-4 p-4">
        <div>
          <div className="font-semibold text-slate-700">All-Access Pack - €24.99 / month</div>
          <div className="subtle">Includes every add-on</div>
        </div>
        <button className="btn-blue">Subscribe</button>
      </div>
    </div>
  );
}
