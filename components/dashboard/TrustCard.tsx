import { ScoreBadge } from "./ScoreBadge";
export function TrustCard(){
  return (
    <div className="glass p-5 space-y-5">
      <h3 className="h-title text-lg">TrustScore Overview</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass p-4"><ScoreBadge label="Wallet: rEbTK…" score={92}/></div>
        <div className="glass p-4">
          <h4 className="font-semibold mb-2">Why this rating?</h4>
          <div className="space-y-2">
            <div className="h-3 rounded bg-white/70 w-4/5"/>
            <div className="h-3 rounded bg-white/70 w-3/5"/>
            <div className="h-3 rounded bg-white/70 w-2/5"/>
          </div>
        </div>
        <div className="glass p-4 md:col-span-2"><ScoreBadge label="Project: XRPL-Lens" score={62}/></div>
      </div>
    </div>
  );
}
