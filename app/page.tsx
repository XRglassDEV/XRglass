// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import ResultCard from "@/components/ResultCard";
import LoadingScan from "@/components/LoadingScan";
import TrustStats from "@/components/TrustStats";
import type { ApiResult, Verdict } from "@/types/results";

/* Helpers */
function isWalletAddress(s: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{25,35}$/.test(s.trim());
}
function looksLikeDomain(s: string): boolean {
  const clean = s.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return !!clean && clean.includes(".") && !/\s/.test(clean);
}
function shorten(s: string, n = 14) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

/* Recent scans */
type RecentItem = { q: string; type: "wallet" | "project"; verdict?: Verdict | null; ts: number };
const RECENT_KEY = "xrpulse_recent_scans";

export default function Home() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"auto" | "wallet" | "project">("auto");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const [qParam, setQParam] = useState<string>(""); // ✅ safe ?q= for SSR

  // load recents
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  // read ?q= and auto-scan
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const q = sp.get("q") || "";
    setQParam(q); // ✅ safe state, used later
    if (q) {
      setInput(q);
      setTimeout(() => handleScan(q), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectedType = useMemo<"wallet" | "project" | null>(() => {
    if (isWalletAddress(input)) return "wallet";
    if (looksLikeDomain(input)) return "project";
    return null;
  }, [input]);

  const effectiveType: "wallet" | "project" | null = useMemo(() => {
    if (mode === "wallet") return "wallet";
    if (mode === "project") return "project";
    return detectedType;
  }, [mode, detectedType]);

  async function handleScan(forced?: string) {
    const q = (forced ?? input).trim();
    if (!q) return;

    const kind: "wallet" | "project" =
      mode === "wallet" ? "wallet" : mode === "project" ? "project" : isWalletAddress(q) ? "wallet" : "project";

    setLoading(true);
    setResult(null);

    const url =
      kind === "wallet"
        ? `/api/check?address=${encodeURIComponent(q)}`
        : `/api/project-check?domain=${encodeURIComponent(q)}`;

    try {
      const res = await fetch(url);
      const data = (await res.json()) as ApiResult;
      setResult(data);

      // update shareable ?q=
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        sp.set("q", q);
        window.history.replaceState(null, "", `?${sp.toString()}`);
        setQParam(q); // keep in state for TrustStats
      }

      // save to recents
      const item: RecentItem = {
        q,
        type: kind,
        verdict: data.status === "ok" ? data.verdict : null,
        ts: Date.now(),
      };
      setRecent((prev) => {
        const withoutDup = prev.filter((r) => r.q !== q);
        const next = [item, ...withoutDup].slice(0, 8);
        try {
          localStorage.setItem(RECENT_KEY, JSON.stringify(next));
        } catch {}
        return next;
      });
    } catch {
      setResult({ status: "error", message: "We couldn’t reach the trust service. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <section className="rounded-3xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-sm p-6 md:p-8 shadow-lg">
        {/* Hero */}
        <h1 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight">
          <span className="text-white">XRglass — </span>
          <span className="text-gradient">scan XRP wallets & projects</span>
        </h1>
        <p className="mt-2 text-center text-sm text-slate-400">
          Paste a wallet or website. We’ll check common risk signals and show a simple verdict you can trust.
        </p>

        {/* Mode toggle */}
        <div className="mt-5 mb-3 flex justify-center">
          <div className="inline-flex rounded-2xl bg-slate-800 p-1">
            {(["auto", "wallet", "project"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3 py-1.5 text-sm rounded-xl transition ${
                  mode === m ? "bg-slate-900 shadow text-white" : "text-slate-300 opacity-80"
                }`}
              >
                {m === "auto" ? "Auto" : m === "wallet" ? "Wallet" : "Project"}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="flex justify-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleScan()}
            placeholder={
              effectiveType === "wallet"
                ? "Wallet address (starts with r...)"
                : effectiveType === "project"
                ? "Project website (example.com)"
                : "Paste wallet address (r...) or website (example.com)"
            }
            className="w-[22rem] rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 outline-none ring-0 transition focus:border-cyan-400 focus:shadow-[0_0_0_4px_rgba(34,211,238,0.08)]"
          />
          <button
            onClick={() => handleScan()}
            disabled={loading || !effectiveType}
            aria-busy={loading ? "true" : "false"}
            title={!effectiveType ? "Paste a wallet or website first" : "Run trust scan"}
            className={`btn-glow btn-glow--pulse rounded-xl px-6 py-3 font-semibold
                        text-slate-900 bg-cyan-500 shadow
                        hover:bg-cyan-400 focus:outline-none
                        focus-visible:ring-2 focus-visible:ring-cyan-300
                        disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {loading ? "Verifying…" : "Start Scan"}
          </button>
        </div>

        {/* Helper line */}
        <div className="mt-2 text-center text-xs text-slate-400">
          {effectiveType === "wallet" && "Detected: Wallet address"}
          {effectiveType === "project" && "Detected: Project / Website"}
          {!effectiveType && input && "Tip: paste a wallet (r...) or a website like example.com"}
        </div>

        {/* Recent */}
        {recent.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span>Recent checks</span>
              <button
                onClick={() => {
                  localStorage.removeItem(RECENT_KEY);
                  setRecent([]);
                }}
                className="text-cyan-300 hover:underline"
              >
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  key={`${r.q}-${r.ts}`}
                  onClick={() => {
                    setInput(r.q);
                    setMode(r.type);
                    handleScan(r.q);
                  }}
                  className={`rounded-full border px-3 py-1 text-xs transition
                    ${r.type === "wallet" ? "border-cyan-500/40" : "border-emerald-500/40"}
                    ${
                      r.verdict === "green"
                        ? "bg-emerald-500/10"
                        : r.verdict === "red"
                        ? "bg-rose-500/10"
                        : "bg-slate-700/50"
                    }
                    hover:bg-slate-700/60`}
                  title={new Date(r.ts).toLocaleString()}
                >
                  {r.type === "wallet" ? "W:" : "P:"} {shorten(r.q)} {r.verdict ? `• ${r.verdict}` : ""}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mt-6 space-y-3">
          {loading && <LoadingScan />}

          {result && result.status === "error" && (
            <div className="mx-auto max-w-2xl rounded-xl border border-rose-500/60 bg-rose-950/40 px-5 py-3 text-left text-rose-200">
              <p className="font-semibold">We couldn’t complete the check</p>
              <p className="text-sm opacity-90">{result.message}</p>
              <p className="mt-1 text-[11px] text-rose-300/80">Tip: check your internet and try again.</p>
            </div>
          )}

          {result && result.status === "ok" && (
            <div className="mx-auto w-full max-w-2xl">
              <ResultCard result={result} />
              {/* Lite social proof */}
              <TrustStats
                query={
                  (result.details?.address as string) ||
                  (result.details?.domain as string) ||
                  qParam /* ✅ safe, SSR-friendly */
                }
                kind={result.details?.address ? "wallet" : "project"}
              />
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">
          Beta heuristics only — always double-check before sending funds.
        </p>
      </section>
    </main>
  );
}
