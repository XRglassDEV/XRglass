"use client";
import { useEffect, useMemo, useState } from "react";

type Type = "wallet" | "domain" | "project";
type VerdictLevel = "green" | "orange" | "red";
type Item = {
  id: string;
  type: Type;
  label: string;
  threshold: VerdictLevel;
  lastVerdict?: VerdictLevel;
  checkedAt?: string;
  webhook?: string;
};

const verdictOrder: Record<VerdictLevel, number> = { green: 0, orange: 1, red: 2 };

function isVerdict(value: unknown): value is VerdictLevel {
  return value === "green" || value === "orange" || value === "red";
}

const STORAGE_KEY = "xrglass.watchlist.v2";
const verdictBadge: Record<VerdictLevel, string> = {
  green: "bg-emerald-100 text-emerald-700",
  orange: "bg-amber-100 text-amber-700",
  red: "bg-rose-100 text-rose-700",
};

export default function Watchlist() {
  const [items, setItems] = useState<Item[]>([]);
  const [type, setType] = useState<Type>("project");
  const [label, setLabel] = useState("");
  const [threshold, setThreshold] = useState<VerdictLevel>("red");
  const [hook, setHook] = useState("");

  useEffect(() => { try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw) setItems(JSON.parse(raw)); }catch{} },[]);
  useEffect(() => { try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }catch{} },[items]);

  const stats = useMemo(()=>({
    total: items.length,
    wallets: items.filter(i=>i.type==="wallet").length,
    domains: items.filter(i=>i.type==="domain").length,
    projects: items.filter(i=>i.type==="project").length,
  }),[items]);

  function add(){
    const v = label.trim();
    if(!v) return;
    const id = `${type}:${v.toLowerCase()}`;
    if(items.some(i=>i.id===id)) return;
    setItems(prev=>[{ id, type, label:v, threshold, webhook: hook || undefined }, ...prev]);
    setLabel(""); setHook("");
  }
  function remove(id:string){ setItems(prev=>prev.filter(i=>i.id!==id)); }

  async function notify(it: Item) {
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          event: "watchlist.notify",
          item: it,
          webhook: it.webhook?.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (res.ok && data?.ok) {
        alert("Webhook sent ✅");
      } else {
        const cause = data?.error || `${res.status}`;
        alert(`Webhook failed ❌ (${cause})`);
      }
    } catch {
      alert("Webhook failed ❌");
    }
  }

  async function runCheck(it: Item) {
    const target = it.label.trim();
    if (!target) return;

    const endpoint =
      it.type === "wallet"
        ? `/api/check?address=${encodeURIComponent(target)}`
        : `/api/project?domain=${encodeURIComponent(target)}`;

    try {
      const res = await fetch(endpoint);
      const data = (await res.json().catch(() => null)) as { status?: string; verdict?: unknown } | null;
      if (!data || data.status !== "ok" || !isVerdict(data.verdict)) {
        alert("Unable to determine verdict right now ❌");
        return;
      }

      const verdict = data.verdict;
      const time = new Date().toLocaleString();
      setItems((prev) =>
        prev.map((x) => (x.id === it.id ? { ...x, lastVerdict: verdict, checkedAt: time } : x)),
      );

      if (it.webhook && verdictOrder[verdict] >= verdictOrder[it.threshold]) {
        fetch("/api/watchlist", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            event: "watchlist.autoNotify",
            item: { ...it, lastVerdict: verdict, checkedAt: time },
            webhook: it.webhook,
          }),
        }).catch(() => {});
      }
    } catch {
      alert("Unable to run check right now ❌");
    }
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Watchlist & Alerts</h2>
        <span className="text-sm text-slate-500">Storage: localStorage • Total {stats.total}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[140px_1fr_140px_100px]">
        <select className="rounded-xl border border-sky-100 bg-white px-3 py-2"
                value={type} onChange={e=>setType(e.target.value as any)}>
          <option value="project">Project</option>
          <option value="domain">Domain</option>
          <option value="wallet">Wallet</option>
        </select>

        <input className="rounded-xl border border-sky-100 bg-white px-3 py-2" placeholder={type==="wallet"?"rEb8TK3g...":"example.com"}
               value={label} onChange={e=>setLabel(e.target.value)} />

        <select className="rounded-xl border border-sky-100 bg-white px-3 py-2"
                value={threshold} onChange={e=>setThreshold(e.target.value as VerdictLevel)}>
          <option value="green">green</option>
          <option value="orange">orange</option>
          <option value="red">red</option>
        </select>

        <button className="btn" onClick={add}>Add</button>
      </div>

      <input className="mt-3 w-full rounded-xl border border-sky-100 bg-white px-3 py-2"
             placeholder="Optional webhook URL (overrides WEBHOOK_URL from env)"
             value={hook} onChange={e=>setHook(e.target.value)} />

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Type</th><th>Target</th><th>Threshold</th><th>Last verdict</th><th>Checked</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it)=>(
              <tr key={it.id} className="border-t border-sky-100">
                <td className="py-2">{it.type}</td>
                <td className="font-medium">{it.label}</td>
                <td>
                  <span className="badge">{it.threshold}</span>
                </td>
                <td>
                  {it.lastVerdict ? (
                    <span className={`badge ${verdictBadge[it.lastVerdict]}`}>{it.lastVerdict}</span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="text-slate-500">{it.checkedAt ?? "-"}</td>
                <td className="flex gap-2 py-2">
                  <button className="rounded-lg px-3 py-1 bg-slate-900/5 hover:bg-slate-900/10 border border-sky-100"
                          onClick={()=>runCheck(it)}>Run check now</button>
                  <button className="rounded-lg px-3 py-1 bg-slate-900/5 hover:bg-slate-900/10 border border-sky-100"
                          onClick={()=>notify(it)}>Notify</button>
                  <button className="rounded-lg px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700"
                          onClick={()=>remove(it.id)}>Remove</button>
                </td>
              </tr>
            ))}
            {items.length===0 && (
              <tr className="border-t border-sky-100"><td colSpan={6} className="py-6 text-center text-slate-500">No watch items yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
