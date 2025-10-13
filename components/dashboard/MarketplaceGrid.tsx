const items = [
  { name:"TrustShield Badge", price:"€2.99 /mn" },
  { name:"WhaleScope", price:"€4.99 /mn" },
  { name:"VaultGuard AI", price:"€5.99 /mn" },
  { name:"Verify API", price:"€19.99 /mn" }
];
export function MarketplaceGrid(){
  return (
    <div className="glass p-5 space-y-4">
      <h3 className="h-title text-lg">XRglass Marketplace</h3>
      <p className="subtle">Enhance your Pro Dashboard with Power Ups</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(i=>(
          <div key={i.name} className="glass p-4">
            <div className="font-semibold">{i.name}</div>
            <div className="subtle mt-1">{i.price}</div>
            <button className="btn-blue w-full mt-3">Activate</button>
          </div>
        ))}
      </div>
      <div className="glass p-4 flex items-center justify-between">
        <div>
          <div className="font-semibold">All-Access Pack - €24.99 / month</div>
          <div className="subtle">Includes every add-on</div>
        </div>
        <button className="btn-blue">Subscribe</button>
      </div>
    </div>
  );
}
