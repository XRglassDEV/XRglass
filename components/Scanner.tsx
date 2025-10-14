// components/Scanner.tsx
'use client';

import { useMemo, useState } from 'react';

type ScanResult = {
  status: 'ok' | 'error';
  kind?: 'address' | 'domain';
  input?: string;
  trustScore?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  flags?: string[];
  recommendations?: string[];
  signals?: Array<{ label: string; value: string }>;
  error?: string;
};

const tabs = ['Auto', 'Wallet', 'Project'] as const;
type Tab = typeof tabs[number];

export default function Scanner() {
  const [tab, setTab] = useState<Tab>('Auto');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function runScan() {
    if (!input.trim()) return;
    setLoading(true);
    setResult(null);
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input, mode: tab.toLowerCase() }),
    });
    const json: ScanResult = await res.json();
    setLoading(false);
    setResult(json);
  }

  const scoreColor = useMemo(() => {
    const s = result?.trustScore ?? 0;
    if (s >= 85) return 'text-emerald-400';
    if (s >= 70) return 'text-yellow-300';
    return 'text-rose-400';
  }, [result?.trustScore]);

  return (
    <section id="scanner" className="space-y-6">
      <div className="glass-panel shadow-ring overflow-hidden p-6 sm:p-10">
        {/* title */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-white sm:text-3xl">
              Free XRPL Wallet & Project Scanner
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Detect scams, rug pulls, fraud patterns, dangerous contracts, spoofed domains, and more.
            </p>
          </div>
          <a href="/dashboard" className="btn-premium">
            Go to Dashboard (Pro)
          </a>
        </div>

        {/* tabs */}
        <div className="mt-6 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full border px-4 py-1.5 text-sm ${
                tab === t
                  ? 'border-white/30 bg-white/15 text-white'
                  : 'border-white/10 bg-white/5 text-white/70 hover:border-white/25'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* input row */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste XRPL wallet (r...) or project domain (example.com)"
            className="flex-1 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-white/90 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
          />
          <button
            onClick={runScan}
            disabled={loading}
            className="rounded-xl px-5 py-3 btn-premium whitespace-nowrap"
          >
            {loading ? 'Scanning…' : 'Start Scan'}
          </button>
        </div>

        {/* result */}
        <div className="mt-8">
          {!result && !loading && (
            <div className="text-sm text-white/50">
              Tip: try a well-known exchange hot wallet, then compare with a random r-address.
            </div>
          )}

          {loading && (
            <div className="grid gap-6 md:grid-cols-[220px,1fr] md:items-center">
              <div className="mx-auto aspect-square w-[220px] animate-pulse rounded-full bg-[conic-gradient(from_210deg,#6ee7ff,#0a66ff,#aee9ff,#6ee7ff)] opacity-60 blur-[2px]" />
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="h-3 w-2/3 animate-pulse rounded bg-white/10" />
                <div className="mt-3 space-y-2">
                  <div className="h-2 w-5/6 animate-pulse rounded bg-white/10" />
                  <div className="h-2 w-4/6 animate-pulse rounded bg-white/10" />
                  <div className="h-2 w-3/6 animate-pulse rounded bg-white/10" />
                </div>
              </div>
            </div>
          )}

          {result && result.status === 'error' && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200">
              {result.error}
            </div>
          )}

          {result && result.status === 'ok' && (
            <div className="grid gap-6 md:grid-cols-[220px,1fr] md:items-center">
              {/* Orb */}
              <div className="mx-auto flex aspect-square w-[220px] items-center justify-center rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,.9),rgba(255,255,255,.08)_60%,transparent_62%),conic-gradient(from_210deg,#6ee7ff,#0a66ff,#aee9ff,#6ee7ff)] shadow-[0_25px_60px_rgba(0,102,255,.25)]">
                <div className={`text-5xl font-extrabold ${scoreColor}`}>
                  {result.trustScore}
                </div>
              </div>

              {/* Details */}
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.35em] text-white/50">
                      {result.kind}
                    </div>
                    <div className="mt-1 break-all font-semibold text-white">
                      {result.input}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/50">Risk level</div>
                    <div className="text-base font-semibold capitalize text-white">
                      {result.riskLevel}
                    </div>
                  </div>
                </div>

                {result.flags && result.flags.length > 0 ? (
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {result.flags.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                      >
                        <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-rose-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-300">
                    No major flags detected.
                  </div>
                )}

                {/* fun signals teaser */}
                {result.signals && result.signals.length > 0 && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {result.signals.map((s) => (
                      <div
                        key={s.label}
                        className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/70"
                      >
                        <div className="text-white/50">{s.label}</div>
                        <div className="mt-1 font-semibold">{s.value}</div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="/dashboard" className="btn-premium">
                    See full analysis in Dashboard
                  </a>
                  <a
                    href="/pricing"
                    className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/80 hover:border-white/30"
                  >
                    Unlock alerts & add-ons
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-white/45">
        Beta heuristics only — always double-check before sending funds.
      </p>
    </section>
  );
}
