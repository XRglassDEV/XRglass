"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "xrglass.watchlist.v2";

type WatchEntry = {
  id: string;
  address: string;
  label?: string;
  webhook?: string;
};

type Verdict = "green" | "orange" | "red";

type ProjectCheckOk = {
  status: "ok";
  verdict: Verdict;
  node?: string | null;
  latency?: number | null;
  account?: Record<string, unknown> | null;
  reason?: string;
};

type ProjectCheckError = {
  status: "error";
  message?: string;
  kind?: string;
};

type ProjectCheckResponse = ProjectCheckOk | ProjectCheckError;

type CheckResult = {
  loading?: boolean;
  fetchedAt?: number;
  data?: ProjectCheckResponse;
  error?: string;
  webhookSent?: boolean;
  webhookError?: string;
};

function parseProjectCheck(data: unknown): ProjectCheckResponse {
  if (typeof data === "object" && data !== null && "status" in data) {
    const base = data as {
      status?: unknown;
      verdict?: unknown;
      node?: unknown;
      latency?: unknown;
      account?: unknown;
      reason?: unknown;
      message?: unknown;
      kind?: unknown;
    };
    if (base.status === "ok") {
      return {
        status: "ok",
        verdict: base.verdict === "green" || base.verdict === "orange" || base.verdict === "red" ? base.verdict : "red",
        node: typeof base.node === "string" ? base.node : null,
        latency: typeof base.latency === "number" ? base.latency : null,
        account:
          typeof base.account === "object" && base.account !== null
            ? (base.account as Record<string, unknown>)
            : null,
        reason: typeof base.reason === "string" ? base.reason : undefined,
      };
    }
    if (base.status === "error") {
      return {
        status: "error",
        message: typeof base.message === "string" ? base.message : undefined,
        kind: typeof base.kind === "string" ? base.kind : undefined,
      };
    }
  }
  return { status: "error", message: "Invalid response" };
}

function normalizeAddress(value: string) {
  return value.trim();
}

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function WatchlistSection() {
  const [entries, setEntries] = useState<WatchEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [draftAddress, setDraftAddress] = useState("");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftWebhook, setDraftWebhook] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, CheckResult>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setEntries(parsed.filter((item) => item?.address));
        }
      }
    } catch (err) {
      console.warn("Failed to load watchlist", err);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err) {
      console.warn("Failed to persist watchlist", err);
    }
  }, [entries, hydrated]);

  const existingAddresses = useMemo(() => {
    const map = new Map<string, WatchEntry>();
    for (const entry of entries) {
      map.set(entry.address.toLowerCase(), entry);
    }
    return map;
  }, [entries]);

  function resetDraft() {
    setDraftAddress("");
    setDraftLabel("");
    setDraftWebhook("");
    setEditingId(null);
  }

  function startEdit(entry: WatchEntry) {
    setDraftAddress(entry.address);
    setDraftLabel(entry.label ?? "");
    setDraftWebhook(entry.webhook ?? "");
    setEditingId(entry.id);
  }

  function upsertEntry(e: FormEvent) {
    e.preventDefault();
    const normalized = normalizeAddress(draftAddress);
    if (!normalized) return;

    if (editingId) {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === editingId
            ? { ...entry, address: normalized, label: draftLabel || undefined, webhook: draftWebhook || undefined }
            : entry,
        ),
      );
    } else {
      const existing = existingAddresses.get(normalized.toLowerCase());
      if (existing) {
        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === existing.id
              ? {
                  ...entry,
                  address: normalized,
                  label: draftLabel || entry.label,
                  webhook: draftWebhook || entry.webhook,
                }
              : entry,
          ),
        );
      } else {
        setEntries((prev) => [
          ...prev,
          {
            id: createId(),
            address: normalized,
            label: draftLabel || undefined,
            webhook: draftWebhook || undefined,
          },
        ]);
      }
    }

    resetDraft();
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    setResults((prev) => {
      const clone = { ...prev };
      delete clone[id];
      return clone;
    });
  }

  async function runCheck(entry: WatchEntry) {
    setResults((prev) => ({
      ...prev,
      [entry.id]: { ...prev[entry.id], loading: true, error: undefined },
    }));

    try {
      const response = await fetch(`/api/project-check?address=${encodeURIComponent(entry.address)}`, {
        cache: "no-store",
      });
      const parsed = parseProjectCheck(await response.json());
      const errorMessage = !response.ok
        ? parsed.status === "error"
          ? parsed.message ?? "Request failed"
          : "Request failed"
        : parsed.status === "error"
        ? parsed.message ?? "Request failed"
        : undefined;
      const result: CheckResult = {
        loading: false,
        fetchedAt: Date.now(),
        data: parsed,
        error: errorMessage,
      };

      let webhookSent = false;
      let webhookError: string | undefined;
      if (entry.webhook && response.ok) {
        try {
          const webhookResp = await fetch(entry.webhook, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              address: entry.address,
              label: entry.label,
              result: parsed,
              fetchedAt: new Date().toISOString(),
            }),
          });
          webhookSent = webhookResp.ok;
          if (!webhookResp.ok) {
            webhookError = `Webhook responded with ${webhookResp.status}`;
          }
        } catch (error: unknown) {
          webhookError = error instanceof Error ? error.message : "Failed to call webhook";
        }
      }

      setResults((prev) => ({
        ...prev,
        [entry.id]: {
          ...result,
          webhookSent: webhookSent || undefined,
          webhookError,
        },
      }));
    } catch (error: unknown) {
      setResults((prev) => ({
        ...prev,
        [entry.id]: {
          loading: false,
          error: error instanceof Error ? error.message : "Request failed",
          fetchedAt: Date.now(),
        },
      }));
    }
  }

  const normalizedDraft = normalizeAddress(draftAddress);
  const isExisting = normalizedDraft ? existingAddresses.has(normalizedDraft.toLowerCase()) : false;

  return (
    <section className="mt-10 rounded-lg border border-slate-800/70 bg-slate-900/40 p-6 text-sm">
      <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Watchlist</h2>
          <p className="text-xs text-slate-400">
            Track XRPL addresses, rerun checks on demand, and optionally ping a webhook when results update.
          </p>
        </div>
      </header>

      <form onSubmit={upsertEntry} className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-slate-400">Address</span>
          <input
            required
            value={draftAddress}
            onChange={(e) => setDraftAddress(e.target.value)}
            placeholder="r..."
            className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-slate-400">Label</span>
          <input
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            placeholder="Optional"
            className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
          <span className="text-xs uppercase tracking-wide text-slate-400">Webhook URL</span>
          <input
            value={draftWebhook}
            onChange={(e) => setDraftWebhook(e.target.value)}
            placeholder="https://..."
            className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded bg-cyan-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyan-500"
          >
            {editingId ? "Save changes" : isExisting ? "Update" : "Add"}
          </button>
        </div>
      </form>

      {entries.length === 0 ? (
        <p className="text-center text-xs text-slate-500">No watchlist entries yet. Add an address above to begin.</p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => {
            const result = results[entry.id];
            const data = result?.data;
            const status = data?.status;
            const verdict = data?.status === "ok" ? data.verdict : undefined;
            const node = data?.status === "ok" ? data.node ?? undefined : undefined;
            const latency = data?.status === "ok" ? data.latency ?? undefined : undefined;
            const account = data?.status === "ok" ? data.account ?? null : null;
            const timestamp = result?.fetchedAt ? new Date(result.fetchedAt).toLocaleString() : null;

            return (
              <li
                key={entry.id}
                className="rounded-lg border border-slate-800/70 bg-slate-950/40 p-4"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm text-slate-100">{entry.address}</span>
                      {entry.label && <span className="rounded bg-slate-800/60 px-2 py-0.5 text-xs text-slate-300">{entry.label}</span>}
                    </div>
                    {entry.webhook && (
                      <p className="text-xs text-slate-500">Webhook: {entry.webhook}</p>
                    )}
                    {timestamp && (
                      <p className="text-xs text-slate-500">Last checked: {timestamp}</p>
                    )}
                    {node && (
                      <p className="text-xs text-slate-500">Node: {node}{latency ? ` • ${latency} ms` : ""}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => runCheck(entry)}
                      className="rounded bg-cyan-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-cyan-500 disabled:opacity-60"
                      disabled={result?.loading}
                    >
                      {result?.loading ? "Checking…" : "Run check now"}
                    </button>
                    <button
                      onClick={() => startEdit(entry)}
                      className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-500 hover:text-cyan-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeEntry(entry.id)}
                      className="rounded border border-rose-700 px-3 py-1.5 text-xs text-rose-200 transition hover:bg-rose-700/20"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {status === "error" && (
                  <div className="mt-3 rounded border border-rose-700/50 bg-rose-900/20 p-3 text-xs text-rose-200">
                    {result?.error || result?.data?.message || "Request failed"}
                  </div>
                )}

                {status === "ok" && (
                  <div className="mt-3 grid gap-2 text-xs text-slate-300 sm:grid-cols-2">
                    <div className="rounded border border-emerald-700/30 bg-emerald-900/20 p-3 text-emerald-100">
                      Verdict: <span className="font-semibold uppercase">{verdict ?? "—"}</span>
                    </div>
                    <pre className="whitespace-pre-wrap rounded border border-slate-800/70 bg-slate-900/60 p-3 text-[0.7rem] leading-relaxed text-slate-200">
                      {JSON.stringify(account, null, 2)}
                    </pre>
                  </div>
                )}

                {result?.webhookError && (
                  <p className="mt-2 text-xs text-amber-300">Webhook error: {result.webhookError}</p>
                )}
                {result?.webhookSent && !result.webhookError && (
                  <p className="mt-2 text-xs text-emerald-300">Webhook notified.</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
