"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { NodeProbeResult, XrplStatusPayload } from "@/lib/xrpl/connect";

type BadgeTone = "info" | "success" | "warning" | "error";

const STYLES: Record<BadgeTone, { wrapper: string; dot: string; text: string }> = {
  info: {
    wrapper: "border border-slate-700/60 bg-slate-900/70",
    dot: "bg-slate-400",
    text: "text-slate-200",
  },
  success: {
    wrapper: "border border-emerald-600/40 bg-emerald-500/10",
    dot: "bg-emerald-400",
    text: "text-emerald-200",
  },
  warning: {
    wrapper: "border border-amber-500/40 bg-amber-500/10",
    dot: "bg-amber-400",
    text: "text-amber-100",
  },
  error: {
    wrapper: "border border-rose-500/50 bg-rose-500/10",
    dot: "bg-rose-400",
    text: "text-rose-100",
  },
};

type StatusState = {
  loading: boolean;
  error: string | null;
  payload: XrplStatusPayload | null;
};

function summarise(result: NodeProbeResult[]): string {
  const online = result.filter((entry) => entry.ok).length;
  const offline = result.length - online;
  if (result.length === 0) return "No nodes checked";
  if (offline === 0) return `${online}/${result.length} nodes healthy`;
  if (online === 0) return "All tracked nodes offline";
  return `${online}/${result.length} responding`;
}

export default function StatusBadge() {
  const [state, setState] = useState<StatusState>({
    loading: true,
    error: null,
    payload: null,
  });
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const refreshInterval = 60_000;

    async function loadStatus() {
      if (!hasLoadedRef.current) {
        setState((prev) => ({ ...prev, loading: true }));
      }

      try {
        const res = await fetch("/api/xrpl-status", {
          cache: "no-store",
        });
        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`);
        }
        const data = (await res.json()) as XrplStatusPayload;
        if (!cancelled) {
          hasLoadedRef.current = true;
          setState({ loading: false, error: null, payload: data });
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to fetch XRPL status";
          setState((prev) => ({
            loading: false,
            error: message,
            payload: prev.payload,
          }));
        }
      }
    }

    void loadStatus();
    const timer = setInterval(() => {
      void loadStatus();
    }, refreshInterval);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const tone = useMemo<BadgeTone>(() => {
    if (state.error) return "error";
    if (state.loading && !state.payload) return "info";
    const payload = state.payload;
    if (!payload) return "info";
    if (payload.online === 0) return "error";
    if (payload.online < payload.total) return "warning";
    return "success";
  }, [state]);

  const label = useMemo(() => {
    if (state.error) return "XRPL status: unreachable";
    if (state.loading && !state.payload) return "XRPL status: checking";
    if (!state.payload) return "XRPL status: pending";
    return `XRPL status: ${state.payload.online > 0 ? "online" : "offline"}`;
  }, [state]);

  const detail = useMemo(() => {
    if (state.error) return state.error;
    if (!state.payload) return "";
    return summarise(state.payload.nodes);
  }, [state]);

  const timestamp = useMemo(() => {
    if (!state.payload) return null;
    try {
      return new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(state.payload.generatedAt));
    } catch {
      return null;
    }
  }, [state.payload]);

  const style = STYLES[tone];

  return (
    <div
      className={`inline-flex min-w-[14rem] flex-col gap-1 rounded-2xl px-4 py-2 text-xs shadow-sm ${style.wrapper}`}
      role="status"
      aria-live="polite"
    >
      <span className={`flex items-center gap-2 font-semibold ${style.text}`}>
        <span className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
        {label}
      </span>
      {detail && <span className={`text-[11px] ${style.text} opacity-80`}>{detail}</span>}
      {timestamp && (
        <span className={`text-[11px] ${style.text} opacity-60`}>Updated {timestamp}</span>
      )}
    </div>
  );
}
