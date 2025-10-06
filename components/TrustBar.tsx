// components/TrustBar.tsx
"use client";

import { Verdict } from "@/lib/score";

export default function TrustBar({ verdict, score }: { verdict: Verdict; score: number }) {
  const colors: Record<Verdict, string> = {
    green: "bg-emerald-500",
    orange: "bg-amber-500",
    red: "bg-red-500",
  };

  const width = Math.min(100, Math.max(0, Math.round((score / 5) * 100)));

  return (
    <div className="w-full">
      <div className="text-sm mb-1">
        Risk score: <span className="font-semibold">{score}</span> · Verdict:{" "}
        <span className={`font-semibold capitalize ${verdict === "green" ? "text-emerald-600" : verdict === "orange" ? "text-amber-600" : "text-red-600"}`}>
          {verdict}
        </span>
      </div>
      <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
        <div className={`h-2 ${colors[verdict]} transition-all`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
