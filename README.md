# XRglass 🔐

**XRglass** is a free, open-source tool to **scan XRP tokens, wallets, and projects** for risk.
It gives a simple **Trust Score (Green / Orange / Red)** with transparent evidence — helping the XRP community avoid scams, rug pulls, and risky issuers.

The project now also ships with optional **Supabase-powered accounts**, **Stripe billing hooks**, a **PDF report generator**, and an experimental **WhaleScope live transaction stream** for Pro users.

🌐 Live: [xrglass.vercel.app](https://xrglass.vercel.app)

---

## ✨ Features

- **Trust Score** (0–100%) with color levels 🟢🟠🔴
- **Signals (evidence)**
  - Domain & xrp-ledger.toml presence
  - Master key disabled check
  - Global Freeze / No Freeze flags
  - Transfer rate (hidden tax) detection
  - Trustlines count (basic adoption measure)
- **Alerts** for high-risk findings (freeze, tax, low adoption)
- **Dark mode toggle** 🌙
- Modern, mobile-friendly UI built with TailwindCSS & Next.js
- Free hosting on Vercel 🚀
- **Watchlist API & UI hook** backed by Supabase tables
- **Stripe checkout endpoint** for creating subscription sessions
- **PDF report generator** (`POST /api/reports`) for exporting AI summaries
- **WhaleScope SSE feed** (`GET /api/whalescope/stream`) gated by Pro + whalescope add-on

---

## 🛠️ Tech Stack

- [Next.js 15 (App Router)](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [XRPL.js](https://github.com/XRPLF/xrpl.js)
- [Supabase](https://supabase.com/) for auth + data
- [Stripe](https://stripe.com/) for billing flows
- Hosted on [Vercel](https://vercel.com)

---

## ⚡ Getting Started (local dev)

1. Clone the repo:
   ```bash
   git clone https://github.com/XRglass/xtrustscore.git
   cd xtrustscore
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

   Fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   OPENAI_API_KEY=...
   STRIPE_KEY=...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   XRPL_WSS=wss://xrplcluster.com
   ```

4. Run the dev server:
   ```bash
   npm run dev
   ```
   Open http://localhost:3000.

5. (Optional) Seed Supabase tables by running `docs/supabase-schema.sql` in the SQL editor.

---

## 🚀 Deployment

Deployed on Vercel: every push to main auto-builds.

To deploy manually:
```bash
vercel --prod
```

Remember to configure the same environment variables in Vercel project settings.

---

## ⚠️ Disclaimer

XRglass provides heuristic indicators only.
It is not financial advice, and cannot guarantee safety.
Always do your own research.
Not affiliated with Ripple or the XRPL Foundation.

---

## 📬 Contributing

Pull requests welcome!

Ideas for new signals:

- Holder concentration % (top 10 wallets)
- Freeze/clawback detection per token
- GitHub repo activity
- Scam token blacklist integration

### API quick reference

- `GET /api/check?address=` — legacy wallet scan (verdict + signals)
- `GET /api/watchlist?user_id=` — list Supabase watchlist entries
- `POST /api/watchlist` — add address to watchlist (JSON body: `user_id`, `address`)
- `DELETE /api/watchlist` — remove address (query params `user_id`, `address`)
- `POST /api/addons` — activate add-on for Pro user (`user_id`, `addon_type`)
- `POST /api/subscribe` — create Stripe Checkout session (`priceId`, optional success/cancel paths)
- `GET /api/whalescope/stream?user_id=` — SSE whale feed (Pro + whalescope add-on only)
- `POST /api/reports` — generate PDF report (`address`, `analysis`, optional `meta`)
