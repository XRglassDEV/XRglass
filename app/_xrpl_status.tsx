"use client";
import React, { useEffect, useState } from "react";

type Row = { url:string; ok:boolean; ms:number; error?:string };
type Resp = { status:"ok"; best: Row|null; tests: Row[] };

export default function XrplStatus(){
  const [data, setData] = useState<Resp|null>(null);
  const [loading, setLoading] = useState(true);

  async function load(){
    setLoading(true);
    try {
      const r = await fetch("/api/status/xrpl");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = (await r.json()) as Resp;
      setData(j);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(()=>{ load(); const id=setInterval(load, 60_000); return ()=>clearInterval(id); },[]);

  const best = data?.best;
  const host = best?.url ? new URL(best.url).hostname.replace(/^www\./,"") : "…";
  const cls = best?.ok ? "bg-emerald-600" : "bg-red-600";
  const btnLabel = loading ? "Refreshing…" : "Refresh";

  return (
    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
      <span className={`inline-flex items-center px-2 py-1 rounded ${cls} text-white`}>
        XRPL node
      </span>
      <span className="px-2 py-1 rounded bg-gray-800 border border-gray-700">{host}</span>
      <span className="px-2 py-1 rounded bg-gray-800 border border-gray-700">{best?.ms ?? "…" } ms</span>
      <button onClick={load} disabled={loading} className="ml-2 px-2 py-1 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed">{btnLabel}</button>
    </div>
  );
}
