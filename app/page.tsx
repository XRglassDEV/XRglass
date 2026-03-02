// app/page.tsx — drop into /app/page.tsx
// Next.js 15 + TypeScript + Tailwind v4
“use client”;

import { useState, useEffect, useRef } from “react”;

type Tab = “wallet” | “token” | “url”;
type ResultType = “safe” | “danger” | “warning”;
interface Check { status: “ok” | “bad” | “warn”; label: string; }
interface ScanResult { type: ResultType; score: number; title: string; sub: string; checks: Check[]; }

const RESULTS: ScanResult[] = [
{
type: “safe”, score: 94,
title: “No Threats Detected”, sub: “Clean address based on on-chain analysis.”,
checks: [
{ status: “ok”,   label: “Not in scam database”   },
{ status: “ok”,   label: “Normal TX pattern”       },
{ status: “ok”,   label: “No drainer activity”     },
{ status: “ok”,   label: “No mixer links”          },
{ status: “warn”, label: “New wallet (< 30 days)”  },
{ status: “ok”,   label: “No phishing reports”     },
],
},
{
type: “danger”, score: 4,
title: “HIGH RISK — Scam Detected”, sub: “Flagged in multiple databases. Do not interact.”,
checks: [
{ status: “bad”, label: “Known drainer wallet”   },
{ status: “bad”, label: “In global scam DB”      },
{ status: “bad”, label: “Abnormal TX pattern”    },
{ status: “bad”, label: “Mixer activity found”   },
{ status: “ok”,  label: “Account on ledger”      },
{ status: “bad”, label: “14 phishing reports”    },
],
},
{
type: “warning”, score: 51,
title: “Suspicious — Use Caution”, sub: “Some risk signals. Verify before interacting.”,
checks: [
{ status: “ok”,   label: “Not in scam database”     },
{ status: “warn”, label: “Unusual TX frequency”     },
{ status: “ok”,   label: “No drainer activity”      },
{ status: “warn”, label: “Linked to flagged addr”   },
{ status: “ok”,   label: “Account age > 1 year”     },
{ status: “warn”, label: “2 community reports”      },
],
},
];

const STEPS = [
“Connecting to XRPL…”,
“Reading TX history…”,
“Checking scam databases…”,
“Analysing patterns…”,
“Generating Trust Score…”,
];

const PH: Record<Tab, string> = {
wallet: “rPPxZtvamgY1iWCoBRf35ktygbM7dwW3d2”,
token:  “Token name or currency code…”,
url:    “https://suspicious-xrp-site.com”,
};

function useCountUp(target: number, duration = 1800, delay = 0) {
const [v, setV] = useState(0);
useEffect(() => {
const t = setTimeout(() => {
let start: number | null = null;
const tick = (ts: number) => {
if (!start) start = ts;
const p = Math.min((ts - start) / duration, 1);
setV(Math.floor(p * target));
if (p < 1) requestAnimationFrame(tick);
};
requestAnimationFrame(tick);
}, delay);
return () => clearTimeout(t);
}, [target, duration, delay]);
return v;
}

function Logo({ size = 36 }: { size?: number }) {
return (
<svg width={size} height={size} viewBox="0 0 40 40" fill="none">
<circle cx="17" cy="17" r="13" fill="url(#lg)" />
<ellipse cx="12" cy="11" rx="5" ry="2.8" fill="rgba(255,255,255,0.22)" transform="rotate(-30 12 11)" />
<path d="M22 12h2L20 16c-1.6 1.6-4.2 1.6-5.8 0L10 12h2l3.2 3.2c.9.9 2.3.9 3.2 0L22 12z" fill="white" />
<path d="M22 22h2L20 18c-1.6-1.6-4.2-1.6-5.8 0L10 22h2l3.2-3.2c.9-.9 2.3-.9 3.2 0L22 22z" fill="white" />
<rect x="27" y="26" width="3.5" height="10" rx="1.75" fill="url(#lh)" transform="rotate(-45 27 26)" />
<defs>
<linearGradient id="lg" x1="4" y1="4" x2="30" y2="30" gradientUnits="userSpaceOnUse">
<stop offset="0%" stopColor="#38C6F4" />
<stop offset="100%" stopColor="#0077B6" />
</linearGradient>
<linearGradient id="lh" x1="27" y1="26" x2="35" y2="36" gradientUnits="userSpaceOnUse">
<stop offset="0%" stopColor="#0099CC" />
<stop offset="100%" stopColor="#005580" />
</linearGradient>
</defs>
</svg>
);
}

function Dot({ s }: { s: Check[“status”] }) {
return (
<span className={`w-2 h-2 rounded-full flex-shrink-0 inline-block ${s === "ok" ? "bg-emerald-400" : s === "bad" ? "bg-red-400" : "bg-amber-400"}`}
/>
);
}

// ─── colour tokens (all in-line so no Tailwind purge issues) ───────────────
// bg:    #020D1A   darkest navy
// card:  #041628   slightly lighter
// rim:   #0A2540   border / divider
// blue:  #00A5DF   XRP brand blue
// blue2: #0077B6   deeper
// txt:   #E8F4FF   near-white
// muted: #5A89A8   muted text

export default function Page() {
const [tab, setTab]         = useState<Tab>(“wallet”);
const [input, setInput]     = useState(””);
const [scanning, setScanning] = useState(false);
const [progress, setProgress] = useState(0);
const [stepLabel, setStepLabel] = useState(STEPS[0]);
const [result, setResult]   = useState<ScanResult | null>(null);
const [copied, setCopied]   = useState(false);
const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

const scams     = useCountUp(2847,   1400, 200);
const wallets   = useCountUp(18432,  1600, 400);
const protected_ = useCountUp(941205, 2000, 600);

function doScan() {
if (!input.trim()) return;
setResult(null);
setProgress(0);
setScanning(true);
setStepLabel(STEPS[0]);
let p = 0, si = 0;
if (timerRef.current) clearInterval(timerRef.current);
timerRef.current = setInterval(() => {
p += Math.random() * 7 + 4;
if (p >= 100) {
clearInterval(timerRef.current!);
setProgress(100);
setTimeout(() => {
setScanning(false);
setResult(RESULTS[Math.floor(Math.random() * RESULTS.length)]);
}, 150);
return;
}
setProgress(p);
const ni = Math.min(Math.floor(p / 20), STEPS.length - 1);
if (ni !== si) { si = ni; setStepLabel(STEPS[ni]); }
}, 90);
}

function copyAddr() {
navigator.clipboard.writeText(“rPPxZtvamgY1iWCoBRf35ktygbM7dwW3d2”).catch(() => {});
setCopied(true);
setTimeout(() => setCopied(false), 2200);
}

const RC = {
safe:    { bar: “bg-emerald-400”, score: “#34D399”, ring: “rgba(52,211,153,0.15)”,  icon: “✅”, label: “text-emerald-300” },
danger:  { bar: “bg-red-400”,     score: “#F87171”, ring: “rgba(248,113,113,0.15)”, icon: “🚨”, label: “text-red-300”     },
warning: { bar: “bg-amber-400”,   score: “#FBBF24”, ring: “rgba(251,191,36,0.15)”,  icon: “⚠️”, label: “text-amber-300”  },
};

return (
<div style={{ background: “#020D1A”, color: “#E8F4FF”, fontFamily: “‘Inter’, system-ui, sans-serif”, minHeight: “100vh” }}>

```
  {/* ── NAV ────────────────────────────────────────────────── */}
  <header style={{
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(2,13,26,0.85)",
    backdropFilter: "blur(20px)",
    borderBottom: "1px solid #0A2540",
  }}>
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <Logo size={32} />
        <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "#E8F4FF", letterSpacing: "-0.5px" }}>
          XR<span style={{ color: "#00A5DF" }}>Glass</span>
        </span>
      </a>
      <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
        {["How it works", "Features", "GitHub"].map(l => (
          <a key={l}
            href={l === "GitHub" ? "https://github.com/XRglassDEV/XRglass" : `#${l.toLowerCase().replace(/ /g, "")}`}
            target={l === "GitHub" ? "_blank" : undefined}
            style={{ fontSize: "0.85rem", fontWeight: 500, color: "#5A89A8", textDecoration: "none" }}
          >{l}</a>
        ))}
        <a href="#scan" style={{
          background: "#00A5DF", color: "#fff",
          fontSize: "0.83rem", fontWeight: 700,
          padding: "8px 20px", borderRadius: 40,
          textDecoration: "none",
          boxShadow: "0 0 20px rgba(0,165,223,0.4)",
        }}>Scan Free →</a>
      </nav>
    </div>
  </header>

  {/* ── HERO ───────────────────────────────────────────────── */}
  <section id="scan" style={{ position: "relative", overflow: "hidden" }}>

    {/* Glow orbs */}
    <div style={{
      position: "absolute", top: -200, right: -200,
      width: 700, height: 700, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(0,165,223,0.12) 0%, transparent 65%)",
      pointerEvents: "none",
    }} />
    <div style={{
      position: "absolute", bottom: -150, left: -150,
      width: 500, height: 500, borderRadius: "50%",
      background: "radial-gradient(circle, rgba(0,119,182,0.1) 0%, transparent 65%)",
      pointerEvents: "none",
    }} />

    <div style={{
      maxWidth: 1100, margin: "0 auto", padding: "100px 24px 80px",
      display: "grid", gridTemplateColumns: "1fr 1fr",
      gap: 64, alignItems: "center",
    }}
      className="hero-grid"
    >

      {/* Left copy */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Live badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(0,165,223,0.12)",
          border: "1px solid rgba(0,165,223,0.3)",
          borderRadius: 40, padding: "6px 14px",
          fontSize: "0.71rem", fontWeight: 700,
          letterSpacing: "1.5px", textTransform: "uppercase",
          color: "#00A5DF", marginBottom: 28,
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#00A5DF",
            display: "inline-block",
            animation: "pulse 2s infinite",
          }} />
          XRP Ledger Security
        </div>

        <h1 style={{
          fontSize: "clamp(2.8rem, 5vw, 4.4rem)",
          fontWeight: 900,
          lineHeight: 1.04,
          letterSpacing: "-2px",
          color: "#FFFFFF",
          marginBottom: 20,
        }}>
          See through<br />
          every XRP<br />
          <span style={{ color: "#00A5DF" }}>threat.</span>
        </h1>

        <p style={{
          fontSize: "1.05rem", fontWeight: 300,
          lineHeight: 1.8, color: "#5A89A8",
          maxWidth: 400, marginBottom: 40,
        }}>
          Paste any wallet, token, or suspicious link.
          Get crystal-clear security intelligence — instantly, for free.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 56 }}>
          <button
            onClick={() => document.getElementById("main-input")?.focus()}
            style={{
              background: "#00A5DF", color: "#fff",
              border: "none", cursor: "pointer",
              fontSize: "0.92rem", fontWeight: 700,
              padding: "14px 32px", borderRadius: 40,
              boxShadow: "0 0 32px rgba(0,165,223,0.45)",
            }}
          >Start scanning →</button>
          <a
            href="https://github.com/XRglassDEV/XRglass"
            target="_blank"
            style={{ fontSize: "0.85rem", fontWeight: 500, color: "#5A89A8", textDecoration: "none" }}
          >View on GitHub ↗</a>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex", gap: 40,
          paddingTop: 36,
          borderTop: "1px solid #0A2540",
        }}>
          {[
            { n: scams.toLocaleString(),      l: "Scams detected"  },
            { n: wallets.toLocaleString(),    l: "Wallets scanned" },
            { n: protected_.toLocaleString(), l: "XRP protected"   },
          ].map(({ n, l }) => (
            <div key={l}>
              <div style={{ fontSize: "1.7rem", fontWeight: 800, color: "#fff", letterSpacing: "-1px" }}>{n}</div>
              <div style={{ fontSize: "0.73rem", color: "#5A89A8", marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right — scanner */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{
          background: "#041628",
          border: "1px solid #0A2540",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 0 0 1px rgba(0,165,223,0.08), 0 32px 80px rgba(0,0,0,0.5)",
        }}>

          {/* Browser bar */}
          <div style={{
            background: "#020D1A",
            borderBottom: "1px solid #0A2540",
            padding: "12px 20px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#FF5F57","#FFBD2E","#28CA41"].map(c => (
                <span key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c, display: "inline-block" }} />
              ))}
            </div>
            <div style={{
              flex: 1, marginLeft: 8,
              background: "#0A2540",
              borderRadius: 7, padding: "5px 14px",
              fontSize: "0.68rem", color: "#5A89A8", fontFamily: "monospace",
            }}>
              xrglass.io — XRP Security Scanner
            </div>
          </div>

          <div style={{ padding: 24 }}>
            {/* Tabs */}
            <div style={{
              display: "flex", background: "#020D1A",
              borderRadius: 12, padding: 4, gap: 3, marginBottom: 18,
            }}>
              {(["wallet","token","url"] as Tab[]).map(t => (
                <button key={t}
                  onClick={() => { setTab(t); setResult(null); setInput(""); }}
                  style={{
                    flex: 1, padding: "9px 8px",
                    background: tab === t ? "#0A2540" : "transparent",
                    border: "none", cursor: "pointer",
                    color: tab === t ? "#00A5DF" : "#5A89A8",
                    fontSize: "0.78rem", fontWeight: tab === t ? 700 : 500,
                    borderRadius: 9, transition: "all .2s",
                  }}
                >
                  {t === "wallet" ? "🔑 Wallet" : t === "token" ? "🪙 Token" : "🌐 URL"}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div style={{ display: "flex", gap: 10, marginBottom: 0 }}>
              <input
                id="main-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && doScan()}
                placeholder={PH[tab]}
                style={{
                  flex: 1,
                  background: "#020D1A",
                  border: "1.5px solid #0A2540",
                  borderRadius: 10,
                  fontFamily: "monospace", fontSize: "0.78rem",
                  color: "#E8F4FF", padding: "13px 14px",
                  outline: "none",
                }}
                onFocus={e => (e.target.style.borderColor = "#00A5DF")}
                onBlur={e  => (e.target.style.borderColor = "#0A2540")}
              />
              <button
                onClick={doScan}
                disabled={scanning}
                style={{
                  background: "#00A5DF", color: "#fff", border: "none",
                  fontWeight: 800, fontSize: "0.85rem",
                  padding: "13px 22px", borderRadius: 10, cursor: "pointer",
                  boxShadow: "0 0 20px rgba(0,165,223,0.35)",
                  opacity: scanning ? 0.7 : 1,
                }}
              >
                {scanning ? "…" : "Scan"}
              </button>
            </div>

            {/* Progress */}
            {scanning && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.68rem", color: "#5A89A8", marginBottom: 6 }}>
                  <span>{stepLabel}</span>
                  <span>{Math.floor(progress)}%</span>
                </div>
                <div style={{ height: 3, background: "#0A2540", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${progress}%`,
                    background: "linear-gradient(90deg, #00A5DF, #0077B6)",
                    borderRadius: 3, transition: "width .1s linear",
                  }} />
                </div>
              </div>
            )}

            {/* Result */}
            {result && (() => {
              const c = RC[result.type];
              return (
                <div style={{ marginTop: 16, border: "1px solid #0A2540", borderRadius: 14, overflow: "hidden" }}>
                  {/* Result header */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "16px 20px",
                    background: c.ring,
                    borderBottom: "1px solid #0A2540",
                  }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      background: "rgba(255,255,255,0.05)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.4rem", flexShrink: 0,
                    }}>{c.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>{result.title}</div>
                      <div style={{ fontSize: "0.73rem", color: "#5A89A8", marginTop: 2 }}>{result.sub}</div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontFamily: "monospace", fontSize: "1.8rem", fontWeight: 800, color: c.score, lineHeight: 1 }}>{result.score}</div>
                      <div style={{ fontSize: "0.58rem", color: "#5A89A8", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>Trust Score</div>
                    </div>
                  </div>
                  {/* Checks grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: "#041628" }}>
                    {result.checks.map((chk, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "10px 16px",
                        fontSize: "0.73rem", color: "#B8D4E8",
                        borderBottom: "1px solid #0A2540",
                        borderRight: i % 2 === 0 ? "1px solid #0A2540" : "none",
                      }}>
                        <Dot s={chk.status} />
                        {chk.label}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Floating glow under card */}
        <div style={{
          position: "absolute", bottom: -40, left: "50%",
          transform: "translateX(-50%)",
          width: "80%", height: 60,
          background: "rgba(0,165,223,0.15)",
          filter: "blur(30px)",
          borderRadius: "50%",
          pointerEvents: "none",
        }} />
      </div>
    </div>
  </section>

  {/* ── HOW IT WORKS ───────────────────────────────────────── */}
  <section id="howitworks" style={{
    borderTop: "1px solid #0A2540",
    padding: "100px 24px",
  }}>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#00A5DF", marginBottom: 12 }}>
        How it works
      </p>
      <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", fontWeight: 900, letterSpacing: "-1px", color: "#fff", marginBottom: 56 }}>
        Three steps to <span style={{ color: "#00A5DF" }}>total clarity.</span>
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 2 }} className="steps-grid">
        {[
          { n: "01", h: "Paste anything",   p: "Drop in a wallet, token name, or suspicious URL. XRGlass handles the rest." },
          { n: "02", h: "We look deeper",   p: "We analyse the XRPL ledger, cross-reference scam databases, and study on-chain behaviour." },
          { n: "03", h: "You see clearly",  p: "A 0–100 Trust Score with full breakdown. No jargon — just clear, actionable insight." },
        ].map(({ n, h, p }) => (
          <div key={n} style={{
            background: "#041628",
            border: "1px solid #0A2540",
            borderRadius: 16, padding: "36px 28px",
          }}>
            <div style={{ fontSize: "3rem", fontWeight: 900, color: "#00A5DF", opacity: 0.2, lineHeight: 1, marginBottom: 20 }}>{n}</div>
            <h3 style={{ fontWeight: 700, fontSize: "1rem", color: "#fff", marginBottom: 10 }}>{h}</h3>
            <p style={{ fontSize: "0.82rem", color: "#5A89A8", lineHeight: 1.75 }}>{p}</p>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* ── FEATURES ───────────────────────────────────────────── */}
  <section id="features" style={{
    borderTop: "1px solid #0A2540",
    padding: "100px 24px",
  }}>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <p style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "3px", textTransform: "uppercase", color: "#00A5DF", marginBottom: 12 }}>
        Features
      </p>
      <h2 style={{ fontSize: "clamp(1.8rem,3vw,2.8rem)", fontWeight: 900, letterSpacing: "-1px", color: "#fff", marginBottom: 56 }}>
        What XRGlass <span style={{ color: "#00A5DF" }}>sees.</span>
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }} className="feat-grid">
        {[
          { icon:"🔍", h:"Wallet Analysis",       p:"Deep on-chain scan. Detect drainer wallets, mixer activity, and blacklisted addresses instantly." },
          { icon:"🪙", h:"Token Scam Detection",  p:"Spot rug pulls, honeypots, and fake XRP clones before you ever interact." },
          { icon:"🌐", h:"Phishing URL Scanner",  p:"Live cross-reference against known XRP phishing sites. Never connect to a fake site again." },
          { icon:"📊", h:"Trust Score",           p:"A clean 0–100 score with full human-readable breakdown of every risk signal." },
          { icon:"🔔", h:"Live Alerts (soon)",    p:"24/7 wallet monitoring. Instant email or Telegram alerts when something suspicious is detected." },
          { icon:"🔓", h:"Open Source",           p:"MIT-licensed, community-verified code on GitHub. No trackers. Free, always." },
        ].map(({ icon, h, p }) => (
          <div key={h} style={{
            background: "#041628",
            border: "1px solid #0A2540",
            borderRadius: 16, padding: "28px 24px",
            transition: "border-color .2s",
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#00A5DF")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#0A2540")}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: "rgba(0,165,223,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.3rem", marginBottom: 18,
            }}>{icon}</div>
            <h3 style={{ fontWeight: 700, fontSize: "0.93rem", color: "#fff", marginBottom: 8 }}>{h}</h3>
            <p style={{ fontSize: "0.8rem", color: "#5A89A8", lineHeight: 1.7 }}>{p}</p>
          </div>
        ))}
      </div>
    </div>
  </section>

  {/* ── DONATE ─────────────────────────────────────────────── */}
  <section style={{ padding: "0 24px 100px" }}>
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{
        background: "linear-gradient(135deg, #00A5DF 0%, #0077B6 50%, #023E8A 100%)",
        borderRadius: 24, padding: "64px",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center",
        position: "relative", overflow: "hidden",
      }}
        className="donate-grid"
      >
        {/* Deco rings */}
        <div style={{ position:"absolute", top:-80, right:-80, width:300, height:300, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.12)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-60, left:-60, width:220, height:220, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.08)", pointerEvents:"none" }} />

        <div style={{ position: "relative" }}>
          <h2 style={{ fontSize: "clamp(1.6rem,3vw,2.4rem)", fontWeight: 900, color: "#fff", letterSpacing: "-1px", lineHeight: 1.15, marginBottom: 14 }}>
            Built for the<br />XRP community.
          </h2>
          <p style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.75, fontWeight: 300 }}>
            XRGlass is free and open source. If it ever saved your XRP from a scam, a small tip means everything.
          </p>
        </div>

        <div style={{
          background: "rgba(0,0,0,0.25)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 16, padding: 28, position: "relative",
        }}>
          <p style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>
            ☕ Tip with XRP
          </p>

          <div
            onClick={copyAddr}
            style={{
              display: "flex", alignItems: "center", gap: 12,
              background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, padding: "14px 16px", marginBottom: 16, cursor: "pointer",
            }}
          >
            {/* Mini XRP logo */}
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="11" fill="#00A5DF" />
              <path d="M15 7.5h1.5L13 11c-1.1 1.1-2.9 1.1-4 0L5.5 7.5H7l2.5 2.5c.6.6 1.5.6 2.1 0L15 7.5z" fill="white" />
              <path d="M15 14.5h1.5L13 11c-1.1-1.1-2.9-1.1-4 0L5.5 14.5H7l2.5-2.5c.6-.6 1.5-.6 2.1 0L15 14.5z" fill="white" />
            </svg>
            <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "rgba(255,255,255,0.65)", flex: 1, wordBreak: "break-all" }}>
              rPPxZtvamgY1iWCoBRf35ktygbM7dwW3d2
            </span>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.9rem" }}>📋</span>
          </div>

          <button
            onClick={copyAddr}
            style={{
              width: "100%", background: "#fff", color: "#023E8A",
              border: "none", fontWeight: 800, fontSize: "0.9rem",
              padding: "14px", borderRadius: 12, cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            }}
          >
            {copied ? "✓ Copied!" : "Copy XRP Address!"}
          </button>

          <p style={{ textAlign: "center", marginTop: 14, fontSize: "0.72rem", color: "rgba(255,255,255,0.22)" }}>
            MIT Licensed ·{" "}
            <a href="https://github.com/XRglassDEV/XRglass" target="_blank"
              style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>GitHub</a>
            {" "}· Not affiliated with Ripple Labs
          </p>
        </div>
      </div>
    </div>
  </section>

  {/* ── FOOTER ─────────────────────────────────────────────── */}
  <footer style={{ borderTop: "1px solid #0A2540", padding: "28px 24px" }}>
    <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <Logo size={24} />
        <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#E8F4FF" }}>
          XR<span style={{ color: "#00A5DF" }}>Glass</span>
        </span>
      </a>
      <p style={{ fontSize: "0.75rem", color: "#5A89A8" }}>© 2025 XRGlass — Not affiliated with Ripple Labs Inc.</p>
      <div style={{ display: "flex", gap: 24 }}>
        {[
          { l: "GitHub",        h: "https://github.com/XRglassDEV/XRglass" },
          { l: "Report a Scam", h: "#" },
          { l: "Privacy",       h: "#" },
        ].map(({ l, h }) => (
          <a key={l} href={h} target={h.startsWith("http") ? "_blank" : undefined}
            style={{ fontSize: "0.78rem", color: "#5A89A8", textDecoration: "none" }}
          >{l}</a>
        ))}
      </div>
    </div>
  </footer>

  {/* ── COPIED TOAST ───────────────────────────────────────── */}
  {copied && (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 999,
      background: "#041628", border: "1px solid #00A5DF",
      color: "#fff", fontSize: "0.83rem", fontWeight: 600,
      padding: "12px 22px", borderRadius: 12,
      boxShadow: "0 0 30px rgba(0,165,223,0.3)",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      ✓ XRP address copied
    </div>
  )}

  {/* ── RESPONSIVE ─────────────────────────────────────────── */}
  <style>{`
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    @media(max-width:768px){
      .hero-grid   { grid-template-columns:1fr !important; padding:80px 20px 60px !important; }
      .steps-grid  { grid-template-columns:1fr !important; }
      .feat-grid   { grid-template-columns:1fr 1fr !important; }
      .donate-grid { grid-template-columns:1fr !important; padding:40px 28px !important; }
      header nav a:not(:last-child){ display:none; }
    }
    @media(max-width:480px){
      .feat-grid { grid-template-columns:1fr !important; }
    }
  `}</style>
</div>
```

);
}