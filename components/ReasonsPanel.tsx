// components/ReasonsPanel.tsx
"use client";

import TrustBadge from "./TrustBadge";
import { Reason } from "@/lib/score";

export default function ReasonsPanel({ reasons }: { reasons: Reason[] }) {
  return (
    <div className="space-y-2">
      {reasons.map((r) => (
        <div key={r.code} className="flex items-start gap-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3">
          <TrustBadge
            label={r.code}
            tone={
              r.weight > 0 ? "good" : r.weight < 0 ? "bad" : "info"
            }
          />
          <div className="text-sm leading-relaxed">
            <div className="font-medium">{r.label}</div>
            {r.detail && <div className="text-neutral-600 dark:text-neutral-400">{r.detail}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
