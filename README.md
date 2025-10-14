# XRglass

Hybrid Ripple + Particles wallet intelligence dashboard built with Next.js 15, Tailwind CSS, Supabase, Framer Motion and GSAP.

## Quick start

```bash
npm install
npm run dev
```

Set the following environment variables (e.g. in Vercel Project Settings → Environment Variables):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`

Deploy to Vercel by pushing to GitHub and connecting the project. The deployment overwrites `xrglass.vercel.app`.

## Features

- Animated Icy Light theme with ripples and particle background
- Live wallet/domain scanner via `/api/scan`
- Add-Ons Marketplace backed by Supabase tables
- Pricing page and Pro dashboard scaffold

## Supabase schema

Run the SQL in `supabase.sql` to provision add-on and subscription tables.
