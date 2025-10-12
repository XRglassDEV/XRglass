"use client";
import { useEffect, useRef, useState } from "react";

type StatusPayload = {
  ok?: boolean;
  error?: string;
  node?: string;
  latency?: number;
  ledger?: number;
};

export default function StatusBadge() {
  const [s, setS] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/xrpl-status", { cache: "no-store" });
      const j = (await r.json()) as StatusPayload;
      setS(j);
    } catch {
      setS({ ok: false, error: "fetch_failed" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    timer.current = window.setInterval(load, 30000);
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, []);

  const ok = !!s?.ok;
  const cls = ok
    ? "bg-emerald-900/40 text-emerald-300"
    : "bg-red-900/40 text-red-300";

  return (
    <div className="mt-4 flex items-center gap-2 text-xs">
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded ${cls}`}>
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            ok ? "bg-emerald-400" : "bg-red-400"
          }`}
        />
        XRPL node
      </span>
      <span className="px-2 py-1 rounded bg-slate-800/60">{s?.node ?? "—"}</span>
      <span className="px-2 py-1 rounded bg-slate-800/60">
        {typeof s?.latency === "number" ? `${s.latency} ms` : "—"}
      </span>
      {typeof s?.ledger === "number" && (
        <span className="px-2 py-1 rounded bg-slate-800/60">L: {s.ledger}</span>
      )}
      <button
        onClick={load}
        disabled={loading}
        className="px-2 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-white disabled:opacity-60"
      >
        {loading ? "…" : "Refresh"}
      </button>
    </div>
  );
}
