"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { NodeProbeResult, XrplStatusPayload } from "@/lib/xrpl/connect";

const REFRESH_INTERVAL = 60_000;

type StatusView = {
  loading: boolean;
  error: string | null;
  payload: XrplStatusPayload | null;
};

function formatLatency(result: NodeProbeResult): string {
  if (typeof result.latencyMs !== "number") return "—";
  if (result.latencyMs < 1) return "<1 ms";
  return `${Math.round(result.latencyMs)} ms`;
}

function formatLedger(result: NodeProbeResult): string {
  if (!result.ok) return "—";
  if (typeof result.validatedLedger !== "number") return "—";
  return result.validatedLedger.toLocaleString();
}

function formatState(result: NodeProbeResult): string {
  if (!result.ok) return "Issue";
  return result.serverState ? result.serverState : "Online";
}

function formatVersion(result: NodeProbeResult): string {
  if (!result.ok) return "—";
  return result.buildVersion ?? "—";
}

function trimError(result: NodeProbeResult): string | null {
  if (result.ok) return null;
  const error = result.error.trim();
  return error.length > 72 ? `${error.slice(0, 69)}…` : error;
}

export default function WatchlistSection() {
  const [view, setView] = useState<StatusView>({ loading: true, error: null, payload: null });
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = useCallback(async () => {
    let hadPayload = false;
    setView((prev) => {
      hadPayload = Boolean(prev.payload);
      if (!hadPayload) {
        return { ...prev, loading: true };
      }
      return prev;
    });
    setRefreshing(hadPayload);

    try {
      const res = await fetch("/api/xrpl-status", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      const data = (await res.json()) as XrplStatusPayload;
      setView({ loading: false, error: null, payload: data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to refresh status";
      setView((prev) => ({ loading: false, error: message, payload: prev.payload }));
    } finally {
      if (hadPayload) {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const interval = setInterval(() => {
      void fetchStatus();
    }, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const nodes = view.payload?.nodes ?? [];

  const updatedAt = useMemo(() => {
    if (!view.payload) return null;
    return new Date(view.payload.generatedAt);
  }, [view.payload]);

  return (
    <section className="mt-8 rounded-3xl border border-slate-800/60 bg-slate-900/60 p-6 shadow-lg">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">XRPL Node Watchlist</h2>
          <p className="text-sm text-slate-400">
            Live overview of tracked public nodes powering wallet & project checks.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          {updatedAt && (
            <span>
              Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
          <button
            type="button"
            onClick={() => void fetchStatus()}
            disabled={refreshing}
            className="rounded-lg border border-slate-700 px-3 py-1 font-medium text-slate-200 transition hover:border-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {view.error && (
        <div className="mt-4 rounded-lg border border-rose-500/50 bg-rose-950/60 px-3 py-2 text-xs text-rose-100">
          {view.error}
        </div>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full table-auto text-left text-sm text-slate-200">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr className="border-b border-slate-800/80">
              <th className="px-3 py-2 font-medium">Node</th>
              <th className="px-3 py-2 font-medium">Location</th>
              <th className="px-3 py-2 font-medium">Latency</th>
              <th className="px-3 py-2 font-medium">Ledger</th>
              <th className="px-3 py-2 font-medium">State</th>
              <th className="px-3 py-2 font-medium">Version</th>
              <th className="px-3 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody>
            {nodes.length === 0 && !view.loading && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-slate-400">
                  No nodes available.
                </td>
              </tr>
            )}
            {view.loading && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-slate-400">
                  Loading XRPL watchlist…
                </td>
              </tr>
            )}
            {nodes.map((node) => {
              const error = trimError(node);
              return (
                <tr key={node.node.url} className="border-b border-slate-800/60 last:border-none">
                  <td className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{node.node.name}</span>
                      <span className="text-xs text-slate-400">{node.node.operator ?? node.node.url}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{node.node.location ?? "—"}</td>
                  <td className="px-3 py-3">
                    <span className={node.ok ? "text-emerald-300" : "text-rose-300"}>{formatLatency(node)}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{formatLedger(node)}</td>
                  <td className="px-3 py-3">
                    <span className={node.ok ? "text-emerald-300" : "text-amber-300"}>{formatState(node)}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{formatVersion(node)}</td>
                  <td className="px-3 py-3 text-slate-400">
                    {error ? error : node.node.notes ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
