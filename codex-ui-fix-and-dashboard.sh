set -e

BRANCH="feat/fix-ui-and-add-dashboard"
MSG="fix: Tailwind globals + add dashboard/pro + build scripts"

# 1) Git branch
git fetch --all || true
git checkout -B "$BRANCH"

# 2) Ensure folders
mkdir -p app app/dashboard app/pro components utils styles lib

# 3) Tailwind / PostCSS / globals
cat > tailwind.config.ts <<'EOT'
import type { Config } from "tailwindcss"

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
EOT

cat > postcss.config.js <<'EOT'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOT

mkdir -p styles
cat > styles/globals.css <<'EOT'
@tailwind base;
@tailwind components;
@tailwind utilities;

/* XRglass base tweaks */
:root { --radius: 12px; }
html, body { height: 100%; }
body { @apply bg-neutral-950 text-neutral-100; }
a { @apply underline-offset-4 hover:underline; }
.container { @apply mx-auto max-w-6xl px-6; }
.card { @apply rounded-2xl bg-neutral-900/60 shadow-xl ring-1 ring-neutral-800; }
.btn { @apply inline-flex items-center rounded-xl px-4 py-2 font-medium bg-cyan-500 text-black hover:bg-cyan-400; }
EOT

# 4) utilities cn()
mkdir -p utils
cat > utils/cn.ts <<'EOT'
import { type ClassValue } from "clsx"
import clsx from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOT

# 5) Ensure app/layout.tsx imports globals
mkdir -p app
if [ ! -f app/layout.tsx ]; then
cat > app/layout.tsx <<'EOT'
import "@/styles/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "XRglass",
  description: "Scan XRP wallets & projects",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
EOT
else
  grep -q 'globals.css' app/layout.tsx || sed -i '1i import "@/styles/globals.css";' app/layout.tsx
fi

# 6) Home page fallback (alleen als ontbreekt)
if [ ! -f app/page.tsx ]; then
cat > app/page.tsx <<'EOT'
export default function Home() {
  return (
    <main className="container py-12">
      <section className="card p-8">
        <h1 className="text-4xl font-bold">XRglass — scan XRP wallets & projects</h1>
        <p className="mt-3 text-neutral-300">Type a wallet or website to analyze risks.</p>
        <div className="mt-6">
          <a className="btn" href="/dashboard">Open Dashboard</a>
        </div>
      </section>
    </main>
  );
}
EOT
fi

# 7) Dashboard & Pro pages (minimal, uitbreidbaar)
cat > app/dashboard/page.tsx <<'EOT'
import { Suspense } from "react";

export default function DashboardPage() {
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold">XRglass Dashboard</h1>
      <p className="mt-2 text-neutral-400">Watchlists, alerts & last verdicts.</p>

      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Watchlist</h2>
          <p className="text-neutral-400 mt-2">No items yet. Add wallets or domains to monitor.</p>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Latest scans</h2>
          <div className="mt-3 text-neutral-400">Coming soon…</div>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Risk signals</h2>
          <div className="mt-3 text-neutral-400">Heuristics & flags preview.</div>
        </div>
      </div>

      <Suspense>
        <section className="card p-6 mt-8">
          <h3 className="text-lg font-semibold">Webhook (optional)</h3>
          <p className="text-neutral-400 mt-2">Post alerts to your endpoint when thresholds are crossed.</p>
        </section>
      </Suspense>
    </main>
  );
}
EOT

cat > app/pro/page.tsx <<'EOT'
export default function ProPage() {
  return (
    <main className="container py-10">
      <h1 className="text-3xl font-bold">XRglass Pro</h1>
      <p className="mt-2 text-neutral-400">Membership, add-ons & advanced scanning.</p>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Pro features</h2>
          <ul className="list-disc pl-6 mt-3 text-neutral-300 space-y-2">
            <li>Deeper XRPL ledger heuristics</li>
            <li>Smart dest-tag & trustline checks</li>
            <li>Webhook alerts & exports</li>
            <li>Project reputation graph</li>
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="text-xl font-semibold">Add-ons</h2>
          <ul className="list-disc pl-6 mt-3 text-neutral-300 space-y-2">
            <li>Domain risk intelligence</li>
            <li>Token holder anomaly detection</li>
            <li>Bulk wallet screening</li>
          </ul>
        </div>
      </div>

      <div className="mt-8">
        <a className="btn" href="/dashboard">Go to dashboard</a>
      </div>
    </main>
  );
}
EOT

# 8) Package.json scripts & engines
if [ -f package.json ]; then
  node - <<'EOT'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json','utf8'));
pkg.scripts = Object.assign({
  dev: "next dev",
  build: "WS_NO_BUFFER_UTIL=1 WS_NO_UTF_8_VALIDATE=1 next build",
  start: "next start",
  typecheck: "tsc --noEmit"
}, pkg.scripts || {});
pkg.engines = { node: ">=18 <23" };
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
EOT
fi

# 9) Feature flags (client-side toggles) – voor nu via build env
: ${NEXT_PUBLIC_FEATURE_DASHBOARD:=1}
: ${NEXT_PUBLIC_FEATURE_PRO:=1}

# 10) Install dev deps als nodig
npm pkg get dependencies.tailwindcss >/dev/null 2>&1 || npm i -D tailwindcss postcss autoprefixer tailwind-merge clsx

# 11) Typecheck & build
npm run typecheck || true
npm run build

# 12) Commit & push
git add -A
git commit -m "$MSG" || true
git push -u origin "$BRANCH"

echo "✅ Branch pushed: $BRANCH"

# 13) PR aanmaken (als gh CLI aanwezig is)
if command -v gh >/dev/null 2>&1; then
  gh pr create --fill --title "$MSG" --body "Automated by Codex: UI/design fix, dashboard/pro pages, build scripts." || true
  echo "✅ PR created via gh"
else
  echo "ℹ️  Open a PR from $BRANCH → main in GitHub UI (Vercel auto-build)."
fi
