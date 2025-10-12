"use client";
import { useEffect, useState } from "react";
import { readScans } from "@/lib/analytics/clientLog";

export default function AnalyticsBar() {
  const [data, setData] = useState(() => readScans());

  useEffect(() => {
    const on = () => setData(readScans());
    window.addEventListener("storage", on);
    const onFocus = () => setData(readScans());
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", on);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const total = data.length;
  const success = data.filter((d) => d.ok).length;
  const successPct = total ? Math.round((success / total) * 100) : 0;

  const last10 = data.slice(0, 10).filter((d) => typeof d.latency === "number");
  const avgLatency =
    last10.length
      ? Math.round(
          last10.reduce((a, b) => a + (b.latency as number), 0) /
            last10.length
        )
      : null;

  const lastNode = data[0]?.node ?? "—";

  return (
    <div className="mt-3 text-xs text-slate-300 flex flex-wrap gap-2">
      <span className="px-2 py-1 rounded bg-slate-800/60">Checks: {total}</span>
      <span className="px-2 py-1 rounded bg-slate-800/60">
        Success: {successPct}%
      </span>
      <span className="px-2 py-1 rounded bg-slate-800/60">
        Avg latency (10): {avgLatency ?? "—"} {avgLatency ? "ms" : ""}
      </span>
      <span className="px-2 py-1 rounded bg-slate-800/60">
        Last node: {lastNode}
      </span>
    </div>
  );
}
