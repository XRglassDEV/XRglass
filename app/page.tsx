'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function scan() {
    setLoading(true); setResult(null);
    const r = await fetch('/api/scan', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ input }) });
    const j = await r.json(); setLoading(false); setResult(j);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      <motion.h1 initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.6}}
        className="text-5xl font-extrabold tracking-tight">
        The AI wallet intelligence platform
      </motion.h1>
      <p className="mt-4 text-lg text-slate-600 max-w-2xl">
        Scan wallets & projects for fraud, rugs and vulnerabilities. Free scanner below — upgrade to Pro for alerts & reports.
      </p>

      <div className="mt-8 flex gap-3">
        <input className="flex-1 rounded-xl border border-slate-200 px-4 py-3 bg-white/70 backdrop-blur"
               placeholder="Wallet address or domain" value={input} onChange={e=>setInput(e.target.value)} />
        <button onClick={scan} disabled={loading}
          className="px-5 py-3 rounded-xl text-white bg-gradient-to-r from-sky-500 to-blue-700 shadow">
          {loading ? 'Scanning…' : 'Scan (Free)'}
        </button>
      </div>

      {result && (
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}
          className="mt-8 p-6 rounded-2xl border border-white/60 bg-white/60 backdrop-blur">
          {result.status !== 'ok' ? (
            <div className="text-rose-600">Error: {result.error}</div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-slate-500">{result.kind}</div>
                  <div className="font-semibold break-all">{result.input}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">TrustScore</div>
                  <div className="text-3xl font-extrabold">{result.trustScore}</div>
                </div>
              </div>
              <div className="mt-4 text-sm">Risk: <span className="font-medium">{result.riskLevel}</span></div>
              {result.flags?.length ? (
                <ul className="mt-2 text-sm list-disc pl-5 text-slate-700">
                  {result.flags.map((f:string)=> <li key={f}>{f}</li>)}
                </ul>
              ) : <div className="mt-2 text-sm text-emerald-700">No major flags detected.</div>}
              <div className="mt-6">
                <a href="/pricing" className="inline-flex px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-700 text-white">
                  Unlock Pro alerts
                </a>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Features teaser */}
      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ['🔍','Fraud Pattern Detection','AI detects rug/exit patterns & risky flows'],
          ['🔔','Realtime Alerts','Email / Discord / Webhook (Pro)'],
          ['👀','Smart Watchlists','Track wallets & projects (Pro)'],
        ].map(([ico, h, t])=>(
          <motion.div key={h as string} initial={{opacity:0,y:12}} whileInView={{opacity:1,y:0}}
            className="p-6 rounded-2xl border border-white/60 bg-white/60 backdrop-blur">
            <div className="text-2xl">{ico}</div>
            <div className="mt-2 font-semibold">{h}</div>
            <div className="text-sm text-slate-600">{t}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
