// app/layout.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;

import "./globals.css";
import Link from "next/link";
import { Providers } from "./providers";

export const metadata = {
  title: "XRglass",
  description: "See through the XRPL",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <header className="sticky top-0 z-20 border-b border-white/60 bg-white/60 backdrop-blur-md">
            <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-3">
              <Link href="/" className="text-2xl font-extrabold" style={{ color: "#0A79C8" }}>
                XR<span className="text-[#0B96E5]">glass</span>
              </Link>
              <div className="hidden flex-1 md:flex">
                <label className="glass flex w-full items-center gap-3 px-4 py-2" htmlFor="global-search">
                  <span className="sr-only">Search wallet or project</span>
                  <input
                    id="global-search"
                    type="search"
                    className="w-full bg-transparent text-sm outline-none"
                    placeholder="Search Wallet/Project"
                  />
                </label>
              </div>
              <nav className="hidden items-center gap-4 text-sm sm:flex">
                <Link href="/dashboard" className="text-slate-600 hover:text-slate-900">
                  Home
                </Link>
                <Link href="/watchlist" className="text-slate-600 hover:text-slate-900">
                  Watchlist
                </Link>
                <Link href="/marketplace" className="text-slate-600 hover:text-slate-900">
                  Reports
                </Link>
              </nav>
              <span
                className="pill text-white"
                style={{ background: "linear-gradient(180deg,#0A79C8,#0663A3)" }}
              >
                XRglass Pro
              </span>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-5 py-8">{children}</main>

          <footer className="mx-auto max-w-7xl px-5 py-8 text-sm text-gray-500">
            © XRglass 2025 – Ripple Ecosystem
          </footer>
        </Providers>
      </body>
    </html>
  );
}
