"use client";
import React, { useCallback, useEffect, useState } from "react";

type Verdict = "green"|"orange"|"red";
type Item = { id:string; type:"wallet"|"project"; target:string; threshold:Verdict; webhook?:string|null; createdAt:string };
type Row = { id:string; type:"wallet"|"project"; target:string; verdict?:Verdict; notified?:boolean; error?:string; webhookError?:string };

async function request<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}
const badge = (v?:string)=> v==="red"?"bg-red-600":v==="orange"?"bg-orange-500":"bg-emerald-600";

export default function WatchlistV2(){
  const [items, setItems] = useState<Item[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [type, setType] = useState<"wallet"|"project">("wallet");
  const [target, setTarget] = useState("");
  const [threshold, setThreshold] = useState<Verdict>("orange");
  const [webhook, setWebhook] = useState("");
  const [supabase, setSupabase] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  type ListResponse = { status: "ok"; supabase: boolean; items: Item[] };
  type CheckResponse = { status: "ok"; items: Row[] };

  const load = useCallback(async ()=>{
    try {
      const j = await request<ListResponse>("/api/watchlist");
      setItems(j.items || []);
      setSupabase(Boolean(j.supabase));
    } catch {
      setItems([]);
      setSupabase(null);
    }
  },[]);
  const run = useCallback(async ()=>{
    setLoading(true);
    try{
      const j = await request<CheckResponse>("/api/watchlist/check");
      setRows(j.items || []);
    } catch {
      setRows([]);
    } finally { setLoading(false); }
  },[]);
  useEffect(()=>{ load().catch(()=>{}); },[load]);
  useEffect(()=>{
    run().catch(()=>{});
    const id=setInterval(()=>run().catch(()=>{}), 10*60*1000);
    return ()=>clearInterval(id);
  },[run]);

  const add = async ()=>{
    try {
      const j = await request<{ status: "ok" }>("/api/watchlist",{
        method:"POST",
        headers:{ "content-type":"application/json" },
        body: JSON.stringify({ type, target, threshold, webhook: webhook.trim() || null })
      });
      if(j.status==="ok"){ setTarget(""); setWebhook(""); await load(); await run(); }
    } catch {}
  };
  const remove = async (id:string)=>{
    try {
      const j = await request<{ status: "ok" }>(`/api/watchlist?id=${encodeURIComponent(id)}`,{ method:"DELETE" });
      if(j.status==="ok"){ await load(); await run(); }
    } catch {}
  };

  return (
    <section className="mt-10 rounded-2xl border border-gray-800 bg-gray-950/60 backdrop-blur p-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Watchlist & Alerts</h2>
          <div className="text-xs text-gray-500">
            Storage: {supabase===null?"…":supabase?"Supabase (persistent)":"In-memory (resets on cold start)"}
          </div>
        </div>
        <button onClick={run} disabled={loading} className="btn btn-secondary">{loading?"Checking…":"Run check now"}</button>
      </div>

      {/* Add form */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2">
        <select className="border rounded bg-gray-900 px-2 py-2" value={type} onChange={e=>setType(e.target.value as "wallet"|"project")}>
          <option value="wallet">Wallet</option>
          <option value="project">Project</option>
        </select>
        <input className="border rounded bg-gray-900 px-3 py-2 md:col-span-2" placeholder={type==="wallet"?"rXXXXXXXXXXXXXXXXXXXX":"example.com"} value={target} onChange={e=>setTarget(e.target.value)} />
        <select className="border rounded bg-gray-900 px-2 py-2" value={threshold} onChange={e=>setThreshold(e.target.value as Verdict)}>
          <option value="green">green</option>
          <option value="orange">orange</option>
          <option value="red">red</option>
        </select>
        <button onClick={add} disabled={!target.trim()} className="btn btn-primary">Add</button>
      </div>
      <input className="w-full border rounded bg-gray-900 px-3 py-2 text-xs mt-2" placeholder="Optional webhook (POST) — Slack/Discord/Telegram/RequestBin URL" value={webhook} onChange={e=>setWebhook(e.target.value)} />

      {/* Items table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-gray-400">
            <tr>
              <th className="py-2 pr-3">Type</th>
              <th className="py-2 pr-3">Target</th>
              <th className="py-2 pr-3">Threshold</th>
              <th className="py-2 pr-3">Webhook</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {items.length===0 ? (
              <tr><td className="py-3 text-gray-500" colSpan={5}>No items yet.</td></tr>
            ) : items.map(it=>(
              <tr key={it.id}>
                <td className="py-2 pr-3">{it.type==="wallet"?"W":"P"}</td>
                <td className="py-2 pr-3">{it.target}</td>
                <td className="py-2 pr-3"><span className="chip">≥ {it.threshold}</span></td>
                <td className="py-2 pr-3">{it.webhook ? <span className="chip">🔔 yes</span> : <span className="text-gray-500">—</span>}</td>
                <td className="py-2 pr-3"><button onClick={()=>remove(it.id)} className="btn btn-danger">Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Latest results */}
      {rows.length>0 && (
        <div className="mt-6">
          <div className="text-sm font-semibold mb-2">Latest results</div>
          <ul className="space-y-2">
            {rows.map(r=>(
              <li key={r.id} className="p-3 rounded border border-gray-800 bg-gray-900 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm truncate"><b className="uppercase">{r.type?.[0] || "?"}</b> <span className="ml-2">{r.target}</span></div>
                  {r.error && <div className="text-xs text-red-300 mt-1">Error: {r.error}</div>}
                  {r.webhookError && <div className="text-xs text-orange-300 mt-1">Webhook error: {r.webhookError}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-white text-xs px-2 py-1 rounded ${badge(r.verdict)}`}>{(r.verdict||"green").toUpperCase()}</span>
                  {r.notified && <span className="text-xs text-gray-400">🔔 sent</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
