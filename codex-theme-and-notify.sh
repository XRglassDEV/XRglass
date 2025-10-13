set -e

BRANCH="feat/light-glass-theme+notify"
MSG="ui: light/sky glass theme, header+logo, Pro marketplace, Watchlist notify"

git fetch --all || true
git checkout -B "$BRANCH"

mkdir -p components components/watchlist public app/pro "app/(partials)" styles

# 0) SIMPLE XRglass LOGO (SVG)
cat > public/xrglass-logo.svg <<'EOT'
<svg width="120" height="28" viewBox="0 0 120 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="120" y2="28" gradientUnits="userSpaceOnUse">
      <stop stop-color="#34C8F6"/><stop offset="1" stop-color="#8AD8FF"/>
    </linearGradient>
  </defs>
  <circle cx="14" cy="14" r="10" stroke="url(#g)" stroke-width="3" fill="none"/>
  <path d="M9 14c3 0 5-5 10-5" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>
  <text x="30" y="19" font-family="Inter, ui-sans-serif" font-size="16" fill="#0A2A3B" font-weight="700">XRglass</text>
</svg>
EOT

# 1) HEADER (logo + nav + Pro badge)
cat > components/Header.tsx <<'EOT'
"use client";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/70 border-b border-sky-100">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/xrglass-logo.svg" alt="XRglass" width={120} height={28} priority />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-slate-700">
          <Link href="/" className="hover:text-sky-700">Home</Link>
          <Link href="/dashboard" className="hover:text-sky-700">Watchlist</Link>
          <Link href="/pro" className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 bg-sky-500 text-white shadow-sm hover:bg-sky-400">
            XRglass Pro
          </Link>
        </nav>
      </div>
    </header>
  );
}
EOT

# 2) LIGHT / SKY "GLASS" THEME (globals)
mkdir -p styles
cat > styles/globals.css <<'EOT'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* --- Light glass theme --- */
:root{
  --bg: 214 100% 98%;
  --panel: 0 0% 100%;
  --text: 210 35% 13%;
  --muted: 210 15% 40%;
  --ring: 199 89% 58%;
  --card-ring: 199 100% 88%;
  --shadow: 210 20% 10%;
  --radius: 16px;
}

html,body{height:100%}
body{
  @apply antialiased text-slate-800;
  background: radial-gradient(1200px 600px at 10% -10%, hsl(199 100% 92%) 0%, transparent 60%),
              radial-gradient(1200px 600px at 90% -10%, hsl(200 100% 95%) 0%, transparent 60%),
              hsl(var(--bg));
}

.container{ @apply mx-auto max-w-7xl px-4; }

.card{
  @apply rounded-2xl border border-sky-100 bg-white/70 backdrop-blur shadow-[0_10px_30px_-12px_rgba(10,42,59,0.2)];
}

.btn{
  @apply inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium bg-sky-500 text-white hover:bg-sky-400 active:scale-[.99] transition;
}
.badge{ @apply inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-sky-100 text-sky-700; }

h1,h2,h3{ @apply tracking-tight text-slate-900; }
EOT

# 3) ENSURE TAILWIND CONTENT (keeps working)
cat > tailwind.config.ts <<'EOT'
import type { Config } from "tailwindcss"
export default {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
} satisfies Config
EOT

# 4) layout.tsx -> include globals + Header
mkdir -p app
if [ ! -f app/layout.tsx ]; then
cat > app/layout.tsx <<'EOT'
import "@/styles/globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "XRglass",
  description: "Scan XRP wallets & projects",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
EOT
else
  grep -q 'globals.css' app/layout.tsx || sed -i '1i import "@/styles/globals.css";' app/layout.tsx
  grep -q 'components/Header' app/layout.tsx || sed -i '1i import Header from "@/components/Header";' app/layout.tsx
  sed -i 's/<body>/<body>\n        <Header \/>/' app/layout.tsx
fi

# 5) Watchlist component WITH NOTIFY button + optional webhook override
mkdir -p components/watchlist
cat > components/watchlist/Watchlist.tsx <<'EOT'
"use client";
import { useEffect, useMemo, useState } from "react";

type Type = "wallet" | "domain" | "project";
type Item = { id: string; type: Type; label: string; threshold: "green"|"orange"|"red"; lastVerdict?: string; checkedAt?: string; webhook?: string; };

const STORAGE_KEY = "xrglass.watchlist.v2";

export default function Watchlist() {
  const [items, setItems] = useState<Item[]>([]);
  const [type, setType] = useState<Type>("project");
  const [label, setLabel] = useState("");
  const [threshold, setThreshold] = useState<"green"|"orange"|"red">("red");
  const [hook, setHook] = useState("");

  useEffect(() => { try{ const raw=localStorage.getItem(STORAGE_KEY); if(raw) setItems(JSON.parse(raw)); }catch{} },[]);
  useEffect(() => { try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }catch{} },[items]);

  const stats = useMemo(()=>({
    total: items.length,
    wallets: items.filter(i=>i.type==="wallet").length,
    domains: items.filter(i=>i.type==="domain").length,
    projects: items.filter(i=>i.type==="project").length,
  }),[items]);

  function add(){
    const v = label.trim();
    if(!v) return;
    const id = `${type}:${v.toLowerCase()}`;
    if(items.some(i=>i.id===id)) return;
    setItems(prev=>[{ id, type, label:v, threshold, webhook: hook || undefined }, ...prev]);
    setLabel(""); setHook("");
  }
  function remove(id:string){ setItems(prev=>prev.filter(i=>i.id!==id)); }

  async function notify(it: Item){
    try{
      const res = await fetch("/api/watchlist", {
        method:"POST",
        headers:{"content-type":"application/json"},
        body: JSON.stringify({event:"watchlist.notify", item: it})
      });
      const ok = res.ok;
      alert(ok ? "Webhook sent ✅" : "Webhook failed ❌");
    }catch{ alert("Webhook failed ❌"); }
  }

  async function runCheck(it: Item){
    // placeholder: integrate real scan API later
    const verdict = ["green","orange","red"][Math.floor(Math.random()*3)];
    const now = new Date().toLocaleString();
    setItems(prev=>prev.map(x=>x.id===it.id?{...x,lastVerdict:verdict,checkedAt:now}:x));
  }

  return (
    <section className="card p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Watchlist & Alerts</h2>
        <span className="text-sm text-slate-500">Storage: localStorage • Total {stats.total}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[140px_1fr_140px_100px]">
        <select className="rounded-xl border border-sky-100 bg-white px-3 py-2"
                value={type} onChange={e=>setType(e.target.value as any)}>
          <option value="project">Project</option>
          <option value="domain">Domain</option>
          <option value="wallet">Wallet</option>
        </select>

        <input className="rounded-xl border border-sky-100 bg-white px-3 py-2" placeholder={type==="wallet"?"rEb8TK3g...":"example.com"}
               value={label} onChange={e=>setLabel(e.target.value)} />

        <select className="rounded-xl border border-sky-100 bg-white px-3 py-2"
                value={threshold} onChange={e=>setThreshold(e.target.value as any)}>
          <option value="green">green</option>
          <option value="orange">orange</option>
          <option value="red">red</option>
        </select>

        <button className="btn" onClick={add}>Add</button>
      </div>

      <input className="mt-3 w-full rounded-xl border border-sky-100 bg-white px-3 py-2"
             placeholder="Optional webhook URL (overrides WEBHOOK_URL from env)"
             value={hook} onChange={e=>setHook(e.target.value)} />

      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2">Type</th><th>Target</th><th>Threshold</th><th>Last verdict</th><th>Checked</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it)=>(
              <tr key={it.id} className="border-t border-sky-100">
                <td className="py-2">{it.type}</td>
                <td className="font-medium">{it.label}</td>
                <td><span className="badge">{it.threshold}</span></td>
                <td>{it.lastVerdict ? <span className="badge">{it.lastVerdict}</span> : "-"}</td>
                <td className="text-slate-500">{it.checkedAt ?? "-"}</td>
                <td className="flex gap-2 py-2">
                  <button className="rounded-lg px-3 py-1 bg-slate-900/5 hover:bg-slate-900/10 border border-sky-100"
                          onClick={()=>runCheck(it)}>Run check now</button>
                  <button className="rounded-lg px-3 py-1 bg-slate-900/5 hover:bg-slate-900/10 border border-sky-100"
                          onClick={()=>notify(it)}>Notify</button>
                  <button className="rounded-lg px-3 py-1 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700"
                          onClick={()=>remove(it.id)}>Remove</button>
                </td>
              </tr>
            ))}
            {items.length===0 && (
              <tr className="border-t border-sky-100"><td colSpan={6} className="py-6 text-center text-slate-500">No watch items yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
EOT

# 6) Inject Watchlist in dashboard (if page exists)
if [ -f app/dashboard/page.tsx ]; then
  sed -i '1i import Watchlist from "@/components/watchlist/Watchlist";' app/dashboard/page.tsx
  if ! grep -q "<Watchlist" app/dashboard/page.tsx; then
    sed -i 's/<main className="container[^\"]*">/&\n      <div className="mt-8"><Watchlist \/><\/div>/' app/dashboard/page.tsx
  fi
fi

# 7) Pro marketplace mock (light cards)
cat > app/pro/page.tsx <<'EOT'
export default function ProPage() {
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold">XRglass Pro</h1>
      <p className="text-slate-600 mt-2">Enhance your dashboard with add-ons and deeper analysis.</p>

      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {[
          { name:"TrustShield Badge", price:"€2.99/m", desc:"Public badge showing your verified status."},
          { name:"WhaleScope Alerts", price:"€4.99/m", desc:"Large holder movements & smart alerts."},
          { name:"VaultGuard AI", price:"€5.99/m", desc:"Heuristic scanning and anomaly hints."},
          { name:"Verify API", price:"€1.99/m", desc:"Lightweight API to embed basic checks."},
          { name:"Reports", price:"€3.99/m", desc:"Periodic PDF summaries and CSV exports."},
          { name:"All-Access Pack", price:"€24.99/m", desc:"Everything unlocked for one price."},
        ].map((p)=>(
          <div key={p.name} className="card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <span className="badge">{p.price}</span>
            </div>
            <p className="mt-2 text-slate-600">{p.desc}</p>
            <div className="mt-4">
              <button className="btn w-full">Activate</button>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
EOT

# 8) Home hero (optional nicer CTAs if exists)
if [ -f app/page.tsx ]; then
  sed -i 's/scan XRP wallets & projects/scan XRP wallets & projects/' app/page.tsx
fi

# 9) deps ensure
npm pkg get dependencies.tailwindcss >/dev/null 2>&1 || npm i -D tailwindcss postcss autoprefixer
npm pkg get dependencies.class-variance-authority >/dev/null 2>&1 || true

git add -A
git commit -m "$MSG" || true
git push -u origin "$BRANCH" || true

echo "✅ Theme + Notify ready on branch: $BRANCH"
echo "Next: open PR and set WEBHOOK_URL to your unique webhook endpoint (or /api/hook)."
