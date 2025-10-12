"use client";
import { useEffect, useState } from "react";
import { logScan } from "@/lib/analytics/clientLog";

type Verdict = "green" | "orange" | "red";
type WLItem = {
  id: string;
  type: "Wallet" | "Project";
  target: string;
  threshold: Verdict;
  webhook?: string;
  lastVerdict?: Verdict;
  lastCheckedAt?: string;
};

const STORAGE_KEY = "xrglass.watchlist.v2";
const load = (): WLItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const save = (items: WLItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {}
};
const priority = (v: Verdict) => (v === "green" ? 1 : v === "orange" ? 2 : 3);

export default function WatchlistSection() {
  const [items, setItems] = useState<WLItem[]>([]);
  const [type, setType] = useState<WLItem["type"]>("Wallet");
  const [target, setTarget] = useState("");
  const [threshold, setThreshold] = useState<Verdict>("orange");
  const [webhook, setWebhook] = useState("");

  useEffect(() => {
    setItems(load());
  }, []);
  useEffect(() => {
    save(items);
  }, [items]);

  function addItem() {
    if (!target.trim()) return;
    const it: WLItem = {
      id: crypto.randomUUID(),
      type,
      target: target.trim(),
      threshold,
      webhook: webhook.trim() || undefined,
    };
    setItems([it, ...items]);
    setTarget("");
  }

  function remove(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }

  async function runCheck(it: WLItem) {
    const target = it.target;
    try {
      const r = await fetch(`/api/project-check?address=${encodeURIComponent(target)}`, {
        cache: "no-store",
      });
      if (!r.ok) {
        logScan({ ts: Date.now(), target, ok: false });
        return;
      }
      const j = await r.json().catch(() => null);
      if (!j || j.status !== "ok") {
        logScan({ ts: Date.now(), target, ok: false });
        return;
      }

      logScan({
        ts: Date.now(),
        target,
        ok: true,
        verdict: j.verdict as Verdict,
        node: j.node,
        latency: j.latency,
      });

      const updated: WLItem = {
        ...it,
        lastVerdict: j.verdict as Verdict,
        lastCheckedAt: new Date().toISOString(),
      };
      setItems((prev) => prev.map((p) => (p.id === it.id ? updated : p)));

      const shouldNotify = priority(j.verdict as Verdict) >= priority(it.threshold);
      if (shouldNotify && it.webhook) {
        fetch(it.webhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "XRglass",
            type: it.type,
            target: it.target,
            verdict: j.verdict,
            node: j.node,
            latency: j.latency,
            checkedAt: updated.lastCheckedAt,
          }),
          keepalive: true,
        }).catch(() => {});
      }
    } catch {
      logScan({ ts: Date.now(), target, ok: false });
    }
  }

  return (
    <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Watchlist & Alerts</h3>
        <span className="text-xs text-slate-400">
          Storage: <strong>localStorage</strong>
        </span>
      </div>
      <div className="flex flex-col gap-2 md:flex-row">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as WLItem["type"])}
          className="rounded-lg bg-slate-800 px-3 py-2 text-slate-200"
        >
          <option>Wallet</option>
          <option>Project</option>
        </select>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder={type === "Wallet" ? "rXXXX..." : "example.com"}
          className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-slate-200"
        />
        <select
          value={threshold}
          onChange={(e) => setThreshold(e.target.value as Verdict)}
          className="rounded-lg bg-slate-800 px-3 py-2 text-slate-200"
        >
          <option value="green">green</option>
          <option value="orange">orange</option>
          <option value="red">red</option>
        </select>
        <button className="rounded-lg bg-cyan-700 px-4 py-2 font-medium text-white hover:bg-cyan-600" onClick={addItem}>
          Add
        </button>
      </div>
      <input
        value={webhook}
        onChange={(e) => setWebhook(e.target.value)}
        placeholder="Optional webhook URL"
        className="mt-2 w-full rounded-lg bg-slate-800 px-3 py-2 text-slate-300"
      />
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="py-2 pr-4 text-left">Type</th>
              <th className="py-2 pr-4 text-left">Target</th>
              <th className="py-2 pr-4 text-left">Threshold</th>
              <th className="py-2 pr-4 text-left">Last verdict</th>
              <th className="py-2 pr-4 text-left">Checked</th>
              <th className="py-2 pr-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t border-slate-800">
                <td className="py-2 pr-4">{it.type}</td>
                <td className="py-2 pr-4 font-mono text-slate-200">{it.target}</td>
                <td className="py-2 pr-4">{it.threshold}</td>
                <td className="py-2 pr-4">
                  {it.lastVerdict ? (
                    <span
                      className={`rounded px-2 py-1 text-xs ${
                        it.lastVerdict === "green"
                          ? "bg-emerald-900/40 text-emerald-300"
                          : it.lastVerdict === "orange"
                          ? "bg-amber-900/40 text-amber-300"
                          : "bg-red-900/40 text-red-300"
                      }`}
                    >
                      {it.lastVerdict}
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-slate-400">
                  {it.lastCheckedAt ? new Date(it.lastCheckedAt).toLocaleString() : "—"}
                </td>
                <td className="flex gap-2 py-2 pr-4">
                  <button
                    onClick={() => runCheck(it)}
                    className="rounded bg-slate-800 px-3 py-1 hover:bg-slate-700"
                  >
                    Run check now
                  </button>
                  <button
                    onClick={() => remove(it.id)}
                    className="rounded bg-red-900/60 px-3 py-1 hover:bg-red-800/70"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  No watch items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
