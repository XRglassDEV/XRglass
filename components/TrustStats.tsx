// components/TrustStats.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

type Props = { query: string; kind: "wallet" | "project" };

const KEY = "xtrust_local_counts";

export default function TrustStats({ query, kind }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
      const k = `${kind}:${query}`;
      map[k] = (map[k] ?? 0) + 1;
      localStorage.setItem(KEY, JSON.stringify(map));
      setCount(map[k]);
    } catch {}
  }, [query, kind]);

  const label = useMemo(
    () => (kind === "wallet" ? "wallet" : "project"),
    [kind]
  );

  return (
    <div className="mt-3 text-[11px] text-slate-400">
      Community usage: This {label} has been checked <b className="text-slate-200">{count}</b> time{count === 1 ? "" : "s"} on this device.
    </div>
  );
}
