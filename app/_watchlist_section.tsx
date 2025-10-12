"use client";
import React, { useEffect, useState } from "react";

type Item = {
  id: string;
  type: "wallet" | "project";
  target: string;
  threshold: "green" | "orange" | "red";
  webhook?: string | null;
  createdAt: string;
};
type WatchlistListResponse = {
  status: "ok";
  supabase: boolean;
  items: Item[];
};
type WatchlistMutationResponse =
  | { status: "ok"; item: Item }
  | { status: "error"; message?: string };
type WatchlistDeleteResponse = { status: "ok" };
type WatchlistCheckResponse = { status: "ok"; items?: unknown[] };

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed with ${response.status}`);
  }
  return (await response.json()) as T;
}

export default function WatchlistSection() {
  const [items, setItems] = useState<Item[]>([]);
  const [type, setType] = useState<"wallet" | "project">("wallet");
  const [target, setTarget] = useState("");
  const [threshold, setThreshold] = useState<"green" | "orange" | "red">("orange");
  const [webhook, setWebhook] = useState("");
  const [supabase, setSupabase] = useState<boolean | null>(null);

  const load = async () => {
    try {
      const data = await requestJson<WatchlistListResponse>("/api/watchlist");
      setItems(data.items || []);
      setSupabase(!!data.supabase);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    try {
      const payload = await requestJson<WatchlistMutationResponse>("/api/watchlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type, target, threshold, webhook: webhook.trim() || null }),
      });
      if (payload.status === "ok") {
        setTarget("");
        setWebhook("");
        load();
      } else {
        alert(payload.message || "Failed");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add watch item");
    }
  };
  const remove = async (id: string) => {
    try {
      const data = await requestJson<WatchlistDeleteResponse>(
        `/api/watchlist?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (data.status === "ok") load();
    } catch (error) {
      console.error(error);
    }
  };
  const runCheck = async () => {
    try {
      const data = await requestJson<WatchlistCheckResponse>("/api/watchlist/check");
      const count = Array.isArray(data.items) ? data.items.length : 0;
      alert(`Checked ${count} items`);
    } catch (error) {
      console.error(error);
      alert("Failed to run checks");
    }
  };

  return (
    <section className="mt-10 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Watchlist & Alerts</h2>
          <div className="text-xs text-gray-500">
            Storage: {supabase === null ? "…" : supabase ? "Supabase (persistent)" : "In-memory (resets on cold start)"}
          </div>
        </div>
        <button
          onClick={runCheck}
          className="text-xs px-3 py-1 rounded bg-gray-800 hover:bg-gray-700"
        >
          Run check now
        </button>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
        <select
          className="border rounded bg-gray-900 px-2 py-2"
          value={type}
          onChange={(e) => setType(e.target.value as "wallet" | "project")}
        >
          <option value="wallet">Wallet</option>
          <option value="project">Project</option>
        </select>
        <input
          className="border rounded bg-gray-900 px-3 py-2 md:col-span-2"
          placeholder={type === "wallet" ? "rXXXXXXXXXXXXXXXXXXXX" : "example.com"}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
        />
        <select
          className="border rounded bg-gray-900 px-2 py-2"
          value={threshold}
          onChange={(e) =>
            setThreshold(e.target.value as "green" | "orange" | "red")
          }
        >
          <option value="green">green</option>
          <option value="orange">orange</option>
          <option value="red">red</option>
        </select>
        <button
          onClick={add}
          disabled={!target.trim()}
          className="rounded bg-cyan-500 text-black font-semibold px-3 py-2 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="mt-2">
        <input
          className="w-full border rounded bg-gray-900 px-3 py-2 text-xs"
          placeholder="Optional webhook (POST) — Slack/Discord/Telegram/RequestBin URL"
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
        />
      </div>

      <div className="mt-4">
        {items.length === 0 ? (
          <div className="text-sm text-gray-500">No items yet.</div>
        ) : (
          <ul className="divide-y divide-gray-800">
            {items.map((it) => (
              <li key={it.id} className="py-2 flex items-center justify-between">
                <div className="text-sm">
                  <b className="mr-2 uppercase">{it.type[0]}</b>
                  <span className="text-gray-200">{it.target}</span>
                  <span className="text-xs ml-2 px-2 py-0.5 rounded bg-gray-800">≥ {it.threshold}</span>
                  {it.webhook && <span className="text-xs ml-2 text-gray-500">🔔 webhook</span>}
                </div>
                <button
                  onClick={() => remove(it.id)}
                  className="text-xs px-2 py-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-200"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
