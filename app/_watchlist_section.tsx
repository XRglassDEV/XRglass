"use client";
import React, { useEffect, useState } from "react";

type Verdict = "green"|"orange"|"red";
type Item = { id:string; type:"wallet"|"project"; target:string; threshold:Verdict; webhook?:string|null; createdAt:string };
type CheckRow = { id:string; type:"wallet"|"project"; target:string; verdict?:Verdict; notified?:boolean; error?:string; webhookError?:string };

const J = (u:string, init?:RequestInit)=> fetch(u, init).then(r=>r.json());
const badge = (v?:string)=> v==="red"?"bg-red-600":v==="orange"?"bg-orange-500":"bg-green-600";

export default function WatchlistSection(){
  const [items, setItems] = useState<Item[]>([]);
  const [results, setResults] = useState<CheckRow[]>([]);
  const [type, setType] = useState<"wallet"|"project">("wallet");
  const [target, setTarget] = useState("");
  const [threshold, setThreshold] = useState<Verdict>("orange");
  const [webhook, setWebhook] = useState("");
  const [loading, setLoading] = useState(false);
  const [supabase, setSupabase] = useState<boolean | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const load = async ()=>{
    const j = await J("/api/watchlist");
    setItems(j.items||[]);
    setSupabase(!!j.supabase);
  };

  const runCheck = async ()=>{
    setLoading(true);
    try{
      const j = await J("/api/watchlist/check");
      setResults(j.items||[]);
      setLastRun(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); },[]);
  useEffect(()=>{ const id=setInterval(()=>runCheck().catch(()=>{}), 10*60*1000); return ()=>clearInterval(id); },[]);

  const add = async ()=>{
    const j = await J("/api/watchlist",{
      method:"POST",
      headers:{ "content-type":"application/json" },
      body: JSON.stringify({ type, target, threshold, webhook: webhook.trim() || null })
    });
    if(j.status==="ok"){ setTarget(""); setWebhook(""); await load(); await runCheck(); }
    else alert(j.message||"Failed");
  };

  const remove = async (id:string)=>{
    const j = await J(`/api/watchlist?id=${encodeURIComponent(id)}`,{ method:"DELETE" });
    if(j.status==="ok"){ await load(); await runCheck(); }
  };

  const hasItems = items.length>0;

  return (
    <section className="mt-10 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Watchlist & Alerts</h2>
          <div className="text-xs text-gray-500">
            Storage: {supabase===null?"…":supabase?"Supabase (persistent)":"In-memory (resets on cold start)"}{lastRun?` • Last check: ${lastRun}`:""}
          </div>
        </div>
        <button onClick={runCheck} disabled={loading} className="text-xs px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-50">
          {loading ? "Checking…" : "Run check now"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
        <select className="border rounded bg-gray-900 px-2 py-2" value={type} onChange={e=>setType(e.target.value as any)}>
          <option value="wallet">Wallet</option>
          <option value="project">Project</option>
        </select>
        <input className="border rounded bg-gray-900 px-3 py-2 md:col-span-2" placeholder={type==="wallet"?"rXXXXXXXXXXXXXXXXXXXX":"example.com"} value={target} onChange={e=>setTarget(e.target.value)} />
        <select className="border rounded bg-gray-900 px-2 py-2" value={threshold} onChange={e=>setThreshold(e.target.value as Verdict)}>
          <option value="green">green</option>
          <option value="orange">orange</option>
          <option value="red">red</option>
        </select>
        <button onClick={add} disabled={!target.trim()} className="rounded bg-cyan-500 text-black font-semibold px-3 py-2 disabled:opacity-50">Add</button>
      </div>

      <div className="mt-2">
        <input className="w-full border rounded bg-gray-900 px-3 py-2 text-xs" placeholder="Optional webhook (POST) — Slack/Discord/Telegram/RequestBin URL" value={webhook} onChange={e=>setWebhook(e.target.value)} />
      </div>

      <div className="mt-4">
        {!hasItems ? (
          <div className="text-sm text-gray-500">No items yet.</div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {items.map(it=>(
              <li key={it.id} className="py-2 flex items-center justify-between">
                <div className="text-sm">
                  <b className="mr-2 uppercase">{it.type[0]}</b>
                  <span className="text-gray-200">{it.target}</span>
                  <span className="text-xs ml-2 px-2 py-0.5 rounded bg-gray-800">≥ {it.threshold}</span>
                  {it.webhook && <span className="text-xs ml-2 text-gray-500">🔔 webhook</span>}
                </div>
                <button onClick={()=>remove(it.id)} className="text-xs px-2 py-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-200">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {results.length>0 && (
        <div className="mt-6">
          <div className="text-sm font-semibold mb-2">Latest results</div>
          <ul className="space-y-2">
            {results.map(r=>(
              <li key={r.id} className="p-3 rounded border border-gray-800 bg-gray-900 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm truncate">
                    <b className="uppercase">{r.type?.[0] || "?"}</b>
                    <span className="ml-2">{r.target}</span>
                  </div>
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
