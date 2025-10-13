import { ScoreBadge } from "./ScoreBadge";

type TrustCardProps = {
  walletLabel?: string;
  walletScore?: number;
  projectLabel?: string;
  projectScore?: number;
};

export function TrustCard({
  walletLabel = "Wallet: rEbTK…",
  walletScore = 92,
  projectLabel = "Project: XRPL-Lens",
  projectScore = 62,
}: TrustCardProps) {
  return (
    <div className="glass space-y-5 p-5">
      <h3 className="h-title text-lg">TrustScore Overview</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass space-y-3 p-4">
          <ScoreBadge label={walletLabel} score={walletScore} />
        </div>
        <div className="glass p-4">
          <h4 className="mb-2 font-semibold text-slate-700">Why this rating?</h4>
          <div className="space-y-2">
            <div className="h-3 w-4/5 rounded bg-white/70" />
            <div className="h-3 w-3/5 rounded bg-white/70" />
            <div className="h-3 w-2/5 rounded bg-white/70" />
          </div>
        </div>
        <div className="glass space-y-3 p-4 md:col-span-2">
          <ScoreBadge label={projectLabel} score={projectScore} />
        </div>
      </div>
    </div>
  );
}
