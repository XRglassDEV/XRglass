"use client";

import { useEffect, useMemo, useState } from "react";

type Item = { id: string; type: "wallet" | "domain"; label: string; addedAt: number };
const STORAGE_KEY = "xrglass.watchlist.v1";

export default function Watchlist() {
  const [items, setItems] = useState<Item[]>([]);
  const [type, setType] = useState<"wallet" | "domain">("wallet");
  const [label, setLabel] = useState("");

  useEffect(() => {
    try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) setItems(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = `${type}:${trimmed.toLowerCase()}`;
    if (items.some(i => i.id === id)) return;
    setItems(prev => [{ id, type, label: trimmed, addedAt: Date.now() }, ...prev]);
    setLabel("");
  };
  const remove = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const stats = useMemo(() => ({
    total: items.length,
    wallets: items.filter(i => i.type === "wallet").length,
    domains: items.filter(i => i.type === "domain").length,
  }), [items]);

  const notify = async (it: Item) => {
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "watchlist.added", item: it }),
      });
      if (!res.ok) console.warn("Webhook failed", await res.text());
    } catch (e) {
      console.warn("Webhook error", e);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-xl font-semibold">Watchlist</h2>
      <p className="text-neutral-400 mt-2">Track wallets & domains. Stored locally in your browser.</p>

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <select className="rounded-xl bg-neutral-800 px-3 py-2" value={type} onChange={e => setType(e.target.value as any)}>
          <option value="wallet">Wallet</option>
          <option value="domain">Domain</option>
        </select>
        <input
          className="rounded-xl bg-neutral-800 px-3 py-2 flex-1"
          placeholder={type === "wallet" ? "rEb8TK3g... (XRP address)" : "example.com"}
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        <button className="btn" onClick={add}>Add</button>
      </div>

      <div className="mt-4 text-sm text-neutral-400">
        Total: {stats.total} • Wallets: {stats.wallets} • Domains: {stats.domains}
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li key={it.id} className="flex items-center justify-between rounded-xl bg-neutral-900/70 px-4 py-2">
            <div className="truncate">
              <span className="text-xs uppercase text-neutral-400 mr-2">{it.type}</span>
              <span className="font-medium">{it.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-lg bg-neutral-800 px-3 py-1 text-sm" onClick={() => notify(it)} title="Send webhook">Notify</button>
              <button className="rounded-lg bg-neutral-800 px-3 py-1 text-sm" onClick={() => remove(it.id)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
