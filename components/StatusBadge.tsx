"use client";
import { useEffect, useState } from "react";

type StatusResponse =
  | { ok: true; node: string | null; latency: number | null; ledger: number | null }
  | { ok: false; error: string };

function parseStatus(data: unknown): StatusResponse {
  if (typeof data === "object" && data !== null && "ok" in data) {
    const base = data as { ok?: unknown; node?: unknown; latency?: unknown; ledger?: unknown; error?: unknown };
    if (base.ok === true) {
      return {
        ok: true,
        node: typeof base.node === "string" ? base.node : null,
        latency: typeof base.latency === "number" ? base.latency : null,
        ledger: typeof base.ledger === "number" ? base.ledger : null,
      };
    }
    if (base.ok === false) {
      return { ok: false, error: typeof base.error === "string" ? base.error : "failed" };
    }
  }
  return { ok: false, error: "failed" };
}

export default function StatusBadge() {
  const [s, setS] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/xrpl-status", { cache: "no-store" });
      const j = await r.json();
      setS(parseStatus(j));
    } catch {
      setS({ ok: false, error: "failed" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);
  const cls = s?.ok ? "bg-emerald-900/40 text-emerald-300" : "bg-red-900/40 text-red-300";

  return (
    <div className="mt-4 flex items-center gap-2 text-xs">
      <span className={`px-2 py-1 rounded ${cls}`}>XRPL node</span>
      <span className="px-2 py-1 rounded bg-slate-800/60">{s && s.ok && s.node ? s.node : "—"}</span>
      <span className="px-2 py-1 rounded bg-slate-800/60">{s && s.ok && s.latency !== null ? `${s.latency} ms` : "—"}</span>
      {s && s.ok && s.ledger !== null && (
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
